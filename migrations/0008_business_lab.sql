-- 0008_business_lab.sql
-- Business Lab: practical exercises with instructions, example data, expected
-- output and a transparent scoring rubric for each.
--
-- ADDITIVE ONLY. Creates rows in lab_exercises, which migration 0007 created.
-- Touches no existing table and no Economic Intelligence data.
--
-- Every exercise carries BOTH English and Khmer text. Rubrics are explicit so
-- a learner (and an AI coach) can see exactly what earns the points. Scoring
-- stays transparent rather than being delegated to a model.

INSERT OR IGNORE INTO lab_exercises
 (key, category_key, skill_key, level, title_en, title_km, brief_en, brief_km,
  instructions_en, instructions_km, example_data, expected_en, expected_km,
  rubric, est_minutes, status, sort_order)
VALUES
-- 1. One-page business model -------------------------------------------------
('lab-business-model','entrepreneurship','entrepreneurship','L3',
 'Write a one-page business model','សរសេរគំរូអាជីវកម្មមួយទំព័រ',
 'Describe who pays you, what you sell, and why you win. One page, no jargon.',
 'ពិពណ៌នាថាអ្នកប្រាក់ផ្នែកនរណា អ្នកលក់អ្វី និងហេតុអ្វីបានធ្វើឱ្យអ្នកឈ្នះ។ មួយទំព័រ ដោយមិនប្រើពាក្យស្មុគ។',
 'Fill in: customer segments, the problem you solve, your offer, how you reach them, and what it costs you per month to operate. Add one number for each. Write it in language a customer would understand.',
 'បំពេញ៖ អតិថិជនគោល បញ្ហាដែលអ្នកដោះស្រាយ ផលិតផលរបស់អ្នក របៀបដែលអ្នកចម្លងដល់ពួកគេ និងថ្លៃប្រចាំខែដើម្បីដំណើរការ។ បន្ថែមលេខមួយសម្រាប់គ្រប់ផ្នែក។ សរសេរជាភាសាដែលអតិថិជនយល់។',
 'Sample: repairs phones in Siem Reap. Customers: 2 shops + 400 walk-ins. Offer: screen replacement, same day. Channel: Google Maps + Facebook. Monthly cost: rent 150, parts 400, transport 80 = $630.',
 'A specific customer, a named offer, one acquisition channel and a monthly cost figure that adds up.',
 'អតិថិជនជាក់លាស់ ផលិតផលដែលបានឈ្មោះ ឆ្នាំទទួលអតិថិជនមួយ និងចំនួនថ្លៃប្រចាំខែដែលបន្ថែមពិត។',
 '[{"criterion":"Names a specific customer segment","points":25,"max":25},{"criterion":"States a clear offer with a price","points":25,"max":25},{"criterion":"Names a real acquisition channel","points":20,"max":20},{"criterion":"Monthly costs are listed and add up","points":15,"max":15},{"criterion":"Written in plain language, no jargon","points":15,"max":15}]',
 60,'active',1),

-- 2. Competitor analysis -----------------------------------------------------
('lab-competitor','intelligence','economics_intel','L2',
 'Analyse one competitor','វាយតម្លៃការប្រទេសប្រទេសម្នាក់',
 'Find a real competitor and explain where they are strong and where you could beat them.',
 'រកការប្រទេសប្រទេសពិត ហើយពិពណ៌នាថាពួកគេខ្លាំងណា និងអ្នកអាចគង់ពានពួកគេយ៉ាងណា។',
 'Choose a competitor you can actually visit or read about. Record: what they sell, who they sell to, their price, their strongest point, their weakest visible point, and one gap you could exploit. Cite where each fact came from.',
 'ជ្រើសការប្រទេសប្រទេសដែលអ្នកអាចទៅមើលឬអានបាន។ កត់ត្រា៖ ពួកគេលក់អ្វី លក់ឱ្យនរណា តម្លៃរបស់ពួកគេ ចំណុចខ្លាំងបំផុត ចំណុចខ្សោយដែលឃើញបាន និងច្រកមួយដែលអ្នកអាចប្រើ។ សម្គាល់មូលដ្ឋាននៃព័ត៌មាននីមួយៗ។',
 'Example source types: a shop front, a public Facebook page, a posted price list. Prices must be observed, not guessed.',
 'Sources must be observable, not assumed. A gap you can act on this month beats five abstract weaknesses.',
 'មូលដ្ឋានត្រូវតែជាអ្វីដែលអាចមើលឃើញ មិនមែនជាការស្មាន។ ច្រកដែលអ្នកធ្វើបានឥឡូវនេះគុជ្ជាជាងចំណុចខ្សោយអរូបមន្តប្រា។។',
 '[{"criterion":"Competitor is real and identifiable","points":20,"max":20},{"criterion":"Price and offer recorded from an actual source","points":25,"max":25},{"criterion":"Names one exploitable gap","points":30,"max":30},{"criterion":"Sources cited","points":15,"max":15},{"criterion":"Sources cited","points":10,"max":10}]',
 45,'active',2),

-- 3. Sales pipeline ----------------------------------------------------------
('lab-pipeline','growth','sales','L2',
 'Build a sales pipeline','បង្កើតរន្ធដោយលក់',
 'Turn a list of prospects into a tracked pipeline with realistic stage counts.',
 'ប្រូរបីការអនឡាញទៅជារន្ធដោយលក់ដែលត្រូវបានតាមដាន ជាមួយចំនួនតាមដំណើរការជាក់លង្ការ។',
 'Create four columns: Contacted, Replied, Quoted, Won. Put at least 5 real prospects in. For each, record value and the date of your last contact. Then calculate your conversion rate from Replied to Won.',
 'បង្កើតបួកបីដារ៖ បានទាក់ទង បានឆ្លើយតប បានផ្តល់តម្លៃ បានឈ្នួល។ ដាក់អតិថិជនពិតយ៉ាងតិច ៥ នាក់។ សម្រាប់មួយនាក់ កត់ត្រាតម្លៃ និងកាលបរិច្ឆេទទាឆងស្មុគចុងក្រោយ។ បន្ទាប់មកគណនាអតិបរមារពីឆ្លើយតបទៅឈ្នួល។',
 'Sample: 20 contacted, 6 replied, 2 quoted, 1 won. Reply-to-win conversion = 1/6 = 17%.',
 'Conversion is Won / Replied, not Won / Contacted. Using the wrong denominator flatters the number.',
 'អតិបរមារគឺ ឈ្នួល / ឆ្លើយតប មិនមែនជា ឈ្នួល / បានទាក់ទងទេ។ ការប្រើឈ្មោះក្រាប់ខុសធ្វើឱ្យលេខស្មានខ្លាង។',
 '[{"criterion":"At least 5 real prospects entered","points":20,"max":20},{"criterion":"All four stages used","points":20,"max":20},{"criterion":"Value and last-contact date recorded per prospect","points":20,"max":20},{"criterion":"Conversion calculated from the correct denominator","points":30,"max":30},{"criterion":"Next action identified for stalled deals","points":10,"max":10}]',
 45,'active',3),

-- 4. Conversion rate ---------------------------------------------------------
('lab-conversion','growth','sales','L2',
 'Improve a conversion rate','កែល្អអតិបរមារនៃការប្រើក', 
 'Diagnose why customers do not buy, then propose a testable change.',
 'វាយតម្លៃថាហេតុអ្វីអតិថិជនមិនទិញ រួចស្នើការផ្លាស់ប្តូរមួយដែលអាចសាកល្បងបាន។',
 'Use this funnel: 100 visitors, 40 browse, 20 add to cart, 5 pay. Calculate each step rate. Identify the largest single drop. Propose ONE change and say how you would test it in two weeks.',
 'ប្រើលទ្ធាននេះ៖ អ្នកទស្សនា ១០០ អ្នកមើល ៤០ អ្នកដាក់កន្ត្រក់ ២០ អ្នកបង់លុយ ៥។ គណនាអតិបរមាររាល់ជំហាន។ ស្វែងរកការធ្លាក់ធំបំផុត។ ផ្តល់ការផ្លាស់ប្តូរមួយ និងពិពណ៌នាថាតើអ្នកនឹងសាកល្បងយ៉ាងណាក្នុងពីសប្តាហ៍។',
 'Given funnel above: browse 40%, cart-to-pay 25%. The cart-to-pay step is the largest absolute drop (15 lost).',
 'One change, one measurement, one deadline. Proposing five changes at once cannot be tested.',
 'ការផ្លាស់ប្តូរមួយ ការវាស់វែងមួយ និងពេលវេលាមួយ។ ការផ្តល់ប្រគល់ការផ្លាស់ប្តូរប្រាំដែរជាមួយគ្នាមិនអាចសាកល្បងបានទេ។',
 '[{"criterion":"Each step rate calculated correctly","points":25,"max":25},{"criterion":"Largest drop correctly identified","points":25,"max":25},{"criterion":"Exactly one change proposed","points":20,"max":20},{"criterion":"Test method and deadline stated","points":20,"max":20},{"criterion":"Change addresses the identified drop","points":10,"max":10}]',
 30,'active',4),

-- 5. Profit margins ----------------------------------------------------------
('lab-margin','finance','financial','L2',
 'Calculate real profit margins','គណនាប្រាក់ចំណេញពិត',
 'Work out margin per product and find out which product is actually making money.',
 'គណនាប្រាក់ចំណេញក្នុងមួយផលិតផល ហើយរកថាតើផលិតផលណាដែលកំពុងបង្កើតលុយពិត។',
 'For three products, calculate revenue, cost of goods, gross margin, and gross margin percentage. Then subtract your monthly fixed costs to find net profit. Name the product you should stop or reprice.',
 'សម្រាប់ផលិតផលបី គណនាចំណេញ ថ្លៃដឹងទំនិញ ប្រាក់ចំណេញមាត្រ និងភាគរយប្រាក់ចំណេញមាត្រ។ បន្ទាប់មកដកថ្លៃថ្លៃដែលបានកំណត់ប្រចាំខែ ដើម្បីរកប្រាក់ចំណេញសុទ្ធ។ សម្គាល់ផលិតផលដែលអ្នកគួរឈប់ ឬកំណត់តម្លៃឡើងវិញ។',
 'Product A: price 100, COGS 60, margin 40 (40%). B: price 50, COGS 45, margin 5 (10%). C: price 200, COGS 90, margin 110 (55%). Fixed costs 2000/mo.',
 'Gross margin is (price - COGS) / price. Product B may have the best sales volume and still lose money after fixed costs are allocated.',
 'ប្រាក់ចំណេញមាត្រគឺ (តម្លៃ - ថ្លៃដឹង) / តម្លៃ។ ផលិតផល B អាចមានបរិមាណលក់ល្អបំផុត ប៉ុន្តែនៅតែបាត់លុយក្រោយពេលអគល់ថ្លៃដែលបានកំណត់។',
 '[{"criterion":"Margin formula applied correctly","points":30,"max":30},{"criterion":"Fixed costs deducted to reach net profit","points":25,"max":25},{"criterion":"Identifies the genuinely unprofitable product","points":25,"max":25},{"criterion":"Recommends a concrete action","points":20,"max":20}]',
 40,'active',5),

-- 6. Monthly revenue forecast -------------------------------------------------
('lab-forecast','finance','financial','L3',
 'Forecast monthly revenue','ព្យាករណ៍ប្រាក់ចំណេញប្រចាំខែ',
 'Project next month from real numbers and state your assumptions out loud.',
 'ព្យាករណ៍ខែបន្ទាប់មកដោយផែន់ផ្អែកលើលេខពិត ហើយប្រាប់ការសន្មតរបស់អ្នកជាក់ស្តែង។',
 'Using the last three months of actual revenue, project the next month. Give a low, likely and high figure. Then list the assumption that would most change the answer.',
 'ប្រើប្រាក់ចំណេញពិតបីខែចុងក្រោយ ដើម្បីព្យាករណ៍ខែបន្ទាប់មក។ ផ្តល់លេខទាប ទូទៅ និងខ្ពស់។ បន្ទាប់មកសម្គាល់ការសន្មតដែលនឹងប៉ះពាល់ចម្បងបំផុតដល់ចម្លើយ។',
 'Actual: month 1 $3,000, month 2 $3,600, month 3 $4,200 (10% growth). Low $4,200, likely $4,600, high $5,000.',
 'A forecast with no stated assumption is a guess. Naming the assumption that moves the number is the actual skill.',
 'ការព្យាករណ៍ដែលគ្មានការសន្មតគឺការស្មាន។ ការសម្គាល់ការសន្មតដែលផ្លាស់ប្តូរលេខគឺជំនាញពិត។',
 '[{"criterion":"Uses real historical figures","points":25,"max":25},{"criterion":"Low / likely / high range provided","points":25,"max":25},{"criterion":"Key assumption named explicitly","points":30,"max":30},{"criterion":"Assumption is plausible and testable","points":20,"max":20}]',
 40,'active',6),

-- 7. KPI dashboard -----------------------------------------------------------
('lab-kpi','data','financial','L2',
 'Build a KPI dashboard','បង្កើតផ្ទាំងពិនិត្យ KPI',
 'Choose four numbers that actually tell you whether the business is working.',
 'ជ្រើសរើសលេខបួនដែលពិតជាក់ថាអាជីវកម្មកំពុងដំណើរការឬទេ។',
 'Define exactly four KPIs. For each write: the definition in one sentence, the current value, the target value, the frequency you will review it, and who is responsible.',
 'កំណត់ KPI បួនដែលជាក់លាស់។ សម្រាប់មួយសរសេរ៖ និយមន័យជាឃ្លីមួយ តម្លៃបច្ចុប្បន្ន តម្លៃគោលដៅ ប្រសិនបើអ្នកនឹងពិនិត្យវាប៉ុន្មានដង និងអ្នកនរណាទទួលខុសត្រូវ។',
 'Bad KPI: "increase sales". Good KPI: "new paid orders per week, target 40 by 31 March, reviewed every Monday, owner: sales lead".',
 'A KPI nobody owns or reviews is decoration. Responsibility and frequency are part of the definition.',
 'KPI ដែលគ្មាននរណាទទួលខុសត្រូវ ឬគ្មានការពិនិត្យ គឺជាការតាំងសម្ដោះតែប៉ុណ្ណោះ។ ភាពទទួលខុសត្រូវ និងប្រសិទ្ធផលជាផ្នែកនៃនិយមន័យ។',
 '[{"criterion":"Exactly four measurable KPIs","points":20,"max":20},{"criterion":"Each has a current and target value","points":25,"max":25},{"criterion":"Review frequency stated","points":20,"max":20},{"criterion":"A named owner per KPI","points":20,"max":20},{"criterion":"KPIs are measurable, not vague goals","points":15,"max":15}]',
 45,'active',7),

-- 8. AI-assisted workflow ----------------------------------------------------
('lab-ai-workflow','ai','digital','L1',
 'Design an AI-assisted workflow','រចនារន្ធដោយប្រើ AI',
 'Find one repetitive task and design a workflow where AI helps and you verify.',
 'រកការងារបំប្រុងមួយ ហើយរចនាដំណើរការដែល AI ជួយ ហើយអ្នកផ្ទៀងផ្ទាត់។',
 'Pick a task you do weekly that takes over an hour. Draw the current steps. Mark which step AI could draft or summarise. Write the exact check a human must do before the output is used. State what must never be sent to the AI tool.',
 'ជ្រើសការងារប្រចាំសប្តាហ៍ដែលអ្នកធ្វើ ហើយចំណាប់លើមួយម៉ោង។ គូររាល់ជំហានបច្ចុប្បន្ន។ សម្គាល់ជំហានដែល AI អាចស្នើព្យាយាម ឬសង្ខេប។ សរសេរការត្រួតពិនិត្យជាក់លាស់ដែលមនុស្សត្រូវធ្វើមុនប្រើប្រាក់ត្រូវបាន។ សម្គាល់អ្វីដែលមិនត្រូវផ្ញើទៅឧបករណ៍ AI ទេ។',
 'Example task: weekly supplier invoice summary. AI drafts the summary; a human checks every figure against the invoice before it is used; customer bank details are never pasted.',
 'The human verification step is the point of the exercise. Without it this is not an assisted workflow, it is an unchecked dependency.',
 'ជំហានត្រួតពិនិត្យដោយមនុស្សគឺចំណុចស្វែងរកនៃលើកឡើង។ បើគ្មានវា នេះមិនមែនជាដំណើរការជួយសម្រួលទេ ហើយជាការពឹទ្ធនឹងដែលគ្មានការត្រួតពិនិត្យ។',
 '[{"criterion":"A real repetitive task chosen","points":20,"max":20},{"criterion":"Current steps documented","points":20,"max":20},{"criterion":"AI step is narrow and specific","points":20,"max":20},{"criterion":"Human verification step defined","points":25,"max":25},{"criterion":"Data that must not be sent to AI identified","points":15,"max":15}]',
 40,'active',8),

-- 9. Marketing campaign ------------------------------------------------------
('lab-campaign','growth','sales','L2',
 'Plan a small marketing campaign','គ្រប់គ្រងការផ្សុាសនាទីក្រុងតូច',
 'Run a campaign you can measure on a small budget.',
 'ដំណើរការការផ្សុាសនាដែលអ្នកអាចវាស់បានដោយថវិកាតាងតូច។',
 'Define: one audience, one offer, one channel, one budget figure, and one success number. Write two message variants. State what you will stop doing if it fails after two weeks.',
 'កំណត់៖ មួយក្រុមអតិថិជន ផ្តល់ជូនមួយ ឆ្នាំករណីមួយ ចំនួនថវិកាមួយ និងលេខជោគជ័យមួយ។ សរសេរសារដែលខុសគ្នាពីគ្នាពីរដូវ។ សម្គាល់ថាតើអ្នកនឹងឈប់ធ្វើអ្វី ប្រាប់បរាជ័យទេបន្ទាប់ពីពីសប្តាហ៍។',
 'Example: audience = new parents in Battambang, offer = free first check-up, channel = Facebook local group, budget $40, success = 8 bookings. Stop: no response after two posts.',
 'One channel, one offer, one number. Campaigns that change everything at once cannot be diagnosed.',
 'ឆ្នាំករណីមួយ ផ្តល់ជូនមួយ លេខមួយ។ ការផ្សុាសនាដែលផ្លាស់ប្តូរអីៗទាំងអស់មិនអាចវាស់វែងបានទេ។',
 '[{"criterion":"One audience, offer, channel, budget, success number","points":30,"max":30},{"criterion":"Two message variants written","points":20,"max":20},{"criterion":"Success number is measurable","points":20,"max":20},{"criterion":"Stopping rule stated","points":20,"max":20},{"criterion":"Realistic budget for the audience size","points":10,"max":10}]',
 45,'active',9),

-- 10. Management presentation -------------------------------------------------
('lab-presentation','leadership','leadership','L3',
 'Prepare a management presentation','រៀបចំការបង្ហាញសម្រាប់ការគ្រប់គ្រង',
 'Present a recommendation that a manager can decide on in five minutes.',
 'រៀបចំអាជីវកម្មណាមួយដែលអ្នកគ្រប់គ្រងអាចសម្រេចក្នុងរយៈពេលប្រាំនាទី។',
 'Structure it as: the decision needed, the recommendation, three supporting facts, the main risk, and the cost. Anticipate the one question your manager will ask and answer it yourself.',
 'រៀបចំជា៖ សេចក្តីសម្រេចដែលត្រូវធ្វើ អាជីវកម្មណែនាំ ហេតុផលគាំទ្របី ហានិភ័យសំខាន់ និងថ្លៃដឹង។ រំពឹងថានឹងមានសំណួរមួយដែលអ្នកគ្រប់គ្រងនឹងសួរ ហើយឆ្លើយដោយខ្លួនឯង។',
 'Bad: "Here are our quarterly numbers". Good: "Decision: hire a second technician or outsource. Recommendation: outsource for 3 months. Facts: backlog 11 days, revenue per job $38, technician cost $320/mo fixed. Risk: quality drop. Cost: ~$45/job."',
 'Lead with the decision, not the background. A presentation that only gives context has asked for no decision.',
 'ចាប់ផ្ដើមដោយសេចក្តីសម្រេច មិនមែនដោយព័ត៌មានផ្ទៃខាងក្រោយ។ ការបង្ហាញដែលផ្តល់តែបរិទ្ធិគឺការស្នើសុំទំនាក់ទំនងដែលមិនទាន់សម្រេចចិត្ត។',
 '[{"criterion":"Decision stated in the first two lines","points":30,"max":30},{"criterion":"Recommendation is explicit and single","points":20,"max":20},{"criterion":"Three supporting facts are specific","points":20,"max":20},{"criterion":"Main risk named","points":15,"max":15},{"criterion":"Anticipated question answered","points":15,"max":15}]',
 50,'active',10);
