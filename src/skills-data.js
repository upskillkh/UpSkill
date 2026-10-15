// Skills data for UpSkill4Me.
// Audience: a Business Development Manager at Khmer24 in Phnom Penh, Cambodia.
// Language: plain English, short sentences, every term explained with an example.

export const SKILLS = [
  {
    key: "strategic",
    name: "Strategic Thinking",
    description: "Learn to find the real problem behind a business symptom, spot gaps in the Cambodian market, set goals you can measure, and choose where to focus.",
    icon: "S",
    order: 1,
    topics: [
      "Separating symptoms from root causes",
      "Reading the market and finding demand gaps",
      "Setting goals you can actually measure",
      "The art of saying no to low value work",
      "Building an advantage competitors cannot copy",
      "Planning ahead when you cannot predict"
    ]
  },
  {
    key: "sales",
    name: "Sales and Revenue Growth",
    description: "Learn to find buyers who really buy, ask without fear, handle price pushback, manage follow up, build partnerships, and grow revenue from clients you already have.",
    icon: "R",
    order: 2,
    topics: [
      "Finding and qualifying real buyers",
      "Asking for the sale without fear",
      "Handling price pushback",
      "Managing follow up so deals move",
      "Partnerships and channel deals",
      "Growing revenue with renewals, upgrades and pricing"
    ]
  },
  {
    key: "leadership",
    name: "Leadership and Management",
    description: "Learn to set clear expectations, hold useful one-on-ones, give feedback that lands, run short decisive meetings, delegate well, and handle hard conversations.",
    icon: "L",
    order: 3,
    topics: [
      "Setting clear expectations for your team",
      "One-on-ones and real listening",
      "Giving feedback that lands",
      "Running meetings that end in decisions",
      "Delegating without losing control",
      "Handling hard conversations"
    ]
  },
  {
    key: "financial",
    name: "Financial and Data Analysis",
    description: "Learn to read a profit and loss statement, find the true cost of a deal, understand cash flow, build a simple forecast, and use numbers to win arguments.",
    icon: "F",
    order: 4,
    topics: [
      "Reading a profit and loss statement",
      "Unit economics and the true cost of a deal",
      "Cash flow is not the same as profit",
      "Simple forecasting and budgeting",
      "Using numbers to make a case to management",
      "Reading the story behind the numbers"
    ]
  },
  {
    key: "digital",
    name: "Digital and AI Skills",
    description: "Learn how digital business works, how to write content that attracts buyers, how customers find you, how to automate small tasks, and how to use AI safely.",
    icon: "D",
    order: 5,
    topics: [
      "Digital literacy for business decisions",
      "Content and audience basics",
      "Search, social and how customers find you",
      "Automation and simple tools",
      "Using AI safely in real work",
      "Building an AI assisted business workflow"
    ]
  }
];

export const LESSONS = [
  {
    day: 1,
    skill: "strategic",
    title: "Problem Before Solution",
    objective: "By the end of this lesson you will be able to tell the difference between a business symptom and the real root cause behind it.",
    explanation: "A symptom is what you can see. A root cause is what is actually making it happen. If you fix the symptom, the problem usually comes back within a month. If you fix the root cause, it tends to stay fixed. People rush to solutions because solutions feel productive, and asking why five times feels slow, so the rush usually wins. The tool that prevents this is simple and costs ten minutes. Before you propose anything, write down exactly what you observe, then keep asking why until you reach something your team controls. Anything outside your control, such as the economy, a public holiday or a competitor, is normally only a background condition rather than a real cause you can remove.",
    example: "Khmer24 posts job ads for local companies. Last month views were healthy but calls dropped by half. The symptom is few calls. If you rewrite the ad copy and nothing changes, you solved nothing. Ask why. People do not call because they cannot tell if the salary is real. They cannot tell because the ad hides it behind a click. It is hidden because our listing template has no salary field. The root cause is our template, so we fix the template, calls return, and the same lesson now applies to every job category.",
    exercise: "Pick one number that dropped on your dashboard this quarter and write the word why five times in a row, one line each.",
    action: "Open your Khmer24 category report, write down one number that dropped, and list three reasons why.",
    reflection: "When a number drops at work, what do you usually do first?",
    quiz: {
      question: "A property agent says nobody calls about listings because advertising online is expensive. What is the most likely root cause?",
      options: [
        "Online advertising prices went up across Cambodia",
        "The listings have weak photos and the prices are hidden behind a phone call",
        "People stopped buying property in Phnom Penh",
        "The agent should post more listings every week"
      ],
      answer: 1,
      explain: "The complaint names a symptom, while weak photos and hidden pricing are things the agent can actually change."
    }
  },
  {
    day: 2,
    skill: "sales",
    title: "Finding Buyers Who Actually Buy",
    objective: "By the end of this lesson you will be able to build a list of qualified buyers instead of a list of names that never respond.",
    explanation: "A qualified buyer has three things: a real business, a clear problem you can solve, and a person who is allowed to say yes. Missing any one of the three means you are wasting your time. Most teams collect hundreds of phone numbers with no filter, then call, get ignored, and conclude the market is bad. The market is often fine, the list is not. Qualifying takes about five minutes on the phone and saves hours of follow up. Ask what they do today, what it costs them now, and who signs off on spending. In Cambodia many decisions are agreed verbally among friends and family, so the person on the phone is often not the decision maker. Ask for the name of the person who signs, and when.",
    example: "Khmer24 wants to sell job posting packages to clinics in Phnom Penh. A list of two hundred clinics sounds impressive. When you call, most are one doctor with a nurse and nobody has budget for advertising. A qualified list of forty looks smaller and pays more. Each one has more than eight staff, already posts jobs on social media, and the owner answers the phone. You can tell because you asked three questions before offering anything. The hundred and sixty weak names go into a newsletter list for later. The forty strong names go into a calling schedule this week.",
    exercise: "Write down ten real businesses that could buy what you sell, and mark each one against the three qualification checks.",
    action: "Call three of those ten today and ask each one who signs off on spending.",
    reflection: "How long does it usually take you to find out if a contact can actually decide?",
    quiz: {
      question: "Which contact is qualified to buy a full year of Khmer24 advertising?",
      options: [
        "A reader who commented on a Khmer24 post last week",
        "A student collecting article links for a class project",
        "A Phnom Penh car dealership owner who already spends on ads and signs the invoices himself",
        "A company listed in the Khmer24 marketplace with no website and no phone"
      ],
      answer: 2,
      explain: "He has a real business, a clear need for promotion, and the authority to pay, which are all three checks."
    }
  },
  {
    day: 3,
    skill: "leadership",
    title: "Clear Expectations Beat Talent",
    objective: "By the end of this lesson you will be able to turn a vague job description into specific standards a new hire can actually follow.",
    explanation: "An expectation is a clear statement of what good work looks like, agreed before the work starts. Talent without clear expectations becomes expensive noise. In media and marketplace teams this shows up as wildly different results from the same job title. One sales rep books six meetings a week, the next books two, and both believe they are fine. The fix is not motivation. The fix is a number, a deadline and a quality bar written in plain words. Say make ten qualified calls a day, not work hard on leads. Say reply to every employer within two hours during office hours, not be responsive. Clear expectations also protect you, because you can point back to what was agreed instead of arguing about effort.",
    example: "Your marketplace team handles seller onboarding. You wrote a vague goal of handling sellers well. Two months later one agent resolves nine seller complaints a week and the other resolves four, and both get the same rating. You rewrite the standard: first reply within four hours, complaint closed within forty eight hours, and a weekly update sent to every seller even when there is no news. That last one surprises people most, because silence is what sellers complain about first. One month later the numbers move, because everyone knows the standard.",
    exercise: "Pick one role on your team and rewrite its duty list as three measurable standards, with a number in each one.",
    action: "Tell one team member today exactly what good looks like in their job, using a number.",
    reflection: "When a team member keeps surprising you, what were they missing?",
    quiz: {
      question: "Which is the clearest expectation for a Khmer24 sales rep?",
      options: [
        "Be a hard worker and always try your best",
        "Be proactive and think outside the box",
        "Be the best salesperson we have ever seen here",
        "Make ten qualified calls every weekday and log each one before noon"
      ],
      answer: 3,
      explain: "It has a number, a time and a record, so there is nothing left to argue about."
    }
  },
  {
    day: 4,
    skill: "financial",
    title: "Reading a Profit and Loss Statement",
    objective: "By the end of this lesson you will be able to read a profit and loss statement and point out where a business is leaking money.",
    explanation: "The profit and loss statement, often called the P and L, shows what money came in, what money went out, and what was left over. It is organised by time, usually one month, one quarter, or one year. Many business development managers avoid it because it looks like accounting, but it is really a scoreboard for the decisions you make. Look at revenue first, then the largest cost lines, then profit. The story sits in the gap between two lines that should move together. Revenue can rise while profit falls if you bought more advertising to get that revenue. For Khmer24, watch how the sales cost line moves against new signed accounts. A month where sales spend doubles while new accounts only grow by a quarter is the leak to fix.",
    example: "Khmer24 Business plans a package for auto dealers. November revenue is 48,000 USD, up from 40,000 USD, which looks like a win. Then you check the cost lines. Sales commission rose from 4,000 to 9,600 USD, events cost rose from 2,000 to 6,000 USD, and discounts were given on eleven of twenty new contracts. Profit fell from 34,000 to 32,400 USD. Revenue grew by twenty percent and profit went down. The P and L is not boring, it is showing you that growth bought with discounts and events is expensive growth.",
    exercise: "Open your latest monthly report and write down revenue, your largest single cost, and profit for the last three months.",
    action: "Ask finance for one monthly P and L and circle the line where costs grow faster than revenue.",
    reflection: "If revenue rises but profit falls, what would you check first?",
    quiz: {
      question: "A quarter shows revenue up twenty five percent and profit down ten percent. What most likely happened?",
      options: [
        "The company sold more at a lower price with heavy discounts and extra spending",
        "The company lost one very large client",
        "The company fired its best salespeople",
        "Revenue and profit always move in opposite directions"
      ],
      answer: 0,
      explain: "Costs such as discounts and events grew faster than the extra revenue they produced, so profit fell."
    }
  },
  {
    day: 5,
    skill: "digital",
    title: "How Digital Business Actually Works",
    objective: "By the end of this lesson you will be able to explain where a digital sale comes from and which part of that path you control.",
    explanation: "Every online sale passes through the same steps: a person sees something, wants it, trusts it, then acts. Your job is to find where they drop off. For Khmer24 the path might be a reader who sees an article in a Facebook group, trusts Khmer24 because of the byline, then goes to the Jobs category and replies to a listing. Digital is not a separate world from your real work. It is a set of tools for reaching the same customers faster. The most common mistake for a new manager is buying tools first and strategy second. Teams install five apps, then cannot say where a single dollar came back. Start with the customer path, then choose the tool that fixes the weakest step.",
    example: "You are selling advertising to Khmer24 tourism clients. Someone in Siem Reap clicks a Khmer24 article shared in a Telegram group, reads it, and does nothing. Another person reads the same article and books a booth for the Phnom Penh expo. Same traffic, different result. The difference is likely trust and a clear next step. Khmer24 could add a visible author box, one recent client success story, and a single button that starts the enquiry form. Those three changes work on the same traffic. No new platform and no new budget, which is what digital thinking really means.",
    exercise: "Write down the four steps from first contact to signed deal for one product you sell, and mark the step where most people stop.",
    action: "Ask three recent customers how they first heard about Khmer24 and write down their exact words.",
    reflection: "Which part of your sales process can you not see or measure today?",
    quiz: {
      question: "What should a business development manager fix first when digital results are weak?",
      options: [
        "Buy a newer customer management system",
        "Post more often on social media",
        "Hire two more salespeople",
        "Find the step where customers stop, then fix that step"
      ],
      answer: 3,
      explain: "Tools only help once you know which specific step in the customer path is broken."
    }
  },
  {
    day: 6,
    skill: "strategic",
    title: "Reading the Market for a Demand Gap",
    objective: "By the end of this lesson you will be able to spot an unmet need in the Cambodian market by watching what people already pay to work around.",
    explanation: "A demand gap is a job people are trying to do badly, slowly, or with an expensive workaround. You do not need a research budget to find one, you need to watch behaviour. Look at what people pay for, what workarounds they accept, and what questions they ask each other in group chats. In Cambodia demand often hides in plain sight because people solve problems with relationships, cash and patience instead of products. Ask a shop owner how they find a supplier today. If the answer involves three Facebook groups and one friend, that is a gap. A gap worth entering has four signs: many people have the problem, the workaround is painful, they already spend money on it, and they can tell you what a good solution must do. That last one is free product research.",
    example: "Khmer24 covers Auto, Property, Jobs and Business. Look at used car buyers in Phnom Penh. Today they check Facebook groups, ask relatives, and drive to two or three yards in person. Many pay a middleman and still do not know the real history of the car. That is a painful workaround with money already changing hands. A vehicle history check with verified ownership records fits a real gap. Notice the last sign too: buyers happily tell you what a good version must do, for example showing the number of previous owners, photo proof of the odometer, and a Khmer summary they can forward to family.",
    exercise: "Pick one category on Khmer24 and list three workarounds people use today instead of a good product.",
    action: "Talk to one Khmer24 reader today and ask what they currently do to solve a problem the platform does not solve.",
    reflection: "Which pain point at Khmer24 do your customers complain about the most?",
    quiz: {
      question: "Which sign shows a real demand gap worth entering?",
      options: [
        "Many people have the problem and already spend money on a painful workaround",
        "The problem only affects a few large companies",
        "No existing solution exists anywhere in the market",
        "Competitors have not thought about it yet"
      ],
      answer: 0,
      explain: "A gap is proven when people already have the problem and already pay money to work around it badly."
    }
  },
  {
    day: 7,
    skill: "sales",
    title: "Asking Without Fear",
    objective: "By the end of this lesson you will be able to close a conversation with a clear ask instead of trailing off into small talk.",
    explanation: "Most deals in business development die because nobody asked. The seller talks, the buyer nods, everyone is polite, and nothing happens. Fear of sounding pushy keeps the ask inside your head. In Cambodia, where relationships matter a lot, pushing hard is not the answer, but being unclear is worse. Good asking is calm and specific. You state what you did, what you found, and what you suggest next, then you stop talking. The silence after the ask feels long to you and normal to the other person. Prepare three things before every call: one fact that shows you researched them, one idea that helps them, and one clear next step with a date. Practise the ask out loud until it sounds ordinary.",
    example: "You have spoken twice with a Phnom Penh property developer. On the third call you share something you found: their units sell slowly above a certain price point. Then you say the quiet part out loud. Based on what we see in your category, the middle range is where buyers are asking questions, so we could place two sponsored units there next month and measure views and enquiries within three weeks. Can I send the proposal tomorrow afternoon and get your view on Thursday at ten? They say yes to the date. That is an ask, and notice you applied no pressure at all.",
    exercise: "Write your next ask as two sentences, then say it out loud three times until it sounds normal.",
    action: "Send one message today that ends with a specific question and a suggested date.",
    reflection: "What do you say right now instead of making a clear ask?",
    quiz: {
      question: "A warm contact says they are interested but never commits. What is the best next move?",
      options: [
        "Send more information and wait for them to reply",
        "Keep calling every week until they answer",
        "Offer a large discount to create urgency",
        "Ask for one specific next step with a date and time"
      ],
      answer: 3,
      explain: "A clear ask with a date turns polite interest into an action you can plan around."
    }
  },
  {
    day: 8,
    skill: "leadership",
    title: "The Fifteen Minute One-on-One",
    objective: "By the end of this lesson you will be able to run a short one-on-one that builds trust and surfaces problems before they become expensive.",
    explanation: "A one-on-one is a private, regular conversation between you and one team member about their work. It is not a status meeting and it is not a performance review. Fifteen minutes is enough if you use it well. Spend the first five minutes on what is going well, the next seven on what is blocking them, and the last three on what each of you will do. The most valuable part is usually the blocking question, because problems surface early while they are still small. Skipping these conversations is how you end up hearing about a lost account from somebody else. Keep the time consistent, keep it private, and keep your phone away. If you only have ten minutes, do it rather than cancelling, because consistency is what makes people open up.",
    example: "A marketplace account manager tells you in a group meeting that the Auto category feels slow. In her weekly one-on-one two weeks earlier she mentioned that two key sellers had stopped posting. That was the real signal, and because it surfaced early you had already replaced the sellers and offered a free boosted post to keep the category moving. The one-on-one did not fix the category that day. It gave you two weeks of warning, which over a quarter is worth more than any report you can write, and it cost fifteen minutes a week.",
    exercise: "Write three questions you will ask every week in a one-on-one, in the order you will ask them.",
    action: "Book a recurring fifteen minute slot with one team member and ask what is blocking them.",
    reflection: "Do your team members tell you bad news early or late?",
    quiz: {
      question: "What makes a one-on-one useful to a manager?",
      options: [
        "It is a chance to correct everything the person did wrong",
        "It happens at the same time every week, so problems surface early",
        "It replaces all team meetings for the month",
        "It is where new targets are announced"
      ],
      answer: 1,
      explain: "A regular private slot builds trust and gives you warning about problems while they are still small."
    }
  },
  {
    day: 9,
    skill: "financial",
    title: "What One Deal Really Costs",
    objective: "By the end of this lesson you will be able to calculate the true cost of winning a client and decide if the deal is worth signing.",
    explanation: "Unit economics means looking at one single customer or one single deal and asking what you actually keep. Most teams only look at the price, but the price is only the start. Take a first year payment of 2,400 USD for a Khmer24 seller package. Subtract the commission at ten percent, the onboarding work at four hours of staff cost, the support time in month two, the free boosted post you promised, and the payment processing fee. What is left is what you really earned. If the answer is small or negative, no amount of volume will save you, because every new customer makes the problem bigger. Know the number before you celebrate the signature, and change the deal if the number is wrong.",
    example: "A Khmer24 Business plan costs 1,800 USD for six months. Commission at ten percent is 180 USD. Onboarding and training take three hours, about 45 USD at your loaded staff cost. You promise two free boosted posts, which sell for 120 USD each of advertising value. Card and bank processing fees come to about 40 USD. Support tickets in month one average 30 USD. Your real cost is roughly 515 USD, so you keep about 1,285 USD. Now compare it with a 600 USD discount version where onboarding takes six hours. Same team, same effort, far less money left.",
    exercise: "Pick one recent deal, list every cost on top of the price, then calculate what you actually kept.",
    action: "Build a one page cost checklist for your most common Khmer24 package and use it on the next quote.",
    reflection: "Which cost on your deals do you usually forget to count?",
    quiz: {
      question: "A deal looks profitable on price but turns negative once costs are added. What should you do?",
      options: [
        "Sign more clients at the same price to build volume",
        "Offer the same package with free setup to create value",
        "Change the price or the cost structure before signing more",
        "Leave the extra costs out of the report for now"
      ],
      answer: 2,
      explain: "If every deal loses money, more deals only lose more money, faster."
    }
  },
  {
    day: 10,
    skill: "digital",
    title: "Content That Attracts the Right Audience",
    objective: "By the end of this lesson you will be able to write content that solves a specific reader problem instead of describing your own company.",
    explanation: "Content is anything you publish that a reader can find and use, such as an article, a video, a post or a photo set. Strong content does one thing well for one specific group. Weak content talks about the company, the awards and the mission, and the reader has no reason to care. The test is simple. If your content disappeared, would a real person lose something useful? For Khmer24, a story about used car prices in Phnom Penh helps a buyer decide. A story about Khmer24 winning an award helps nobody decide anything. Write for one reader, one moment and one problem. That is how a small media brand builds trust quickly, because readers can tell within seconds whether a page was made for them or for the company.",
    example: "Khmer24 Auto publishes two things in one week. The first is a brand story about the new office. The second is a price guide listing five used car models under 10,000 USD with real asking prices taken from local yards. The price guide gets saved, shared in three Facebook groups, and quoted by two other news sites. The brand story gets polite likes and no enquiries. Same effort, completely different value. If you write for advertisers, the rule is the same. Instead of a company profile page, write about what a Phnom Penh dealership spends to hire one salesperson, using real numbers from your own marketplace data.",
    exercise: "Take your last published piece and rewrite the opening line to speak directly to one reader and their problem.",
    action: "Publish or draft one piece today that answers a question a real customer asked you this month.",
    reflection: "When you last shared content, what did the reader actually get out of it?",
    quiz: {
      question: "Which headline is most likely to bring the right readers to Khmer24?",
      options: [
        "Used car prices in Phnom Penh for March, with real asking prices from five yards",
        "Our journey continues with amazing growth this year",
        "Khmer24 is proud to announce a new partnership",
        "We are the leading platform for business in Cambodia"
      ],
      answer: 0,
      explain: "It names a specific reader, a specific problem and a concrete promise they can check for themselves."
    }
  },
  {
    day: 11,
    skill: "strategic",
    title: "Goals You Can Actually Measure",
    objective: "By the end of this lesson you will be able to write a goal that lets any two people agree on whether it was hit or missed.",
    explanation: "Most goals fail because nobody can judge them. Grow revenue is a direction, not a goal. A real goal needs four parts: a number, a date, an owner, and a reason it is worth that effort. Without the owner nobody is responsible. Without the reason, people optimise the wrong thing. Without the date, the goal quietly disappears in the busy season. The test for a good goal is whether two people looking at the result would reach the same verdict. If your manager and your team member could argue about whether you succeeded, rewrite it. For a business development manager this means connecting activity to outcome, such as twenty five qualified calls a week to reach eight signed advertisers by the end of March, rather than chasing call volume alone.",
    example: "You tell your team to increase advertising sales this quarter. Sales feel pressure, discount hard, and revenue rises. But margins collapse and half the new accounts stop paying after month two. The goal was measurable in the worst way, it hit revenue and missed everything else. Rewrite it like this: sign eight new advertiser accounts by March 31, keep at least six active in month two, keep discounts under fifteen percent, and personally make twenty five qualified calls a week. Now everyone judges it the same way, and a result that only spikes revenue is clearly not a win.",
    exercise: "Rewrite one of your current goals so it includes a number, a date, an owner and a reason.",
    action: "Ask your team to rewrite one shared goal this way and check whether everyone agrees whether it was hit.",
    reflection: "Which of your current goals could two people disagree about?",
    quiz: {
      question: "Which of these is a properly measurable goal?",
      options: [
        "Improve client relationships across the Auto category",
        "Become the best business development manager in Cambodia",
        "Sign eight advertiser accounts by March 31, keep discounts under fifteen percent, and keep six active in month two",
        "Increase revenue as much as possible this year"
      ],
      answer: 2,
      explain: "It has a number, a date, a limit and a retention check, so the verdict is the same for everyone."
    }
  },
  {
    day: 12,
    skill: "sales",
    title: "When They Say the Price Is Too High",
    objective: "By the end of this lesson you will be able to answer a price objection without lowering your price straight away.",
    explanation: "When a buyer says your price is too high, they are usually saying one of three things: they do not yet see the value, they are comparing you with a cheaper option, or they do not have the budget this month. Those need three different answers. Dropping your price only handles the third one, and it damages you every time. Start with a question instead of a defence. What would need to be true for that price to work? What are you comparing it with? What budget did you have in mind? Then answer with evidence rather than adjectives. Show how many qualified leads a similar client got last quarter, what each enquiry cost, and the total for six months. Price is far easier to accept when the buyer can calculate the return.",
    example: "A Siem Reap hotel group says your 2,400 USD package is too expensive. If you drop to 1,200 USD you earn less and they still feel it. Instead you ask what they are comparing it with, and they mention two Facebook boosts. You show the numbers: similar hotels in your category spent 600 USD on boosts and averaged nine enquiries, while the package produced thirty one qualified enquiries for the same money. You offer a staged option, three months at 1,100 USD first, then decide. They take the first stage, the price stayed intact and the risk moved down.",
    exercise: "Write the three questions you will ask the next time someone says the price is too high.",
    action: "Build a one page proof sheet with results from three similar clients that you can show on a call.",
    reflection: "Do you drop price quickly whenever a deal feels stuck?",
    quiz: {
      question: "A client says your price is too high. What is the strongest first response?",
      options: [
        "Ask what they are comparing your price with, then show evidence of what similar clients received",
        "Agree quickly and offer fifteen percent off",
        "Send a longer brochure with more features listed",
        "Repeat the price firmly and end the call"
      ],
      answer: 0,
      explain: "Finding the real comparison lets you answer with results instead of cutting into your own margin."
    }
  },
  {
    day: 13,
    skill: "leadership",
    title: "Feedback That Does Not Hurt Feelings",
    objective: "By the end of this lesson you will be able to give clear corrective feedback while keeping trust and the relationship intact.",
    explanation: "Feedback fails in two ways. It fails when it is soft and sounds like a compliment with a complaint hidden inside, because nobody knows what to change. It fails when it is harsh and attacks the person instead of the work, because the person defends themselves instead of listening. The reliable middle path has four steps: say the specific thing you observed, say the effect it had, say what you want instead, then ask for their view. Order matters, so describe before you judge. A Cambodian team context makes this more important, not less, because saving face is real. Give the hard part of the feedback in private, and let the good part be repeated by other people instead of by you.",
    example: "One of your seller support agents replies to employers after two days. Private and specific, you say the Tuesday reply for a Choam Pich appliance shop arrived on Thursday, the employer had already hired through a Facebook group, and you lost the placement fee. Next time, first reply within four hours even if it is only to say we are checking. What got in the way? She explains that the employer kept calling while she was handling a landlord complaint about an apartment listing. Now the real problem is visible: two queues competing for one agent, which you would never have found through a soft comment.",
    exercise: "Write one piece of feedback you have been avoiding, using the four step structure.",
    action: "Give one piece of specific private feedback today, starting with what you observed.",
    reflection: "When somebody gives you feedback, do you argue first or ask questions first?",
    quiz: {
      question: "Which opening is the strongest start to corrective feedback?",
      options: [
        "You never follow up with clients, and everybody can see it",
        "People think you are slow, so please work faster",
        "The Tuesday reply to the appliance shop arrived on Thursday and we lost the fee",
        "You need to be more of a team player around here"
      ],
      answer: 2,
      explain: "It states what happened and the effect without attacking the person, so the other person can act on it."
    }
  },
  {
    day: 14,
    skill: "financial",
    title: "Profit Is Not Cash",
    objective: "By the end of this lesson you will be able to explain why a business can show a profit and still run out of money.",
    explanation: "Profit is an accounting number. Cash is what is actually in the bank today. They differ for simple reasons. If a client pays you in sixty days, you have made a sale and recorded a profit, but the money has not arrived. If you pay a supplier upfront for a year of hosting or a season of events, your cash leaves today while the cost is spread over the year. Growing fast makes this worse, because every new client adds work before it adds money. The number that keeps you safe is called cash flow, which is simply money moving in minus money moving out over a period. For a business development manager the practical lesson is to know the payment terms on every deal, because the invoice date and the money date are not the same thing.",
    example: "Khmer24 Business sells a twelve month package at 2,400 USD in two instalments. Finance confirms the sale in March and books the full 2,400 USD as March revenue, so March profit looks strong. But the client pays the first half now and the second half in July, and processing fees come out first. Meanwhile you owe the event supplier for a launch in April that clients paid for in March. The bank account is tight in April even though the report says you had a good quarter. A profitable quarter and a stressful month can be the same company.",
    exercise: "Pick your biggest open deal and write down the invoice date, the expected payment date and the amount.",
    action: "Ask finance for your current bank balance and your unpaid invoice total, and write both numbers down.",
    reflection: "How long do your clients take to pay, and does anyone actually track it?",
    quiz: {
      question: "Why can a profitable month still end with no cash in the bank?",
      options: [
        "Because profit is calculated by the accountant and not by the bank",
        "Because invoices were issued but clients have not paid yet, while bills are already due",
        "Because banks in Cambodia hold profit for several months",
        "Because profit is always smaller than cash"
      ],
      answer: 1,
      explain: "Recording a sale does not move money, so unpaid invoices plus early bills can empty the account."
    }
  },
  {
    day: 15,
    skill: "digital",
    title: "How Customers Find You Online",
    objective: "By the end of this lesson you will be able to name the three ways a Cambodian customer finds a business and check where you appear in each one.",
    explanation: "Customers arrive from search, from social, or from recommendations. Search happens when someone already knows what they need and types it, for example jobs in Phnom Penh or used cars under ten thousand dollars. Social happens when someone is scrolling and something catches their eye. Recommendation happens when a friend, a group chat or a colleague tells them. Each one behaves differently, and most small businesses are strong in only one. Search takes time but brings ready buyers. Social is fast but brings curious people. Recommendations carry the highest trust and the slowest scale. Your job is to know which one produces paying customers, because that decides where you put your time and your budget instead of following whichever platform is loudest this month.",
    example: "You are selling exhibition booths for a Phnom Penh trade expo. One advertiser finds you through a Facebook group post and books in two days. Another finds you through a search for expo packages four months later and books without a single call. A third hears about you from a supplier and waits a year before buying. All three are valuable, but they behave differently and cost different amounts. If you only ever post, you win the first type. If you write the page that answers the search question with real prices, you win the second type, which usually has the highest intent to buy.",
    exercise: "Search your main product keyword on your phone and note what appears first and whether Khmer24 is there.",
    action: "Ask your last ten customers to name the exact place they first found you, and count the answers.",
    reflection: "Which channel brings paying customers, not just page views?",
    quiz: {
      question: "Where does a person looking for used cars in Phnom Penh most likely start?",
      options: [
        "A search for used cars in Phnom Penh, because they already know what they want",
        "A random scroll through a social feed with no idea what they need",
        "A recommendation from a friend who bought a car last year",
        "Your company profile page"
      ],
      answer: 0,
      explain: "Searching is driven by intent, so the person already has a need and is ready to compare options."
    }
  },
  {
    day: 16,
    skill: "strategic",
    title: "The Art of Saying No",
    objective: "By the end of this lesson you will be able to say no to a request using a script that protects the relationship and your time.",
    explanation: "Every yes costs something: time, focus, and often money. A business development manager who says yes to everything ends the quarter with nothing finished and every promise late. Saying no is not rude. Refusing without a reason or an alternative is rude. The useful pattern has three parts: thank them clearly, name your constraint honestly, and offer one thing you can do instead. For example, you cannot take on a new event in April because your team is committed, but you can send a media partner list or reserve space in a later month. Notice that the constraint is about capacity, not about the person. In Cambodia a warm no followed by a real alternative is usually respected, while a silent yes is not, because it becomes a broken promise later.",
    example: "A Phnom Penh bank asks Khmer24 to cover a free financial literacy workshop on a Saturday plus ten branded posts. You say yes because refusing a bank feels risky, then your advertiser commitments slip. A better answer is a warm no with a real option. Thank you, this is a good topic for our readers and we would be glad to support it. Our newsroom is fully booked that weekend, so I can offer two things instead: a written interview with your expert published in our Business section, and a free booth at our next SME expo. They said yes to the interview, the relationship improved and your Saturday stayed protected.",
    exercise: "Write your own three part no script using thank you, the real constraint, and one alternative.",
    action: "Say no to one low value request today using your script.",
    reflection: "What are you saying yes to right now that you should be declining?",
    quiz: {
      question: "Which response is the best way to decline a request?",
      options: [
        "No, we are too busy, so please stop asking",
        "Maybe, possibly, we will see what happens",
        "Thank you, our team is committed that week, but I can send an interview or hold a booth at the next expo",
        "Yes to everything now, then cancel the smaller commitment later"
      ],
      answer: 2,
      explain: "It thanks the person, names a real constraint and offers a concrete alternative."
    }
  },
  {
    day: 17,
    skill: "sales",
    title: "The Follow-Up Most People Skip",
    objective: "By the end of this lesson you will be able to run a follow-up sequence that keeps deals moving without sounding pushy.",
    explanation: "Most deals are not lost in the first conversation. They are lost in the quiet space afterwards, where nobody has scheduled an action. A follow-up is not asking whether they are still interested. It is adding new value each time so the other person has a reason to reply. A good sequence mixes three kinds of contact: something useful, such as a relevant number or a case from your category, something specific to them, such as a competitor listing in their area, and a simple check-in with a proposed date. Three to five touches over two or three weeks is usually enough. Keep each touch short, under about six lines. If you cannot name the value a follow-up brings, it is not a follow-up, it is a reminder to pay attention to you.",
    example: "You met a property agent, Sopheak, in early March and nothing happened. Instead of asking for a decision, your first follow-up is a page link showing three apartment listings in her target area that gained views last week. The second follow-up is a short note that a similar agent in Tuol Keng had three enquiries after listing two units in the same week. The third asks whether she wants her listings moved to the top of the Property page for April, and offers Thursday. She replies on Wednesday with a question about cost. The deal was never cold, it was waiting for a reason to continue.",
    exercise: "Write a four message follow-up sequence for one real deal, with a different value in each message.",
    action: "Send the first follow-up message today for a deal that has gone quiet.",
    reflection: "How many times do you currently follow up before giving up?",
    quiz: {
      question: "What makes a follow-up message worth reading?",
      options: [
        "It asks five separate questions in one message",
        "It is long and explains the history of your company",
        "It repeats the price you already sent last week",
        "It is short and adds something useful or specific to the recipient"
      ],
      answer: 3,
      explain: "New value gives the other person a reason to reply, while repetition gives them none."
    }
  },
  {
    day: 18,
    skill: "leadership",
    title: "Meetings That End With Decisions",
    objective: "By the end of this lesson you will be able to run a short meeting that produces named owners and deadlines before everyone leaves.",
    explanation: "A meeting is expensive because it takes several paid hours of several people at the same time. If it ends without a decision, an owner and a date, it was not a meeting, it was an announcement. The fix is simple and works well for busy Cambodian teams. Send an agenda one day ahead with three items and a time limit for each. Read it out at the start so nobody is surprised. Keep discussion on the current item, not on who was not invited. Write the decisions live where everyone can see them. Close every item with two things: who does what, and by when. If a topic will not finish in its time, park it in a list with a named owner instead of running over. Fifteen minutes of clarity beats sixty minutes of noise.",
    example: "You call a meeting about the Property category dropping for three weeks. You send an agenda with three items: the drop in enquiries, two competitor listings that outrank yours, and what changes this week. In the meeting the editor explains that enquiries come mostly from the Friday roundup, and the reporter who wrote it moved to another team. You stop there. Decision: the Friday roundup gets a named owner and a backup starting next week, the Property page gets a top listing slot for two test units, and you review the numbers in fourteen days. Everyone left knowing what to do before lunch.",
    exercise: "Write an agenda for your next meeting with three items, a time limit for each, and the decision needed.",
    action: "Send an agenda before your next team meeting and close it with owners and dates.",
    reflection: "When was the last meeting you attended, and what decision came out of it?",
    quiz: {
      question: "What is the minimum a business meeting must produce?",
      options: [
        "A written summary of everybody's opinion",
        "New ideas to explore next quarter",
        "A decision, a named owner and a deadline",
        "Full attendance from every team member"
      ],
      answer: 2,
      explain: "Without an owner and a date, nothing changes and the meeting only costs time."
    }
  },
  {
    day: 19,
    skill: "financial",
    title: "A Simple Forecast You Can Build",
    objective: "By the end of this lesson you will be able to build a three month revenue and cash forecast using your own past numbers.",
    explanation: "A forecast is a simple statement of what you expect to happen, based on what already happened. It is not complicated and it does not need special software. Start from your last three months of real numbers. Take the best month and write it as your target month. Then adjust for things you already know, such as a public holiday week, a contract that ended, a new advertiser that just signed, or a season when Auto enquiries always drop. Add your committed deals first, because they are the most reliable line. Keep two versions, one cautious and one optimistic, and write down why they differ. Review the forecast every month and note which assumption was wrong. The value of a forecast is not being right, it is finding out early that you were going to be wrong.",
    example: "Khmer24 Business signed 9,600 USD in new annual contracts last month and you forecast 12,000 USD this month. You start from last month and add what is already signed, 7,200 USD of confirmed deals, then add two renewals you expect but have not confirmed, 3,000 USD. You know April has a national holiday week with fewer working days, so you cut five percent. You write your assumption in one line: renewals land at eighty percent of last month. In three weeks the first renewal says no, and you see it immediately instead of discovering it in April when the cash is already committed.",
    exercise: "Write a three month forecast for your category using the last three months of real numbers as your base.",
    action: "Put a forecast review in your calendar for the same day each month and note which assumption was wrong.",
    reflection: "What did you assume this month that you have not checked with anyone?",
    quiz: {
      question: "What is the main purpose of a simple forecast?",
      options: [
        "To predict the future exactly and never be wrong",
        "To show early that your assumptions do not match reality, so you can adjust",
        "To replace your monthly sales report",
        "To decide which team members to promote"
      ],
      answer: 1,
      explain: "A forecast earns its value when you review it and correct the assumptions before money is committed."
    }
  },
  {
    day: 20,
    skill: "digital",
    title: "Automating Small Annoying Tasks",
    objective: "By the end of this lesson you will be able to pick one repetitive task, write it as steps, and hand it to a simple tool safely.",
    explanation: "Automation means letting a tool do a repetitive step you have already written down clearly. The rule is simple: never automate an unclear process, because you will only make the confusion faster. Start with the boring tasks that eat your week, such as copying lead details into a sheet, renaming photos, sending the same reminder to every seller, or posting one news update to several channels. Write each task as numbered steps first, including what to do when something is unusual. Then pick a no code tool that does that specific thing, where no code means you do not need to write computer code yourself. Test it on ten records before you trust it with a hundred, and keep a human check on anything that reaches a paying customer.",
    example: "Every Monday you copy new employer details from a form into a shared sheet, then send each one a welcome message. That is four hours a week for a task with no decisions in it. You write the steps: check the response is complete, add the company to the employer sheet, check for a duplicate phone number, send the welcome template, mark it done. You set up a simple automation for the sheet update and the duplicate check, and keep the message step manual for now because replies come back to you. You get back about three hours a week and nothing has gone wrong in a paying account.",
    exercise: "List three repetitive tasks you did last week and write the numbered steps for the smallest one.",
    action: "Automate or template one small task today and check ten records before you trust it fully.",
    reflection: "Which task in your week would you happily never do by hand again?",
    quiz: {
      question: "What should you always do before automating a task?",
      options: [
        "Buy the most expensive tool available",
        "Ask your team to do the same task faster by hand",
        "Automate it first and fix the problems as they appear",
        "Write the task as clear numbered steps, including what to do when something is unusual"
      ],
      answer: 3,
      explain: "Tools follow instructions exactly, so unclear steps produce unclear mistakes at high speed."
    }
  },
  {
    day: 21,
    skill: "strategic",
    title: "Building an Advantage Competitors Cannot Copy",
    objective: "By the end of this lesson you will be able to identify what makes your offer harder to copy than a competitor version of the same offer.",
    explanation: "A competitive advantage is something that makes buyers choose you and is hard for a competitor to copy quickly. Price is the weakest advantage, because anyone can match it tomorrow and then you both earn less. Stronger advantages come from four places: local knowledge a foreign competitor lacks, relationships that take years to build, data nobody else has, and speed of execution. You only need one, but you must be honest about whether it is real. Khmer24 has an advantage in Khmer language reach and local trust that a large international news brand cannot buy quickly. The test is simple: if a well funded competitor decided to copy you next month, what would actually stop them? If you cannot answer that, you do not have an advantage yet.",
    example: "Two media companies in Phnom Penh sell sponsored listings to auto dealers. Both charge similar prices, so dealers compare them and choose on price alone. Now consider the angle on data. Khmer24 can show a dealer how many people viewed listings in their district last month, how many saved a phone number, and which models buyers asked for most. That is not on any billboard and a competitor cannot invent it overnight. The dealer is no longer buying space, the dealer is buying proof of demand, and that report is defensible because building it takes years of traffic and careful tracking.",
    exercise: "Write down three things a competitor cannot copy from you on day one, and rate how strong each one is.",
    action: "Produce one small piece of exclusive proof this week that only Khmer24 can give.",
    reflection: "If a well funded competitor copied your offer tomorrow, what would still be yours?",
    quiz: {
      question: "Which of these is the strongest competitive advantage?",
      options: [
        "Being the cheapest option in the market",
        "Having local knowledge and data that a larger competitor cannot copy quickly",
        "Offering exactly the same service as everybody else",
        "Changing your logo and your colour scheme"
      ],
      answer: 1,
      explain: "Hard to copy assets protect your price and your buyers, while price matching only protects you until somebody undercuts you."
    }
  },
  {
    day: 22,
    skill: "sales",
    title: "Partnerships That Pay Both Sides",
    objective: "By the end of this lesson you will be able to structure a partnership proposal that gives the other side a clear reason to say yes.",
    explanation: "A partnership is an arrangement where two businesses share something valuable and both sides gain. Unlike selling, where you benefit and the buyer pays, a partnership must make sense for the other party before anything else. If you cannot state their benefit in one sentence, you do not have a partnership, you have a favour request. Strong partnerships for a media brand usually come from shared audience, shared cost or shared credibility. An auto association already has dealer members. A bank already has customers. An expo already has footfall. You bring audience, content and coverage. Structure it simply: who brings what, who pays what, how results are measured, and when you review together. Start small, prove it in one cycle, then grow it.",
    example: "A motorcycle association in Phnom Penh has two hundred members and no way to contact them all. Khmer24 wants advertising buyers in the Auto category. You propose a six month arrangement where the association allows Khmer24 to send a weekly Jobs and Auto newsletter to its members, Khmer24 publishes one member profile each month, and the association places one branded banner in its own group chat. Both sides give audience and content, both sides get visibility, and you agree to review results at month three using opens, clicks and enquiries. Month one produced forty new subscribers and two enquiries for a dealership sponsor.",
    exercise: "Pick one partner you already work with and write their benefit in one sentence before you ask for anything.",
    action: "Write a one page partnership proposal covering what each side gives and how success is measured.",
    reflection: "Which organisations already share your audience but not yet your revenue?",
    quiz: {
      question: "What is the test of a real partnership proposal?",
      options: [
        "It gives you the most benefit out of everyone involved",
        "It clearly explains what the other side gains, what you give, and how results are measured",
        "It can be signed without a single discussion",
        "It costs you nothing to deliver"
      ],
      answer: 1,
      explain: "Both sides must see a clear gain, otherwise it is just a request dressed up as a partnership."
    }
  },
  {
    day: 23,
    skill: "leadership",
    title: "Delegating Without Losing Control",
    objective: "By the end of this lesson you will be able to hand a task to someone else with clear ownership, a check-in point and a clear result.",
    explanation: "Delegating is not disappearing. It means deciding what you keep and what you hand over, then being explicit about both. Most managers delegate badly in one of two ways: they give a vague task and then complain the result is wrong, or they take the task back the moment it gets hard. Both cost you time and teach the team that your trust is not real. A clean handover has four parts: the result you want, the deadline, the decisions they may make alone, and the check-in date you set yourself. Choose the check-in date before you hand it over, not after the deadline passes. Then do not quietly redo the work. If you disagree, say so with the reason, the same way you would want to be corrected.",
    example: "You hand the seller support inbox to a new team member. Instead of saying handle support, you write it down. Goal: replies within four hours during office hours. Deadline: from this Monday onwards. You decide anything under 500 USD and any complaint about listing quality. I decide refunds, anything above 500 USD, and anything that threatens legal action. Check-in: fifteen minutes every Friday. In week two he wrongly approved a refund because a landlord was shouting. You do not take the inbox back. You point at the written line, move his threshold down to 200 USD, and ask how he wants to handle angry landlords in future.",
    exercise: "Write a four part handover for one task you want to give away this week.",
    action: "Delegate one real task today and set the check-in date before you hand it over.",
    reflection: "Which task are you still holding that one of your team members could own?",
    quiz: {
      question: "What should you set yourself before delegating a task?",
      options: [
        "A check-in date and a clear boundary on which decisions they may make alone",
        "A quiet test to see whether they are ready",
        "A list of everything you will still do yourself",
        "A promise to review the result at the end of the quarter"
      ],
      answer: 0,
      explain: "Clear boundaries and a scheduled check-in keep ownership with the person while you stay in control."
    }
  },
  {
    day: 24,
    skill: "financial",
    title: "Making the Numbers Prove Your Point",
    objective: "By the end of this lesson you will be able to present a business case using three numbers a manager can act on.",
    explanation: "You will often believe something is right before you can prove it. A manager who likes numbers needs a short structure, not a long explanation. Use three numbers. First, the size of the problem in money, for example forty eight percent of employer enquiries get no reply within a day. Second, the cost of the problem, which is how many enquiries become lost deals each month and what that is worth. Third, the cost of the fix and what it returns. Keep it to one page. Use a simple table showing the current number, the proposed change and the expected result. Say clearly what you are unsure about. Managers trust people who flag their own assumptions, and they rarely trust the person who sounds certain about everything.",
    example: "You believe a reply speed rule would save advertiser deals. You do not tell your director the team is too slow. You put one page on the table. Today forty eight percent of employer enquiries get a first reply later than twenty four hours, and last month twelve of thirty lost enquiries mentioned speed as the reason. At a typical package value of 1,800 USD, that is 21,600 USD of new business that never started. The fix is a four hour reply rule with one named owner per day, costing about two staff hours daily. The ask is a two week trial and a review on the numbers.",
    exercise: "Turn one of your opinions into a one page case with a problem number, a cost number and an expected return.",
    action: "Present a three number business case to your manager this week.",
    reflection: "Which decision are you waiting for that you have never put a number against?",
    quiz: {
      question: "What is the strongest way to present a business case to a manager?",
      options: [
        "Explain the idea in detail and hope the explanation convinces them",
        "Show the problem in money, the cost of doing nothing, and the expected return of the fix",
        "Send your recommendation first and the numbers later if asked",
        "Wait until the results are in so nobody can question the assumptions"
      ],
      answer: 1,
      explain: "Managers decide on size of impact and return, not on how enthusiastic the explanation sounds."
    }
  },
  {
    day: 25,
    skill: "digital",
    title: "Using AI Without Creating Risk",
    objective: "By the end of this lesson you will be able to use AI tools for real work while protecting company data and your professional reputation.",
    explanation: "AI tools are software that predicts text, images or code from instructions you give them. They are fast, they never get tired, and they are confidently wrong sometimes. That last point is the whole risk. The safe way to use them is with a clear boundary. Never paste customer personal data, phone numbers, contract details or anything under a client agreement into a public tool. Never publish AI output without reading it, because invented facts and strange Khmer phrasing travel very fast in a news context. Use AI for first drafts, summaries, short rewrites, headline options and structure. Keep a human as the final editor, and remember you are accountable for every word published under Khmer24. If you would not put your own name on it, do not publish it.",
    example: "A reporter hands you three Khmer draft summaries of a council meeting and asks for help tightening the opening paragraphs. This is safe use, because the text is already public information and a person reviews the final version. The opposite case is pasting an advertiser contract with pricing into a free public tool to summarise it. That leaks client terms and you cannot verify what happens to the text afterwards. Khmer24 can set a simple team rule for both cases, which takes one line, and it turns a vague worry into something people can actually follow.",
    exercise: "Take one real task you do weekly and write a short instruction for AI that produces a first version you then edit.",
    action: "Set a simple team rule today that no client personal data goes into any public AI tool.",
    reflection: "What would you be uncomfortable seeing published in your own name?",
    quiz: {
      question: "What is the safest way to use AI in a Khmer24 newsroom?",
      options: [
        "Publish any AI draft directly to save time",
        "Send client contracts to a free public tool so they can be summarised faster",
        "Use AI for a first draft, then check facts and language yourself before publishing",
        "Let AI fill in figures when the original source is missing"
      ],
      answer: 2,
      explain: "AI speeds up the first pass, but a named person still has to check accuracy and meaning."
    }
  },
  {
    day: 26,
    skill: "strategic",
    title: "Planning When You Cannot Predict",
    objective: "By the end of this lesson you will be able to prepare two different plans so your team still knows what to do when things change.",
    explanation: "Uncertainty is normal in Cambodia. Fuel prices move, approval timelines shift, tourism seasons change, and an advertiser can pull a campaign in a single week. Waiting for a perfect forecast means waiting forever. A better tool is two plans. Write plan A, which is what you do if things go roughly as expected, and plan B, which is what you do if revenue falls or a key client leaves. Keep both short, one page each, with the trigger that switches you from A to B written at the top. Triggers are numbers rather than feelings, for example two months of new signings below eight, or a category losing more than twenty percent of views. Then decide in advance what you cut first and what you protect.",
    example: "You are building a Khmer24 Auto campaign with three advertisers. Plan A assumes all three sign and you run two events in the second quarter. Plan B assumes one pulls out after the first month, and the trigger at the top says if signed Auto revenue in any month falls below 4,000 USD we switch. Under plan B you postpone the second event to keep the cash, you move the two remaining advertisers into a bundled package, and you protect the reporter assigned to Auto because that coverage feeds three categories. When an advertiser pulls out in March, nobody panics.",
    exercise: "Write plan A and plan B for one project, with the number that switches you between them.",
    action: "Write a one page plan B for your biggest current project and share it with your team.",
    reflection: "What is the first thing you would cut if revenue dropped thirty percent?",
    quiz: {
      question: "What makes a plan B actually useful?",
      options: [
        "It is written in detail and approved by management",
        "It is kept private from the team to avoid confusion",
        "It assumes revenue will fall by half next quarter",
        "It has a clear numeric trigger and named actions decided in advance"
      ],
      answer: 3,
      explain: "A trigger plus prepared actions lets the team switch calmly instead of deciding under pressure."
    }
  },
  {
    day: 27,
    skill: "sales",
    title: "Growing Revenue Without More Sales Calls",
    objective: "By the end of this lesson you will be able to raise revenue from existing clients using renewals, upgrades and a price review.",
    explanation: "New business is the slowest and most expensive way to grow. It takes a pitch, a negotiation, a contract and onboarding before anybody pays. Revenue you already have is faster and cheaper to increase. Three moves do most of the work. Renew on time, because a client who quietly lapses is the same as losing them. Upgrade by showing the client what they are not using. Review price, because in a growing market a price from two years ago is often too low for the work you now do. All three need the same preparation: a usage report, one result you can prove, and a single clear proposal. Do this on a schedule, such as every ninety days, so it feels like a normal business rhythm and not an awkward surprise.",
    example: "Your best client signed a 1,800 USD package eighteen months ago and renews quietly every year without discussion. Their team grew from four people to twenty, but they still use the smallest tier. You pull their usage report and see they have 60 unused listing credits. Your one page proposal is a renewal at the current price plus a move to the larger tier, which saves them about fifteen percent per hire compared with buying separately. They upgrade, you keep the relationship, and neither side starts a negotiation from zero.",
    exercise: "List your top ten existing clients and mark each one for renewal date, unused features and last price review.",
    action: "Send one upgrade or renewal proposal today using real usage numbers.",
    reflection: "Which of your current clients have not heard from you in three months?",
    quiz: {
      question: "Which action usually grows revenue fastest inside an existing account?",
      options: [
        "Finding ten new cold leads every single week",
        "Sending a price increase letter with no notice at all",
        "Showing the client what they are not using and proposing an upgrade at renewal",
        "Cancelling low value clients to protect the brand"
      ],
      answer: 2,
      explain: "The client already trusts you, so a proven upgrade converts faster and cheaper than a new sale."
    }
  },
  {
    day: 28,
    skill: "leadership",
    title: "The Hard Conversations You Avoid",
    objective: "By the end of this lesson you will be able to prepare and hold a difficult conversation about performance or behaviour.",
    explanation: "Every manager has a conversation they keep postponing: the one about a repeated mistake, an attitude problem, or a role that is no longer right. Delay protects nobody. It costs you the respect of the team and it usually costs the other person more, because the issue grows. Preparation makes the conversation survivable. Write down three things: what happened, what effect it had on the team or the business, and what you need to change. Choose a private setting and a calm time, never Monday morning after a crisis and never in front of peers. State the facts without story. Then stop talking and let the person respond. The goal is not to win. The goal is to leave the room with a clear agreement and a date to review it.",
    example: "One seller support agent has been replying late for three weeks running and two advertisers have complained. You have avoided it for two weeks. You book thirty minutes on a Wednesday afternoon and you say the facts. Between the second and fourth weeks, eleven employer messages waited more than a day, and two advertisers told us speed was the reason they stopped renewing. From Monday I need first replies within four hours. I am giving you the morning enquiries only, and the new agent takes afternoons for two weeks. He says he did not realise the volume had tripled since the colleague above him left.",
    exercise: "Write the three notes you need for the conversation you have been avoiding most.",
    action: "Book and hold one difficult conversation this week, starting with facts only.",
    reflection: "Which conversation has cost you more by waiting?",
    quiz: {
      question: "What is the best structure for a hard conversation with a team member?",
      options: [
        "State the specific facts, the effect, and the change you need, then listen",
        "Wait for them to fail again so your case is stronger",
        "Start with your story about how they always let the team down",
        "Discuss it in the group meeting so everyone sees the problem"
      ],
      answer: 0,
      explain: "Facts plus a clear request keep the conversation fair and give the person room to explain what is really happening."
    }
  },
  {
    day: 29,
    skill: "financial",
    title: "Reading the Story Behind the Numbers",
    objective: "By the end of this lesson you will be able to look past a number that looks good and find what is actually causing it.",
    explanation: "Numbers always need a story. Something caused them, and the cause is usually visible if you look at the line above and the line below. Three habits make you faster. Compare against last year, not only last month, because some months are simply different by season. Look at ratios instead of raw numbers, such as revenue per account, cost per enquiry or average order value, because ratios stay meaningful while a business grows. And check whether one unusual deal is hiding a general problem. If revenue jumped because of a single tourism sponsor, that is not growth, that is one lucky contract. A business development manager who understands the story can warn the team early and can explain to management why a number should or should not be trusted.",
    example: "Your Business category revenue rose eighteen percent this month and the team is celebrating. Before you report it, you check the ratio. New accounts grew nine, but the average value per account fell by a third, and the jump was created by one 6,000 USD tourism sponsor signed for a single event. Underneath, the real business is slightly weaker than last month. You report the eighteen percent because it is true, but you also report the falling average value and the one off contract, so your director does not plan next quarter on numbers that will not repeat.",
    exercise: "Take one good number from your report, write down two possible causes, then check which one the data supports.",
    action: "Add one ratio to your monthly report, such as revenue per advertiser account.",
    reflection: "Which number in your last report did you celebrate without asking why?",
    quiz: {
      question: "Revenue jumps because of one large tourism sponsor. How should you read it?",
      options: [
        "The business is now growing steadily and should plan around it",
        "It is one lucky contract, so check whether the underlying trend also improved",
        "All revenue should be counted equally across advertisers",
        "The sponsor should be asked to renew for twelve months immediately"
      ],
      answer: 1,
      explain: "A single large contract can hide an unchanged trend, so you check the normal business underneath it."
    }
  },
  {
    day: 30,
    skill: "digital",
    title: "Building an AI Assisted Business Workflow",
    objective: "By the end of this lesson you will be able to design one repeatable workflow where AI, your data and your team work together on a real business task.",
    explanation: "Over thirty days you have learned to find the real problem, sell properly, lead clearly, read the numbers and use digital tools carefully. The final step is putting them together so the work repeats without you. A workflow is just the same sequence written down and handed to the right tools. Good candidates are tasks that happen every week, take more than an hour and follow rules. For business development that could be new lead capture, qualification notes, follow-up reminders and a weekly summary. Write the steps, choose where AI drafts and where a human decides, set the check that stops bad data getting through, and measure one number each cycle. Start small, run it four weeks, then improve it.",
    example: "At Khmer24 you build one advertiser pipeline. A lead arrives through a form or a phone call and the details go into one sheet. AI drafts a short qualification note from the notes you typed, using three fixed questions about budget, timing and decision maker. If any answer is missing, the lead is flagged for a human call. You get an automatic reminder on day two and day seven if there is no reply. Every Friday, AI drafts a one page summary of new signings, lost deals and reasons. You review it in ten minutes and send it to the director.",
    exercise: "Pick one weekly business development task, write its steps, and mark which steps AI can draft and which must stay human.",
    action: "Build a first version of that workflow this week and run it on ten real records before trusting it.",
    reflection: "Which part of your weekly work would you like to never do by hand again, and what should stay human?",
    quiz: {
      question: "What makes a business workflow worth building?",
      options: [
        "It uses the most advanced AI tools available",
        "It removes as many staff as possible straight away",
        "It is fully automatic with no human involvement at all",
        "It runs every week, takes real time, follows clear rules, and has a human check before anything reaches a customer"
      ],
      answer: 3,
      explain: "Repetition, real time and clear rules make automation worthwhile, and the human check protects the customer."
    }
  }
];

export const ASSIGNMENTS = [
  {
    id: "strategic-1",
    skill: "strategic",
    title: "Root Cause Audit of One Number",
    prompt: "Pick one number on your dashboard that moved in the wrong direction and trace it back to a cause your team can actually change.",
    steps: [
      "Choose one number that dropped or missed target in the last ninety days.",
      "Write what you observe, then ask why five times, one line for each why.",
      "Mark the first reason in your list that your team has the power to change.",
      "Write one small change you will test within two weeks, with an owner and a date."
    ],
    evidence: "A one page note with the five whys, the root cause you identified, and the test you will run with its date."
  },
  {
    id: "strategic-2",
    skill: "strategic",
    title: "Two Plan Focus Sheet",
    prompt: "Prepare plan A and plan B for one Khmer24 project so your team knows exactly what to do if revenue changes.",
    steps: [
      "Choose one project with a real budget, a real deadline and named people.",
      "Write plan A on one page with expected numbers, owners and key dates.",
      "Write plan B for a thirty percent revenue drop, including what you cut and what you protect.",
      "Put the numeric trigger at the top of plan B and share both plans with your team."
    ],
    evidence: "Both one page plans, the trigger you wrote at the top of plan B, and a short note from the person you shared them with."
  },
  {
    id: "sales-1",
    skill: "sales",
    title: "Twenty Qualified Leads",
    prompt: "Build a list of twenty real prospects who pass three qualification checks, then contact the first five.",
    steps: [
      "Write twenty real businesses that could buy what you sell.",
      "Mark each one for real business, clear problem, and access to the decision maker.",
      "Score each one A, B or C and keep only the A list for this month.",
      "Call the first five and record the decision maker name and any budget signal."
    ],
    evidence: "A sheet with twenty names, their qualification marks and scores, plus call notes for the first five."
  },
  {
    id: "sales-2",
    skill: "sales",
    title: "Price Objection Playbook",
    prompt: "Build a one page response you can use the next time a client says your price is too high.",
    steps: [
      "Write the three questions you ask when you hear a price objection.",
      "Collect proof from three similar clients: what they spent and what they received.",
      "Draft two options, a full package and a staged start, with clear prices.",
      "Rehearse the full response out loud twice so it sounds ordinary."
    ],
    evidence: "The one page playbook with your questions, your proof and two priced options, plus a note from one live use."
  },
  {
    id: "leadership-1",
    skill: "leadership",
    title: "Weekly One-on-One System",
    prompt: "Run the same fifteen minute one-on-one with every direct report for four weeks and see what repeats.",
    steps: [
      "Block the same fifteen minute slot each week for each person.",
      "Use five minutes for progress, seven for blockers, and three for commitments.",
      "After each meeting write one line per person naming the blocker and the action.",
      "After four weeks, review the list and name the two problems that appear again and again."
    ],
    evidence: "Four weeks of one line notes per person, plus the two recurring problems you identified and one action you started."
  },
  {
    id: "leadership-2",
    skill: "leadership",
    title: "Rewrite the Hardest Conversation",
    prompt: "Prepare one difficult conversation you have been avoiding, then hold it in a private and calm setting.",
    steps: [
      "Write three notes: what happened, the effect it had, and the change you need.",
      "Choose a private time that is not right after a crisis and not first thing on a Monday.",
      "State the facts, then stop talking and let the person respond fully.",
      "Agree one change and one review date, then write it down and share it."
    ],
    evidence: "Your three notes, the date you held the conversation, and the written agreement with the review date."
  },
  {
    id: "financial-1",
    skill: "financial",
    title: "True Cost of One Deal",
    prompt: "Calculate what you actually kept from one recent Khmer24 deal after every direct cost and hidden cost.",
    steps: [
      "Write down the price the client actually paid.",
      "List commission, onboarding time, support time, free items and payment fees.",
      "Convert your staff time into a number using your hourly staff cost.",
      "Subtract the total and compare the result with a cheaper version of the same deal."
    ],
    evidence: "A one page calculation for the deal, the figure you really kept, and the price or package change you will make next time."
  },
  {
    id: "financial-2",
    skill: "financial",
    title: "Thirteen Week Cash View",
    prompt: "Build a thirteen week view of money coming in and going out so you know which week is tight before it arrives.",
    steps: [
      "List every expected payment in, by week, with dates and amounts.",
      "List every payment out, by week, including salaries, suppliers and events.",
      "Subtract to find the tightest week and the size of the gap in USD.",
      "Decide one action for that week now, such as moving an invoice date or delaying a purchase."
    ],
    evidence: "The thirteen week sheet, the tightest week you found with the gap size, and the action you decided in advance."
  },
  {
    id: "digital-1",
    skill: "digital",
    title: "One Weekly Content Engine",
    prompt: "Build a repeatable weekly content process for one Khmer24 category, from the first idea to the published piece.",
    steps: [
      "Pick one category and list three reader questions people ask you every week.",
      "Write one short answer to each question, aimed at that reader only.",
      "Set a fixed day to publish and a fixed day to share it to your main channels.",
      "Track reads, enquiries and sign-ups for four weeks and keep only the best two topics."
    ],
    evidence: "Four weeks of published pieces with a simple numbers sheet, and the two topics that performed best."
  },
  {
    id: "digital-2",
    skill: "digital",
    title: "AI Workflow With a Human Check",
    prompt: "Build one AI assisted workflow for a real weekly task and test it on ten records before you trust it.",
    steps: [
      "Choose a weekly task that takes over an hour and follows clear rules.",
      "Write the numbered steps, including what to do when something is unusual.",
      "Decide where AI drafts and where a human must decide, then set one clear check step.",
      "Run it on ten real records, check every output, and write down the rules you had to add."
    ],
    evidence: "The written steps, the ten checked outputs, and the list of rules you added after the first test run."
  }
];

export const ASSESSMENT = {
  title: "30-Day Skills Assessment",
  intro: "This assessment covers the five skills you practised over thirty days. Answer each section in your own words and in short sentences, using real examples from Khmer24 where you can. Length does not matter here. What matters is whether you can actually apply the idea at work.",
  sections: [
    {
      title: "Strategic Thinking",
      questions: [
        "Explain the difference between a symptom and a root cause, using one number from your own work.",
        "Describe one demand gap you found in the Cambodian market, and the signs that proved it was real.",
        "Write one goal of yours that includes a number, a date, an owner and a reason."
      ]
    },
    {
      title: "Sales and Revenue Growth",
      questions: [
        "Describe how you qualify a buyer, using the three checks, and give one example.",
        "Write the exact words you would use when a client says your price is too high.",
        "Explain one way to grow revenue from existing clients without making new sales calls."
      ]
    },
    {
      title: "Leadership and Management",
      questions: [
        "Explain how a clear expectation differs from a vague instruction, with one example.",
        "Describe the structure of a fifteen minute one-on-one and explain why it works.",
        "Explain how you would give corrective feedback in four steps."
      ]
    },
    {
      title: "Financial and Data Analysis",
      questions: [
        "Explain what a profit and loss statement shows and where a business can hide a cost leak.",
        "Describe why a profitable month can still leave no cash in the bank.",
        "Walk through how you would build a simple three month forecast using past numbers."
      ]
    },
    {
      title: "Digital and AI Skills",
      questions: [
        "Explain the three ways a customer finds a business and say which one brings you paying customers.",
        "Describe one task you have automated and one rule you had to add after testing it.",
        "Explain the boundary you would set for using AI safely in a news and marketplace business."
      ]
    }
  ],
  summaryPrompts: [
    "What is the single most useful thing you changed in your work in the last thirty days?",
    "Which skill do you now use most confidently, and which one still feels weak to you?",
    "Describe one number you will now check every week that you did not check before.",
    "Name one hard conversation you have been putting off, and the date you will have it.",
    "Write down one workflow you want running within the next thirty days."
  ]
};
