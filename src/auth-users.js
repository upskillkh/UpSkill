// Multi-user authentication for Up Skill PWA.
//
// Passwords use PBKDF2-SHA256 with a per-user random salt and 100k iterations,
// which is available in Workers through WebCrypto, so no third-party dependency
// is required. Sessions are opaque random tokens; only a SHA-256 hash of the
// token is stored, so a database leak cannot be replayed as a login.
//
// This is deliberately separate from the legacy ADMIN_SECRET guard, which is
// retained so existing personal-dashboard routes keep working during migration.

const PBKDF2_ITERATIONS = 100_000;
const SESSION_DAYS = 30;
const encoder = new TextEncoder();

const b64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

function randomHex(n = 32) {
  const buf = new Uint8Array(n);
  crypto.getRandomValues(buf);
  return [...buf].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function pbkdf2(password, saltB64, iterations = PBKDF2_ITERATIONS) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: unb64(saltB64), iterations, hash: "SHA-256" },
    key,
    256
  );
  return b64(bits);
}

export function normaliseEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function validateEmail(email) {
  const e = normaliseEmail(email);
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 254 ? e : null;
}

export function validatePassword(password) {
  const p = String(password || "");
  // Length is the dominant factor in password strength; require a sensible
  // minimum without rejecting a long passphrase.
  if (p.length < 8) return "Password must be at least 8 characters.";
  if (p.length > 200) return "Password must be under 200 characters.";
  if (!/[a-zA-Z]/.test(p)) return "Password must contain at least one letter.";
  if (!/[0-9\W]/.test(p)) return "Password must contain a number or symbol.";
  return null;
}

export async function hashPassword(password) {
  const salt = b64(crypto.getRandomValues(new Uint8Array(16)));
  const hash = await pbkdf2(password, salt);
  return { hash, salt };
}

export async function verifyPassword(password, expectedHash, salt) {
  if (!expectedHash || !salt) return false;
  if (expectedHash === "MIGRATED_NO_PASSWORD") return false;
  const actual = await pbkdf2(password, salt);
  return timingSafeEqual(actual, expectedHash);
}

/** Constant-time-ish string comparison. */
export function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function sha256Hex(text) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------
export async function createSession(env, userId, meta = {}) {
  const token = randomHex(32);
  const tokenHash = await sha256Hex(token);
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
  await env.DB.prepare(
    `INSERT INTO sessions (user_id, token_hash, expires_at, created_at) VALUES (?,?,?,?)`
  ).bind(userId, tokenHash, expires, new Date().toISOString()).run();
  return { token, expiresAt: expires };
}

export async function destroySession(env, tokenHash) {
  await env.DB.prepare(`DELETE FROM sessions WHERE token_hash = ?`).bind(tokenHash).run();
}

export async function purgeExpiredSessions(env) {
  await env.DB.prepare(`DELETE FROM sessions WHERE expires_at < ?`).bind(new Date().toISOString()).run();
}

/** Resolve a raw session token to a user row, or null. */
export async function userFromToken(env, token) {
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  const { results } = await env.DB.prepare(
    `SELECT u.id, u.email, u.display_name, u.role, u.locale, u.level, u.occupation,
            u.daily_minutes, u.goals, u.status, u.onboarding_done, s.expires_at
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > ? AND u.status = 'active'
      LIMIT 1`
  ).bind(tokenHash, new Date().toISOString()).all();
  const user = results?.[0] || null;
  if (user) {
    env.DB.prepare(`UPDATE sessions SET last_seen = ? WHERE token_hash = ?`)
      .bind(new Date().toISOString(), tokenHash).run().catch(() => {});
  }
  return user;
}

export function sessionCookieName() {
  return "upskill_session";
}

export function sessionCookie(token, secure = true, maxAgeSeconds = SESSION_DAYS * 86400) {
  const bits = [
    `${sessionCookieName()}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (secure) bits.push("Secure");
  return bits.join("; ");
}

export function clearSessionCookie() {
  return `${sessionCookieName()}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function readCookie(request, name) {
  const header = request.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    if (part.slice(0, i).trim() === name) {
      try {
        return decodeURIComponent(part.slice(i + 1).trim());
      } catch {
        return null;
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Simple fixed-window rate limiting (per identifier, per action)
// ---------------------------------------------------------------------------
export async function rateLimit(env, key, action, limit = 10, windowSeconds = 60) {
  const id = `${action}:${key}:${Math.floor(Date.now() / (windowSeconds * 1000))}`;
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO rate_limits (bucket, count, updated_at) VALUES (?,1,?)
     ON CONFLICT(bucket) DO UPDATE SET count = count + 1, updated_at = excluded.updated_at`
  ).bind(id, now).run();
  const { results } = await env.DB.prepare(`SELECT count FROM rate_limits WHERE bucket = ?`).bind(id).all();
  const count = results?.[0]?.count || 0;
  return { allowed: count <= limit, count, limit };
}
