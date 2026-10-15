// Integration test suite for the Skill Development module.
// Runs against a deployed Worker (or `wrangler dev` on localhost).
//
//   node tests/api.test.mjs                       # uses .dev.vars + deployed SITE_URL
//   BASE_URL=http://127.0.0.1:8787 node tests/api.test.mjs
//
// Results are printed as PASS/FAIL per case with a final summary.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const vars = Object.fromEntries(
  readFileSync(join(root, ".dev.vars"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.trim() && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const BASE = (process.env.BASE_URL || "https://economic-intelligence-dashboard.ebookskh855.workers.dev").replace(/\/$/, "");
const SECRET = process.env.ADMIN_SECRET || vars.ADMIN_SECRET;

let cookie = "";
const results = [];
function record(name, pass, detail = "") {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? "  -> " + detail : ""}`);
}

async function call(path, { method = "GET", body, auth = true, headers = {} } = {}) {
  const h = { accept: "application/json", ...headers };
  if (body !== undefined) h["content-type"] = "application/json";
  if (auth) {
    if (cookie) h.cookie = cookie;
    else h.authorization = "Bearer " + SECRET;
  }
  const res = await fetch(BASE + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(";")[0];
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  return { status: res.status, data };
}

const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Phnom_Penh", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

(async () => {
  console.log(`\nTesting ${BASE}\n${"=".repeat(60)}\n`);

  // --- 1. Protection on personal data ------------------------------------
  const noAuth = await call("/api/skills/today", { auth: false });
  record("unauthenticated /api/skills/today is rejected", noAuth.status === 401, `got ${noAuth.status}`);

  const noAuthProgress = await call("/api/skills/journal", { auth: false });
  record("unauthenticated /api/skills/journal is rejected", noAuthProgress.status === 401, `got ${noAuthProgress.status}`);

  const badLogin = await call("/api/skills/login", { method: "POST", body: { secret: "wrong-secret" }, auth: false });
  record("login with wrong secret returns 401", badLogin.status === 401, `got ${badLogin.status}`);

  // --- 2. Session ---------------------------------------------------------
  const login = await call("/api/skills/login", { method: "POST", body: { secret: SECRET }, auth: false });
  record("login with correct secret returns 200", login.status === 200, `got ${login.status}`);
  record("login issues an HttpOnly session cookie", cookie.startsWith("ei_session="));

  const session = await call("/api/skills/session");
  record("session reports authenticated", session.status === 200 && session.data?.authenticated === true);
  record("session authenticated via cookie, not raw secret", session.data?.via === "cookie", `via=${session.data?.via}`);

  // --- 3. Curriculum ------------------------------------------------------
  const plan = await call("/api/skills/plan");
  record("plan returns 30 lessons", plan.data?.plan?.length === 30, `got ${plan.data?.plan?.length}`);
  const days = (plan.data?.plan || []).map((p) => p.day);
  record("plan days are unique and complete 1-30", days.length === 30 && days.every((d, i) => d === i + 1));

  const lesson = await call("/api/skills/lesson?day=1");
  const l = lesson.data?.lesson;
  record("lesson 1 returns content", lesson.status === 200 && !!l?.title, l?.title);
  record("lesson has all required sections",
    !!(l?.objective && l?.explanation && l?.example && l?.exercise && l?.action && l?.reflection));
  record("quiz has 4 options", l?.quiz?.options?.length === 4);
  record("quiz answer is NOT sent to the client", l?.quiz && l.quiz.answer === undefined && l.quiz.correctIndex === undefined);

  const lesson30 = await call("/api/skills/lesson?day=30");
  record("lesson 30 exists (final day)", lesson30.status === 200 && !!lesson30.data?.lesson?.title, lesson30.data?.lesson?.title);

  // --- 4. Validation ------------------------------------------------------
  record("day=0 rejected", (await call("/api/skills/lesson?day=0")).status === 400);
  record("day=31 rejected", (await call("/api/skills/lesson?day=31")).status === 400);
  record("day=abc rejected", (await call("/api/skills/lesson?day=abc")).status === 400);
  record("day=-5 rejected", (await call("/api/skills/lesson?day=-5")).status === 400);
  record("unknown skills route returns 404", (await call("/api/skills/nope")).status === 404);

  // --- 5. Today's plan ----------------------------------------------------
  const t = await call("/api/skills/today");
  record("today returns a lesson", t.status === 200 && !!t.data?.lesson, `day ${t.data?.lesson?.day}`);
  record("today returns the 3-part 30-minute routine", t.data?.routine?.length === 3 &&
    t.data.routine.reduce((s, r) => s + r.minutes, 0) === 30);
  record("today uses Cambodia timezone", t.data?.timezone === "Asia/Phnom_Penh");

  // --- 6. Progress + idempotency -----------------------------------------
  const body = { day: 1, date: today, step_learned: 1, step_analyzed: 1, step_applied: 1, minutes: 30, notes: "integration test" };
  const save1 = await call("/api/skills/progress", { method: "POST", body });
  record("saving completion succeeds", save1.status === 200 && save1.data?.completed === true);
  const save2 = await call("/api/skills/progress", { method: "POST", body });
  record("saving the same day twice is idempotent", save2.status === 200);

  const progress = await call("/api/skills/progress");
  const p = progress.data;
  record("progress counts the completed lesson", p?.overall?.completedLessons >= 1, `${p?.overall?.completedLessons} done`);
  record("progress has 5 skills", p?.bySkill?.length === 5);
  record("progress totals are consistent",
    p?.bySkill?.reduce((s, x) => s + x.totalLessons, 0) === p?.overall?.totalLessons);
  record("percentages are numbers in range",
    p?.bySkill?.every((s) => typeof s.percent === "number" && s.percent >= 0 && s.percent <= 100));
  record("streak is a number", typeof p?.overall?.currentStreak === "number");
  record("study minutes recorded", p?.overall?.totalMinutes >= 30, `${p?.overall?.totalMinutes} min`);
  record("weekly chart has 7 days", p?.weekly?.length === 7);

  // partial completion must NOT count as a completed day
  const partial = await call("/api/skills/progress", { method: "POST",
    body: { day: 2, date: today, step_learned: 1, step_analyzed: 0, step_applied: 0, minutes: 10 } });
  record("partial routine is not marked complete", partial.data?.completed === false);

  // --- 7. Quiz ------------------------------------------------------------
  const quizBad = await call("/api/skills/quiz", { method: "POST", body: { day: 1, chosen: 0 } });
  record("quiz accepts an answer and grades it", quizBad.status === 200 && typeof quizBad.data?.correct === "boolean");
  record("quiz response reveals correct index after grading", typeof quizBad.data?.correctIndex === "number");
  record("quiz with invalid day rejected", (await call("/api/skills/quiz", { method: "POST", body: { day: 99, chosen: 1 } })).status === 400);

  // --- 8. Journal ---------------------------------------------------------
  const jBody = { date: today, learned: "test learned", applied: "test applied", worked_well: "x",
                  did_not_work: "y", improve: "z", next_action: "do it", mood: 4 };
  const jSave = await call("/api/skills/journal", { method: "POST", body: jBody });
  record("journal entry saves", jSave.status === 200 && jSave.data?.date === today);
  const jGet = await call("/api/skills/journal?date=" + today);
  record("journal entry is retrievable", jGet.data?.entry?.learned === "test learned");
  const jEdit = await call("/api/skills/journal", { method: "POST", body: { ...jBody, learned: "edited value" } });
  record("journal entry can be edited (one per day)", jEdit.status === 200);
  record("journal edit persisted",
    (await call("/api/skills/journal?date=" + today)).data?.entry?.learned === "edited value");
  record("journal rejects malformed date", (await call("/api/skills/journal?date=nope")).status === 400);
  const jList = await call("/api/skills/journal?limit=10");
  record("journal list returns entries", Array.isArray(jList.data?.entries));

  // --- 9. Assignments -----------------------------------------------------
  const templates = await call("/api/skills/assignments/templates");
  record("assignment templates available", (templates.data?.templates?.length || 0) >= 10,
    `${templates.data?.templates?.length} templates`);

  const created = await call("/api/skills/assignments", { method: "POST", body: {
    assignment_key: "strategic-1", skill: "strategic", title: "Integration test assignment",
    problem: "p", analysis: "a", solution: "s", expected_result: "e", actual_result: "r",
    lessons_learned: "l", next_action: "n", status: "done" } });
  record("assignment creates", created.status === 200 && !!created.data?.id, `id=${created.data?.id}`);

  const list = await call("/api/skills/assignments");
  const mine = list.data?.assignments?.find((a) => a.id === created.data?.id);
  record("assignment is retrievable with all fields", !!mine && mine.solution === "s" && mine.status === "done");

  const updated = await call("/api/skills/assignments", { method: "POST", body: {
    id: created.data?.id, actual_result: "measured", status: "active" } });
  record("assignment updates", updated.status === 200);
  const after = (await call("/api/skills/assignments")).data?.assignments?.find((a) => a.id === created.data?.id);
  record("assignment update persisted", after?.actual_result === "measured" && after?.status === "active");
  record("update preserves untouched fields", after?.solution === "s");

  // --- 10. Preferences / reminders ---------------------------------------
  const pref = await call("/api/skills/preferences", { method: "POST", body: { remindersEnabled: true } });
  record("reminders can be enabled", pref.status === 200 && pref.data?.remindersEnabled === true);
  record("preference persists", (await call("/api/skills/preferences")).data?.remindersEnabled === true);
  await call("/api/skills/preferences", { method: "POST", body: { remindersEnabled: false } });
  record("reminders can be disabled", (await call("/api/skills/preferences")).data?.remindersEnabled === false);

  // --- 11. Assessment -----------------------------------------------------
  const assess = await call("/api/skills/assessment");
  record("final assessment available", assess.status === 200 && !!assess.data?.assessment);
  record("assessment covers 5 skill sections", (assess.data?.assessment?.sections?.length || 0) === 5);

  // --- 12. Existing news API unaffected ----------------------------------
  const news = await call("/api/news?limit=5", { auth: false });
  record("news API still works", news.status === 200 && Array.isArray(news.data?.stories));
  record("news data preserved", (news.data?.stats?.total || 0) > 0, `${news.data?.stats?.total} stories`);
  const health = await call("/api/health", { auth: false });
  record("health endpoint still works", health.status === 200 && health.data?.telegramConfigured === true);
  record("health does not leak secrets",
    !JSON.stringify(health.data).toLowerCase().includes("token") && !JSON.stringify(health.data).toLowerCase().includes("secret"));

  // --- 13. Logout ---------------------------------------------------------
  await call("/api/skills/logout", { method: "POST" });
  const afterLogout = await call("/api/skills/today");
  record("after logout, private data is rejected again", afterLogout.status === 401, `got ${afterLogout.status}`);

  // --- summary ------------------------------------------------------------
  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${"=".repeat(60)}\n${passed}/${results.length} passed, ${failed.length} failed\n`);
  if (failed.length) {
    console.log("Failures:");
    for (const f of failed) console.log(`  - ${f.name} ${f.detail}`);
    process.exit(1);
  }
})().catch((e) => {
  console.error("\nTest run crashed:", e.message);
  process.exit(1);
});
