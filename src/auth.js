// Session handling for personal skill-development data.
//
// Personal learning records and assignments are private, so every /api/skills
// route requires proof of ownership. Two accepted forms:
//
//   1. Authorization: Bearer <ADMIN_SECRET>  (scripts, curl, the bot)
//   2. A short-lived HMAC-signed cookie issued by POST /api/skills/login
//
// The cookie is signed with ADMIN_SECRET but never contains it, so a stolen
// cookie cannot be escalated back into the admin secret.

const COOKIE = "ei_session";
const MAX_AGE_S = 60 * 60 * 12; // 12 hours

const encoder = new TextEncoder();

function toBase64Url(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str) {
  const pad = str.length % 4 ? "=".repeat(4 - (str.length % 4)) : "";
  const bin = atob(str.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function sign(payload, secret) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time-ish comparison to avoid leaking the signature byte by byte. */
function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function parseCookies(request) {
  const header = request.headers.get("cookie") || "";
  const out = {};
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

/** Mint a signed session token for the given secret. */
export async function createToken(secret, ttlSeconds = MAX_AGE_S) {
  const payload = toBase64Url(encoder.encode(JSON.stringify({ exp: Date.now() + ttlSeconds * 1000 })));
  const sig = await sign(payload, secret);
  return `${payload}.${sig}`;
}

/** Verify a token string. Returns true only if signed correctly and unexpired. */
export async function verifyToken(token, secret) {
  if (!token || typeof token !== "string") return false;
  const dot = token.lastIndexOf(".");
  if (dot < 1) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = await sign(payload, secret);
  if (!safeEqual(sig, expected)) return false;
  try {
    const { exp } = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)));
    return typeof exp === "number" && exp > Date.now();
  } catch {
    return false;
  }
}

/**
 * Authorize a request for private data.
 * Returns { ok:true, via:"header"|"cookie" } or { ok:false }.
 */
export async function authorize(request, env) {
  const secret = env.ADMIN_SECRET;
  if (!secret) return { ok: false, reason: "not_configured" };

  const auth = request.headers.get("authorization") || "";
  if (auth && safeEqual(auth, "Bearer " + secret)) return { ok: true, via: "header" };

  const cookies = parseCookies(request);
  if (cookies[COOKIE] && (await verifyToken(cookies[COOKIE], secret))) return { ok: true, via: "cookie" };

  return { ok: false };
}

export function sessionCookie(token, secure = true) {
  const bits = [
    `${COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${MAX_AGE_S}`,
  ];
  if (secure) bits.push("Secure");
  return bits.join("; ");
}

export function clearCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}

export const SESSION_COOKIE = COOKIE;
