// Offline curriculum integrity test. Runs with no database or network access,
// so it can be used as a fast pre-commit check that the 30-day program is intact.
//
//   node tests/curriculum.test.mjs

import { SKILLS, LESSONS, ASSIGNMENTS, ASSESSMENT } from "../src/skills-data.js";

const results = [];
function record(name, pass, detail = "") {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? "  -> " + detail : ""}`);
}

const REQUIRED_ROTATION = {
  strategic: [1, 6, 11, 16, 21, 26],
  sales: [2, 7, 12, 17, 22, 27],
  leadership: [3, 8, 13, 18, 23, 28],
  financial: [4, 9, 14, 19, 24, 29],
  digital: [5, 10, 15, 20, 25, 30],
};

// --- structure ------------------------------------------------------------
record("exactly 5 skills", SKILLS.length === 5, `${SKILLS.length}`);
record("exactly 30 lessons", LESSONS.length === 30, `${LESSONS.length}`);
record("at least 10 assignments", ASSIGNMENTS.length >= 10, `${ASSIGNMENTS.length}`);
record("assessment object present", !!ASSESSMENT && Array.isArray(ASSESSMENT.sections));
record("assessment has 5 sections", ASSESSMENT.sections?.length === 5, `${ASSESSMENT.sections?.length}`);
record("assignment ids are unique", new Set(ASSIGNMENTS.map((a) => a.id)).size === ASSIGNMENTS.length);
record("every skill has at least 2 assignments",
  SKILLS.every((s) => ASSIGNMENTS.filter((a) => a.skill === s.key).length >= 2));

// --- day integrity --------------------------------------------------------
const days = LESSONS.map((l) => l.day).sort((a, b) => a - b);
record("days are 1-30 with no gaps or duplicates",
  days.length === 30 && days.every((d, i) => d === i + 1));

// --- rotation -------------------------------------------------------------
const want = {};
for (const [skill, ds] of Object.entries(REQUIRED_ROTATION)) for (const d of ds) want[d] = skill;
const rotationErrors = LESSONS.filter((l) => l.skill !== want[l.day]).map((l) => `day ${l.day}`);
record("skill rotation matches the required schedule", rotationErrors.length === 0, rotationErrors.join(", "));

for (const [skill, ds] of Object.entries(REQUIRED_ROTATION)) {
  record(`${skill} has exactly 6 lessons`, LESSONS.filter((l) => l.skill === skill).length === 6);
}

// --- content quality ------------------------------------------------------
record("all lesson titles are unique", new Set(LESSONS.map((l) => l.title)).size === 30);
record("all lesson explanations are unique", new Set(LESSONS.map((l) => l.explanation)).size === 30);
record("all lesson examples are unique", new Set(LESSONS.map((l) => l.example)).size === 30);

const FIELDS = ["title", "objective", "explanation", "example", "exercise", "action", "reflection"];
const thin = [];
for (const l of LESSONS) {
  for (const f of FIELDS) if (!l[f] || String(l[f]).trim().length < 15) thin.push(`day ${l.day}.${f}`);
}
record("every lesson field has substantive content", thin.length === 0, thin.join(", "));

const wordCounts = LESSONS.map((l) => (l.explanation || "").split(/\s+/).length);
const tooShort = LESSONS.filter((l) => (l.explanation || "").split(/\s+/).length < 100);
record("explanations are readable in ~10 minutes", tooShort.length === 0,
  `min ${Math.min(...wordCounts)}, max ${Math.max(...wordCounts)} words`);

// --- quiz integrity -------------------------------------------------------
const badQuiz = LESSONS.filter((l) =>
  !l.quiz || !Array.isArray(l.quiz.options) || l.quiz.options.length !== 4 ||
  !Number.isInteger(l.quiz.answer) || l.quiz.answer < 0 || l.quiz.answer > 3);
record("every quiz has 4 options and a valid answer index", badQuiz.length === 0,
  badQuiz.map((l) => `day ${l.day}`).join(", "));

const dupOpts = LESSONS.filter((l) => new Set(l.quiz.options).size !== 4);
record("no duplicate quiz options", dupOpts.length === 0, dupOpts.map((l) => `day ${l.day}`).join(", "));

const spread = LESSONS.reduce((a, l) => ({ ...a, [l.quiz.answer]: (a[l.quiz.answer] || 0) + 1 }), {});
record("correct answers are spread across all 4 positions",
  Object.values(spread).filter((n) => n >= 3).length === 4, JSON.stringify(spread));

// --- safety ---------------------------------------------------------------
const allText = JSON.stringify(LESSONS) + JSON.stringify(ASSIGNMENTS);
record("no HTML tags in lesson text", !/<[a-z][\s\S]*>/i.test(allText.replace(/<[^>]*>/g, (m) => m)));
record("no leftover placeholders", !/TODO|FIXME|lorem ipsum|placeholder/i.test(allText));

// --- summary --------------------------------------------------------------
const passed = results.filter((r) => r.pass).length;
const failed = results.filter((r) => !r.pass);
console.log(`\n${passed}/${results.length} passed, ${failed.length} failed\n`);
if (failed.length) {
  for (const f of failed) console.log(`  - ${f.name} ${f.detail}`);
  process.exit(1);
}
