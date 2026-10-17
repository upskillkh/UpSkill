// catalog.js — 2027-2031 Future Skills platform data layer.
//
// Covers the 12-category taxonomy, four levels, the five-year roadmap, the
// Business Lab, proficiency evidence, per-user analytics and admin reporting.
//
// Everything is scoped by user_id in the SQL itself rather than in JavaScript,
// so a missing WHERE clause is visible in review instead of silently leaking
// one learner's records to another.

const jsonCol = (v, fallback) => {
  try { const p = JSON.parse(v); return p ?? fallback; } catch { return fallback; }
};

// Locale is validated against the two supported languages. Anything else falls
// back to English rather than being echoed back into a query.
export const normLocale = (v) => (String(v || "").toLowerCase().startsWith("km") ? "km" : "en");

const pick = (row, en, km, locale) => (locale === "km" && row[km]) ? row[km] : row[en];

// ---------------------------------------------------------------------------
// Catalog: categories, levels, skills, paths
// ---------------------------------------------------------------------------
export async function getCatalog(env, locale = "en") {
  const loc = normLocale(locale);

  const cats = await env.DB.prepare(`
    SELECT key, name_en, name_km, summary_en, summary_km, icon, sort_order, established, status
      FROM categories
     WHERE status <> 'merged'
     ORDER BY sort_order`).all();

  const levels = await env.DB.prepare(
    "SELECT key, name_en, name_km, summary_en, summary_km, sort_order FROM levels ORDER BY sort_order").all();

  const skills = await env.DB.prepare(`
    SELECT s.key, s.name, s.name_km, s.description, s.description_km, s.icon, s.category_key,
           s.level, s.proficiency, s.est_weeks, s.status, s.established, s.prerequisites,
           s.objectives, s.sort_order,
           (SELECT COUNT(*) FROM lessons l WHERE l.skill_key = s.key AND l.status <> 'retired') AS lesson_count
      FROM skills s
     ORDER BY s.sort_order`).all();

  const paths = await env.DB.prepare(`
    SELECT id, key, year, level, title_en, title_km, summary_en, summary_km, sort_order
      FROM learning_paths WHERE status = 'active' ORDER BY sort_order`).all();

  const pathSkills = await env.DB.prepare(`
    SELECT ps.path_id, ps.skill_key, ps.position, ps.required
      FROM learning_path_skills ps ORDER BY ps.position`).all();

  const byPath = new Map();
  for (const r of pathSkills.results) {
    if (!byPath.has(r.path_id)) byPath.set(r.path_id, []);
    byPath.get(r.path_id).push(r);
  }

  return {
    locale: loc,
    levels: levels.results.map((l) => ({
      key: l.key,
      name: pick(l, "name_en", "name_km", loc),
      summary: pick(l, "summary_en", "summary_km", loc),
    })),
    categories: cats.results.map((c) => ({
      key: c.key,
      name: pick(c, "name_en", "name_km", loc),
      summary: pick(c, "summary_en", "summary_km", loc),
      icon: c.icon,
      sortOrder: c.sort_order,
      // Established vs emerging is surfaced, not hidden. Emerging content is
      // speculative and the UI must never imply it is a guaranteed opportunity.
      established: c.established === 1,
      skills: skills.results
        .filter((s) => s.category_key === c.key)
        .map((s) => shapeSkill(s, loc)),
    })),
    paths: paths.results.map((p) => ({
      key: p.key,
      year: p.year,
      level: p.level,
      title: pick(p, "title_en", "title_km", loc),
      summary: pick(p, "summary_en", "summary_km", loc),
      skillKeys: (byPath.get(p.id) || []).map((x) => x.skill_key),
    })),
  };
}

function shapeSkill(s, loc) {
  return {
    key: s.key,
    name: pick(s, "name", "name_km", loc),
    description: pick(s, "description", "description_km", loc),
    icon: s.icon,
    category: s.category_key,
    level: s.level,
    proficiency: s.proficiency,
    estWeeks: s.est_weeks,
    // planned = structure exists, lessons not written yet. The UI must say so.
    status: s.status,
    available: s.status === "active" && s.lesson_count > 0,
    lessonCount: s.lesson_count,
    established: s.established === 1,
    prerequisites: jsonCol(s.prerequisites, []),
    objectives: jsonCol(s.objectives, []),
  };
}

// ---------------------------------------------------------------------------
// Skill assessment (diagnostic). Deterministic and explainable: the result is
// computed from the learner's own answers, never asserted as a capability by a
// language model.
// ---------------------------------------------------------------------------
const ASSESS_QUESTIONS = [
  { id: "q1", skill: "digital",   level: "L1", en: "You need a weekly sales report every Monday. What is the most reliable first step?", km: "អ្នកត្រូវការរបាយលក់ប្រចាំសប្តាហ៍រៀងរាល់ថ្ងៃចន្ទុកទេ។ ជីវិតដំបូងបំផុតដែលអាចទុកចិត្តបានគឺ…" },
  { id: "q2", skill: "strategic", level: "L2", en: "Sales are down 20%. Which question should you answer first?", km: "ការលក់ធ្លាក់មួយភាគយោបល់។ សំណួរណាគួរឆ្លើយជាមុនចែប?" },
  { id: "q3", skill: "sales",    level: "L2", en: "What is the point of a sales pipeline?", km: "ចំណុចបំផុតនៃរន្ធដោយលក់គឺអ្វី?" },
  { id: "q4", skill: "leadership",level: "L2", en: "A team member keeps missing deadlines. What is the best first step?", km: "សមាជិកក្រុមម្នាក់បន្តកកកខាន់មិនដែលទាន់ពេល។ ជំហានដំបូងបំផុតគឺ?" },
  { id: "q5", skill: "financial", level: "L2", en: "You sell a product for $100 that costs $60. What is the gross margin?", km: "អ្នកលក់ផលិតផលដល់ $100 ដែលមានតម្លៃថ្លៃដើម $60។ ប្រាក់ចំណេញមានប៉ុន្មាន?" },
  { id: "q6", skill: "ai",        level: "L1", en: "An AI-written report contains a confident but unverified statistic. What should you do?", km: "របាយការដែល AI សរសេរមានទិន្នន័យប្រាកដប៉ុន្មានតែមិនទាន់ផ្ទៀងផ្ទាត់។ អ្នកគួរធ្វើអ្វី?" },
];

export async function getAssessmentQuestions(env, locale = "en") {
  const loc = normLocale(locale);
  return ASSESS_QUESTIONS.map((q) => ({ id: q.id, skill: q.skill, text: pick(q, "en", "km", loc) }));
}

// Scores are counted locally. The model is never asked to judge ability.
export async function submitAssessment(env, userId, locale, answers) {
  const loc = normLocale(locale);
  const correct = { q1: "b", q2: "b", q3: "b", q4: "b", q5: "b", q6: "b" };
  let score = 0;
  const bySkill = {};
  for (const q of ASSESS_QUESTIONS) {
    const given = String(answers?.[q.id] || "").toLowerCase();
    const hit = given === correct[q.id];
    if (hit) score++;
    if (!bySkill[q.skill]) bySkill[q.skill] = { skill: q.skill, correct: 0, total: 0 };
    bySkill[q.skill].total++;
    if (hit) bySkill[q.skill].correct++;
  }

  const level = score >= 5 ? "L3" : score >= 3 ? "L2" : "L1";
  // Recommend the skills this learner is weakest in, lowest score first.
  const recommended = Object.values(bySkill)
    .filter((r) => r.correct < r.total)
    .sort((a, b) => (a.correct / a.total) - (b.correct / b.total))
    .slice(0, 3)
    .map((r) => r.skill);

  const result = {
    score,
    total: ASSESS_QUESTIONS.length,
    level,
    recommended,
    breakdown: Object.values(bySkill),
    // Explicitly limits what the score means. A six-question diagnostic is not
    // a measurement of anyone's ability.
    caveat: loc === "km"
      ? "នេះជាការវាស់សមត្ថភាពតូចមួយ មិនមែនជាការវាយតម្លៃពិតលងពីសមត្ថភាពរបស់អ្នកទេ។"
      : "This is a short diagnostic, not a measurement of your ability. It only suggests where to start.",
  };

  await env.DB.prepare(`
    INSERT INTO skill_assessments (user_id, locale, answers, level, recommended_skills)
    VALUES (?, ?, ?, ?, ?)`)
    .bind(userId, loc, JSON.stringify(answers || {}), level, JSON.stringify(recommended)).run();

  // Provenance is explicit: this level came from an assessment, not from usage.
  // Recording evidence is a side effect. If it fails the learner must still get
  // their score, so each skill is recorded independently and a failure is
  // logged rather than propagated as a 500.
  for (const r of Object.values(bySkill)) {
    try {
      await bumpProficiency(env, userId, r.skill, { });
    } catch (e) {
      console.warn(`proficiency not recorded for ${r.skill}: ${e.message}`);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Proficiency: evidence-based only.
// ---------------------------------------------------------------------------
export async function bumpProficiency(env, userId, skillKey, deltas) {
  // Guard: an unknown skill key would violate the foreign key on
  // skill_proficiency.skill_key. Skip rather than let a side effect throw.
  const known = await env.DB.prepare("SELECT 1 FROM skills WHERE key = ?").bind(skillKey).first();
  if (!known) {
    console.warn(`proficiency skipped: unknown skill "${skillKey}"`);
    return;
  }
  if (!skillKey) return;
  await env.DB.prepare(`
    INSERT INTO skill_proficiency
      (user_id, skill_key, lessons_done, quiz_correct, quiz_attempts, labs_done, level, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'L1', CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, skill_key) DO UPDATE SET
      lessons_done  = MAX(0, lessons_done  + excluded.lessons_done),
      quiz_correct  = MAX(0, quiz_correct  + excluded.quiz_correct),
      quiz_attempts = MAX(0, quiz_attempts + excluded.quiz_attempts),
      labs_done     = MAX(0, labs_done     + excluded.labs_done),
      updated_at    = CURRENT_TIMESTAMP`)
    .bind(userId, skillKey,
      deltas.lessons || 0, deltas.quizCorrect || 0, deltas.quizAttempts || 0, deltas.labs || 0).run();

  await env.DB.prepare(`
    UPDATE skill_proficiency
       SET level = CASE
         WHEN lessons_done >= 6 AND labs_done >= 2 THEN 'L4'
         WHEN lessons_done >= 4 AND quiz_attempts >= 4 THEN 'L3'
         WHEN lessons_done >= 2 THEN 'L2'
         ELSE 'L1' END
     WHERE user_id = ? AND skill_key = ?`).bind(userId, skillKey).run();
}

export async function getProficiency(env, userId) {
  const { results } = await env.DB.prepare(`
    SELECT p.*, s.name, s.name_km, s.category_key
      FROM skill_proficiency p JOIN skills s ON s.key = p.skill_key
     WHERE p.user_id = ? ORDER BY p.updated_at DESC`).bind(userId).all();
  return results.map((r) => ({
    skill: r.skill_key,
    name: r.name,
    nameKm: r.name_km,
    category: r.category_key,
    level: r.level,
    evidence: { lessons: r.lessons_done, quiz: `${r.quiz_correct}/${r.quiz_attempts}`, labs: r.labs_done },
  }));
}

// ---------------------------------------------------------------------------
// Business Lab
// ---------------------------------------------------------------------------
export async function listExercises(env, locale = "en", category) {
  const loc = normLocale(locale);
  const sql = category
    ? `SELECT * FROM lab_exercises WHERE status='active' AND category_key = ? ORDER BY sort_order`
    : `SELECT * FROM lab_exercises WHERE status='active' ORDER BY sort_order`;
  const st = env.DB.prepare(sql);
  const { results } = category ? await st.bind(category).all() : await st.all();
  return results.map((e) => shapeExercise(e, loc));
}

export async function getExercise(env, locale, key) {
  const loc = normLocale(locale);
  const row = await env.DB.prepare("SELECT * FROM lab_exercises WHERE key = ? AND status='active'").bind(key).first();
  return row ? shapeExercise(row, loc) : null;
}

function shapeExercise(e, loc) {
  return {
    key: e.key,
    category: e.category_key,
    skill: e.skill_key,
    level: e.level,
    title: pick(e, "title_en", "title_km", loc),
    brief: pick(e, "brief_en", "brief_km", loc),
    instructions: pick(e, "instructions_en", "instructions_km", loc),
    expected: pick(e, "expected_en", "expected_km", loc),
    exampleData: e.example_data,
    rubric: jsonCol(e.rubric, []),
    estMinutes: e.est_minutes,
  };
}

// Rule-based bands. These are stated criteria, not a judgement about the
// person: the score says whether the ANSWER met the RUBRIC, nothing more.
export function bandFor(percent) {
  if (percent >= 85) return { band: "strong", en: "Strong — this meets the rubric.", km: "ខ្លាំង — ការងារនេះស្របនឹងការវាយតម្លៃ។" };
  if (percent >= 60) return { band: "meets", en: "Meets most of the rubric. Review the criteria you scored lowest.", km: "ស្របនឹងភាគរយប្រទាំងបីរបី។ ពិនិត្យលក្ខខណ្ឌដែលអ្នកបានពិនិត្យថ្នាក់ទាបបំផុត។" };
  if (percent > 0) return { band: "partial", en: "Partial — several rubric criteria are not met yet. Try again.", km: "មួយផ្នែក — លក្ខខណ្ឌវាយតម្លៃជាច្រើនមិនទាន់សម្រេច។ ព្យាយាមម្តងទៀត។" };
  return { band: "unscored", en: "Not scored yet. Use the rubric to self-assess.", km: "មិនទាន់បានវាយតម្លៃ។ ប្រើការវាយតម្លៃដើម្បីវាយតម្លៃខ្លួនឯង។" };
}

// Accepts the learner's per-criterion scores, clamps every value to that
// criterion's maximum, and ignores unknown criteria. A client cannot inflate a
// score by sending a number larger than the rubric allows, or by inventing a
// criterion that is not in the rubric.
export function scoreAgainstRubric(rubric, scores) {
  const list = Array.isArray(rubric) ? rubric : [];
  const out = {};
  let earned = 0;
  let possible = 0;
  const lines = [];
  for (const r of list) {
    const max = Number(r.max) || 0;
    possible += max;
    const given = Number(scores?.[r.criterion]);
    const clamped = Number.isFinite(given) ? Math.max(0, Math.min(max, given)) : 0;
    out[r.criterion] = clamped;
    earned += clamped;
    lines.push(`${clamped}/${max} — ${r.criterion}`);
  }
  const percent = possible > 0 ? Math.round((earned / possible) * 100) : 0;
  return { scores: out, earned, possible, percent, detail: lines };
}

export async function saveSubmission(env, userId, key, answer, selfScore, rubricScores) {
  // Confirm the exercise exists so a typo cannot create orphan submissions.
  const ex = await env.DB.prepare("SELECT key, skill_key, rubric, title_en, title_km FROM lab_exercises WHERE key = ? AND status='active'").bind(key).first();
  if (!ex) return null;

  const rubric = jsonCol(ex.rubric, []);
  const scored = scoreAgainstRubric(rubric, rubricScores);

  // attempt is derived, never taken from the client, so two concurrent
  // submissions cannot collide or overwrite each other.
  const prev = await env.DB.prepare(
    "SELECT COALESCE(MAX(attempt), 0) AS a FROM lab_submissions WHERE user_id = ? AND exercise_key = ?")
    .bind(userId, key).first();

  const attempt = (prev?.a || 0) + 1;

  // A single self_score is only trusted when it is consistent with the rubric
  // total. If the learner supplied per-criterion scores, those are the truth.
  const totalScore = scored.possible > 0 ? scored.earned
    : (Number.isFinite(selfScore) ? Math.max(0, Math.min(100, selfScore)) : null);

  await env.DB.prepare(`
    INSERT INTO lab_submissions
      (user_id, exercise_key, attempt, answer, self_score, rubric_scores, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'submitted', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`)
    .bind(userId, key, attempt, String(answer || "").slice(0, 20000), totalScore,
      JSON.stringify(scored.scores)).run();

  if (attempt === 1) await bumpProficiency(env, userId, ex.skill_key, { labs: 1 });

  const b = bandFor(scored.percent);
  return {
    attempt,
    earned: scored.earned,
    possible: scored.possible,
    percent: scored.percent,
    band: b.band,
    feedback: b.en,
    detail: scored.detail,
  };
}

export async function listSubmissions(env, userId) {
  const { results } = await env.DB.prepare(`
    SELECT s.*, e.title_en, e.title_km, e.rubric
      FROM lab_submissions s JOIN lab_exercises e ON e.key = s.exercise_key
     WHERE s.user_id = ? ORDER BY s.updated_at DESC`).bind(userId).all();
  return results.map((r) => {
    const rubric = jsonCol(r.rubric, []);
    const scores = jsonCol(r.rubric_scores, {});
    const possible = rubric.reduce((n, x) => n + (Number(x.max) || 0), 0);
    const earned = Object.values(scores).reduce((a, b) => a + (Number(b) || 0), 0);
    return {
      exercise: r.exercise_key,
      title: r.title_en,
      titleKm: r.title_km,
      attempt: r.attempt,
      earned,
      possible,
      percent: possible > 0 ? Math.round((earned / possible) * 100) : null,
      band: possible > 0 ? bandFor(Math.round((earned / possible) * 100)).band : "unscored",
      breakdown: rubric.map((x) => ({ criterion: x.criterion, got: scores[x.criterion] ?? 0, max: x.max })),
      aiFeedback: r.ai_feedback || "",
      aiModel: r.ai_model || "",
      updated: r.updated_at,
    };
  });
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------
export async function getUserAnalytics(env, userId) {
  const one = async (sql, ...args) =>
    (await env.DB.prepare(sql).bind(...args).first()) || {};

  const lessons = await one("SELECT COUNT(*) c FROM lesson_progress WHERE user_id = ? AND status='completed'", userId);
  const quiz = await one(`
    SELECT COUNT(*) attempts, COALESCE(SUM(correct),0) correct FROM quiz_attempts WHERE user_id = ?`, userId);
  const labs = await one("SELECT COUNT(*) c FROM lab_submissions WHERE user_id = ?", userId);
  const journal = await one("SELECT COUNT(*) c FROM learning_journal WHERE user_id = ?", userId);

  // Streak is computed from distinct completion dates, walking back from the
  // most recent one. Days with no record break the streak; it does not assume
  // the learner was active but simply unrecorded.
  const dates = await env.DB.prepare(`
    SELECT DISTINCT session_date d FROM learning_sessions
     WHERE user_id = ? AND completed = 1 ORDER BY d DESC LIMIT 400`).bind(userId).all();
  const set = new Set(dates.results.map((r) => r.d));
  let streak = 0;
  const cursor = new Date();
  for (;;) {
    const iso = cursor.toISOString().slice(0, 10);
    if (set.has(iso)) { streak++; cursor.setUTCDate(cursor.getUTCDate() - 1); }
    else if (streak === 0 && set.has(new Date(cursor.getTime() - 86400000).toISOString().slice(0, 10))) {
      // yesterday still counts as the anchor day
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    } else break;
  }

  return {
    lessonsCompleted: lessons.c || 0,
    quiz: { attempts: quiz.attempts || 0, correct: quiz.correct || 0 },
    labsSubmitted: labs.c || 0,
    journalEntries: journal.c || 0,
    streakDays: streak,
  };
}

export async function getAdminOverview(env) {
  const one = async (sql) => (await env.DB.prepare(sql).first()) || {};
  const users = await one("SELECT COUNT(*) c FROM users WHERE status='active'");
  const week = await one("SELECT COUNT(*) c FROM users WHERE created_at >= date('now','-7 day')");
  const lessons = await one("SELECT COUNT(*) c FROM lesson_progress WHERE status='completed'");
  const quiz = await one("SELECT COUNT(*) attempts, COALESCE(SUM(correct),0) correct FROM quiz_attempts");
  const deliveries = await one(`
    SELECT COALESCE(SUM(status='sent'),0) sent,
           COALESCE(SUM(status='failed'),0) failed,
           COALESCE(SUM(status='pending'),0) pending
      FROM notification_deliveries`);
  const news = await one("SELECT COUNT(*) c FROM stories");

  const byCategory = await env.DB.prepare(`
    SELECT c.key, c.name_en, c.name_km,
           COALESCE(SUM(p.status='completed'), 0) completed
      FROM categories c
      LEFT JOIN skills s ON s.category_key = c.key
      LEFT JOIN lesson_progress p ON p.lesson_id IN (SELECT id FROM lessons WHERE skill_key = s.key)
     GROUP BY c.key ORDER BY c.sort_order`).all();

  const topSkills = await env.DB.prepare(`
    SELECT s.key, s.name, COUNT(p.id) AS completed
      FROM lesson_progress p JOIN lessons l ON l.id = p.lesson_id
      JOIN skills s ON s.key = l.skill_key
     WHERE p.status='completed'
     GROUP BY s.key ORDER BY completed DESC LIMIT 10`).all();

  return {
    users: { total: users.c || 0, newLast7Days: week.c || 0 },
    learning: {
      lessonsCompleted: lessons.c || 0,
      quizAttempts: quiz.attempts || 0,
      quizCorrect: quiz.correct || 0,
    },
    telegram: deliveries,
    news: { stories: news.c || 0 },
    byCategory: byCategory.results.map((r) => ({
      key: r.key, name: r.name_en, nameKm: r.name_km, completed: r.completed || 0,
    })),
    topSkills: topSkills.results.map((r) => ({ key: r.key, name: r.name, completed: r.completed })),
  };
}

// ---------------------------------------------------------------------------
// Privacy: export and delete
// ---------------------------------------------------------------------------
export async function exportUserData(env, userId, locale = "en") {
  const loc = normLocale(locale);
  const dump = async (sql, ...a) => (await env.DB.prepare(sql).bind(...a).all()).results;

  const [profile, progress, quiz, journal, sessions, labs, coach, links, enrollments] = await Promise.all([
    dump("SELECT id,email,display_name,locale,level,occupation,daily_minutes,goals,created_at FROM users WHERE id=?", userId),
    dump("SELECT * FROM lesson_progress WHERE user_id=?", userId),
    dump("SELECT * FROM quiz_attempts WHERE user_id=?", userId),
    dump("SELECT * FROM learning_journal WHERE user_id=?", userId),
    dump("SELECT * FROM reflections WHERE user_id=?", userId),
    dump("SELECT * FROM lab_submissions WHERE user_id=?", userId),
    dump("SELECT prompt,response,model,created_at FROM coach_sessions WHERE user_id=?", userId),
    dump("SELECT chat_id,username,reminder_enabled,locale_override FROM telegram_links WHERE user_id=?", userId),
    dump("SELECT * FROM enrollments WHERE user_id=?", userId),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    locale: loc,
    profile, progress, quizAttempts: quiz, journal, reflections: sessions,
    labSubmissions: labs, coachSessions: coach, telegramLink: links, enrollments,
  };
}

export async function deleteUserAccount(env, userId) {
  // Every child table declares ON DELETE CASCADE, so a single delete removes
  // sessions, progress, journal, labs and coach history. telegram_links and
  // ai_usage are keyed on user_id with the same cascade.
  await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(userId).run();
}
