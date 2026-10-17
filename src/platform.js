// Up Skill PWA platform layer: accounts, content access, and per-user progress.
//
// Everything here is scoped by user_id. There is no global "current user" —
// every read and write takes an explicit user id resolved from the session, so
// one account can never read another's journal, assignments or progress.

import {
  validateEmail, normaliseEmail, validatePassword, hashPassword, verifyPassword,
  createSession, userFromToken, readCookie, sessionCookieName, rateLimit,
} from "./auth-users.js";
import { LESSONS, SKILLS } from "./skills-data.js";

// Khmer translations. They are a separate artefact so a lesson exists once and
// its language variants hang off it. They are marked review_status "machine"
// and must be human-reviewed before being presented as vetted course content.
let LESSONS_KM = [];
try {
  const mod = await import("./skills-data-km.js");
  LESSONS_KM = mod.LESSONS_KM || [];
} catch {
  // A missing Khmer file must never break English delivery.
  LESSONS_KM = [];
}
const KM_BY_DAY = new Map(LESSONS_KM.map((l) => [l.day, l]));

async function lessonsCount(env) {
  const { results } = await env.DB.prepare(`SELECT COUNT(*) n FROM lessons`).all();
  return results?.[0]?.n || 0;
}

export const LOCALES = ["en", "km"];
export const LEVELS = ["beginner", "intermediate", "advanced"];

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------
export async function registerUser(env, body, meta = {}) {
  const email = validateEmail(body.email);
  if (!email) throw httpError(400, "Enter a valid email address.");
  const pwError = validatePassword(body.password);
  if (pwError) throw httpError(400, pwError);

  // Two independent limits, because either one alone is wrong for a public
  // platform. A tight per-IP limit locks out an entire office, campus or mobile
  // carrier behind shared NAT, which is the normal case in Cambodia. A loose
  // per-IP limit alone does nothing to stop hammering one specific account.
  //   per email: stops repeated attempts against a single address
  //   per IP:    still stops bulk signup from a single host, but generously
  const perEmail = await rateLimit(env, "email:" + email, "register", 3, 3600);
  if (!perEmail.allowed) throw httpError(429, "Too many signup attempts for this email. Try again later.");

  const perIp = await rateLimit(env, clientKey(meta), "register", 30, 3600);
  if (!perIp.allowed) throw httpError(429, "Too many signups from this network. Try again later.");

  const { results: existing } = await env.DB.prepare(`SELECT id FROM users WHERE email = ?`).bind(email).all();
  if (existing?.length) throw httpError(409, "An account with that email already exists.");

  const { hash, salt } = await hashPassword(body.password);
  const locale = LOCALES.includes(body.locale) ? body.locale : "en";
  const level = LEVELS.includes(body.level) ? body.level : "beginner";
  const dailyMinutes = Math.min(180, Math.max(5, Number(body.daily_minutes) || 30));

  const now = new Date().toISOString();
  const r = await env.DB
    .prepare(
      `INSERT INTO users (email,password_hash,password_salt,display_name,role,locale,level,
                          occupation,daily_minutes,goals,status,onboarding_done,created_at,updated_at)
       VALUES (?,?,?,?,'user',?,?,?,?,?,'active',0,?,?)`
    )
    .bind(email, hash, salt, clean(body.display_name, 120), locale, level,
          clean(body.occupation, 120), dailyMinutes, clean(body.goals, 1000), now, now)
    .run();

  const userId = r.meta?.last_row_rowid || r.meta?.last_row_id;
  await ensureEnrolment(env, userId);
  return { id: userId, email };
}

export async function loginUser(env, body, meta = {}) {
  const email = normaliseEmail(body.email);
  const key = `${clientKey(meta)}:${email}`;
  const limit = await rateLimit(env, key, "login", 10, 300);
  if (!limit.allowed) throw httpError(429, "Too many login attempts. Wait a few minutes.");

  const { results } = await env.DB
    .prepare(`SELECT * FROM users WHERE email = ? AND status = 'active' LIMIT 1`)
    .bind(email)
    .all();
  const user = results?.[0];

  // Always run a verification so a missing account and a wrong password take a
  // similar amount of time, which avoids leaking which emails are registered.
  // The dummy salt/hash must be valid base64 of the expected lengths or PBKDF2
  // throws instead of simply returning false.
  const ok = user
    ? await verifyPassword(String(body.password || ""), user.password_hash, user.password_salt)
    : await verifyPassword(String(body.password || ""), DUMMY_HASH, DUMMY_SALT);

  if (!user || !ok) throw httpError(401, "Email or password is incorrect.");
  return user;
}

// base64 of 16 and 32 zero bytes: correct lengths, never matches a real hash.
const DUMMY_SALT = "AAAAAAAAAAAAAAAAAAAAAA==";
const DUMMY_HASH = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";

export async function logoutUser(env, request) {
  const token = readCookie(request, sessionCookieName());
  if (token) {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
    const hash = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
    await env.DB.prepare(`DELETE FROM sessions WHERE token_hash = ?`).bind(hash).run();
  }
}

/** Resolve the signed-in user, or null. */
export async function currentUser(env, request) {
  const token = readCookie(request, sessionCookieName());
  if (!token) return null;
  return userFromToken(env, token);
}

export async function updateProfile(env, userId, body) {
  const locale = LOCALES.includes(body.locale) ? body.locale : undefined;
  const level = LEVELS.includes(body.level) ? body.level : undefined;
  const dailyMinutes = body.daily_minutes !== undefined
    ? Math.min(180, Math.max(5, Number(body.daily_minutes) || 30))
    : undefined;

  const sets = [], binds = [];
  if (body.display_name !== undefined) { sets.push("display_name = ?"); binds.push(clean(body.display_name, 120)); }
  if (locale) { sets.push("locale = ?"); binds.push(locale); }
  if (level) { sets.push("level = ?"); binds.push(level); }
  if (body.occupation !== undefined) { sets.push("occupation = ?"); binds.push(clean(body.occupation, 120)); }
  if (dailyMinutes !== undefined) { sets.push("daily_minutes = ?"); binds.push(dailyMinutes); }
  if (body.goals !== undefined) { sets.push("goals = ?"); binds.push(clean(body.goals, 1000)); }
  if (body.onboarding_done !== undefined) { sets.push("onboarding_done = ?"); binds.push(body.onboarding_done ? 1 : 0); }
  if (!sets.length) return { ok: true, updated: 0 };

  sets.push("updated_at = ?");
  binds.push(new Date().toISOString(), userId);
  await env.DB.prepare(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`).bind(...binds).run();
  return { ok: true, updated: sets.length };
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

/** Idempotently publish the built-in 30-day curriculum as platform lessons. */
export async function seedLessons(env) {
  const now = new Date().toISOString();
  const { results } = await env.DB.prepare(`SELECT locale, COUNT(*) n FROM lesson_translations GROUP BY locale`).all();
  const counts = Object.fromEntries((results || []).map((r) => [r.locale, r.n]));

  // The guard must consider both locales. Checking only `lessons` meant that
  // once English existed, the Khmer rows were never written.
  const wantEn = LESSONS.length;
  const wantKm = KM_BY_DAY.size;
  const lessonsFull = await lessonsCount(env);
  if (lessonsFull >= wantEn && (counts.en || 0) >= wantEn && (counts.km || 0) >= wantKm) {
    return { skipped: true };
  }

  const stmts = [];
  for (const l of LESSONS) {
    const slug = `day-${String(l.day).padStart(2, "0")}`;
    stmts.push(
      env.DB.prepare(
        `INSERT INTO lessons (slug, day, skill_key, difficulty, est_minutes, status, sort_order, created_at)
         VALUES (?,?,?,'beginner',20,'published',?,?)
         ON CONFLICT(day) DO UPDATE SET skill_key = excluded.skill_key, updated_at = excluded.updated_at`
      ).bind(slug, l.day, l.skill, l.day, now)
    );
  }
  for (let i = 0; i < stmts.length; i += 50) await env.DB.batch(stmts.slice(i, i + 50));

  // English translations, marked human-reviewed because the curriculum was
  // authored directly in English rather than machine translated.
  const { results: lessonRows } = await env.DB.prepare(`SELECT id, day FROM lessons`).all();
  const byDay = new Map((lessonRows || []).map((r) => [r.day, r.id]));

  const trStmts = [];
  for (const l of LESSONS) {
    const lessonId = byDay.get(l.day);
    if (!lessonId) continue;
    trStmts.push(
      env.DB.prepare(
        `INSERT INTO lesson_translations
           (lesson_id, locale, title, objective, explanation, example, exercise, action,
            reflection, quiz_question, quiz_options, quiz_answer, quiz_explain, review_status, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'human_reviewed',?)
         ON CONFLICT(lesson_id, locale) DO NOTHING`
      ).bind(lessonId, "en", l.title, l.objective, l.explanation, l.example, l.exercise,
             l.action, l.reflection, l.quiz.question, JSON.stringify(l.quiz.options || []),
             Math.min(3, Math.max(0, Number(l.quiz.answer) || 0)), l.quiz.explain || "", now)
    );
  }

  // Khmer translations are stored with review_status "machine" on purpose, so
  // the platform can surface that they still need a human reviewer.
  for (const l of LESSONS_KM) {
    const lessonId = byDay.get(l.day);
    if (!lessonId || !l.title) continue;
    trStmts.push(
      env.DB.prepare(
        `INSERT INTO lesson_translations
           (lesson_id, locale, title, objective, explanation, example, exercise, action,
            reflection, quiz_question, quiz_options, quiz_answer, quiz_explain, review_status, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'machine',?)
         ON CONFLICT(lesson_id, locale) DO UPDATE SET
           title=excluded.title, objective=excluded.objective, explanation=excluded.explanation,
           example=excluded.example, exercise=excluded.exercise, action=excluded.action,
           reflection=excluded.reflection, quiz_question=excluded.quiz_question,
           quiz_options=excluded.quiz_options, quiz_answer=excluded.quiz_answer,
           quiz_explain=excluded.quiz_explain, updated_at=excluded.updated_at`
      ).bind(lessonId, "km", l.title, l.objective, l.explanation, l.example, l.exercise,
             l.action, l.reflection, l.quiz?.question || "", JSON.stringify(l.quiz?.options || []),
             Math.min(3, Math.max(0, Number(l.quiz?.answer) || 0)), l.quiz?.explain || "", now)
    );
  }

  for (let i = 0; i < trStmts.length; i += 50) await env.DB.batch(trStmts.slice(i, i + 50));

  return { seeded: LESSONS.length, khmer: LESSONS_KM.length };
}

/**
 * A lesson in the caller's language, falling back to English when the requested
 * translation is missing so the UI never shows an empty string.
 */
export async function getLessonForUser(env, day, locale = "en") {
  const { results } = await env.DB
    .prepare(
      `SELECT l.id, l.day, l.skill_key, l.difficulty, l.est_minutes,
              t.locale, t.title, t.objective, t.explanation, t.example, t.exercise,
              t.action, t.reflection, t.review_status
         FROM lessons l
         LEFT JOIN lesson_translations t ON t.lesson_id = l.id AND t.locale = ?
        WHERE l.day = ?
        LIMIT 1`
    )
    .bind(LOCALES.includes(locale) ? locale : "en", day)
    .all();
  let row = results?.[0];

  if (!row || !row.title) {
    const { results: fb } = await env.DB
      .prepare(
        `SELECT l.id, l.day, l.skill_key, l.difficulty, l.est_minutes,
                t.locale, t.title, t.objective, t.explanation, t.example, t.exercise,
                t.action, t.reflection, t.review_status
           FROM lessons l
           JOIN lesson_translations t ON t.lesson_id = l.id AND t.locale = 'en'
          WHERE l.day = ? LIMIT 1`
      )
      .bind(day)
      .all();
    if (fb?.[0]) { row = fb[0]; row.fallback = true; }
  }
  if (!row) return null;

  const skill = SKILLS.find((s) => s.key === row.skill_key);
  return {
    id: row.id,
    day: row.day,
    skill: { key: row.skill_key, name: skill?.name || row.skill_key, icon: skill?.icon || "" },
    difficulty: row.difficulty,
    estMinutes: row.est_minutes,
    locale: row.locale,
    fallback: !!row.fallback,
    // Surfaced so the UI can tell a learner the Khmer text still needs review.
    reviewStatus: row.review_status,
    needsReview: row.review_status === "machine",
    title: row.title || "",
    objective: row.objective || "",
    explanation: row.explanation || "",
    example: row.example || "",
    exercise: row.exercise || "",
    action: row.action || "",
    reflection: row.reflection || "",
  };
}

export async function listLessonsForUser(env, userId, locale = "en") {
  const loc = LOCALES.includes(locale) ? locale : "en";
  const { results } = await env.DB
    .prepare(
      `SELECT l.day, l.skill_key, l.difficulty, t.title, t.review_status,
              COALESCE(p.status,'') AS status
         FROM lessons l
         LEFT JOIN lesson_translations t ON t.lesson_id = l.id AND t.locale = ?
         LEFT JOIN lesson_progress p ON p.lesson_id = l.id AND p.user_id = ?
        ORDER BY l.day`
    )
    .bind(loc, userId)
    .all();
  return results || [];
}

// ---------------------------------------------------------------------------
// Per-user progress
// ---------------------------------------------------------------------------
export async function ensureEnrolment(env, userId) {
  await env.DB
    .prepare(`INSERT OR IGNORE INTO enrollments (user_id, program, status, pointer) VALUES (?, '30day', 'active', 1)`)
    .bind(userId)
    .run();
}

export async function recordLessonCompletion(env, userId, day, { minutes = 0, notes = "" } = {}) {
  const { results } = await env.DB.prepare(`SELECT id, day FROM lessons WHERE day = ?`).bind(day).all();
  const lesson = results?.[0];
  if (!lesson) throw httpError(404, "Lesson not found.");

  await ensureEnrolment(env, userId);
  const now = new Date().toISOString();
  await env.DB
    .prepare(
      `INSERT INTO lesson_progress (user_id, lesson_id, status, minutes, notes, started_at, completed_at)
       VALUES (?,?,'completed',?,?,?,?)
       ON CONFLICT(user_id, lesson_id) DO UPDATE SET
         status='completed', minutes=excluded.minutes, notes=excluded.notes,
         completed_at=excluded.completed_at`
    )
    .bind(userId, lesson.id, Math.min(600, Math.max(0, Number(minutes) || 0)), clean(notes, 2000), now, now)
    .run();

  // Advance the pointer only past lessons the learner has actually finished.
  const { results: enr } = await env.DB.prepare(`SELECT pointer FROM enrollments WHERE user_id = ?`).bind(userId).all();
  const pointer = enr?.[0]?.pointer || 1;
  if (day >= pointer) {
    const next = Math.min(30, day + 1);
    await env.DB
      .prepare(`UPDATE enrollments SET pointer = ? WHERE user_id = ? AND program = '30day'`)
      .bind(next, userId)
      .run();
  }
  return { ok: true, day };
}

export async function platformProgress(env, userId, locale = "en") {
  const loc = LOCALES.includes(locale) ? locale : "en";
  const [plan, quiz, assignments, journal, enrolment] = await Promise.all([
    listLessonsForUser(env, userId, loc),
    env.DB.prepare(`SELECT COUNT(*) attempts, SUM(correct) correct FROM quiz_attempts WHERE user_id = ?`)
      .bind(userId).all().then((r) => r.results?.[0] || {}),
    env.DB.prepare(`SELECT COUNT(*) n FROM business_assignments WHERE user_id = ? AND status = 'done'`)
      .bind(userId).all().then((r) => r.results?.[0]?.n || 0),
    env.DB.prepare(`SELECT COUNT(*) n FROM learning_journal WHERE user_id = ?`)
      .bind(userId).all().then((r) => r.results?.[0]?.n || 0),
    env.DB.prepare(`SELECT pointer, status FROM enrollments WHERE user_id = ? AND program='30day'`)
      .bind(userId).all().then((r) => r.results?.[0] || { pointer: 1, status: 'active' }),
  ]);

  const total = plan.length;
  const completed = plan.filter((p) => p.status === "completed").length;
  const bySkill = {};
  for (const p of plan) {
    bySkill[p.skill_key] ||= { total: 0, completed: 0 };
    bySkill[p.skill_key].total++;
    if (p.status === "completed") bySkill[p.skill_key].completed++;
  }

  return {
    locale: loc,
    completedLessons: completed,
    totalLessons: total,
    percent: total ? Math.round((completed / total) * 100) : 0,
    pointer: enrolment.pointer,
    status: enrolment.status,
    bySkill,
    quizAttempts: quiz.attempts || 0,
    quizCorrect: quiz.correct || 0,
    completedAssignments: assignments,
    journalEntries: journal,
    // Completed lessons measure engagement, not professional competence.
    disclaimer: "Completion shows what you studied, not what you can do. Quizzes and applied assignments are separate evidence.",
  };
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
export function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

export function clean(value, max = 2000) {
  return String(value ?? "").replace(/\s+$/g, "").slice(0, max);
}

function clientKey(meta = {}) {
  return (meta.ip || "anon").toString();
}
