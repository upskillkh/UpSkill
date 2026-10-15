// Daily 06:00 Asia/Phnom_Penh skill lesson: selection, formatting, and the
// Sunday weekly review. Telegram messages are kept short enough for a phone.

import {
  ictDate, ictWeekday, weekdayName, getPlan, getLesson, getProgress,
  selectDailyLesson, getLearningPointer, getLastSent, listReflections,
  listAssignments, PROGRAM_DAYS,
} from "./skills.js";
import { SKILLS, ASSIGNMENTS } from "./skills-data.js";

export const MOTIVATION =
  "Small improvements every day create exceptional results. Learn today, apply today, improve tomorrow.";

// Monday..Friday map to one skill each. Saturday and Sunday carry no lesson number.
export const WEEKDAY_SKILL = {
  1: "strategic",
  2: "sales",
  3: "leadership",
  4: "financial",
  5: "digital",
};

const WHY = {
  strategic:
    "Strategic thinking is how you move from reacting to problems to choosing where to spend effort. As Business Development Manager at Khmer24 you are often asked which category, customer or campaign deserves the next riel of budget. Strategy is the skill of making that choice on evidence instead of habit.",
  sales:
    "Sales and revenue growth is the engine of the business. Khmer24 earns from advertisers, partners and marketplace activity, so the same funnel thinking that works in any business applies here: who the customer is, what stops them buying, and what we can change this week.",
  leadership:
    "Leadership is not having all the answers, it is making the team faster without standing in their way. Whether you are running a small squad or supporting the wider team, clear delegation, honest feedback and decisions that get made on time are what turn effort into results.",
  financial:
    "Financial and data skill turns opinions into evidence. In business development you will be judged on numbers, so being comfortable with margin, conversion, cash timing and simple forecasting is what lets you defend a proposal and show whether it worked.",
  digital:
    "Digital and AI skills multiply the hours you have. The same reporting task that takes two hours every week can be done in minutes once you structure it properly. These tools are how a small team produces output that looks like a much bigger one.",
};

function clip(text, max) {
  const s = String(text || "").trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastStop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("\n"));
  return (lastStop > max * 0.5 ? cut.slice(0, lastStop + 1) : cut).trim() + "…";
}

function skillName(key) {
  return SKILLS.find((s) => s.key === key)?.name || key || "Business skill";
}

/**
 * The full daily lesson message, plus the inline keyboard it should carry.
 * `weekday` may be overridden so Saturday and Sunday can be tested on any day.
 */
export async function buildDailyLesson(env, { date = ictDate(), force = false, weekday: weekdayOverride } = {}) {
  const weekday = Number.isInteger(weekdayOverride) ? weekdayOverride : ictWeekday();
  const plan = await getPlan(env);

  if (weekday === 0) return { type: "review", text: await buildWeeklyReview(env, plan) };
  if (weekday === 6) return { type: "practice", text: await buildSaturdayPractice(env, plan) };

  const pick = await selectDailyLesson(env, weekday, plan);
  const lesson = await getLesson(env, pick.day);
  if (!lesson) return { type: "lesson", text: "Your curriculum is not loaded yet. Open the website once to initialise it." };

  const why = WHY[pick.skill] || WHY.strategic;
  const text = [
    `🌅 DAILY SKILL DEVELOPMENT`,
    ``,
    `Day: ${lesson.day} of ${PROGRAM_DAYS}`,
    `Skill: ${skillName(lesson.skill)}`,
    `Topic: ${lesson.title}`,
    `Learning time: 15–20 minutes`,
    ``,
    `1️⃣ Today's Learning`,
    clip(lesson.explanation, 1100),
    ``,
    `2️⃣ Why It Matters`,
    clip(why, 700),
    ``,
    `3️⃣ Real Business Example`,
    clip(lesson.example, 850),
    ``,
    `4️⃣ Today's Practical Exercise`,
    clip(lesson.exercise, 450),
    ``,
    `5️⃣ Apply It to Khmer24`,
    clip(lesson.action, 450),
    ``,
    `6️⃣ Today's Challenge`,
    clip(lesson.reflection, 350),
    ``,
    `7️⃣ Track My Progress`,
    `Send /complete when you finish. That marks Day ${lesson.day} done and moves the programme forward.`,
    ``,
    `💬 "${MOTIVATION}"`,
  ].join("\n");

  return { type: "lesson", day: lesson.day, skill: lesson.skill, text, quizDay: lesson.day };
}

async function buildSaturdayPractice(env, plan) {
  const pointer = await getLearningPointer(env);
  const focus = SKILLS[Math.max(0, Math.min(SKILLS.length - 1, (pointer - 1) % SKILLS.length))];
  const template =
    ASSIGNMENTS.filter((a) => a.skill === focus.key)[0] || ASSIGNMENTS[0];

  const done = await listAssignments(env);
  const mine = done.filter((a) => a.assignment_key === template.id);

  return [
    `🛠️ PRACTICAL BUSINESS APPLICATION`,
    ``,
    `Day: Saturday review`,
    `Skill: ${focus.name}`,
    `Topic: ${template.title}`,
    `Learning time: 20–30 minutes`,
    ``,
    `1️⃣ Why It Matters`,
    clip(WHY[focus.key], 700),
    ``,
    `2️⃣ Today's Assignment`,
    template.prompt,
    ``,
    `3️⃣ Do These Steps`,
    ...template.steps.map((s, i) => `${i + 1}. ${s}`),
    ``,
    `4️⃣ Evidence To Bring Back`,
    template.evidence,
    ``,
    `5️⃣ Record It`,
    mine.length
      ? `You already have ${mine.length} record(s) for this assignment. Update it on the website under Apply to My Business.`
      : `Open the website: Skill Development → Apply to My Business, start this assignment and save your analysis.`,
    ``,
    `6️⃣ Track My Progress`,
    `Lessons completed so far: ${plan.filter((r) => r.completed).length} of ${plan.length}. Send /progress for the full picture.`,
    ``,
    `💬 "${MOTIVATION}"`,
  ].join("\n");
}

/** Sunday: always returns a useful review, even with little or no activity. */
export async function buildWeeklyReview(env, plan) {
  const rows = plan || (await getPlan(env));
  const p = await getProgress(env);
  const reflections = await listReflections(env, 7);

  const completed = rows.filter((r) => r.completed);
  const bySkill = SKILLS.map((s) => {
    const list = rows.filter((r) => r.skill === s.key);
    return { name: s.name, done: list.filter((r) => r.completed).length, total: list.length };
  });

  const weakest = [...bySkill].sort((a, b) => a.done / a.total - b.done / b.total)[0];
  const strongest = [...bySkill].sort((a, b) => b.done / b.total - a.done / a.total)[0];

  const quizDay = p.overall.completedLessons > 0
    ? completed[completed.length - 1]?.day || rows[0].day
    : rows[0].day;
  const quizLesson = await getLesson(env, quizDay);

  const lines = [
    `🗓️ WEEKLY REVIEW & QUIZ`,
    ``,
    `Week ending ${ictDate()}`,
    ``,
    `1️⃣ This Week In Summary`,
    completed.length
      ? `You completed ${completed.length} lesson${completed.length === 1 ? "" : "s"}: ${completed.map((c) => `Day ${c.day}`).join(", ")}.`
      : `No lessons are recorded yet. That is fine — start with Day 1 and the programme will move from there.`,
    ``,
    `2️⃣ Progress Across The Five Skills`,
    ...bySkill.map((s) => `   ${s.done}/${s.total}  ${s.name}`),
    ``,
    `3️⃣ Review Quiz`,
    quizLesson
      ? `Recap of Day ${quizLesson.day} — ${quizLesson.title}\n\n${quizLesson.quiz.question}\n\n` +
        quizLesson.quiz.options.map((o, i) => `   ${i + 1}. ${o}`).join("\n") +
        `\n\nReply with just the number to be graded.`
      : "Your curriculum is not loaded yet. Open the website once to initialise it.",
    ``,
    `4️⃣ One Business Problem To Solve`,
    weakest
      ? `Your weakest skill so far is ${weakest.name} (${weakest.done}/${weakest.total}). Write one sentence: what single change would move that number this week? Then do it.`
      : `Pick one number you are judged on at Khmer24. Write it down, then decide which single lever moves it.`,
    ``,
    `5️⃣ Reflection`,
    reflections.length
      ? `You wrote ${reflections.length} reflection(s) recently. Keep the habit going.`
      : `What was the most useful thing you learned this week, and what will you do differently on Monday?`,
    ``,
    `6️⃣ Recommendation For Next Week`,
    strongest && weakest && strongest.name !== weakest.name
      ? `Keep building ${strongest.name} (already ${strongest.done}/${strongest.total}) and give extra time to ${weakest.name}. One lesson a day is enough.`
      : `Protect 20 minutes every morning. Consistency beats intensity.`,
    ``,
    `7️⃣ Your Numbers`,
    `Lessons: ${p.overall.completedLessons}/${p.overall.totalLessons} (${p.overall.percent}%)`,
    `Streak: ${p.overall.currentStreak} day(s)`,
    `Study time: ${p.overall.totalMinutes} minutes`,
    `Quiz accuracy: ${p.overall.quizAccuracy}%`,
    `Assignments completed: ${p.overall.completedAssignments} of ${ASSIGNMENTS.length} templates started`,
    ``,
    `💬 "${MOTIVATION}"`,
  ];

  return lines.join("\n");
}

/** Inline keyboard attached to a lesson message. */
export function lessonKeyboard(day) {
  if (!day) return undefined;
  return {
    inline_keyboard: [
      [
        { text: "✅ Mark Complete", callback_data: `done:${day}` },
        { text: "🧠 Take Quiz", callback_data: `quiz:${day}` },
      ],
      [{ text: "📝 Write Reflection", callback_data: `reflect:${day}` }],
    ],
  };
}

/** Buttons shown for a Sunday review: only the quiz applies. */
export function reviewKeyboard(day) {
  return {
    inline_keyboard: [
      [{ text: "🧠 Take Review Quiz", callback_data: `quiz:${day}` }],
      [{ text: "📝 Write Reflection", callback_data: "reflect:0" }],
    ],
  };
}

/** Short summary used by /progress and the Sunday header. */
export async function briefProgress(env) {
  const p = await getProgress(env);
  const pointer = await getLearningPointer(env);
  const last = await getLastSent(env);
  return { progress: p, pointer, last };
}

export { ictDate, ictWeekday, weekdayName };
