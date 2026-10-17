-- 0010_business_structures.sql
-- Business structure guide: the legal form a business takes.
--
-- WHY THIS IS A SEPARATE MODULE AND NOT 6 MORE LESSONS
-- `lessons.day` is UNIQUE and the 30-day program is a fixed, tested sequence of
-- 30 slots. Adding lessons would mean renumbering and breaking a curriculum that
-- learners already have progress against. Structure knowledge is also
-- reference-shaped rather than daily-practice-shaped: you consult it once, at
-- the start, rather than practise it daily.
--
-- HOW TO KEEP THIS HONEST
-- This content teaches the DURABLE differences between structures: who owns it,
-- who is liable, whether it is a separate legal person, and how much paperwork
-- follows. Those do not change between government reorganisations.
--
-- It deliberately does NOT state current fees, tax rates, capital thresholds or
-- filing deadlines as facts. Those change, and D1/this table cannot verify
-- them. Every such figure is marked 'verify' and the module tells the reader to
-- confirm with the Ministry of Commerce, the Ministry of Interior, the General
-- Department of Taxation or a qualified lawyer before relying on it.
--
-- This is educational content, not legal or tax advice.

CREATE TABLE IF NOT EXISTS business_structures (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  key            TEXT    NOT NULL UNIQUE,
  name_en        TEXT    NOT NULL,
  name_km        TEXT    NOT NULL,
  summary_en     TEXT    NOT NULL DEFAULT '',
  summary_km     TEXT    NOT NULL DEFAULT '',
  -- Structural facts. These are stable and are the thing to learn.
  liability      TEXT    NOT NULL DEFAULT '',   -- limited | unlimited | mixed
  legal_person   INTEGER NOT NULL DEFAULT 0,    -- 1 = separate legal person
  min_owners     TEXT    NOT NULL DEFAULT '',
  ownership      TEXT    NOT NULL DEFAULT '',   -- who may own it
  accepts_investment INTEGER NOT NULL DEFAULT 0,
  admin_burden   TEXT    NOT NULL DEFAULT '',   -- low | medium | high
  registered_by  TEXT    NOT NULL DEFAULT '',
  best_for_en    TEXT    NOT NULL DEFAULT '',
  best_for_km    TEXT    NOT NULL DEFAULT '',
  tradeoffs_en    TEXT    NOT NULL DEFAULT '',
  tradeoffs_km    TEXT    NOT NULL DEFAULT '',
  -- Anything numeric is a prompt to check, not an answer.
  verify_en       TEXT    NOT NULL DEFAULT '',
  verify_km       TEXT    NOT NULL DEFAULT '',
  sort_order      INTEGER NOT NULL DEFAULT 0,
  status          TEXT    NOT NULL DEFAULT 'active',
  created_at      TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TEXT
);
CREATE INDEX IF NOT EXISTS idx_structures_status ON business_structures(status, sort_order);

INSERT OR IGNORE INTO business_structures
 (key, name_en, name_km, summary_en, summary_km, liability, legal_person, min_owners,
  ownership, accepts_investment, admin_burden, registered_by,
  best_for_en, best_for_km, tradeoffs_en, tradeoffs_km, verify_en, verify_km, sort_order)
VALUES

('sole', 'Sole Proprietorship', 'បុគ្គលឯកបុណ្យ',
 'One person owns and runs the business. The simplest and cheapest way to trade in Cambodia.',
 'មនុស្សម្នាក់ជាអ្នកដំណើរការ និងគ្រប់គ្រងអាជីវកម្ម។ វិធីងាយស្រួល និងថោចបំផុតដែលអាចធ្វើបាននៅកម្ពុជា។',
 'unlimited', 0, '1',
 'One natural person only. No shares, no co-owners.', 0, 'low',
 'Ministry of Commerce, plus a business licence from the ministry that runs your sector',
 'A trader testing demand, a freelancer, a consultant, or a small shop with no investors and low risk.',
 'អ្នកប្រកប់បញ្ហាតម្រូវ អ្នកធ្វើការឯករាជ្យ ឬប្រឹក្សា ឬហាងតូចដែលគ្មានវិន្ទុស្តី និងហានិភ័យទាប។',
 'You are the business, so there is no paperwork separating you from it. That is also the risk: customers and suppliers can claim against your personal assets, including your home.',
 'អ្នកជាអាជីវកម្មផ្ទាល់ ដូច្នេះគ្មានឯកសារដ្ឋានបំបែកអ្នកចេញពីវា។ ប៉ុន្តែនេះក៏ជាហានិភ័យដែរ៖ អតិថិជន និងអ្នកផ្គត្រកម្មអាចទាមទារលុយពីទ្រព្យផ្ទាល់ខ្លួនរបស់អ្នក រួមទាំងផ្ទះផ្ទាងរបស់អ្នក។',
 'Registration fees, licence requirements for your sector, and the turnover-tax threshold.',
 'ថ្លៃចុំត្រា, តម្រូវការបណ្ឋាប់សម្រាប់វិសេសកម្មរបស់អ្នក និងកម្រិតពន្ធប្រាកបត្រាចន្ត្រកម្ម។', 1),

('partnership', 'Ordinary Partnership', 'ភាពជាដៃគូ',
 'Two or more people run the business together and share its obligations.',
 'មនុស្សពីរនាក់ឬច្រើនជាក់ដំណើរការអាជីវកម្មជាមួយគ្នា និងចែករួមកាតព្វកិច្ច។',
 'unlimited', 0, '2',
 'Two or more natural persons. Shares are not normally issued.', 0, 'medium',
 'Ministry of Commerce',
 'Two or more people genuinely operating the business together, where neither is investing only.',
 'មនុស្សពីរនាក់ឬច្រើននាក់ដែលពិតជាដំណើរការអាជីវកម្មជាមួយគ្នា ហើយគ្មានចង់វាយលុយវិញតែប៉ុណ្ណោះ។',
 'Partners are jointly and severally liable, so one partner''s mistake can be claimed against the other''s personal assets. Partnership disputes are also harder to exit than shares in a company.',
 'ដៃគូទទួលខុសត្រូវរួមគ្នា ដោយមិនបែងចែក ដូច្នេះកំហុសរបស់ដៃគូម្នាក់អាចត្រូវទាមទារលុយពីទ្រព្យផ្ទាល់ខ្លួនរបស់ដៃគូម្នាក់។ វិវាទ្យរវាងដៃគូក៏ពិបាល់បញ្ហាបន្តិចជាងការបំបែកចំណែកក្នុងក្រុមសាសន៍។',
 'Whether a partnership can hold property or sign certain contracts, and how disputes are handled.',
 'តើភាពជាដៃគូអាចបានដក់ស្រុក ឬចុះកិច្ចទាមទារខ្លះ ឬរបៀបដោះស្រាយវិវាទ្យយ៉ាងម៉េច។', 2),

('llc', 'Private Limited Company', 'ក្រុមហ្វន្តឯករាជ្យមួយ',
 'A company owned by shareholders whose liability is limited to what they put in. The usual choice for a growing business.',
 'ក្រុមហ្វន្តដែលមានអ្នកបានម្លាក់ដល់ ហើយការទទួលខុសត្រូវរបស់ពួកគេកំណត់ចំនួនដែលពួកគេបានវាយលុយដំបង់តែប៉ុណ្ណោះ។ ជម្រើសធម្មតាសម្រាប់អាជីវកម្មដែលកំពុងលូទាន់។',
 'limited', 1, '2',
 'Natural or legal persons, Cambodian or foreign subject to sector rules.', 1, 'medium',
 'Ministry of Commerce',
 'Almost any business that will keep trading, employ people, sign contracts, or bring in a partner or investor.',
 'អាជីវកម្មគ្រប់ប្រភេទដែលនឹងបន្តដំណើរការ បញ្ចូលមនុស្ស ចុះកិច្ច ឬនាំដៃគូ ឬអ្នកវិន្ទុស្តីចូលមក។',
 'Separate legal personality and limited liability are real protections, but they cost more to run: annual filings, formal records, and often audited accounts. Personal guarantees can still pierce the protection.',
 'គន្លឹះនាការច្បាប់ឯករាជ្យ និងការការពារខុសត្រូវមានពិត។ ប៉ុន្តែវាមានតម្លៃច្រើនជាង៖ ការដាក់ប្រាក់ប្រចាំឆ្នាំ កំណត់ត្រាជាក់ជាងធម្មតា និងក្រុមហ្វន្តការណ៍របស់ពិនិត្យជាក់ជាក់។ ការធានាប្រាក់ក្នុងផ្ទាល់ខ្លួន នៅតែអាចឆ្លងកាត់ការការពារនេះបាន។',
 'Minimum capital, annual return deadlines, audit thresholds, and any sector licence.',
 'កាមរិតប្រាក់អប្បបរមា កាលបរិច្ឆេទដាក់ស្រាការក្រុម កម្រិតការការណ៍របស់ពិនិត្យ និងបណ្ឋាប់សម្រាប់វិសេសកម្ម។', 3),

('plc', 'Public Limited Company', 'ក្រុមហ្វន្តសាធារណឈ',
 'A company that may offer shares to the public and is subject to heavier governance and disclosure rules.',
 'ក្រុមហ្វន្តដែលអាចផ្តល់ភាគផ្តារដល់សាធារណឈ ហើយស្តប់ទាំងលើក្បាល្យានគ្រប់គ្រង និងការបង្ហាញព័ត៌មានធ្ងន់ធ្ងរ។',
 'limited', 1, '3',
 'Natural or legal persons. Shares may be offered to the public.', 1, 'high',
 'Ministry of Commerce',
 'Larger enterprises planning to raise substantial capital from many investors.',
 'សាជីវធំណាងធំដែលគ្រោះថ្នាក់ប្រើប្រាក់ចំណេញធំពីអ្នកវិន្ទុស្តីច្រើនរូប។',
 'Access to more capital, but far more disclosure, governance and reporting obligations, and a much higher running cost.',
 'មានលទ្ធផលចូលប្រើមូលនាក់ច្រើនជាង ប៉ុន្តែត្រូវបង្ហាញព័ត៌មាន គ្រប់គ្រង និងរបាយការណ៍ធ្ងន់ធ្ងរ ហើយថ្លៃដំណើរការខ្ពស់ណាស់។',
 'Minimum shareholders and directors, listing and disclosure obligations.',
 'ចំនួនអប្បបរមា និងនាយក ការបង្ហាញស្តីការ និងកាតព្វកិច្ចធ្វើបង្ហាញព័ត៌មាន។', 4),

('branch', 'Branch of a Foreign Company', 'សាខារបស់ក្រុមហ្វន្តបរទេស',
 'A foreign company opening a place of business in Cambodia. The foreign parent remains behind the business.',
 'ក្រុមហ្វន្តបរទេសដែលបើកទីកន្លែងធ្វើការនៅកម្ពុជា។ ម្តាក់ជាភាពបរទេសនៅពីក្រោយអាជីវកម្ម។',
 'limited', 1, '1',
 'The foreign parent company.', 0, 'medium',
 'Ministry of Commerce, and an investment or sector licence where required',
 'A foreign company already trading elsewhere that wants a presence in Cambodia.',
 'ក្រុមហ្វន្តបរទេសដែលកំពុងដំណើរការនៅទីផ្សេង ហើយចង់មានវត្តមាននៅកម្ពុជា។',
 'The Cambodian branch does not remove the parent''s exposure, and it is subject to local law for local operations.',
 'សាខានៅកម្ពុជាមិនដោះហានិភ័យរបស់ម្តាក់ឡើងវិញទេ ហើយវាស្តប់នៅច្បាប់កម្ពុជាសម្រាប់ប្រតិបត្តិការក្នុងស្រុក។',
 'Whether your activity needs an investment licence rather than only a branch registration.',
 'តើសកម្មវិសេសរបស់អ្នកត្រូវការអាជ្ញាបណ្ណោះស្តីវិន្ទុស្តី ឬតែការចុះឈ្មោះសាខា។', 5),

('fie', 'Foreign Investment Enterprise', 'សហគ្រាមវិន្ទុស្តីបរទេស',
 'A Cambodian enterprise established to invest foreign capital, licensed through the investment process.',
 'សហគ្រាមនៅកម្ពុជាដែលបង្កើតឡើងដើម្បីវិន្ទុស្តីបរទេស ដោយទទួលការអនុញ្ញាំតាមដំណើរការវិន្ទុស្តី។',
 'limited', 1, '1',
 'Foreign investors, subject to the ownership rules of the sector.', 1, 'high',
 'Cambodia Investment Board for the licence, Ministry of Commerce for registration',
 'Foreign investors establishing operations rather than only representing a parent.',
 'អ្នកវិន្ទុស្តីបរទេសដែលបង្កើតប្រតិបត្តិការនៅកម្ពុជា ជំនួសការតែតំណាំតំណួរសម្រាប់ម្តាក់។',
 'Access to the investment regime, including possible incentives, with a licence process and compliance obligations attached.',
 'ការចូលប្រើរបៀបវិន្ទុស្តី រួមទាំងអាចមានការជំទាញផ្តល់ជូន ដោយមានដំណើរការអនុញ្ញាំ និងកាតព្វកិច្ចអនុលោមភាព។',
 'Which sectors are open to foreign ownership, and whether an investment licence is required for your activity.',
 'វិសេសកម្មណាខ្លែងអនុញ្ញាំការកាប់ងុកបរទេស និងតើត្រូវអាជ្ញាបណ្ណោះស្តីវិន្ទុស្តីសម្រាប់សកម្មវិសេសរបស់អ្នកដែរឬទេ។', 6),

('ngo', 'Association, Foundation or NGO', 'សាជីវកម្ម មន្ទីសម្ពន្ធ ឬអង្គកណ្ឌសារមន្តិភាពអន្តរជាតិ',
 'A non-profit form for member, charitable or development purposes. It does not exist to distribute profit to owners.',
 'ទម្រង់មិនរកចំណេញសម្រាប់អ្នកជាម្តាយសម្រាប់សមាជិក ឬសាធារណៈ ឬអភិវឌ្ឍន៍។ មិនបានបង្កើតដើម្បីចែករំលែកប្រាក់ចំណេញទៅអ្នកជាម្តាយ។',
 'mixed', 1, '3',
 'Members or founders, depending on the form.', 0, 'high',
 'Ministry of Interior, and the Ministry of Commerce for certain forms',
 'Charities, associations, community organisations and development bodies.',
 'សង្ខេបណកត្តិ សាជីវកម្ម អង្គកណ្ឌ និងអង្គកណ្ឌអភិវឌ្ឍន៍សហគ្រាមសាស្ត្រ។',
 'It can receive donations and grants and may have tax advantages, but it cannot pay profits to members and is not a route to personal wealth.',
 'វាអាចទទួលបញ្ចី និងមានទទួលជំនួយពិធ្ជាប់អន្តរជាតិ ហើយអាចមានគុណសម្បត្តិពន្ធដូចជាក់ ប៉ុន្តែមិនអាចបែកចំណេញទៅសមាជិក និងមិនមែនជាផ្លូវទៅក្រុមទ្រព្យផ្ទាល់ខ្លួនឡើយទេ។',
 'Which ministry registers your specific form, and donor or grant eligibility rules.',
 'ក្រសួងណាដែលចុះឈ្មោះទម្រង់ជាក់លាស់របស់អ្នក និងលក្ខខណ្ឌសម្រាប់អ្នកផ្តល់បញ្ចី ឬមានជំនួយពិធ្ជា។', 7);

-- ---------------------------------------------------------------------------
-- Two lab exercises that apply the comparison to a real decision.
-- ---------------------------------------------------------------------------
INSERT OR IGNORE INTO lab_exercises
 (key, category_key, skill_key, level, title_en, title_km, brief_en, brief_km,
  instructions_en, instructions_km, example_data, expected_en, expected_km,
  rubric, est_minutes, status, sort_order)
VALUES

('lab-structure','entrepreneurship','entrepreneurship','L2',
 'Choose a business structure','ជ្រើសរើសទម្រង់អាជីវកម្ម',
 'Match the legal form to the real situation, including what is actually at risk.',
 'ផ្គូរទម្រង់ច្បាប់ទៅនឹងស្ថានភាពពិត រួមទាំងអ្វីដែលពិតជាងត្រូវបានដាក់ហានិភ័យ។',
 'Read the scenario. List the facts that actually change the answer: how many owners, who is investing, whether the business will employ or lease, and the worst thing that could go wrong. Choose a structure and defend it in three sentences. Then name one fact that, if it changed, would change your answer.',
 'អានស្ថានភាពស្ថាប់។ រំលេចព័ត៌មានដែលពិតជាក់នៃការប៉ះពាល់ចម្លើយ៖ មានអ្នកដំណើរការប៉ុន្មាន នរណាជាអ្នកវិន្ទុស្តី តើអាជីវកម្មនឹងថ្កើតមនុស្ស ឬជួលទេ និងអ្វីដែលអាចខូចទ្រង់ទ្រាយជាមួយធំបំផុត។ ជ្រើសទម្រង់មួយ ហើយការពារយោបល់ក្នុងបីឃ្លា។ បន្ទាប់មកសម្គាល់ព័ត៌មានមួយដែលប្រសិនបើផ្លាស់ប្តូរ នឹងប្តូរចម្លើយរបស់អ្នក។',
 'Scenario: two friends want to run a car repair shop. They each put in $3,000 and both work full time. The workshop will lease premises, employ two mechanics, and take customer vehicles with valuable parts inside. A supplier is owed $4,000 when a supplier relationship turns bad.',
 'Sole proprietorship is not available to two owners. The key question is what is at risk: personal assets of both owners, and the business can be sued for supplier debt. A limited liability company separates them. Name the structure, identify who is personally exposed if it goes wrong, state what specifically protects them, and name one fact that would change the answer. That fact: if either owner plans to leave, transferring shares is easier than withdrawing from a partnership.',
 'ការសន្តរដារគាត់មែនត្រូវបានសម្រាប់អ្នកដំណើរការពីរនាក់ទេ។ សំណួរសំខាន់គឺថាតើអ្វីដែលត្រូវដាក់ហានិភ័យ។ ក្រុមហ្វន្តឯករាជ្យដោ៙ដែលកំណត់សមាជិកពីគ្នាចេញពីការទទួលខុសត្រូវរបស់អាជីវកម្ម។ ព័ត៌មានដែលនឹងប្តូរចម្លើយ គឺថា ប្រសិនបើអ្នកដំណើរការណាម្នាក់គ្រោះថ្នាក់ចាកចេញ ការផ្ទេកភាគរយងាយជាងការដកចេញពីភាពជាដៃគូ។',
 '[{"criterion":"Identifies who is personally exposed","points":25,"max":25},{"criterion":"Names the structure that matches the situation","points":20,"max":20},{"criterion":"Explains what the protection actually covers","points":25,"max":25},{"criterion":"Names one fact that would change the answer","points":20,"max":20},{"criterion":"Notes that fees and thresholds must be verified","points":10,"max":10}]',
 40,'active',11),

('lab-exposure','finance','financial','L3',
 'Map what is actually at risk','គណនាអ្វីដែលត្រូវបានដាក់ហានិភ័យ',
 'List the assets and obligations a structure exposes you to, then decide what to change.',
 'រំលេចទ្រព្យ និងកាតព្វកិច្ចដែលទម្រង់មួយដែលបង្ហាញលើអ្នក រួចសម្រេចថាតើត្រូវប្ដូរអ្វី។',
 'Take your own situation. Write three columns: what you own personally, what the business owns, and what you are personally guaranteeing. Then write one sentence describing the single worst realistic outcome, and one action that would reduce it.',
 'យកស្ថានភាពពិតរបស់អ្នកមក។ សរសេជបីជួរ៖ អ្វីដែលជាកម្មសិទ្ធិផ្ទាល់ខ្លួនរបស់អ្នក, អ្វីដែលអាជីវកម្មជាម្តាយ, និងអ្វីដែលអ្នកបានធានាផ្ទាល់ខ្លួន។ បន្ទាប់មកសរសេជួឲមួយឃ្លាពណ៌នាលទ្ធផលអាក្រក់ដែលអាចភ្លាមៗជាងគេទ្រង់លើពេលវេលា និងសកម្មភាពមួយដែលអាចកាត់បន្ថយវាបាន។',
 'Example: a sole trader renting a shop. Personal: home, savings, car. Business: stock and equipment. Guaranteed: personal guarantee on the shop lease, and personal liability for unpaid supplier invoices.',
 'The exercise is not the list. It is noticing which column is empty. An empty "business owns" column usually means the structure is doing nothing for you.',
 'លើការសរសេនេះមិនមែនជាបញ្ជីទេ។ វាគឺការកត់ត្រាថាជួរណាទទេ។ ជួរដែល "អាជីវកម្មជាម្តាយ" ទទេ ជាធម្មតាមានន័យថាទម្រង់គ្រប់គ្រងបានសម្រុងសម្រាប់អ្នកទេ។',
 '[{"criterion":"Separates personal assets from business assets","points":25,"max":25},{"criterion":"Identifies personal guarantees and unlimited exposure","points":30,"max":30},{"criterion":"Describes a realistic worst case, not a melodramatic one","points":20,"max":20},{"criterion":"Proposes one concrete action that reduces the exposure","points":25,"max":25}]',
 35,'active',12);
