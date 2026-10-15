// Telegram formatting for the Skill Development module.
// Produces the same `command -> reply text` shape as the existing news commands
// so worker.js can dispatch both through one handler.

import {
  getToday, getLesson, getProgress, listAssignments, getJournalEntry,
  getPreference, setPreference, remindersEnabled, saveQuiz, claimReminder,
  ictDate, ictStamp, PROGRAM_DAYS,
} from "./skills.js";
import { ASSIGNMENTS } from "./skills-data.js";

const MAX = 3800;

function clip(text, max = 140) {
  const s = String(text || "").replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function lessonBlock(l, { withQuiz = false } = {}) {
  const out = [
    `📘 Day ${l.day} of ${PROGRAM_DAYS} — ${l.title}`,
    `Skill: ${l.skill}`,
    "",
    `🎯 Goal: ${l.objective}`,
    "",
    `📖 Lesson`,
    l.explanation,
    "",
    `🏢 Business example`,
    l.example,
    "",
    `✍️ Do this now (10 min)`,
    l.exercise,
    "",
    `🚀 Apply at work today`,
    l.action,
    "",
    `💭 Reflect`,
    l.reflection,
  ];
  if (withQuiz && l.quiz?.options?.length) {
    out.push("", "🧠 Quick quiz", l.quiz.question);
    l.quiz.options.forEach((o, i) => out.push(`   ${i + 1}. ${o}`));
    out.push("", "Reply with just the number, like: 2");
  }
  return out.join("\n");
}

export const SKILL_HELP =
  "🎓 SKILL DEVELOPMENT\n\n" +
  "/skills — my five skills and progress\n" +
  "/learn — today's 30-minute lesson\n" +
  "/lesson 7 — open a lesson by day (1-30)\n" +
  "/progress — full progress tracker\n" +
  "/quiz — short quiz on today's topic\n" +
  "/practice — practical business assignment\n" +
  "/journal — record today's reflection\n" +
  "/reminder_on — daily 07:30 reminders\n" +
  "/reminder_off — stop reminders\n\n" +
  "News commands: /today /cambodia /asean /global /opportunities /refresh";

/** Handle a skill command. Returns reply text, or null if not a skill command. */
export async function handleSkillCommand(env, command, arg) {
  switch (command) {
    case "/skills":
      return await skillsOverview(env);
    case "/learn":
      return await todayLesson(env);
    case "/lesson": {
      const n = Number.parseInt(arg, 10);
      if (!Number.isInteger(n) || n < 1 || n > PROGRAM_DAYS) {
        return `📘 Which day?\nUse /lesson 1 to /lesson ${PROGRAM_DAYS}.\nExample: /lesson 7`;
      }
      const lesson = await getLesson(env, n);
      if (!lesson) return `Day ${n} is not available yet. Use /lesson 1 to /lesson ${PROGRAM_DAYS}.`;
      return lessonBlock(lesson, { withQuiz: true });
    }
    case "/progress":
      return await progressReport(env);
    case "/quiz":
      return await startQuiz(env);
    case "/practice":
      return await practiceAssignment(env);
    case "/journal":
      return await journalPrompt(env);
    case "/reminder_on":
      await setPreference(env, "reminders_enabled", "1");
      return "🔔 Daily reminders ON.\n\nYou will get a short learning prompt every day at 07:30 Cambodia time.\nIt tells you the skill, the lesson, and why it matters.\n\nTurn it off any time with /reminder_off.";
    case "/reminder_off":
      await setPreference(env, "reminders_enabled", "0");
      return "🔕 Daily reminders OFF.\n\nYour progress is still saved. Turn reminders back on with /reminder_on.";
    default:
      return null;
  }
}

/** Grade a bare "1".."4" reply while a quiz is pending. Returns text or null. */
export async function handleQuizAnswer(env, text) {
  const pending = await getPreference(env, "pending_quiz_day", "");
  if (!pending) return null;
  const n = Number.parseInt(String(text).trim(), 10);
  if (!Number.isInteger(n) || n < 1 || n > 4) return null;

  await setPreference(env, "pending_quiz_day", "");
  const result = await saveQuiz(env, { day: Number(pending), chosen: n - 1 });
  return (
    (result.correct ? "✅ Correct.\n\n" : "❌ Not quite.\n\n") +
    `💡 ${result.explain}\n\n` +
    `Progress on day ${result.day} quiz is recorded.`
  );
}

async function skillsOverview(env) {
  const p = await getProgress(env);
  const lines = [
    "🎓 MY SKILL DEVELOPMENT",
    ictStamp(),
    "",
    `Overall: ${p.overall.completedLessons}/${p.overall.totalLessons} lessons (${p.overall.percent}%)`,
    `🔥 Streak: ${p.overall.currentStreak} day${p.overall.currentStreak === 1 ? "" : "s"}`,
    "",
  ];
  for (const s of p.bySkill) {
    const bar = meter(s.percent);
    lines.push(`${s.icon} ${s.name}`, `   ${bar} ${s.percent}%  (${s.completedLessons}/${s.totalLessons})`);
    if (s.nextLesson) lines.push(`   Next: Day ${s.nextLesson.day} — ${clip(s.nextLesson.title, 60)}`);
    lines.push("");
  }
  const weakest = p.needsImprovement[0];
  if (weakest) lines.push(`🎯 Needs most attention: ${weakest.name} (${weakest.percent}%)`);
  lines.push("", "/learn for today's lesson · /progress for details");
  return lines.join("\n").slice(0, MAX);
}

function meter(pct) {
  const filled = Math.round(pct / 10);
  return "[" + "█".repeat(filled) + "░".repeat(10 - filled) + "]";
}

async function todayLesson(env) {
  const t = await getToday(env);
  if (!t.lesson) return "No lesson is available yet. Open the website to finish setup.";
  const head = [
    `📅 ${t.date} — Day ${t.day} of ${PROGRAM_DAYS}`,
    `Skill: ${t.skill?.name || t.lesson.skill}`,
    t.isCatchUp ? "✅ You finished the 30-day plan. Reviewing the final lesson." : "",
    "",
  ].filter(Boolean);
  return (head.join("\n") + lessonBlock(t.lesson, { withQuiz: true })).slice(0, MAX);
}

async function progressReport(env) {
  const p = await getProgress(env);
  const lines = [
    "📊 LEARNING PROGRESS",
    ictStamp(),
    "",
    `Lessons: ${p.overall.completedLessons}/${p.overall.totalLessons} (${p.overall.percent}%)`,
    `🔥 Current streak: ${p.overall.currentStreak} days`,
    `⏱ Total study time: ${p.overall.totalMinutes} min`,
    `📅 Lessons this week: ${p.overall.thisWeekLessons}`,
    `🧠 Quizzes: ${p.overall.quizCorrect}/${p.overall.quizAttempts} correct (${p.overall.quizAccuracy}%)`,
    `💼 Assignments completed: ${p.overall.completedAssignments}`,
    `📓 Journal entries: ${p.overall.journalEntries}`,
    "",
    "By skill:",
  ];
  for (const s of p.bySkill) {
    lines.push(`   ${s.icon} ${s.name}: ${s.percent}%`);
  }
  const week = p.weekly.filter((d) => d.completed > 0);
  if (week.length) {
    lines.push("", "This week:", ...week.map((d) => `   ${d.label}: ${d.completed} lesson${d.completed === 1 ? "" : "s"}`));
  }
  if (p.needsImprovement.length) {
    lines.push("", "🎯 Focus next: " + p.needsImprovement.map((s) => `${s.name} (${s.percent}%)`).join(", "));
  }
  return lines.join("\n").slice(0, MAX);
}

async function startQuiz(env) {
  const t = await getToday(env);
  if (!t.lesson) return "No quiz available yet. Use /learn first.";
  await setPreference(env, "pending_quiz_day", String(t.lesson.day));
  const q = t.lesson.quiz;
  return (
    `🧠 QUIZ — Day ${t.lesson.day}\n${t.lesson.title}\n\n${q.question}\n\n` +
    q.options.map((o, i) => `   ${i + 1}. ${o}`).join("\n") +
    "\n\nReply with just the number, like: 2"
  ).slice(0, MAX);
}

async function practiceAssignment(env) {
  const done = await listAssignments(env);
  const bySkill = new Map();
  for (const a of done) {
    if (!bySkill.has(a.skill)) bySkill.set(a.skill, 0);
    bySkill.set(a.skill, bySkill.get(a.skill) + 1);
  }
  // Offer the least-used skill so the rotation stays balanced.
  const order = ["strategic", "sales", "leadership", "financial", "digital"];
  const skillKey = order.reduce((best, k) => ((bySkill.get(k) || 0) < (bySkill.get(best) || 0) ? k : best), order[0]);
  const a = ASSIGNMENTS.find((x) => x.skill === skillKey) || ASSIGNMENTS[0];

  const lines = [
    `💼 APPLY TO MY BUSINESS`,
    `Skill: ${a.title}`,
    "",
    a.prompt,
    "",
    "Steps:",
    ...a.steps.map((s, i) => `   ${i + 1}. ${s}`),
    "",
    `📎 Evidence: ${a.evidence}`,
    "",
    "Record your work on the website under Skill Development → Apply to My Business.",
  ];
  return lines.join("\n").slice(0, MAX);
}

async function journalPrompt(env) {
  const date = ictDate();
  const entry = await getJournalEntry(env, date);
  const lines = [`📓 TODAY'S REFLECTION — ${date}`, ""];
  if (entry && (entry.learned || entry.applied)) {
    lines.push("You already wrote today. Current entry:", "", `Learned: ${clip(entry.learned, 200)}`, `Applied: ${clip(entry.applied, 200)}`, "");
    lines.push("Edit or extend it on the website → Skill Development → Learning Journal.");
    return lines.join("\n").slice(0, MAX);
  }
  lines.push(
    "Answer these five questions on the website, or write them here and keep a copy:",
    "",
    "1. What did I learn today?",
    "2. What did I apply at work?",
    "3. What worked well?",
    "4. What did not work?",
    "5. What is my next action?",
    "",
    "Open the site → Skill Development → Learning Journal to save it."
  );
  return lines.join("\n").slice(0, MAX);
}

/** 07:30 Cambodia daily reminder. Returns the text, or null if it should not send. */
export async function buildReminder(env, siteUrl) {
  if (!(await remindersEnabled(env))) return null;
  const today = ictDate();
  if (!(await claimReminder(env, "learning", today))) return null;

  const t = await getToday(env);
  if (!t.lesson) return null;

  return (
    `⏰ 30-MINUTE LEARNING REMINDER\n` +
    `Skill: ${t.skill?.name || t.lesson.skill}\n` +
    `Day ${t.day}: ${t.lesson.title}\n\n` +
    `🎯 ${t.lesson.objective}\n\n` +
    `Why it matters: this is a ${PROGRAM_DAYS}-day plan across five business skills. ` +
    `Skipping days is what stops the habit forming, and ${t.lesson.title} builds directly on earlier lessons.\n\n` +
    `Do this in 30 minutes:\n` +
    `   10 min — read the lesson\n` +
    `   10 min — do the exercise\n` +
    `   10 min — apply one thing at work\n\n` +
    `Open: ${siteUrl || "your Skill Development page"}\n` +
    `Or send /learn to get it in Telegram.`
  ).slice(0, MAX);
}

export async function reminderStatus(env) {
  return (await remindersEnabled(env)) ? "on" : "off";
}
