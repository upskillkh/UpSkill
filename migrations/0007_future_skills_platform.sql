-- 0007_future_skills_platform.sql
-- Up Skill 2027-2031: 12-category Future Skills taxonomy, four levels,
-- five-year learning roadmap, Business Lab, assessments, analytics and admin
-- audit.
--
-- ADDITIVE ONLY. This migration creates new tables and adds columns to `skills`.
-- It never drops, renames or rewrites an existing table, so every existing row
-- in `stories` (617 news items), `skill_lessons`, `lessons`,
-- `lesson_translations` and the personal learning tables is preserved exactly.
--
-- The Economic Intelligence schema is not referenced anywhere below.
--
-- One defect is corrected rather than left in place: `user_preferences` is a
-- legacy global key/value table with no user_id, so one learner's reminder
-- setting silently overwrites another's. The original table is left untouched
-- for backwards compatibility and a correctly scoped `user_settings` is added
-- alongside it. Reads move to the new table; nothing is deleted.

-- ---------------------------------------------------------------------------
-- 1. The 12-category taxonomy
-- ---------------------------------------------------------------------------
-- `established = 0` marks categories whose content is partly speculative. The UI
-- and the API must not present emerging technology as a guaranteed opportunity.
CREATE TABLE IF NOT EXISTS categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  key         TEXT    NOT NULL UNIQUE,
  name_en     TEXT    NOT NULL,
  name_km     TEXT    NOT NULL,
  summary_en  TEXT    NOT NULL DEFAULT '',
  summary_km  TEXT    NOT NULL DEFAULT '',
  icon        TEXT    NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  established INTEGER NOT NULL DEFAULT 1,   -- 1 = established, 0 = emerging/speculative
  status      TEXT    NOT NULL DEFAULT 'active', -- active | merged | retired
  merged_into TEXT,                          -- target category key when status='merged'
  created_at  TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TEXT
);
CREATE INDEX IF NOT EXISTS idx_categories_status ON categories(status, sort_order);

INSERT OR IGNORE INTO categories (key, name_en, name_km, summary_en, summary_km, icon, sort_order, established) VALUES
 ('strategic','Strategic & Critical Thinking','ការគិតផ្នែកយុត្តនភាព និងការសម្រេចដោយផ្អែកលើភស្តុត្រ',
  'Break down hard problems, weigh options, and decide with evidence instead of opinion.',
  'បំបែកបញ្ហាដ៏ខិតខំ ᖘើលជម្រើសផ្សេងៗ ហើយសម្រេចដោយផ្អែកលើភស្តុត្រជំនួសនឹងមតិយោបល់។','S',1,1),
 ('ai','AI & Digital Literacy','បញ្ហាវីភ្លាម្យសាសន៍ និងចំណេញដឹងអំពី AI',
  'Use AI and digital tools for real productivity, and know their limits and risks.',
  'ប្រើ AI និងឧបករណ៍ឌីជីតែលដើម្បីបង្កើនផលការងារពិត ហើយដឹងពីដែនកំណត់ និងហានិភ័យរបស់វា។','AI',2,1),
 ('data','Data & Analytical Skills','ជំនាញទិន្នន័យ និងការវាទាន់វិភាគ',
  'Read data, build dashboards, define KPIs and make evidence-based decisions.',
  'អានទិន្នន័យ បង្កើតផ្ទាំងពិនិត្យ កំណត់ KPI ហើយសម្រេចដោយភស្តុត្រ។','DA',3,1),
 ('growth','Sales, Marketing & Revenue Growth','ការលក់ ទីក្រុង និងការលូទាន់មាតិភាព',
  'Find customers, convert them, retain them, and price for profit.',
  'រកអតិថិជន ប្រកប់ជាអតិថិជន រក្សាពួកគេ និងកំណត់តម្លៃដើម្បីប្រាក់ចំណេញ។','SM',4,1),
 ('leadership','Leadership & People Management','ការដឹកនាំ និងការគ្រប់គ្រងមនុស្ស',
  'Lead people well: delegate, coach, manage performance and handle conflict.',
  'ដឹកនាំមនុស្សបានល្អ៖ ទុកចិត្ត ណែនាំ គ្រប់គ្រងវឌ្ឍនភាព និងដំណ៾រដោះស្រាយវិវាទ្យ។','LM',5,1),
 ('finance','Finance & Business Economics','ហិរញ្ញវិទ្យា និងសេដ្ឋកិច្ចអាជីវកម្ម',
  'Understand money: cash flow, margins, pricing, risk and forecasting.',
  'យល់អំពីលុយ៖ ស្ថានាធន្នីប្រាក់ ប្រាក់ចំណេញ តម្លៃ ហានិភ័យ និងការព្យាករណ៍។','FI',6,1),
 ('digital','Digital, Software & Cloud Skills','ជំនាញឌីជីតែល ស៊ីហ្វ្តវែ និងកន្លែងមូល',
  'Work confidently with software, no-code tools, APIs and cloud services.',
  'ធ្វើការជាមួយស៊ីហ្វ្តវែ ឧបករណ៍ no-code API និងសេវាកន្លែងមូលដោយជាប់ជាក់។','DS',7,1),
 ('security','Cybersecurity, Privacy & Digital Trust','សុវត្ថិភាពគ្រប់គ្រងអ្នកិត្ត ភាពឯកជន និងទំនុកចិត្តឌីជីតែល',
  'Protect accounts, spot scams, and handle personal data responsibly.',
  'ការពារគណនី ស្គាល់ការបញ្ហាបញ្ជាក់ និងគ្រប់គ្រងទិន្នន័យផ្ទាល់ខ្លួនដោយការពិត។','CY',8,1),
 ('entrepreneurship','Entrepreneurship & Business Building','សាជីវកម្ម និងការសាងសង់អាជីវកម្ម',
  'Find opportunities, validate ideas, launch lean, and scale what works.',
  'រកឱកាន ផ្ទៀងផ្ទាត់គំនិត ដំណើរការដោយតូច និងពង្រីកនៅអ្វីដែលដំណើរការ។','EN',9,1),
 ('effectiveness','Communication, Creativity & Personal Effectiveness','ការទំនាក់ទំនង ចំណេញដឹងអំពីការច្នៃផ្ទះ និងប្រសិទ្ធផលផ្ទាល់ខ្លួន',
  'Communicate clearly, manage your time, and keep learning as the world changes.',
  'ប្រាស្រាល់ជាមួយអ្នកជាទស្ស គ្រប់គ្រងពេលវេលា និងបន្តរៀនពេលពិភពលោកផ្លាស់ប្តូរ។','CE',10,1),
 ('intelligence','Global, Economic & Industry Intelligence','ចំណេញដឹងអំពីសេដ្ឋកិច្ចពិភពលោក វិសេសកម្ម និងឧសភា',
  'Read the economy and your industry, and turn information into decisions.',
  'អានសេដ្ឋកិច្ច និងវិសេសកម្មរបស់ខ្លួន ហើយប្រើព័ត៌មានក្នុងការសម្រេចដោយផ្អែកលើព័ត៌មាន។','GI',11,1),
 ('emerging','Emerging Technologies & Future Industries','បច្ចេកវិទ្យាចុងក្រោយ និងឧសភាអនាគត',
  'Understand robotics, clean energy, biotech and other shifts as they mature.',
  'យល់អំពីម៉ាស៊ីនស្តូតិក ថាមរយឈ្ស្តាចន្យម ជីវបច្ចេកវិទ្យា និងការផ្លាស់ប្តូរផ្សេងៗដែលកំពុងរាស់ដំណើរ។','ET',12,0);

-- ---------------------------------------------------------------------------
-- 2. Skill metadata: category, level, proficiency, prerequisites
-- ---------------------------------------------------------------------------
-- SQLite allows ADD COLUMN. The existing five skills keep all their rows and
-- gain NULL/DEFAULT values, so nothing is lost and nothing needs rewriting.
ALTER TABLE skills ADD COLUMN category_key   TEXT    REFERENCES categories(key);
ALTER TABLE skills ADD COLUMN level          TEXT    NOT NULL DEFAULT 'L1';
ALTER TABLE skills ADD COLUMN proficiency    TEXT    NOT NULL DEFAULT 'introductory';
ALTER TABLE skills ADD COLUMN est_weeks      INTEGER NOT NULL DEFAULT 2;
ALTER TABLE skills ADD COLUMN status         TEXT    NOT NULL DEFAULT 'active';
ALTER TABLE skills ADD COLUMN established   INTEGER NOT NULL DEFAULT 1;
ALTER TABLE skills ADD COLUMN prerequisites  TEXT    NOT NULL DEFAULT '[]';
ALTER TABLE skills ADD COLUMN objectives     TEXT    NOT NULL DEFAULT '[]';
ALTER TABLE skills ADD COLUMN name_km        TEXT    NOT NULL DEFAULT '';
ALTER TABLE skills ADD COLUMN description_km TEXT    NOT NULL DEFAULT '';
ALTER TABLE skills ADD COLUMN updated_at     TEXT;

-- The five existing skills are the MVP content and are mapped to the five MVP
-- categories. Category 1 "AI and Digital Literacy" is served by the existing
-- "Digital & AI Skills" row, so no lesson content has to be duplicated.
UPDATE skills SET category_key='strategic', level='L2', name_km='ការគិតផ្នែកយុត្តនភាព', description_km='វាស់ស្លាប់អាជីវកម្ម រកបញ្ហាពិត ប្រៀបធៀបយ៉ាងតិចបី វាស់ហានិភ័យទទួលជំនួសថ្លៃដឹង ហើយសម្រេចដោយភស្តុត្រ្រជំនួសមតិយោបល់។', sort_order=1 WHERE key='strategic';
UPDATE skills SET category_key='ai',        level='L1', name_km='ជំនាញឌីជីតែល និង AI', description_km='ប្រើឧបករណ៍ AI សម្រាប់ផលការងារពិត សរសេរពាក្យជំនួយដែលមានប្រយោជន៍ ស្វ័យប្រវត្តិកម្មងារងារងារដោយស្វ័យប្រវត្តិ យល់ API និងសេវាកន្លែងមូល ហើយបង្កើតប្រព័ន្ធវិភាគពីទិន្នន័យ។', sort_order=2 WHERE key='digital';
UPDATE skills SET category_key='growth',    level='L2', name_km='ការលក់ និងការលូទាន់មាតិភាព', description_km='យល់ពីរន្ធដោយលក់ និងអតិបរមាប្រកប់ទស្សនា បែងចែកអតិថិជន បង្កើតនិងតាមដានមុន ជំនួយអតិថិជន រំលឹកអតិថិជន និងវាំពន្ធមាតិភាពដោយការប្រើការផ្តល់ជូននិងតម្លៃដែលសមស្រប។', sort_order=3 WHERE key='sales';
UPDATE skills SET category_key='leadership', level='L3', name_km='ការដឹកនាំ និងការគ្រប់គ្រង', description_km='គ្រប់គ្រងវឌ្ឍនភាពក្រុម ទុកចិត្តដោយតួចច្រើន ណែនាំដោយមតិយោបល់ រៀបចំកិច្ចប្រជុសដែលផានសម្រេចចិត្ត ដោះស្រាយវិវាទ្យ និងរៀបចំការវាយតម្លៃវឌ្ឍនភាពដោយយុភាព។', sort_order=4 WHERE key='leadership';
UPDATE skills SET category_key='finance',    level='L3', name_km='ហិរញ្ញវិទ្យា និងការវាទាន់ទិន្នន័យ', description_km='អានចំណេញ ថ្លៃដឹង ប្រាក់ចំណេញ និងស្ថានាធន្នីប្រាក់ ប្រើប្រាក់ចំណេញរុទ និងប្រាក់ចំណេញមុនថ្លៃ សាងផ្ទាំងពិនិត្យ KPI ក្នុង Excel ឬ Google Sheets វាំពន្ធ និងថវិកា ដើម្បីឱ្យទិន្នន័យដឹកនាំការសម្រេច។', sort_order=5 WHERE key='financial';

-- Scaffolding skills for the seven categories that are supported but not yet
-- written. status='planned' so the UI can show the category honestly as
-- "structure ready, lessons coming" rather than implying content exists.
INSERT OR IGNORE INTO skills (key, name, name_km, description, description_km, category_key, level, proficiency, est_weeks, sort_order, status, established, prerequisites, objectives) VALUES
 ('data_analytics','Data & Analytics','ទិន្នន័យ និងការវាទាន់វិភាគ',
  'Data literacy, spreadsheets, dashboards, KPIs, basic statistics, forecasting and SQL fundamentals.',
  'ចំណេញដឹងទិន្នន័យ ស៊ីត ផ្ទាំងពិនិត្យ KPI ស្ថាប័នមូល ការព្យាករណ៍ និង SQL មូលដ្ឋាន។',
  'data','L2','intermediate',3,6,'planned',1,'[]','["Read and challenge a number","Build a KPI dashboard","Explain a trend in plain language"]'),
 ('digital_cloud','Software & Cloud','ស៊ីហ្វ្តវែ និងកន្លែងមូល',
  'No-code tools, websites, APIs, cloud fundamentals and workflow automation.',
  'ឧបករណ៍ no-code គេហទាវរ API កន្លែងមូល និងស្វ័យប្រវត្តិកម្មដំណើរការ។',
  'digital','L2','beginner',3,7,'planned',1,'["digital"]','["Automate a repetitive task","Explain what an API does"]'),
 ('cyber_safety','Cybersecurity & Privacy','សុវត្ថិភាព និងភាពឯកជន',
  'Passwords, phishing awareness, data protection and safe digital transactions.',
  'ពាក្យសម្ងាត់ ការពិពណ៌នាបញ្ហាបញ្ជាក់ ការការពារទិន្នន័យ និងប្រតិបត្តិការប្រុងប្រយ័ត្ន។',
  'security','L1','beginner',1,8,'planned',1,'[]','["Spot a phishing attempt","Protect an account with a strong password"]'),
 ('entrepreneurship','Entrepreneurship','សាជីវកម្ម',
  'Opportunity discovery, customer discovery, MVPs, business plans and scaling.',
  'ស្វែងរកឱកាន ស្វែងរកអតិថិជន MVP ផែនការអាជីវកម្ម និងការពង្រីក។',
  'entrepreneurship','L3','intermediate',6,9,'planned',1,'["strategic","growth"]','["Test an idea before investing","Build a one-page business model"]'),
 ('communication','Communication & Personal Effectiveness','ការទំនាក់ទំនង និងប្រសិទ្ធផលផ្ទាល់ខ្លួន',
  'Business writing, presenting, storytelling, time management and learning how to learn.',
  'ការសរសេរអាជីវកម្ម ការបង្ហាញ រឿងស្លោក គ្រប់គ្រងពេល និងការរៀនយុត្តនភាព។',
  'effectiveness','L1','beginner',2,10,'planned',1,'[]','["Write a clear one-paragraph update","Prioritise competing tasks"]'),
 ('economics_intel','Economic & Industry Intelligence','ចំណេញដឹងអំពីសេដ្ឋកិច្ច និងវិសេសកម្ម',
  'Read Cambodia, ASEAN and global trends; analyse competitors and verify sources.',
  'អានបញ្ហាកម្ពុជា ASEAN និងបទពិសោធន៍ពិភពលោក វាយតម្លៃប្រទេសប្រទេស និងផ្ទៀងផ្ទាត់មូលដ្ឋាន។',
  'intelligence','L2','intermediate',3,11,'planned',1,'["strategic"]','["Assess whether a news item affects your business","Verify a source before acting"]'),
 ('future_tech','Emerging Technology Literacy','ចំណេញដឹងអំពីបច្ចេកវិទ្យាចុងក្រោយ',
  'Robotics, IoT, clean energy, biotech and other shifts, evaluated without hype.',
  'ម៉ាស៊ីនស្តូតិក IoT ថាមរយឈ្ស្តាចន្យម ជីវបច្ចេកវិទ្យា និងការផ្លាស់ប្តូរផ្សេងៗ ដោយវាយតម្លៃដោយគ្មានការផ្អើលប្រង។',
  'emerging','L3','introductory',3,12,'planned',0,'["digital"]','["Describe an emerging technology accurately","Separate established facts from speculation"]');

-- ---------------------------------------------------------------------------
-- 3. Levels and the 2027-2031 roadmap
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS levels (
  key         TEXT PRIMARY KEY,                    -- L1 | L2 | L3 | L4
  name_en     TEXT NOT NULL,
  name_km     TEXT NOT NULL,
  summary_en  TEXT NOT NULL DEFAULT '',
  summary_km  TEXT NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO levels (key, name_en, name_km, summary_en, summary_km, sort_order) VALUES
 ('L1','Foundations','មូលដ្ឋាន','Digital literacy, communication, critical thinking, AI literacy, productivity and personal finance.',
  'ជំនាញឌីជីតែល ការទំនាក់ទំនង ការគិតផ្នែកយុត្តនភាព ចំណេញដឹងអំពី AI ផលិតភាព និងហិរញ្ញវិទ្យាផ្ទាល់ខ្លួន។',1),
 ('L2','Professional Skills','ជំនាញកម្រិតវិជ្ជាកម្ម','Sales and marketing, data analysis, leadership fundamentals, project management, business writing and CRM.',
  'ការលក់ និងទីក្រុង ការវាទាន់ទិន្នន័យ មូលដ្ឋានការដឹកនាំ ការគ្រប់គ្រងគម្រោះ និងការសរសេរអាជីវកម្ម។',2),
 ('L3','Advanced Skills','ជំនាញកម្រិតខ្ពស់','Strategic management, advanced AI workflows, business intelligence, revenue optimisation, financial analysis and entrepreneurship.',
  'ការគ្រប់គ្រងយុត្តនភាព ដំណើរការ AI ជាន់ស្មើ ព័ត៌មានអាជីវកម្ម ការបង្កើនមាតិភាព និងសាជីវកម្ម។',3),
 ('L4','Real-World Mastery','ជំនាញអនុលម្បងក្នុងការអនុវត្តជាក់ស្តែង','Simulations, practical projects, case studies, portfolios, team challenges and capstones.',
  'សម្ងាត់ គម្រោះថាសម្រួល ករណីខាង បទពិសោធន៍ ការបង្កើតបទពិសោធន៍ និងគម្រោះចម្បង។',4);

CREATE TABLE IF NOT EXISTS learning_paths (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  key         TEXT    NOT NULL UNIQUE,
  year        INTEGER,                              -- 2027..2031, NULL = evergreen
  level       TEXT    NOT NULL DEFAULT 'L1',
  title_en    TEXT    NOT NULL,
  title_km    TEXT    NOT NULL,
  summary_en  TEXT    NOT NULL DEFAULT '',
  summary_km  TEXT    NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  status      TEXT    NOT NULL DEFAULT 'active',
  created_at  TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TEXT
);

INSERT OR IGNORE INTO learning_paths (key, year, level, title_en, title_km, summary_en, summary_km, sort_order) VALUES
 ('roadmap-2027',2027,'L1','2027 — Build Foundations','២០២៧ — សាងមូលដ្ឋាន',
  'Digital literacy, AI literacy, communication, critical thinking and personal finance. Recommended starting year; you may start at any time.',
  'ជំនាញឌីជីតែល ចំណេញដឹងអំពី AI ការទំនាក់ទំនង ការគិតផ្នែកយុត្តនភាព និងហិរញ្ញវិទ្យាផ្ទាល់ខ្លួន។ ជាឆ្នាំណែនាំសម្រាប់ចាប់ផ្តើម តែអាចចាប់ផ្តើមនៅពេលណាមួយ។',1),
 ('roadmap-2028',2028,'L2','2028 — Build Professional Capability','២០២៨ — បង្កើតសមត្ថភាពកម្រិតវិជ្ជាកម្ម',
  'Sales, marketing, data analysis, project management and leadership fundamentals.',
  'ការលក់ ទីក្រុង ការវាទាន់ទិន្នន័យ ការគ្រប់គ្រងគម្រោះ និងមូលដ្ឋានការដឹកនាំ។',2),
 ('roadmap-2029',2029,'L3','2029 — Apply Advanced Skills','២០២៩ — អនុវត្តជំនាញកម្រិតខ្ពស់',
  'AI automation, business intelligence, strategic decision-making and advanced management.',
  'ស្វ័យប្រវត្តិកម្ម AI ព័ត៌មានអាជីវកម្ម ការសម្រេចយុត្តនភាព និងការគ្រប់គ្រងកម្រិតខ្ពស់។',3),
 ('roadmap-2030',2030,'L3','2030 — Develop Specialization','២០៣០ — បង្កើតជំនាញឯកទេស',
  'Choose a career-specific or industry-specific pathway. Recommendations only; learners may deviate freely.',
  'ជ្រើសរើសផ្លូវជំនាញតាមវិជ្ជាកម្ម ឬតាមឧសភា។ ជាការណែនាំតែ អ្នករៀនអាចប្រើផ្លូវផ្សេងដោយសេរី។',4),
 ('roadmap-2031',2031,'L4','2031 — Integrate and Lead','២០៣១ — បង្កើតតួរុក និងដឹកនាំ',
  'Complex problem-solving, AI-human collaboration, innovation, leadership and business transformation.',
  'ការដោះស្រាយបញ្ហាស្មុគ ការសហកម្មរួមរវាងមនុស្ស និង AI ការច្នៃផ្ទះ ការដឹកនាំ និងការផ្លាស់ប្តូរអាជីវកម្ម។',5),
 ('starter-30day',NULL,'L1','30-Day Starter Program','កម្មវិធីចាប់ផ្តើម ៣០ ថ្ងៃ',
  'One lesson a day across the five MVP categories. A starting point, not a restriction.',
  'មួយការណ៍ក្នុងមួយថ្ងៃ ជាប់បញ្ហាទាំងប្រា។ដើម្បីចាប់ផ្តើម មិនមែនជាការដាក់ការដាក់។',0);

CREATE TABLE IF NOT EXISTS learning_path_skills (
  path_id    INTEGER NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  skill_key  TEXT    NOT NULL REFERENCES skills(key),
  position   INTEGER NOT NULL DEFAULT 0,
  required   INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (path_id, skill_key)
);
CREATE INDEX IF NOT EXISTS idx_path_skills ON learning_path_skills(skill_key);

-- Roadmap composition. 2030 is the specialisation year so it offers the widest
-- choice; 2031 integrates the five MVP skills that have real lessons behind
-- them. No path is empty, and no skill is claimed at a level it has no content
-- for.
INSERT OR IGNORE INTO learning_path_skills (path_id, skill_key, position, required)
  SELECT p.id, s.key, s.sort_order, 1 FROM learning_paths p JOIN skills s
  WHERE (p.key='roadmap-2027' AND s.level='L1')
     OR (p.key='roadmap-2028' AND s.level='L2')
     OR (p.key='roadmap-2029' AND s.level='L3')
     OR (p.key='roadmap-2030' AND s.level IN ('L2','L3'))
     OR (p.key='roadmap-2031' AND s.status='active')
     OR (p.key='starter-30day'  AND s.status='active');

-- ---------------------------------------------------------------------------
-- 4. Per-user settings (scoped; replaces the global legacy table for reads)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_settings (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key        TEXT    NOT NULL,
  value      TEXT    NOT NULL DEFAULT '',
  updated_at TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, key)
);
-- Existing rows belong to the owner account (id 1). The legacy global table is
-- left in place untouched.
INSERT OR IGNORE INTO user_settings (user_id, key, value, updated_at)
  SELECT 1, key, value, updated_at FROM user_preferences;

-- ---------------------------------------------------------------------------
-- 5. Skill assessment and proficiency evidence
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS skill_assessments (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  locale       TEXT    NOT NULL DEFAULT 'en',
  answers      TEXT    NOT NULL DEFAULT '[]',
  level        TEXT    NOT NULL DEFAULT 'L1',
  recommended_skills TEXT NOT NULL DEFAULT '[]',
  created_at   TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_assess_user ON skill_assessments(user_id, created_at);

-- Proficiency is evidence-based: it only rises with completed lessons, quiz
-- answers and lab submissions. It is never inferred from time spent.
CREATE TABLE IF NOT EXISTS skill_proficiency (
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_key       TEXT    NOT NULL REFERENCES skills(key),
  lessons_done    INTEGER NOT NULL DEFAULT 0,
  quiz_correct    INTEGER NOT NULL DEFAULT 0,
  quiz_attempts   INTEGER NOT NULL DEFAULT 0,
  labs_done       INTEGER NOT NULL DEFAULT 0,
  level           TEXT    NOT NULL DEFAULT 'L1',
  updated_at      TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, skill_key)
);

-- ---------------------------------------------------------------------------
-- 6. Business Lab
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lab_exercises (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  key            TEXT    NOT NULL UNIQUE,
  category_key   TEXT    NOT NULL REFERENCES categories(key),
  skill_key      TEXT    NOT NULL REFERENCES skills(key),
  level          TEXT    NOT NULL DEFAULT 'L2',
  title_en       TEXT    NOT NULL,
  title_km       TEXT    NOT NULL,
  brief_en       TEXT    NOT NULL DEFAULT '',
  brief_km       TEXT    NOT NULL DEFAULT '',
  instructions_en TEXT   NOT NULL DEFAULT '',
  instructions_km TEXT   NOT NULL DEFAULT '',
  example_data   TEXT    NOT NULL DEFAULT '',
  expected_en    TEXT    NOT NULL DEFAULT '',
  expected_km    TEXT    NOT NULL DEFAULT '',
  rubric         TEXT    NOT NULL DEFAULT '[]',   -- [{criterion,points,max}]
  est_minutes    INTEGER NOT NULL DEFAULT 45,
  status         TEXT    NOT NULL DEFAULT 'active',
  sort_order     INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TEXT
);
CREATE INDEX IF NOT EXISTS idx_lab_cat ON lab_exercises(category_key, status);

CREATE TABLE IF NOT EXISTS lab_submissions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_key  TEXT    NOT NULL REFERENCES lab_exercises(key),
  attempt       INTEGER NOT NULL DEFAULT 1,
  answer        TEXT    NOT NULL DEFAULT '',
  self_score    INTEGER,
  rubric_scores TEXT    NOT NULL DEFAULT '{}',
  ai_feedback   TEXT    NOT NULL DEFAULT '',
  ai_model      TEXT    NOT NULL DEFAULT '',
  status        TEXT    NOT NULL DEFAULT 'submitted',
  created_at    TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TEXT,
  UNIQUE(user_id, exercise_key, attempt)
);
CREATE INDEX IF NOT EXISTS idx_lab_sub_user ON lab_submissions(user_id, exercise_key);

-- ---------------------------------------------------------------------------
-- 7. Monetization: plan entitlements. No payment provider is connected and
-- nothing is charged. The table records intent and gates access server-side.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plans (
  key         TEXT PRIMARY KEY,                     -- free | pro | team | enterprise
  name_en     TEXT NOT NULL,
  name_km     TEXT NOT NULL,
  max_ai_per_day INTEGER NOT NULL DEFAULT 0,
  features    TEXT NOT NULL DEFAULT '[]',
  sort_order  INTEGER NOT NULL DEFAULT 0
);
INSERT OR IGNORE INTO plans (key, name_en, name_km, max_ai_per_day, features, sort_order) VALUES
 ('free','Free','ឥតគិតថ្លៃ',3,'["Selected lessons","Basic progress","Limited AI coaching"]',1),
 ('pro','Pro','ជម្រើសពាក្យ',60,'["Full learning paths","Expanded coaching","Business Lab","Advanced analytics"]',2),
 ('team','Team','ក្រុម',200,'["Organisation dashboard","Team learning paths","Progress reports"]',3),
 ('enterprise','Enterprise','សាជីវកម្ម',0,'["Custom training","Organisation management","Advanced reporting"]',4);

-- ---------------------------------------------------------------------------
-- 8. Analytics rollups and admin audit
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS analytics_daily (
  day    TEXT    NOT NULL,
  metric TEXT    NOT NULL,
  value  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, metric)
);

CREATE TABLE IF NOT EXISTS admin_audit (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id   INTEGER NOT NULL REFERENCES users(id),
  action     TEXT    NOT NULL,
  entity     TEXT    NOT NULL DEFAULT '',
  entity_id  TEXT    NOT NULL DEFAULT '',
  detail     TEXT    NOT NULL DEFAULT '',
  created_at TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON admin_audit(actor_id, created_at);
