// Telegram formatting for the Skill Development module.
// Handlers return { text, keyboard } so worker.js can attach an inline keyboard,
// or { text, alert } for a callback query reply.

import {
  getToday, getLesson, getProgress, listAssignments, getJournalEntry,
  getPreference, setPreference, remindersEnabled, saveQuiz, claimReminder,
  completeLesson, getLastSent, setLastSent, saveReflection, deliveryStats,
  ictDate, ictStamp, PROGRAM_DAYS,
} from "./skills.js";
import { ASSIGNMENTS } from "./skills-data.js";
import { buildDailyLesson, lessonKeyboard, reviewKeyboard, MOTIVATION } from "./skills-daily.js";

const MAX = 3800;

function clip(text, max = 140) {
  const s = String(text || "").replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function meter(pct) {
  const filled = Math.round(Math.max(0, Math.min(100, pct || 0)) / 10);
  return "[" + "█".repeat(filled) + "░".repeat(10 - filled) + "]";
}

export const SKILL_HELP =
  "🎓 SKILL DEVELOPMENT\n\n" +
  "/learn — today's lesson now\n" +
  "/complete — mark today's lesson complete\n" +
  "/skills — my five skills and progress\n" +
  "/lesson 7 — open a lesson by day (1-30)\n" +
  "/progress — full progress tracker\n" +
  "/quiz — short quiz on today's topic\n" +
  "/practice — practical business assignment\n" +
  "/journal — today's reflection guide\n" +
  "/reminder_on — daily 06:00 lessons\n" +
  "/reminder_off — stop daily lessons\n\n" +
  "News: /today /cambodia /asean /global /opportunities /refresh";

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

/** Handle a skill command. Returns { text, keyboard } or null if not a skill command. */
export async function handleSkillCommand(env, command, arg) {
  switch (command) {
    case "/skills":
      return { text: await skillsOverview(env) };
    case "/learn": {
      const built = await buildDailyLesson(env);
      if (built.type === "lesson") {
        await setLastSent(env, { day: built.day, type: "lesson" });
        return { text: built.text, keyboard: lessonKeyboard(built.day) };
      }
      return { text: built.text, keyboard: built.quizDay ? reviewKeyboard(built.quizDay) : undefined };
    }
    case "/complete":
      return { text: await doComplete(env) };
    case "/lesson": {
      const n = Number.parseInt(arg, 10);
      if (!Number.isInteger(n) || n < 1 || n > PROGRAM_DAYS) {
        return { text: `📘 Which day?\nUse /lesson 1 to /lesson ${PROGRAM_DAYS}.\nExample: /lesson 7` };
      }
      const lesson = await getLesson(env, n);
      if (!lesson) return { text: `Day ${n} is not available yet. Use /lesson 1 to /lesson ${PROGRAM_DAYS}.` };
      await setLastSent(env, { day: n, type: "lesson" });
      return { text: lessonBlock(lesson, { withQuiz: true }), keyboard: lessonKeyboard(n) };
    }
    case "/progress":
      return { text: await progressReport(env) };
    case "/quiz":
      return { text: await startQuiz(env) };
    case "/practice":
      return { text: await practiceAssignment(env) };
    case "/journal":
      return { text: await journalPrompt(env) };
    case "/reminder_on":
      await setPreference(env, "reminders_enabled", "1");
      return {
        text:
          "🔔 Daily lessons ON.\n\n" +
          "Every morning at 06:00 Cambodia time you will get a lesson covering one of the five skills, " +
          "with a practical exercise and one way to apply it at Khmer24.\n\n" +
          "Turn it off any time with /reminder_off.",
      };
    case "/reminder_off":
      await setPreference(env, "reminders_enabled", "0");
      return {
        text:
          "🔕 Daily lessons OFF.\n\n" +
          "No more automatic morning messages. Your progress is still saved.\n" +
          "You can still use /learn any time.\n\nTurn back on with /reminder_on.",
      };
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
    `💡 ${result.explain}\n\nProgress on day ${result.day} quiz is recorded.`
  );
}

async function doComplete(env) {
  const last = await getLastSent(env);
  if (!last.day) {
    return "Nothing to mark yet.\n\nSend /learn first, then /complete when you finish the lesson.";
  }
  const result = await completeLesson(env, last.day);
  const p = await getProgress(env);
  return [
    `✅ Marked complete — Day ${result.day}: ${result.title}`,
    ``,
    `Programme now at ${p.overall.completedLessons}/${p.overall.totalLessons} lessons (${p.overall.percent}%).`,
    p.overall.currentStreak > 0 ? `🔥 Streak: ${p.overall.currentStreak} day(s).` : "",
    ``,
    `Tomorrow's lesson arrives automatically at 06:00 Cambodia time.`,
    `Want to reflect? Send /journal.`,
  ].filter(Boolean).join("\n");
}

/** Handle a Telegram inline button press. Returns { text, alert } or null. */
export async function handleCallback(env, data) {
  const [action, raw] = String(data || "").split(":");
  const day = Number.parseInt(raw, 10);

  if (action === "done") {
    if (!Number.isInteger(day) || day < 1 || day > PROGRAM_DAYS) return null;
    const result = await completeLesson(env, day);
    const p = await getProgress(env);
    return {
      alert: `Day ${result.day} complete! ${p.overall.percent}% of the programme done.`,
      text: [
        `✅ Marked complete — Day ${result.day}: ${result.title}`,
        ``,
        `Programme now at ${p.overall.completedLessons}/${p.overall.totalLessons} lessons (${p.overall.percent}%).`,
        p.overall.currentStreak > 0 ? `🔥 Streak: ${p.overall.currentStreak} day(s).` : "",
        ``,
        `Next lesson arrives automatically at 06:00 Cambodia time.`,
      ].filter(Boolean).join("\n"),
    };
  }

  if (action === "quiz") {
    const target = Number.isInteger(day) && day >= 1 && day <= PROGRAM_DAYS ? day : 1;
    const lesson = await getLesson(env, target);
    if (!lesson) return null;
    await setPreference(env, "pending_quiz_day", String(target));
    return {
      alert: "Quiz sent",
      text: [
        `🧠 QUIZ — Day ${lesson.day}`,
        lesson.title,
        ``,
        lesson.quiz.question,
        ``,
        lesson.quiz.options.map((o, i) => `   ${i + 1}. ${o}`).join("\n"),
        ``,
        `Reply with just the number, like: 2`,
      ].join("\n"),
    };
  }

  if (action === "reflect") {
    await saveReflection(env, {
      date: ictDate(),
      day: Number.isInteger(day) && day > 0 ? day : null,
      prompt: "What did you learn today, and what will you do differently tomorrow?",
      body: "",
    }, "telegram");
    return {
      alert: "Reflection started",
      text: [
        `📝 Today's Reflection — ${ictDate()}`,
        ``,
        `Answer these two questions, then add the full write-up on the website:`,
        `Skill Development → Learning Journal.`,
        ``,
        `1. What did you learn today?`,
        `2. What did you apply at work, and what happened?`,
        ``,
        `One honest sentence is worth more than a long paragraph.`,
      ].join("\n"),
    };
  }

  return null;
}

async function skillsOverview(env) {
  const p = await getProgress(env);
  const deliveries = await deliveryStats(env);
  const lines = [
    "🎓 MY SKILL DEVELOPMENT",
    ictStamp(),
    "",
    `Overall: ${p.overall.completedLessons}/${p.overall.totalLessons} lessons (${p.overall.percent}%)`,
    `🔥 Streak: ${p.overall.currentStreak} day${p.overall.currentStreak === 1 ? "" : "s"}`,
    `⏱ Study time: ${p.overall.totalMinutes} min`,
    `📬 Lessons sent: ${deliveries.sent || 0}`,
    "",
  ];
  for (const s of p.bySkill) {
    lines.push(`${s.icon} ${s.name}`, `   ${meter(s.percent)} ${s.percent}%  (${s.completedLessons}/${s.totalLessons})`);
    if (s.nextLesson) lines.push(`   Next: Day ${s.nextLesson.day} — ${clip(s.nextLesson.title, 60)}`);
    lines.push("");
  }
  const weakest = p.needsImprovement[0];
  if (weakest) lines.push(`🎯 Needs most attention: ${weakest.name} (${weakest.percent}%)`);
  lines.push("", "/learn for today's lesson · /progress for details");
  return lines.join("\n").slice(0, MAX);
}

async function progressReport(env) {
  const p = await getProgress(env);
  const deliveries = await deliveryStats(env);
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
    `📬 Automatic lessons delivered: ${deliveries.sent || 0}` +
      (deliveries.last_delivery ? `\n🕐 Last delivery: ${deliveries.last_delivery}` : ""),
    "",
    "By skill:",
  ];
  for (const s of p.bySkill) lines.push(`   ${s.icon} ${s.name}: ${s.percent}%`);
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
  const target = t.lesson?.day || 1;
  const lesson = await getLesson(env, target);
  if (!lesson) return "Your curriculum is not loaded yet. Open the website once to initialise it.";
  await setPreference(env, "pending_quiz_day", String(target));
  return (
    `🧠 QUIZ — Day ${lesson.day}\n${lesson.title}\n\n${lesson.quiz.question}\n\n` +
    lesson.quiz.options.map((o, i) => `   ${i + 1}. ${o}`).join("\n") +
    "\n\nReply with just the number, like: 2"
  ).slice(0, MAX);
}

async function practiceAssignment(env) {
  const done = await listAssignments(env);
  const bySkill = new Map();
  for (const a of done) bySkill.set(a.skill, (bySkill.get(a.skill) || 0) + 1);
  const order = ["strategic", "sales", "leadership", "financial", "digital"];
  const skillKey = order.reduce((best, k) => ((bySkill.get(k) || 0) < (bySkill.get(best) || 0) ? k : best), order[0]);
  const a = ASSIGNMENTS.find((x) => x.skill === skillKey) || ASSIGNMENTS[0];

  return [
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
    "Record your work on the website → Skill Development → Apply to My Business.",
  ].join("\n").slice(0, MAX);
}

async function journalPrompt(env) {
  const date = ictDate();
  const entry = await getJournalEntry(env, date);
  const lines = [`📓 TODAY'S REFLECTION — ${date}`, ""];
  if (entry && (entry.learned || entry.applied)) {
    lines.push(
      "You already wrote today:",
      "",
      `Learned: ${clip(entry.learned, 200)}`,
      `Applied: ${clip(entry.applied, 200)}`,
      "",
      "Edit or extend it on the website → Skill Development → Learning Journal."
    );
    return lines.join("\n").slice(0, MAX);
  }
  lines.push(
    "Answer these on the website, or write them here and keep a copy:",
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

/**
 * 06:00 Cambodia daily lesson, sent by cron or by a manual trigger.
 * Claims the date first so a repeated run can never send twice.
 */
export async function buildReminder(env, siteUrl) {
  if (!(await remindersEnabled(env))) return null;
  return null; // superseded by the 06:00 daily lesson
}

export async function reminderStatus(env) {
  return (await remindersEnabled(env)) ? "on" : "off";
}
