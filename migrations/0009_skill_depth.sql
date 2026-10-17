-- 0009_skill_depth.sql
-- Gives every one of the 12 categories' skills enough depth to have a real
-- detail page, instead of a one-line description.
--
-- ADDITIVE ONLY. Adds columns to `skills` and fills them in. Nothing is dropped,
-- no lesson content is touched, and the Economic Intelligence schema is not
-- referenced.
--
-- Four new fields per skill:
--   detail_en / detail_km   what the skill actually is, in a paragraph
--   who_for_en / who_for_km who it is for, and who should skip it for now
--   outcomes                JSON array of concrete things a learner can DO after
--   tools                   JSON array of tools that are typical for the work
--
-- `outcomes` is deliberately written as observable actions ("build", "calculate",
-- "run"), not as claims about ability. Nobody is told they are competent.

ALTER TABLE skills ADD COLUMN detail_en   TEXT NOT NULL DEFAULT '';
ALTER TABLE skills ADD COLUMN detail_km   TEXT NOT NULL DEFAULT '';
ALTER TABLE skills ADD COLUMN who_for_en  TEXT NOT NULL DEFAULT '';
ALTER TABLE skills ADD COLUMN who_for_km  TEXT NOT NULL DEFAULT '';
ALTER TABLE skills ADD COLUMN tools       TEXT NOT NULL DEFAULT '[]';
ALTER TABLE skills ADD COLUMN outcomes    TEXT NOT NULL DEFAULT '[]';

-- ---------------------------------------------------------------------------
-- 1. Strategic & Critical Thinking
-- ---------------------------------------------------------------------------
UPDATE skills SET
  detail_en='Breaking a problem into parts, finding the one that actually matters, and testing a decision before committing money or time to it. Most business problems are not solved by working harder; they are solved by naming the real cause.',
  detail_km='បំបែកបញ្ហាជាផ្នែក រកផ្នែកដែលពិតជាពិត ហើយសាកល្បងការសម្រេចមុននឹងបញ្ហាលុយ ឬពេលវេលា។ បញ្ហាអាជីវកម្មភាគរយមិនត្រូវដោះស្រាយដោយខិតខំបំផុតទេ តែត្រូវដោយស្គាល់បញ្ហាពិតជាមុន។',
  who_for_en='Anyone who has ever solved the wrong problem efficiently. Also useful before you start a project, when the brief is still changeable.',
  who_for_km='អ្នកដែលធ្លាប់ដោះស្រាយបញ្ហាខុសដោយមានប្រសិទ្ធិ។ ក៏មានប្រយោជន៍មុនពេលចាប់ផ្តើមគម្រោះ ពេលការងារក្រោយទៀតក៏អាចប្តូរបានដែរ។',
  tools='["Mind maps","Root cause analysis (5 Whys)","Decision matrices","Spreadsheets","Simple surveys"]',
  outcomes='["Break a vague problem into a specific one","Run a 5 Whys analysis to find the real cause","Compare options against explicit criteria","Spot when a problem is a symptom, not the cause","Write a one-page decision memo someone else can act on"]'
WHERE key='strategic';

-- ---------------------------------------------------------------------------
-- 2. AI and Digital Literacy
-- ---------------------------------------------------------------------------
UPDATE skills SET
  detail_en='Using AI and everyday digital tools to finish real work faster, while knowing what those tools get wrong. The goal is not to become an engineer. It is to recognise when AI helps, when it invents something plausible, and when to check the answer yourself.',
  detail_km='ការប្រើ AI និងឧបករណ៍ឌីជីតែលធម្មតា ដើម្បីបញ្ចប់ការងារពិតលឿនជាងមុន ហើយដឹងថាឧបករណ៍នេះខុសឆ្ងាយណា។ គោលដោយមិនមែនជាការក្លាយជាវិទ្យាន្យទេ ថែមទោះជាការស្គាល់ថាពេលណា AI ជួយបាន ពេលណាវាបង្កើតអ្វីដែលមើលទៅស្របតែមិនពិត និងពេលណាត្រូវផ្ទៀងផ្ទាត់ដោយខ្លួនឯង។',
  who_for_en='Anyone who writes, sells, manages or reports. You do not need programming. You do need to know the limits, because AI states wrong things confidently.',
  who_for_km='អ្នកដែលសរសេរ លក់ គ្រប់គ្រង ឬរៀបចំរបាយ។ មិនត្រូវការកម្មវិធីងាត់ទេ តែត្រូវដឹងពីដែនកំណត់ ព្រោះ AI នឹងប្រាប់ព័ត៌មានខុសដោយជាប់ជាក់ស្តែង។',
  tools='["Chat assistants","Image generation","Speech to text","Transcription","Translation","Spreadsheet formulas"]',
  outcomes='["Write a prompt that gets a usable first draft","Spot when an AI answer is confidently wrong","Design a workflow where AI drafts and a human checks","Choose what must never be pasted into an AI tool","Judge whether an AI output is good enough to use"]'
WHERE key='digital';

-- ---------------------------------------------------------------------------
-- 3. Sales, Marketing and Revenue Growth
-- ---------------------------------------------------------------------------
UPDATE skills SET
  detail_en='Finding the right customers, earning their attention, converting them, and keeping them. Marketing brings attention; sales turns it into money. Most small businesses are weak in one of those two halves, and it is usually sales follow-up.',
  detail_km='ស្វែងរកអតិថិជនត្រឹមត្រូវ ទាក់ទារយ៉ាងអាចជាក់ ប្តូរពួកគេមកជាអតិថិជន និងរក្សាពួកគេឱ្យនៅក្បៅ។ ទីក្រុងនាំអារម្បណ៍ចូល រស់ជាលុយ។ អាជីវកម្មតូចភាគរយខ្សោយកាន់មួយក្បៅ ជាធម្មតាគឺការតាមដានក្រោយក្នុងការលក់។',
  who_for_en='Salespeople, shop owners, freelancers and anyone who needs customers to find them. Also the right skill if you are competing with people who simply advertise more.',
  who_for_km='អ្នកលក់ ម្តាក់ស្ថាប័ន អ្នកធ្វើការឯករាជ្យ និងអ្នកដែលត្រូវការអតិថិជនឲ្យមករកពួកគេ។ ក៏សមសម្រាប់អ្នកដែលកំពុងប្រកាសាជាមួយអ្នកដែលគ្រាប់ចែកផ្សាយពិពណ៌នាច្រើនជាង។',
  tools='["CRM (free tiers)","Facebook and Messenger","Google Maps","WhatsApp","Email","Simple landing pages"]',
  outcomes='["Build a tracked pipeline instead of relying on memory","Calculate conversion rates using the right denominator","Segment customers by what they actually need","Write a follow-up that gets a reply","Decide a price that protects your margin"]'
WHERE key='sales';

-- ---------------------------------------------------------------------------
-- 4. Leadership and People Management
-- ---------------------------------------------------------------------------
UPDATE skills SET
  detail_en='Getting results through other people. Delegation, feedback, performance conversations and conflict. Most management problems are actually clarity problems: people are not being told what good looks like, or what happens next.',
  detail_km='ទទួលបានលទ្ធផលតាមរយៈអ្នកផ្សេង។ ការទុកចិត្ត មតិយោបល់ ការពិភាក្សាវឌ្ឍនភាព និងដំណ៾រដោះស្រាយវិវាទ្យ។ បញ្ហាការគ្រប់គ្រងភាគរយគឺបញ្ហាភាពច្បាស់ច្បាត់ជាក់លង់៖ មិនមែនបានប្រាប់ថាល្អណាស់ ឬអ្វីនឹងកើតឡើងបន្ទាប់។',
  who_for_en='New managers, team leads and business owners. Useful even if you manage two people. Not a substitute for handling a serious performance or conduct problem through your HR process.',
  who_for_km='អ្នកគ្រប់គ្រងថ្មី ចំណាប់ក្រុម និងម្តាក់ស្ថាប័ន។ មានប្រយោជន៍ចែនាំពេលអ្នកគ្រប់គ្រងតែពីរនាក់។ មិនជំនួសការដោះស្រាយបញ្ហាវឌ្ឍនភាព ឬអាធិបតេអ្នកធ្វើពីរដោបទេ។',
  tools='["Weekly one-to-ones","Written expectations","Simple checklists","Feedback frameworks","Meeting agendas"]',
  outcomes='["Delegate an outcome rather than a list of tasks","Give feedback someone can act on","Set a clear standard for what good looks like","Run a meeting that ends in a decision","Handle a recurring conflict without it getting personal"]'
WHERE key='leadership';

-- ---------------------------------------------------------------------------
-- 5. Finance and Business Economics
-- ---------------------------------------------------------------------------
UPDATE skills SET
  detail_en='Reading money: revenue, cost, margin and cash. The gap between profit and cash is where most small businesses fail, so both matter. This is about understanding your own numbers well enough to make a decision, not about becoming an accountant.',
  detail_km='ការអានលុយ៖ ចំណេញ ថ្លៃដឹង ប្រាក់ចំណេញ និងស្ថានាធន្នីប្រាក់។ ចន្លោះរវាងប្រាក់ចំណេញ និងស្ថានាធន្នីប្រាក់គឺជនិលង ដែលអាជីវកម្មតូចភាគរយច្រើនបរាជ័យ ដូច្នេះទាំងពីរសំខាន់។ វាគឺការយល់លេខរបស់ខ្លួនឯងគ្រប់គ្រាន់ដើម្បីសម្រេច មិនមែនជាការក្លាយជាសត្ថិកម្មនៅត្រូវទេ។',
  who_for_en='Business owners, freelancers and managers who need to understand a profit and loss statement. Start here before taking on funding or a partner.',
  who_for_km='ម្តាក់ស្ថាប័ន អ្នកធ្វើការឯករាជ្យ និងអ្នកគ្រប់គ្រងដែលត្រូវយល់កំណត់ប្រាក់ចំណេញ និងខាត។ ចាប់ផ្តើមពីទីនេះមុននឹងទទួលមូលនាក់ ឬដៃគូ។',
  tools='["Excel or Google Sheets","Simple bookkeeping app","Cash flow spreadsheet","Bank statements","Payment records"]',
  outcomes='["Read a profit and loss statement without guessing","Tell the difference between profit and cash","Calculate gross and contribution margin","Build a simple cash flow forecast","Set a price that covers your real costs"]'
WHERE key='financial';

-- ---------------------------------------------------------------------------
-- 6. Data and Analytical Skills
-- ---------------------------------------------------------------------------
UPDATE skills SET
  detail_en='Turning numbers into a decision someone can act on. Being fluent in spreadsheets is less important than asking a clear question first and being honest when the data cannot answer it.',
  detail_km='ប្រូរប្រាក់លេខជាការសម្រេចដែលអាចធ្វើបាន។ ការច្បាស់ស្ថាប័ន ស៊ីតតិចជាងការសួរសំណួរច្បាស់ជាមុន និងការសម្រាប់ពិតពេលទិន្នន័យមិនអាចឆ្លើយបាន។',
  who_for_en='Anyone who has to defend a decision with numbers, and anyone tired of arguing from opinion.',
  who_for_km='អ្នកដែលត្រូវការការពារការសម្រេចដោយប្រើលេខ និងអ្នកដែលគិតចុជាងមកពិភាក្សាដោយផ្អែកលើមតិ។',
  tools='["Excel","Google Sheets","Google Data Studio","Pivot tables","Databases and SQL basics"]',
  outcomes='["Define a KPI precisely enough to measure","Build a dashboard that answers a real question","Explain a trend in plain language","Spot when a number is misleading","Clean a list before analysing it"]'
WHERE key='data_analytics';

-- ---------------------------------------------------------------------------
-- 7. Digital, Software and Cloud Skills
-- ---------------------------------------------------------------------------
UPDATE skills SET
  detail_en='Working confidently with software instead of being stuck by it. Automating the repetitive parts of a job, connecting tools that do not talk to each other, and understanding enough cloud and web hosting to make good decisions.',
  detail_km='ការធ្វើការជាមួយស៊ីហ្វ្តវែដោយប្រាកដ ជំនួសការត្រូវជាទក់ជាមួយវា។ ស្វ័យប្រវត្តិកម្មផ្នែកដែលការងារងារតែងរវាងឡើងវិញ និងយល់កន្លែងមូល និងគេហទាវរបានស្រាន់គ្រាន់តែប្រសិទ្ធិសម្រេចត្រឹមតែប្រស។',
  who_for_en='Operations staff, administrators and small business owners. Particularly valuable if your work involves repeating the same clicks every week.',
  who_for_km='ប្រទេសការងារ អ្នកគ្រប់គ្រង និងម្តាក់ស្ថាប័នតូច។ មានប្រយោជន៍ពេលការងាររបស់អ្នកមួយដូចប្រកាស់ក្រង់ដដែលតែងរវាងឡើងវិញជាតិ។',
  tools='["Google Workspace","Microsoft 365","Zapier or Make","Airtable","Canva","Cloud hosting basics"]',
  outcomes='["Automate a task you currently do by hand","Connect two tools that do not talk to each other","Set up a shared workspace others can use","Explain what an API does in plain terms","Decide whether software solves a real problem"]'
WHERE key='digital_cloud';

-- ---------------------------------------------------------------------------
-- 8. Cybersecurity, Privacy and Digital Trust
-- ---------------------------------------------------------------------------
UPDATE skills SET
  detail_en='Not being the person who loses the data. Passwords, phishing, and handling customer information responsibly. The most common attacks are boring, cheap and preventable.',
  detail_km='ការមិនក្លាយជាអ្នកដែលបាត់ទិន្នន័យ។ ពាក្យសម្ងាត់ ការពិពណ៌នាបញ្ជាក់ និងការគ្រប់គ្រងព័ត៌មានអតិថិជនដោយការពិត។ ការវាយប្រយោគភាគរយធម្មតាគឺធម្មតា ថោច និងការរាំងស្អាតបាន។',
  who_for_en='Everyone. This is the one category where doing nothing is more expensive than spending an hour on it.',
  who_for_km='មនុស្សគ្រប់គ្នា។ នេះជាប្រភេទតែមួយដែលមិនធ្វើអ្វីទេ ច្រើនជាងចំណាប់ម៉ោងសិក្សា។',
  tools='["Password manager","Two-factor authentication","Backups","Access control lists","Encrypted messaging"]',
  outcomes='["Recognise a phishing attempt before acting on it","Protect an account with a strong unique password","Know what to back up and how often","Handle customer data without over-collecting it","Respond sensibly when something is compromised"]'
WHERE key='cyber_safety';

-- ---------------------------------------------------------------------------
-- 9. Entrepreneurship and Business Building
-- ---------------------------------------------------------------------------
UPDATE skills SET
  detail_en='Turning an idea into something that actually gets paid for. Validating demand before spending, building the smallest version that works, and growing without losing control of costs.',
  detail_km='ប្រើគំនិតមកជាអ្វីដែលពិតជាការបានបង់ប្រាក់។ ពិនិត្យតម្រូវការជាមុននឹងចំណាប់អ្វី ស្ថាងកំណែតូចបំផុតដែលដំណើរការ និងលូទាន់លូទាន់ដោយមិនបាត់ការគ្រប់គ្រងថ្លៃដឹង។',
  who_for_en='People with a business idea that has not been tested yet, and people running a business that has stalled.',
  who_for_km='អ្នកដែលមានគំនិតអាជីវកម្មដែលមិនទាន់ត្រូវបានសាកល្បង និងអ្នកដែលកំពុងដំណើរការអាជីវកម្មដែលឈប់ថាន់។',
  tools='["Customer interviews","Simple prototypes","Landing pages","Cost spreadsheets","Pilot projects"]',
  outcomes='["Test demand before investing money","Interview customers without leading them","Describe a business model on one page","Run the smallest version that proves the idea","Decide whether to scale, change or stop"]'
WHERE key='entrepreneurship';

-- ---------------------------------------------------------------------------
-- 10. Communication, Creativity and Personal Effectiveness
-- ---------------------------------------------------------------------------
UPDATE skills SET
  detail_en='Getting your thinking across clearly, and staying effective when there is more to do than time. Writing, presenting, prioritising and learning deliberately are the skills that make the rest usable.',
  detail_km='ប្រគល់គំនិតរបស់អ្នកឱ្យច្បាស់ចរាង និងបន្តមានប្រសិទ្ធផលពេលការងារច្រើនជាងពេលវេលា។ ការសរសេរ ការបង្ហាញ ការធ្វើមិនសំខាន់ជាក់ជាមុន និងការរៀនដោយចេញចិត្ត គឺជាជំនាញដែលធ្វើឱ្យជំនាញផ្សេងៗអាចប្រើបាន។',
  who_for_en='Anyone whose work depends on other people understanding them: managers, salespeople, students and founders.',
  who_for_km='អ្នកដែលការងាររបស់ខ្លួនទាមឲ្យអ្នកផ្សេងយល់អ្នក គ្រប់គ្រង អ្នកលក់ និងសិស្ស។',
  tools='["Plain writing","Presentation tools","Task lists","Time blocking","Note-taking"]',
  outcomes='["Write a short update someone can act on","Present a recommendation before the background","Prioritise when everything seems urgent","Learn a new skill with a deliberate method","Recover quickly after a setback"]'
WHERE key='communication';

-- ---------------------------------------------------------------------------
-- 11. Global, Economic and Industry Intelligence
-- ---------------------------------------------------------------------------
UPDATE skills SET
  detail_en='Reading what is changing in the economy and your industry, and checking whether a headline is worth acting on. This is the skill that stops you making a business decision from a rumour.',
  detail_km='ការអានអ្វីដែលកំពុងផ្លាស់ប្តូរក្នុងសេដ្ឋកិច្ច និងវិសេសកម្មរបស់អ្នក និងការពិនិត្យថាតើប្រព័ន្ធមួយតវាសមស្របនឹងអ្នកគួរធ្វើប្រតិបត្តិការឬអត់។ នេះជាជំនាញរាំងកុំឱ្យអ្នកសម្រេចអាជីវកម្មពីការស្មានដោយខ្លួន។',
  who_for_en='Owners and managers in Cambodia and regionally, where policy, supply and demand can change faster than annual planning assumes.',
  who_for_km='ម្តាក់ស្ថាប័ន និងអ្នកគ្រប់គ្រងនៅកម្ពុជា និងតំបន់តំបន់ ដែលគោលនយោបល់ ការផ្គត្រង់ និងតម្រូវការអាចប្តូរលឿនជាងការចង់បាន។',
  tools='["News dashboards","Central bank and ministry releases","Industry reports","Trade data","Local media"]',
  outcomes='["Decide whether a news item affects your business","Verify a source before acting on it","Read an indicator and explain what it means","Spot a policy change early","Connect a global trend to a local decision"]'
WHERE key='economics_intel';

-- ---------------------------------------------------------------------------
-- 12. Emerging Technologies and Future Industries
-- ---------------------------------------------------------------------------
UPDATE skills SET
  detail_en='Understanding technologies that are still maturing, described accurately. Robotics, clean energy, biotech and similar shifts are assessed on what is proven today versus what is still forecast, so no opportunity is oversold.',
  detail_km='យល់អំពីបច្ចេកវិទ្យាដែលនៅតែកំពុងរាស់ដំណើរ ដោយពិពណ៌នាត្រឹមត្រូវ។ ម៉ាស៊ីនស្តូតិក ថាមរយ និងជីវបច្ចេកវិទ្យាស្មើភាពត្រូវបានវាយតម្លៃថាអ្វីដែលបានបញ្ជាក់រួច និងអ្វីដែលនៅតែជាការព្យាករណ៍ ដូច្នេះឱ្យមិនមានឱកានណាមួយត្រូវបានលក់លឿន។',
  who_for_en='People who plan ahead, and anyone who finds it hard to tell genuine progress from marketing.',
  who_for_km='អ្នកដែលគ្រោះថ្នាក់មុន និងអ្នកដែលពិបាល់ថាខុសពីចំណាប់ការផ្សាយពិពណ៌នា។',
  tools='["Industry reporting","Manufacturer documentation","News verification","Trial projects"]',
  outcomes='["Describe an emerging technology accurately","Separate proven capability from forecast","Judge whether a trend affects your sector","Avoid committing to technology that is not ready","Plan for a change that is likely, not speculative"]'
WHERE key='future_tech';
