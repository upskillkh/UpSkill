// Personal Skill Development — domain logic.
// Keeps all progress calculations derived from saved rows in D1, never from
// hardcoded numbers. All dates are handled in Cambodia time (Asia/Phnom_Penh).

import { SKILLS, LESSONS, ASSIGNMENTS, ASSESSMENT } from "./skills-data.js";

export const ICT = "Asia/Phnom_Penh";
export const PROGRAM_DAYS = 30;

// ---------------------------------------------------------------------------
// Cambodia-time helpers
// ---------------------------------------------------------------------------
const dateFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: ICT,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const prettyFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: ICT,
  dateStyle: "medium",
  timeStyle: "short",
});

/** Today in Cambodia as YYYY-MM-DD. */
export function ictDate(d = new Date()) {
  return dateFmt.format(d);
}

/** Human readable Cambodia timestamp. */
export function ictStamp(d = new Date()) {
  return prettyFmt.format(d) + " ICT";
}

/** Minutes since midnight, Cambodia time. */
export function ictMinutes(d = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: ICT,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t) => Number(parts.find((p) => p.type === t)?.value || 0);
  return get("hour") * 60 + get("minute");
}

/** Day of week in Cambodia time: 0 = Sunday ... 6 = Saturday. */
export function ictWeekday(d = new Date()) {
  const name = new Intl.DateTimeFormat("en-US", { timeZone: ICT, weekday: "short" }).format(d);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(name);
}

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export function weekdayName(index) {
  return WEEKDAY_NAMES[index] ?? "";
}

/** Shift a YYYY-MM-DD string by whole days, staying in calendar space. */
function shiftDate(ymd, days) {
  const [y, m, d] = ymd.split("-").map(Number);
  const t = Date.UTC(y, m - 1, d) + days * 86400000;
  return new Date(t).toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
export function clean(value, max = 4000) {
  return String(value ?? "").replace(/\s+$/g, "").slice(0, max);
}

export function toDay(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > PROGRAM_DAYS) return null;
  return n;
}

function toInt(value, min, max, fallback = 0) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

// ---------------------------------------------------------------------------
// Curriculum seeding — idempotent, keyed on the UNIQUE day column.
// ---------------------------------------------------------------------------
export async function seedCurriculum(env) {
  const now = new Date().toISOString();
  const stmts = [];

  for (const s of SKILLS) {
    stmts.push(
      env.DB.prepare(
        `INSERT OR IGNORE INTO skills (key,name,description,icon,sort_order) VALUES (?,?,?,?,?)`
      ).bind(s.key, s.name, s.description, s.icon || "", s.order || 0)
    );
    // Keep descriptions/topics fresh if the curriculum file is edited later.
    stmts.push(
      env.DB.prepare(`UPDATE skills SET name=?,description=?,icon=?,sort_order=? WHERE key=?`).bind(
        s.name,
        s.description,
        s.icon || "",
        s.order || 0,
        s.key
      )
    );
  }

  for (const l of LESSONS) {
    stmts.push(
      env.DB.prepare(
        `INSERT OR IGNORE INTO skill_lessons
          (day,skill,title,objective,explanation,example,exercise,action,reflection,
           quiz_question,quiz_options,quiz_answer,quiz_explain,sort_order)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
      ).bind(
        l.day,
        l.skill,
        l.title,
        l.objective,
        l.explanation,
        l.example,
        l.exercise,
        l.action,
        l.reflection,
        l.quiz.question,
        JSON.stringify(l.quiz.options || []),
        toInt(l.quiz.answer, 0, 3, 0),
        l.quiz.explain || "",
        l.day
      )
    );
    stmts.push(
      env.DB.prepare(
        `UPDATE skill_lessons SET
           skill=?,title=?,objective=?,explanation=?,example=?,exercise=?,action=?,reflection=?,
           quiz_question=?,quiz_options=?,quiz_answer=?,quiz_explain=?
         WHERE day=?`
      ).bind(
        l.skill,
        l.title,
        l.objective,
        l.explanation,
        l.example,
        l.exercise,
        l.action,
        l.reflection,
        l.quiz.question,
        JSON.stringify(l.quiz.options || []),
        toInt(l.quiz.answer, 0, 3, 0),
        l.quiz.explain || "",
        l.day
      )
    );
  }

  for (let i = 0; i < stmts.length; i += 50) {
    await env.DB.batch(stmts.slice(i, i + 50));
  }

  await refreshProgressCache(env);
}

/** Recompute the cached rollup table. Always derived, never trusted blindly. */
export async function refreshProgressCache(env) {
  const now = new Date().toISOString();
  const { results } = await env.DB.prepare(
    `SELECT l.skill,
            COUNT(DISTINCT l.day) AS total,
            COUNT(DISTINCT CASE WHEN s.completed = 1 THEN l.day END) AS done,
            MAX(CASE WHEN s.completed = 1 THEN s.completed_at END) AS last_studied
       FROM skill_lessons l
       LEFT JOIN learning_sessions s ON s.day = l.day AND s.completed = 1
      GROUP BY l.skill`
  ).all();

  const stmts = (results || []).map((r) =>
    env.DB
      .prepare(
        `INSERT INTO skill_progress (skill,total_lessons,completed_lessons,last_studied,updated_at)
         VALUES (?,?,?,?,?)
         ON CONFLICT(skill) DO UPDATE SET
           total_lessons=excluded.total_lessons,
           completed_lessons=excluded.completed_lessons,
           last_studied=excluded.last_studied,
           updated_at=excluded.updated_at`
      )
      .bind(r.skill, r.total || 0, r.done || 0, r.last_studied || null, now)
  );
  if (stmts.length) await env.DB.batch(stmts);
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------
export async function getLesson(env, day) {
  const d = toDay(day);
  if (!d) return null;
  const { results } = await env.DB
    .prepare(
      `SELECT * FROM skill_lessons WHERE day = ?`
    )
    .bind(d)
    .all();
  const row = results?.[0];
  if (!row) return null;
  return {
    day: row.day,
    skill: row.skill,
    title: row.title,
    objective: row.objective,
    explanation: row.explanation,
    example: row.example,
    exercise: row.exercise,
    action: row.action,
    reflection: row.reflection,
    quiz: {
      question: row.quiz_question,
      options: safeJson(row.quiz_options),
      // The correct answer is never sent to the browser.
    },
  };
}

function safeJson(value) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function getPlan(env) {
  // GROUP BY l.day is required: MAX() is an aggregate, and without it SQLite
  // collapses the whole result set into a single row.
  const { results } = await env.DB.prepare(
    `SELECT l.day,l.skill,l.title,k.name AS skill_name,
            COALESCE(MAX(s.completed),0) AS completed,
            MAX(s.session_date) AS last_session
       FROM skill_lessons l
       LEFT JOIN skills k ON k.key = l.skill
       LEFT JOIN learning_sessions s ON s.day = l.day AND s.completed = 1
      GROUP BY l.day, l.skill, l.title, k.name
      ORDER BY l.day`
  ).all();
  return results || [];
}

/** Today's lesson: next uncompleted day, falling back to the highest day done. */
export async function getToday(env) {
  const date = ictDate();
  const plan = await getPlan(env);

  let lessonDay = plan.find((r) => !r.completed)?.day;
  let isCatchUp = false;
  if (!lessonDay) {
    lessonDay = PROGRAM_DAYS;
    isCatchUp = true;
  }

  const lesson = await getLesson(env, lessonDay);
  const skill = SKILLS.find((s) => s.key === lesson?.skill);
  const { results: sess } = await env.DB
    .prepare(`SELECT * FROM learning_sessions WHERE session_date = ? AND day = ?`)
    .bind(date, lessonDay)
    .all();

  const session = sess?.[0] || null;
  return {
    date,
    stamp: ictStamp(),
    timezone: ICT,
    day: lessonDay,
    isCatchUp,
    totalDays: PROGRAM_DAYS,
    lesson,
    skill: skill ? { key: skill.key, name: skill.name, icon: skill.icon } : null,
    routine: [
      { key: "learn", label: "Learn one concept", minutes: 10 },
      { key: "analyze", label: "Analyze a business case", minutes: 10 },
      { key: "apply", label: "Apply it to Khmer24", minutes: 10 },
    ],
    session: session
      ? {
          step_learned: !!session.step_learned,
          step_analyzed: !!session.step_analyzed,
          step_applied: !!session.step_applied,
          minutes: session.minutes || 0,
          notes: session.notes || "",
          completed: !!session.completed,
          completed_at: session.completed_at || null,
        }
      : null,
    journalToday: await getJournalEntry(env, date),
  };
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------
/** Idempotent per (date, day) thanks to UNIQUE(session_date, day). */
export async function saveSession(env, input) {
  const day = toDay(input.day);
  if (!day) throw new Error("day must be between 1 and 30");
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(input.date || "")) ? input.date : ictDate();

  const lesson = await getLesson(env, day);
  if (!lesson) throw new Error("lesson not found");

  const learned = toInt(input.step_learned, 0, 1);
  const analyzed = toInt(input.step_analyzed, 0, 1);
  const applied = toInt(input.step_applied, 0, 1);
  const minutes = toInt(input.minutes, 0, 600);
  const notes = clean(input.notes, 4000);
  // A day counts complete only when all three routine steps are done.
  const completed = learned && analyzed && applied ? 1 : 0;
  const now = new Date().toISOString();

  await env.DB
    .prepare(
      `INSERT INTO learning_sessions
         (session_date,day,skill,step_learned,step_analyzed,step_applied,minutes,notes,completed,completed_at,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(session_date,day) DO UPDATE SET
         step_learned=excluded.step_learned,
         step_analyzed=excluded.step_analyzed,
         step_applied=excluded.step_applied,
         minutes=excluded.minutes,
         notes=excluded.notes,
         completed=excluded.completed,
         completed_at=excluded.completed_at,
         updated_at=excluded.updated_at`
    )
    .bind(date, day, lesson.skill, learned, analyzed, applied, minutes, notes, completed, completed ? now : null, now, now)
    .run();

  await refreshProgressCache(env);
  return { ok: true, day, date, completed: !!completed, minutes };
}

export async function saveQuiz(env, input) {
  const day = toDay(input.day);
  if (!day) throw new Error("day must be between 1 and 30");
  const lesson = await getLesson(env, day);
  if (!lesson) throw new Error("lesson not found");

  // Read the correct answer server-side only.
  const { results } = await env.DB
    .prepare(`SELECT quiz_answer, quiz_question, quiz_explain FROM skill_lessons WHERE day = ?`)
    .bind(day)
    .all();
  const row = results?.[0];
  const chosen = toInt(input.chosen, 0, 3, -1);
  const correct = chosen >= 0 && chosen === row.quiz_answer;

  await env.DB
    .prepare(
      `INSERT INTO quiz_attempts (day,skill,question,chosen,correct,created_at) VALUES (?,?,?,?,?,?)`
    )
    .bind(day, lesson.skill, row.quiz_question, chosen >= 0 ? chosen : null, correct ? 1 : 0, new Date().toISOString())
    .run();

  return {
    ok: true,
    correct,
    correctIndex: row.quiz_answer,
    explain: row.quiz_explain || "",
    day,
  };
}

export async function saveJournal(env, input) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(input.date || "")) ? input.date : ictDate();
  const now = new Date().toISOString();
  await env.DB
    .prepare(
      `INSERT INTO learning_journal
         (entry_date,learned,applied,worked_well,did_not_work,improve,next_action,mood,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(entry_date) DO UPDATE SET
         learned=excluded.learned,applied=excluded.applied,worked_well=excluded.worked_well,
         did_not_work=excluded.did_not_work,improve=excluded.improve,next_action=excluded.next_action,
         mood=excluded.mood,updated_at=excluded.updated_at`
    )
    .bind(
      date,
      clean(input.learned),
      clean(input.applied),
      clean(input.worked_well),
      clean(input.did_not_work),
      clean(input.improve),
      clean(input.next_action),
      input.mood == null || input.mood === "" ? null : toInt(input.mood, 1, 5),
      now,
      now
    )
    .run();
  return { ok: true, date };
}

export async function getJournalEntry(env, date) {
  const { results } = await env.DB.prepare(`SELECT * FROM learning_journal WHERE entry_date = ?`).bind(date).all();
  return results?.[0] || null;
}

export async function listJournal(env, limit = 60) {
  const { results } = await env.DB
    .prepare(`SELECT * FROM learning_journal ORDER BY entry_date DESC LIMIT ?`)
    .bind(Math.min(200, Math.max(1, Number(limit) || 60)))
    .all();
  return results || [];
}

export async function saveAssignment(env, input) {
  const id = Number.parseInt(input.id, 10);
  const now = new Date().toISOString();
  const status = ["draft", "active", "done"].includes(input.status) ? input.status : "draft";

  if (Number.isInteger(id) && id > 0) {
    const { results } = await env.DB.prepare(`SELECT id FROM business_assignments WHERE id = ?`).bind(id).all();
    if (!results?.[0]) throw new Error("assignment not found");

    // Only touch fields the caller actually sent. A blank field in the form is
    // "unchanged", not "clear this", otherwise saving one box would wipe the rest.
    const FIELDS = ["problem", "analysis", "solution", "expected_result", "actual_result", "lessons_learned", "next_action"];
    const sets = [];
    const binds = [];
    for (const f of FIELDS) {
      if (input[f] !== undefined) {
        sets.push(`${f} = ?`);
        binds.push(clean(input[f]));
      }
    }
    if (input.status !== undefined) {
      sets.push("status = ?");
      binds.push(status);
    }
    if (sets.length) {
      sets.push("updated_at = ?");
      binds.push(now, id);
      await env.DB
        .prepare(`UPDATE business_assignments SET ${sets.join(", ")} WHERE id = ?`)
        .bind(...binds)
        .run();
    }
    return { ok: true, id };
  }

  const skill = clean(input.skill, 40) || "strategic";
  const key = clean(input.assignment_key, 80) || null;
  const template = ASSIGNMENTS.find((a) => a.id === key);
  const title = clean(input.title, 200) || template?.title || "Business assignment";
  const prompt = clean(input.prompt, 2000) || template?.prompt || "";

  const r = await env.DB
    .prepare(
      `INSERT INTO business_assignments
         (assignment_key,skill,title,prompt,problem,analysis,solution,expected_result,
          actual_result,lessons_learned,next_action,status,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    )
    .bind(
      key, skill, title, prompt,
      clean(input.problem), clean(input.analysis), clean(input.solution),
      clean(input.expected_result), clean(input.actual_result),
      clean(input.lessons_learned), clean(input.next_action), status, now, now
    )
    .run();
  return { ok: true, id: r.meta?.last_row_rowid || r.meta?.last_row_id || null };
}

export async function listAssignments(env) {
  const { results } = await env.DB.prepare(`SELECT * FROM business_assignments ORDER BY updated_at DESC, id DESC`).all();
  return results || [];
}

export async function getPreference(env, key, fallback = "") {
  const { results } = await env.DB.prepare(`SELECT value FROM user_preferences WHERE key = ?`).bind(key).all();
  return results?.[0]?.value ?? fallback;
}

export async function setPreference(env, key, value) {
  await env.DB
    .prepare(
      `INSERT INTO user_preferences (key,value,updated_at) VALUES (?,?,?)
       ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`
    )
    .bind(key, String(value), new Date().toISOString())
    .run();
  return { ok: true };
}

export async function remindersEnabled(env) {
  return (await getPreference(env, "reminders_enabled", "0")) === "1";
}

/**
 * Claims today's reminder slot. Returns false if it already ran today, which is
 * what prevents duplicate reminders when cron retries or fires twice.
 */
export async function claimReminder(env, kind, date = ictDate()) {
  const r = await env.DB
    .prepare(`INSERT OR IGNORE INTO reminder_log (kind,sent_date,created_at) VALUES (?,?,?)`)
    .bind(kind, date, new Date().toISOString())
    .run();
  return (r.meta?.changes || 0) > 0;
}

// ---------------------------------------------------------------------------
// Progress — every number below is computed from saved rows.
// ---------------------------------------------------------------------------
export async function getProgress(env) {
  const [plan, assignments, quiz, sessions, journal] = await Promise.all([
    getPlan(env),
    listAssignments(env),
    env.DB.prepare(
      `SELECT COUNT(*) AS attempts,
              SUM(correct) AS correct,
              COUNT(DISTINCT day) FILTER (WHERE correct = 1) AS days_passed
         FROM quiz_attempts`
    ).all().then((r) => r.results?.[0] || {}),
    env.DB.prepare(
      `SELECT session_date, day, skill, minutes, completed FROM learning_sessions`
    ).all().then((r) => r.results || []),
    listJournal(env, 400),
  ]);

  const doneDays = plan.filter((p) => p.completed).length;
  const overallPct = plan.length ? Math.round((doneDays / plan.length) * 100) : 0;

  // Per-skill progress, including the next lesson to study.
  const bySkill = SKILLS.map((s) => {
    const rows = plan.filter((p) => p.skill === s.key);
    const completed = rows.filter((r) => r.completed);
    const next = rows.find((r) => !r.completed) || rows[rows.length - 1] || null;
    const pct = rows.length ? Math.round((completed.length / rows.length) * 100) : 0;
    return {
      key: s.key,
      name: s.name,
      icon: s.icon,
      description: s.description,
      topics: s.topics || [],
      totalLessons: rows.length,
      completedLessons: completed.length,
      percent: pct,
      lastStudied: completed.length ? completed[completed.length - 1].last_session : null,
      nextLesson: next ? { day: next.day, title: next.title } : null,
    };
  });

  // Current streak: consecutive days with at least one completed session.
  const doneDates = new Set(sessions.filter((s) => s.completed).map((s) => s.session_date));
  let streak = 0;
  let cursor = ictDate();
  if (!doneDates.has(cursor)) cursor = shiftDate(cursor, -1); // today may not be done yet
  while (doneDates.has(cursor)) {
    streak++;
    cursor = shiftDate(cursor, -1);
  }

  const weekAgo = shiftDate(ictDate(), -6);
  const thisWeek = sessions.filter((s) => s.completed && s.session_date >= weekAgo);
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.minutes || 0), 0);
  const completedAssignments = assignments.filter((a) => a.status === "done").length;

  // Weakest skill = lowest completion, ties broken by order.
  const needsImprovement = [...bySkill].sort((a, b) => a.percent - b.percent || a.key.localeCompare(b.key)).slice(0, 2);

  // Weekly activity for the chart, oldest first.
  const weekly = [];
  for (let i = 6; i >= 0; i--) {
    const d = shiftDate(ictDate(), -i);
    const rows = sessions.filter((s) => s.session_date === d);
    weekly.push({
      date: d,
      label: new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" }),
      completed: rows.filter((r) => r.completed).length,
      minutes: rows.reduce((sum, r) => sum + (r.minutes || 0), 0),
    });
  }

  return {
    timezone: ICT,
    generatedAt: ictStamp(),
    overall: {
      completedLessons: doneDays,
      totalLessons: plan.length,
      percent: overallPct,
      currentStreak: streak,
      longestStreak: streak,
      totalMinutes,
      thisWeekLessons: thisWeek.length,
      completedAssignments,
      journalEntries: journal.length,
      quizAttempts: quiz.attempts || 0,
      quizCorrect: quiz.correct || 0,
      quizAccuracy: quiz.attempts ? Math.round(((quiz.correct || 0) / quiz.attempts) * 100) : 0,
    },
    bySkill,
    weekly,
    needsImprovement: needsImprovement.map((s) => ({ key: s.key, name: s.name, percent: s.percent })),
    programDays: PROGRAM_DAYS,
  };
}

export function getAssessment() {
  return ASSESSMENT;
}

// ---------------------------------------------------------------------------
// Daily lesson progression and delivery tracking
// ---------------------------------------------------------------------------

/** Where the learner is in the 30-day program. Only completion moves this. */
export async function getLearningPointer(env) {
  const v = Number.parseInt(await getPreference(env, "learning_pointer", "1"), 10);
  return Number.isInteger(v) && v >= 1 && v <= PROGRAM_DAYS ? v : 1;
}

export async function setLearningPointer(env, day) {
  await setPreference(env, "learning_pointer", String(Math.min(PROGRAM_DAYS, Math.max(1, day))));
}

/**
 * Pick today's lesson.
 *
 * Monday-Friday map to a skill. We scan forward from the current pointer for the
 * first lesson of that skill that is not yet completed, wrapping once. That keeps
 * the weekday rotation without ever restarting the program on completed work.
 *
 * Saturday returns a practice assignment and Sunday a weekly review, so those
 * days carry no lesson number of their own.
 */
export async function selectDailyLesson(env, weekday, plan) {
  if (weekday === 0) return { type: "review" };
  if (weekday === 6) return { type: "practice" };

  const skillForDay = { 1: "strategic", 2: "sales", 3: "leadership", 4: "financial", 5: "digital" }[weekday];
  const rows = plan || (await getPlan(env));
  const start = await getLearningPointer(env);

  const ordered = [...rows.slice(start - 1), ...rows.slice(0, start - 1)];
  const match = ordered.find((r) => r.skill === skillForDay && !r.completed);
  const fallback = ordered.find((r) => !r.completed);
  const pick = match || fallback || rows[rows.length - 1];
  return { type: "lesson", day: pick.day, skill: pick.skill, title: pick.title };
}

/** Remember what was last pushed so /complete marks the right lesson. */
export async function setLastSent(env, info) {
  await setPreference(env, "last_sent_day", String(info.day ?? ""));
  await setPreference(env, "last_sent_date", ictDate());
  await setPreference(env, "last_sent_type", info.type);
}

export async function getLastSent(env) {
  return {
    day: Number.parseInt(await getPreference(env, "last_sent_day", ""), 10) || null,
    date: await getPreference(env, "last_sent_date", ""),
    type: await getPreference(env, "last_sent_type", ""),
  };
}

/**
 * Claim today's delivery slot.
 * Returns 'sent'  -> already delivered today, caller must not send again
 *         'claim'  -> caller owns the slot and should send
 *         'skip'   -> nothing to send
 */
export async function claimDelivery(env, info, date = ictDate()) {
  const now = new Date().toISOString();
  const ins = await env.DB
    .prepare(
      `INSERT OR IGNORE INTO lesson_deliveries
         (delivered_date,day,skill,weekday,message_type,status,attempts,delivered_at,created_at,updated_at)
       VALUES (?,?,?,?,?,'pending',0,NULL,?,?)`
    )
    .bind(date, info.day ?? 0, info.skill ?? info.type, info.weekday ?? 0, info.type, now, now)
    .run();

  if (ins.meta?.changes) return "claim";

  // Row already exists for this date.
  const { results } = await env.DB
    .prepare(`SELECT status FROM lesson_deliveries WHERE delivered_date = ?`)
    .bind(date)
    .all();
  if (results?.[0]?.status === "sent") return "sent";

  await env.DB
    .prepare(`UPDATE lesson_deliveries SET status='pending', attempts=attempts+1, updated_at=? WHERE delivered_date=?`)
    .bind(now, date)
    .run();
  return "claim";
}

export async function markDelivered(env, date = ictDate()) {
  await env.DB
    .prepare(`UPDATE lesson_deliveries SET status='sent', delivered_at=?, updated_at=? WHERE delivered_date=?`)
    .bind(new Date().toISOString(), new Date().toISOString(), date)
    .run();
}

/** Release the claim on failure so a later run can retry without duplicating. */
export async function markDeliveryFailed(env, error, date = ictDate()) {
  await env.DB
    .prepare(`UPDATE lesson_deliveries SET status='failed', last_error=?, updated_at=? WHERE delivered_date=?`)
    .bind(String(error || "unknown").slice(0, 300), new Date().toISOString(), date)
    .run();
}

export async function deliveryStats(env) {
  const { results } = await env.DB
    .prepare(
      `SELECT COUNT(*) total,
              SUM(CASE WHEN status='sent' THEN 1 ELSE 0 END) sent,
              SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) failed,
              MAX(delivered_at) last_delivery
         FROM lesson_deliveries`
    )
    .all();
  return results?.[0] || { total: 0, sent: 0, failed: 0, last_delivery: null };
}

export async function saveReflection(env, body, source = "telegram") {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(body.date || "")) ? body.date : ictDate();
  const now = new Date().toISOString();
  await env.DB
    .prepare(
      `INSERT INTO reflections (entry_date,day,prompt,body,source,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?)
       ON CONFLICT(entry_date) DO UPDATE SET
         day=excluded.day, prompt=excluded.prompt, body=excluded.body,
         source=excluded.source, updated_at=excluded.updated_at`
    )
    .bind(date, toInt(body.day, 0, PROGRAM_DAYS, null) ?? null, clean(body.prompt, 300), clean(body.body, 4000), source, now, now)
    .run();
  return { ok: true, date };
}

export async function getReflection(env, date) {
  const { results } = await env.DB.prepare(`SELECT * FROM reflections WHERE entry_date = ?`).bind(date).all();
  return results?.[0] || null;
}

export async function listReflections(env, limit = 30) {
  const { results } = await env.DB
    .prepare(`SELECT * FROM reflections ORDER BY entry_date DESC LIMIT ?`)
    .bind(Math.min(200, Math.max(1, Number(limit) || 30)))
    .all();
  return results || [];
}

/**
 * Mark a lesson complete. Idempotent, and advances the program pointer only when
 * the completed lesson is the one currently being studied.
 */
export async function completeLesson(env, day, notes) {
  const d = toDay(day);
  if (!d) throw new Error("day must be between 1 and " + PROGRAM_DAYS);
  const date = ictDate();
  const lesson = await getLesson(env, d);
  if (!lesson) throw new Error("lesson not found");

  const existing = await getSessionForDay(env, d);
  const minutes = existing?.minutes || 20;
  await saveSession(env, {
    day: d,
    date,
    step_learned: 1,
    step_analyzed: 1,
    step_applied: 1,
    minutes,
    notes: notes !== undefined ? clean(notes, 4000) : existing?.notes || "",
  });

  const pointer = await getLearningPointer(env);
  if (d >= pointer) await setLearningPointer(env, d + 1 > PROGRAM_DAYS ? 1 : d + 1);

  return { ok: true, day: d, skill: lesson.skill, title: lesson.title, pointer: await getLearningPointer(env) };
}

async function getSessionForDay(env, day) {
  const { results } = await env.DB
    .prepare(`SELECT * FROM learning_sessions WHERE day = ? ORDER BY completed_at DESC LIMIT 1`)
    .bind(day)
    .all();
  return results?.[0] || null;
}
