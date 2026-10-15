-- 0003_seed_skills.sql
-- Seeds the five core skills. Idempotent: INSERT OR IGNORE against the UNIQUE
-- `key` column means re-running never creates duplicates.
--
-- Lesson content is NOT seeded here. The 30 lessons live in src/skills-data.js
-- and are upserted by the Worker on first use, so the curriculum is versioned in
-- one place instead of being duplicated between SQL and JavaScript.

INSERT OR IGNORE INTO skills (key, name, description, icon, sort_order) VALUES
  ('strategic',
   'Strategic Thinking',
   'Analyze business problems, find the real root cause, compare at least three options, weigh risk against reward, and decide using evidence instead of opinion.',
   'S', 1),
  ('sales',
   'Sales & Revenue Growth',
   'Understand the sales funnel and conversion rates, segment customers, generate and follow up leads, use pricing and promotion well, retain customers, and forecast revenue with clear KPIs.',
   'R', 2),
  ('leadership',
   'Leadership & Management',
   'Manage team performance, delegate with clear accountability, coach with useful feedback, run meetings that produce decisions, handle conflict, and prepare fair performance reviews.',
   'L', 3),
  ('financial',
   'Financial & Data Analysis',
   'Read revenue, cost, profit and cash flow, use gross and contribution margin, build KPI dashboards in Excel or Google Sheets, forecast and budget, and let data drive decisions.',
   'F', 4),
  ('digital',
   'Digital & AI Skills',
   'Use AI tools for real productivity, write prompts that get useful results, automate repetitive workflows, understand websites and APIs, work with cloud services, and build business intelligence from data.',
   'D', 5);
