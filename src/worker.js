// Personal Skill Development module
import {
  seedCurriculum, getToday, getLesson, getPlan, saveSession, saveQuiz,
  saveJournal, getJournalEntry, listJournal, saveAssignment, listAssignments,
  getProgress, getAssessment, setPreference, ictMinutes, ictDate, ictWeekday,
  selectDailyLesson, setLastSent, claimDelivery, markDelivered,
  markDeliveryFailed, remindersEnabled, clean, toDay, PROGRAM_DAYS, OWNER_ID,
} from "./skills.js";
import { handleSkillCommand, handleQuizAnswer, handleCallback, SKILL_HELP } from "./skills-telegram.js";
import { buildDailyLesson, lessonKeyboard, reviewKeyboard } from "./skills-daily.js";
import { authorize, createToken, sessionCookie, clearCookie } from "./auth.js";
import { createSession, sessionCookie as userSessionCookie, clearSessionCookie } from "./auth-users.js";
import {
  registerUser, loginUser, logoutUser, currentUser, updateProfile,
  seedLessons, getLessonForUser, listLessonsForUser, recordLessonCompletion,
  platformProgress, ensureEnrolment, httpError, LOCALES,
} from "./platform.js";
import { handlePlatformNext } from "./next-routes.js";
import { handleLearningCommand } from "./learn-telegram.js";

const FEEDS = [
  // ASEAN / regional
  {name:"ASEAN.org", url:"https://asean.org/feed/"},
  {name:"ASEAN Briefing", url:"https://www.aseanbrief.com/feed/"},
  {name:"The Thaiger", url:"https://thethaiger.com/feed/"},
  {name:"VnExpress World", url:"https://e.vnexpress.net/rss/world.rss"},
  {name:"CNA", url:"https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml"},
  {name:"Straits Times", url:"https://www.straitstimes.com/news/world/rss.xml"},
  {name:"SCMP Economy", url:"https://www.scmp.com/rss/4/feed"},
  {name:"SCMP Business", url:"https://www.scmp.com/rss/92/feed"},
  // Markets / finance
  {name:"CNBC World", url:"https://www.cnbc.com/id/100727362/device/rss/rss.html"},
  {name:"CNBC Finance", url:"https://www.cnbc.com/id/10000664/device/rss/rss.html"},
  {name:"CNBC Economy", url:"https://www.cnbc.com/id/20910258/device/rss/rss.html"},
  {name:"CNBC Asia", url:"https://www.cnbc.com/id/19832390/device/rss/rss.html"},
  {name:"Nikkei Asia", url:"https://asia.nikkei.com/rss/feed/nar"},
  {name:"MarketWatch", url:"https://feeds.content.dowjones.io/public/rss/mw_topstories"},
  {name:"Investing.com", url:"https://www.investing.com/rss/news.rss"},
  // General world
  {name:"BBC Asia", url:"https://www.bbc.com/news/world/asia/rss.xml"},
  {name:"Al Jazeera", url:"https://www.aljazeera.com/xml/rss/all.xml"},
  {name:"DW World", url:"https://rss.dw.com/rdf/rss-en-world"},
  {name:"UN Economic Development", url:"https://news.un.org/feed/subscribe/en/news/topic/economic-development/feed/rss.xml"},
  {name:"Economic Times", url:"https://economictimes.indiatimes.com/rssfeedstopstories.cms"},
  // Cambodia coverage. Khmer Times and Phnom Penh Post return 403 to Cloudflare
  // Workers egress and cannot be bypassed in code; Google News topic search
  // returns 503. These routes are verified reachable from the Worker itself.
  // defaultRegion applies when keyword matching finds nothing, so Khmer-script
  // headlines from a Cambodia publisher are still attributed to Cambodia.
  {name:"Cambodia Daily", url:"https://www.cambodiadaily.com/rss", defaultRegion:"Cambodia"},
  {name:"Thaiger Cambodia", url:"https://thethaiger.com/tag/cambodia/feed/"},
  {name:"Thaiger SE Asia", url:"https://thethaiger.com/tag/southeast-asia/feed/"},
  {name:"ASEAN Brief Cambodia", url:"https://www.aseanbrief.com/?s=Cambodia&feed=rss2"},
  {name:"Lowy Interpreter", url:"https://www.lowyinstitute.org/the-interpreter/rss.xml"}
];

const PER_FEED = 15;

// Some publishers reject obvious bot agents. Retry once with a browser agent
// before treating a feed as failed, since several also gate on egress IP.
const FEED_UA = "EconomicIntelligenceBot/1.0 (+RSS reader)";
const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const REGION_TERMS = {
  Cambodia:["cambodia","khmer","phnom penh","siem reap","riel"],
  ASEAN:["asean","vietnam","thailand","singapore","indonesia","malaysia","laos","philippines","myanmar","brunei"],
  China:["china","beijing","shanghai","hong kong","yuan"],
  US:["united states","u.s.","federal reserve","fed "],
  Europe:["europe","eurozone","ecb","germany","france","united kingdom","britain"]
};
const CATEGORY_TERMS = {
  "Interest Rates":["interest rate","rate hike","rate cut","federal reserve","central bank"],
  Inflation:["inflation","consumer prices","cpi"],
  Trade:["trade","tariff","export","import","customs"],
  Investment:["investment","fdi","foreign direct","factory","plant"],
  Tourism:["tourism","tourist","hotel","travel","visitor"],
  Property:["property","real estate","housing","condo","mortgage","construction","land"],
  Auto:["car","vehicle","electric vehicle","automotive","motor"],
  Jobs:["job","employment","hiring","layoff","salary","wage","labor","labour"],
  Banking:["bank","loan","credit","deposit","lending"],
  Commodities:["oil","crude","gold","copper","natural gas"],
  Markets:["stock","bond","equity","market","shares","index"],
  Manufacturing:["manufacturing","production","supply chain"],
  Regulation:["regulation","law","policy","government","tax","license","licence"]
};
const HIGH_IMPACT = ["war","conflict","sanction","tariff","rate cut","rate hike","default","bank failure","crisis","emergency","devaluation","recession"];

function esc(s="") {
  return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function decodeXml(s="") {
  return String(s).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1")
    .replace(/<[^>]+>/g," ").replace(/&amp;/g,"&").replace(/&lt;/g,"<")
    .replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'")
    .replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)))
    .replace(/\s+/g," ").trim();
}
function tag(block, name) {
  const m = block.match(new RegExp("<(?:[\\w.-]+:)?"+name+"(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[\\w.-]+:)?"+name+"\\s*>","i"));
  return m ? decodeXml(m[1]) : "";
}
function parseFeed(xml, feedName) {
  const blocks = [...xml.matchAll(/<(?:item|entry)\b[^>]*>([\s\S]*?)<\/(?:item|entry)\s*>/gi)].map(m=>m[1]);
  return blocks.map(b => {
    const title = tag(b,"title");
    let url = "";
    const linkTag = b.match(/<(?:[\w.-]+:)?link\b([^>]*)\/?>/i);
    if (linkTag) {
      const href = linkTag[1].match(/\bhref=["']([^"']+)["']/i);
      if (href) url = href[1];
    }
    if (!url) url = tag(b,"link");
    const summary = tag(b,"description") || tag(b,"summary") || tag(b,"content");
    const published = tag(b,"pubDate") || tag(b,"published") || tag(b,"updated") || tag(b,"date");
    return {title,url:url.trim(),summary:summary.slice(0,1600),published,source:feedName};
  }).filter(x=>x.title && /^https?:\/\//i.test(x.url));
}
// Substring matching produced false hits: "riel" matched inside "Espriella",
// tagging an unrelated Colombia story as Cambodia. Require alphanumeric boundaries.
const termCache=new Map();
function hasTerm(text, term) {
  let re=termCache.get(term);
  if(!re) {
    const esc=term.replace(/[.*+?^${}()|[\]\\]/g,"\\$&").trim();
    re=new RegExp("(?<![a-z0-9])"+esc+"(?![a-z0-9])","i");
    termCache.set(term,re);
  }
  return re.test(text);
}
function classify(title, summary) {
  const x=(title+" "+summary).toLowerCase();
  let region="Global";
  for (const [r,terms] of Object.entries(REGION_TERMS)) if (terms.some(t=>hasTerm(x,t))) {region=r;break;}
  let category="Other";
  for (const [c,terms] of Object.entries(CATEGORY_TERMS)) if (terms.some(t=>hasTerm(x,t))) {category=c;break;}
  const urgent=HIGH_IMPACT.some(t=>hasTerm(x,t));
  const score=1+(urgent?3:0)+(["Cambodia","ASEAN","China","US"].includes(region)?1:0)+(["Interest Rates","Trade","Banking","Commodities","Regulation"].includes(category)?1:0);
  const priority=score>=5?"RED":score>=4?"ORANGE":score>=3?"YELLOW":"GREEN";
  return {region,category,score,priority};
}
function json(data,status=200) {
  return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
}
const SKIP_REPLY = Symbol("skip");
async function telegram(env, chatId, text, keyboard) {
  if (!env.TELEGRAM_BOT_TOKEN || !chatId) return false;
  const chunks = [];
  let remaining=String(text);
  while (remaining.length>3900) {
    let cut=remaining.lastIndexOf("\n",3900);
    if(cut<1000) cut=3900;
    chunks.push(remaining.slice(0,cut)); remaining=remaining.slice(cut).trimStart();
  }
  if(remaining) chunks.push(remaining);
  for (let i=0;i<chunks.length;i++) {
    const body={chat_id:chatId,text:chunks[i],disable_web_page_preview:true};
    // Only the first chunk carries the buttons, so long lessons stay tappable.
    if(keyboard && i===0) body.reply_markup=keyboard;
    const res=await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify(body)
    });
    if(!res.ok) throw new Error("Telegram sendMessage failed: "+res.status);
  }
  return true;
}

// Answer an inline button press so the client stops showing a spinner.
async function answerCallback(env, callbackId, text) {
  if (!env.TELEGRAM_BOT_TOKEN || !callbackId) return;
  try {
    await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
      method:"POST", headers:{"content-type":"application/json"},
      body: JSON.stringify({callback_query_id:callbackId, text:String(text||"").slice(0,200)})
    });
  } catch(e) {
    console.error("answerCallbackQuery failed", String(e.message||e));
  }
}
async function fetchFeed(url) {
  let lastErr="";
  for (const ua of [FEED_UA, BROWSER_UA]) {
    try {
      const response=await fetch(url,{headers:{"user-agent":ua},signal:AbortSignal.timeout(9000)});
      if(!response.ok) throw new Error("HTTP "+response.status);
      return await response.text();
    } catch(e) { lastErr=String(e.message||e); }
  }
  throw new Error(lastErr);
}
async function collect(env) {
  const now=new Date().toISOString();
  const failed=[];
  const rows=[];
  for (const feed of FEEDS) {
    try {
      const xml=await fetchFeed(feed.url);
      const stories=parseFeed(xml,feed.name).slice(0,PER_FEED);
      if(!stories.length) { failed.push(feed.name+": no parsable items"); continue; }
      for(const s of stories) {
        const cls=classify(s.title,s.summary);
        // A known Cambodia publisher outranks a blank keyword match, which is
        // what Khmer-script headlines from Cambodia Daily would otherwise get.
        if(cls.region==="Global" && feed.defaultRegion) cls.region=feed.defaultRegion;
        rows.push([s.url,s.title,s.summary,s.source,s.published,now,cls.region,cls.category,cls.priority,cls.score]);
      }
    } catch(e) { failed.push(feed.name+": "+String(e.message||e)); }
  }
  // Insert in chunks so a large feed set does not serialise hundreds of round trips.
  let added=0;
  const INSERT=`INSERT OR IGNORE INTO stories
    (url,title,summary,source,published,collected,region,category,priority,score)
    VALUES(?,?,?,?,?,?,?,?,?,?)`;
  for(let i=0;i<rows.length;i+=50) {
    const chunk=rows.slice(i,i+50).map(r=>env.DB.prepare(INSERT).bind(...r));
    try {
      const results=await env.DB.batch(chunk);
      for(const r of results) if(r?.meta?.changes) added++;
    } catch(e) { failed.push("database write failed: "+String(e.message||e)); break; }
  }
  return {added,failed,checked:FEEDS.length,total:rows.length,at:now};
}
async function getStories(env, params={}) {
  const limit=Math.min(500,Math.max(1,Number(params.limit||50)));
  const region=params.region||"";
  const q=(params.q||"").trim().slice(0,120);
  const priority=params.priority||"";
  let sql="SELECT id,url,title,summary,source,published,collected,region,category,priority,score FROM stories WHERE 1=1";
  const binds=[];
  if(region && region!=="All"){sql+=" AND region=?";binds.push(region);}
  if(priority){sql+=" AND priority=?";binds.push(priority);}
  if(q){sql+=" AND (title LIKE ? OR summary LIKE ? OR source LIKE ? OR category LIKE ?)";const like="%"+q+"%";binds.push(like,like,like,like);}
  sql+=" ORDER BY score DESC, collected DESC LIMIT ?";
  binds.push(limit);
  const stmt=env.DB.prepare(sql).bind(...binds);
  const {results=[]}=await stmt.all();
  return results;
}
async function reportText(env, region="") {
  const stories=await getStories(env,{limit:12,region});
  const label=region||"Cambodia · ASEAN · Global";
  const out=["🌏 DAILY ECONOMIC INTELLIGENCE",label,new Date().toLocaleString("en-GB",{timeZone:"Asia/Phnom_Penh",dateStyle:"medium",timeStyle:"short"}),""];
  if(!stories.length) out.push("No stories collected yet. Use /refresh in the bot or wait for the next scheduled collection.");
  for(let i=0;i<Math.min(stories.length,10);i++){
    const s=stories[i];
    out.push(`${i+1}. [${s.priority}] ${s.title}`,`${s.source} | ${s.region} | ${s.category}`,s.url,"");
  }
  out.push("🧠 BUSINESS LENS","What happened? → Why does it matter? → Where could money move? → What is the Cambodia impact? → What should we do next?");
  return out.join("\n");
}
async function sendScheduledReport(env) {
  if(!env.TELEGRAM_BOT_TOKEN || !env.ALLOWED_CHAT_ID) return;
  await collect(env);
  await telegram(env,env.ALLOWED_CHAT_ID,await reportText(env));
}

// ---------------------------------------------------------------------------
// Daily skill lesson, sent at 06:00 Cambodia time (23:00 UTC previous day).
//
// The delivery date is claimed before sending, so a cron retry or a double fire
// cannot deliver twice. A failed send is recorded and released for retry rather
// than silently marked done.
// ---------------------------------------------------------------------------
async function sendDailyLesson(env, opts={}) {
  if(!env.TELEGRAM_BOT_TOKEN || !env.ALLOWED_CHAT_ID) return {sent:false,reason:"telegram_not_configured"};
  const date = opts.date || ictDate();

  try {
    await ensureSeeded(env);
    const forced = !!opts.force;
    if(!forced && !(await remindersEnabled(env))) return {sent:false,reason:"reminders_off"};

    // Idempotency guard. `force` lets /learn and manual tests bypass today's claim.
    if(!forced) {
      const weekday = ictWeekday(new Date());
      const pick = await selectDailyLesson(env, weekday);
      const claim = await claimDelivery(env, {...pick, weekday}, date);
      if(claim==="sent") return {sent:false,reason:"already_delivered",date};
    }

    const built = await buildDailyLesson(env, {date});
    const keyboard = built.type==="lesson" ? lessonKeyboard(built.day)
                    : built.quizDay ? reviewKeyboard(built.quizDay) : undefined;

    await telegram(env, env.ALLOWED_CHAT_ID, built.text, keyboard);
    if(built.type==="lesson") await setLastSent(env, {day:built.day, type:"lesson"});
    if(!forced) await markDelivered(env, date);
    return {sent:true, date, type:built.type, day:built.day||null};
  } catch(e) {
    console.error("daily lesson failed", String(e.message||e));
    if(!opts.force) await markDeliveryFailed(env, e, date).catch(()=>{});
    return {sent:false, reason:String(e.message||e), date};
  }
}

// ---------------------------------------------------------------------------
// Skill Development API. All personal data routes require authorization.
// ---------------------------------------------------------------------------
async function handleSkills(request, env, url) {
  const route = url.pathname.replace(/^\/api\/skills/, "") || "/";

  // Unauthenticated entry points.
  if (route === "/login" && request.method === "POST") {
    if (!env.ADMIN_SECRET) return json({ error: "ADMIN_SECRET is not configured" }, 503);
    const body = await readBody(request);
    // Trim: a trailing space or newline from copy/paste is a common and
    // invisible cause of a rejected-but-correct secret.
    const supplied = String(body.secret || "").trim();
    const ok = await authorize(
      new Request(request.url, { headers: { authorization: "Bearer " + supplied } }),
      env
    );
    if (!ok.ok) return json({ error: "Incorrect secret" }, 401);
    const secure = new URL(request.url).protocol === "https:";
    return new Response(JSON.stringify({ ok: true, expiresIn: 43200 }), {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
        "set-cookie": sessionCookie(await createToken(env.ADMIN_SECRET), secure),
      },
    });
  }

  if (route === "/logout" && request.method === "POST") {
    const secure = new URL(request.url).protocol === "https:";
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json", "set-cookie": clearCookie() },
    });
  }

  // authorize() resolves to a plain object, not a Response, so it must be
  // awaited and checked on .ok. Treating it as a Response silently allowed
  // every unauthenticated request through.
  if (!env.ADMIN_SECRET) {
    return json({ error: "Skill Development is disabled until ADMIN_SECRET is set" }, 503);
  }
  const auth = await authorizePersonal(request, env);
  if (!auth.ok) {
    return json({ error: "Unauthorized", hint: "Sign in at /skills.html or /welcome.html" }, 401);
  }

  if (route === "/session" && request.method === "GET") {
    return json({ ok: true, authenticated: true, via: auth.via });
  }

  try {
    await seedLessons(env);
  } catch (e) {
    return json({ error: "Curriculum could not be initialised", detail: String(e.message || e) }, 500);
  }

  try {
    if (route === "/today" && request.method === "GET") {
      return json(await getToday(env));
    }

    if (route === "/lesson" && request.method === "GET") {
      const day = toDay(url.searchParams.get("day"));
      if (!day) return json({ error: "day must be an integer between 1 and " + PROGRAM_DAYS }, 400);
      const lesson = await getLesson(env, day);
      if (!lesson) return json({ error: "Lesson not found" }, 404);
      return json({ lesson });
    }

    if (route === "/plan" && request.method === "GET") {
      const plan = await getPlan(env);
      return json({ plan, total: plan.length, programDays: PROGRAM_DAYS });
    }

    if (route === "/assessment" && request.method === "GET") {
      return json({ assessment: getAssessment() });
    }

    if (route === "/progress" && request.method === "GET") {
      return json(await getProgress(env));
    }

    if (route === "/progress" && request.method === "POST") {
      const body = await readBody(request);
      const result = await saveSession(env, body);
      return json(result);
    }

    if (route === "/quiz" && request.method === "POST") {
      const body = await readBody(request);
      const day = toDay(body.day);
      if (!day) return json({ error: "day must be between 1 and " + PROGRAM_DAYS }, 400);
      return json(await saveQuiz(env, body));
    }

    if (route === "/journal") {
      if (request.method === "GET") {
        const date = url.searchParams.get("date");
        if (date) {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ error: "date must be YYYY-MM-DD" }, 400);
          const entry = await getJournalEntry(env, date);
          return json({ entry });
        }
        return json({ entries: await listJournal(env, url.searchParams.get("limit")) });
      }
      if (request.method === "POST") {
        const body = await readBody(request);
        return json(await saveJournal(env, body));
      }
    }

    if (route === "/assignments") {
      if (request.method === "GET") {
        return json({ assignments: await listAssignments(env) });
      }
      if (request.method === "POST") {
        const body = await readBody(request);
        return json(await saveAssignment(env, body));
      }
    }

    if (route === "/assignments/templates" && request.method === "GET") {
      return json({ templates: (await import("./skills-data.js")).ASSIGNMENTS });
    }

    if (route === "/preferences") {
      if (request.method === "GET") {
        return json({ remindersEnabled: await remindersEnabled(env) });
      }
      if (request.method === "POST") {
        const body = await readBody(request);
        const enabled = body.remindersEnabled === true || body.remindersEnabled === 1 || body.remindersEnabled === "1";
        await setPreference(env, "reminders_enabled", enabled ? "1" : "0");
        return json({ ok: true, remindersEnabled: enabled });
      }
    }

    if (url.pathname === "/api/skills/assessment" && request.method === "GET") {
      return json({ assessment: getAssessment() });
    }
  } catch (e) {
    const message = String(e.message || e);
    const bad = /must be|not found|Invalid/i.test(message);
    return json({ error: bad ? message : "Request could not be completed" }, bad ? 400 : 500);
  }

  return json({ error: "Not found" }, 404);
}
// Telegram delivers to chats the bot cannot reach (wrong id, blocked, kicked).
// A failed reply must not surface as a non-200, or Telegram retries in a loop.
async function tryTelegram(env, chatId, text, keyboard) {
  try {
    await telegram(env, chatId, text, keyboard);
  } catch (e) {
    console.error("telegram reply failed for chat", chatId, String(e.message || e));
  }
}
// ---------------------------------------------------------------------------
// Skill Development helpers
// ---------------------------------------------------------------------------
let seedTask = null;
// Skills are seeded once per isolate and only when the curriculum tables are
// actually empty. The gate checks skill_lessons rather than skills, because
// migration 0003 already seeds the skills rows while lessons come from JS.
async function ensureSeeded(env) {
  const { results } = await env.DB.prepare("SELECT COUNT(*) AS c FROM skill_lessons").all();
  if ((results?.[0]?.c || 0) > 0) return false;
  if (!seedTask) seedTask = seedCurriculum(env).catch((e) => { seedTask = null; throw e; });
  await seedTask;
  return true;
}
// ---------------------------------------------------------------------------
// PERSONAL DASHBOARD OPEN MODE  --  set to false to restore the sign-in gate.
//
// The owner asked for the Skill Development dashboard to open without a
// password. While true, EVERY /api/skills/* route is readable and writable by
// anyone who can reach this hostname, with no credential of any kind. That
// includes the learning journal, business assignments, reflections, quiz results
// and the Telegram linking settings, and it allows anyone to modify them.
//
// This is a deliberate, owner-approved trade of privacy for convenience on a
// publicly resolvable workers.dev address. Flip this one line back to false and
// redeploy to lock it again; the login form is still present in skills.html and
// works unchanged.
// ---------------------------------------------------------------------------
const PERSONAL_DASHBOARD_OPEN = true;

async function authorizePersonal(request, env) {
  if (PERSONAL_DASHBOARD_OPEN) return { ok: true, via: "open" };

  const auth = await authorize(request, env);
  if (auth.ok) return auth;

  // Also accept an Up Skill account session, but ONLY for the migrated owner
  // account. The legacy /api/skills/* data belongs to user id 1; letting any
  // signed-in account read it would expose one person's journal and assignments
  // to another, which is exactly the isolation the platform layer prevents.
  const user = await currentUser(env, request);
  if (user && user.id === OWNER_ID) return { ok: true, via: "account" };

  return { ok: false };
}

async function readBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

async function handleTelegram(request, env) {
  if(!env.TELEGRAM_BOT_TOKEN) return json({error:"Telegram bot is not configured"},503);
  if(env.TELEGRAM_WEBHOOK_SECRET) {
    const provided=request.headers.get("x-telegram-bot-api-secret-token")||"";
    if(provided!==env.TELEGRAM_WEBHOOK_SECRET) return new Response("Forbidden",{status:403});
  }
  const update=await request.json();

  // Inline button presses arrive as callback_query, not message.
  const press=update.callback_query;
  if(press) {
    if(!env.ALLOWED_CHAT_ID || String(press.message?.chat?.id)!==String(env.ALLOWED_CHAT_ID)) {
      await answerCallback(env, press.id, "This bot is private.");
      return json({ok:true});
    }
    try {
      await ensureSeeded(env);
      const result=await handleCallback(env, press.data);
      if(result) {
        await answerCallback(env, press.id, result.alert||"Done");
        if(result.text) await tryTelegram(env, String(press.message.chat.id), result.text);
      } else {
        await answerCallback(env, press.id, "Unknown action");
      }
    } catch(e) {
      console.error("callback failed", String(press.data), String(e.message||e));
      await answerCallback(env, press.id, "Something went wrong. Try again.");
    }
    return json({ok:true});
  }

  const message=update.message||update.edited_message;
  if(!message?.text || !message.chat?.id) return json({ok:true});
  const chatId=String(message.chat.id);
  if(!env.ALLOWED_CHAT_ID) {
    await tryTelegram(env,chatId,"This bot is not configured yet. The owner must set ALLOWED_CHAT_ID first.");
    return json({ok:true});
  }
  if(chatId!==String(env.ALLOWED_CHAT_ID)) {
    await tryTelegram(env,chatId,"This bot is private. Ask the owner to authorize your chat ID.");
    return json({ok:true});
  }
  const parts=message.text.trim().split(/\s+/);
  const command=parts[0].split("@")[0].toLowerCase();
  const arg=parts.slice(1).join(" ");
  let reply=SKIP_REPLY;
  if(command==="/start" || command==="/help") {
    reply="👋 Welcome to Economic Intelligence.\n\nNEWS\n/today — latest business intelligence\n/cambodia — Cambodia-focused stories\n/asean — ASEAN stories\n/global — global stories\n/opportunities — business opportunity prompts\n/refresh — collect new RSS stories\n\n"+SKILL_HELP;
  } else if(command==="/today") reply=await reportText(env);
  else if(command==="/cambodia") reply=await reportText(env,"Cambodia");
  else if(command==="/asean") reply=await reportText(env,"ASEAN");
  else if(command==="/global") reply=await reportText(env,"Global");
  else if(command==="/opportunities") {
    const stories=await getStories(env,{limit:8});
    reply="💡 BUSINESS OPPORTUNITY REVIEW\n\n"+(stories.length?stories.map((s,i)=>`${i+1}. ${s.title}\nSignal: ${s.category} / ${s.region}\nQuestion: Could this change customer demand, costs, hiring, property, vehicles, or marketplace activity?\nSource: ${s.url}`).join("\n\n"):"No news collected yet. Use /refresh first.")+"\n\nTreat these as prompts to investigate, not verified forecasts.";
  } else if(command==="/refresh") {
    const r=await collect(env);
    reply=`🔄 Collection finished.\nNew stories: ${r.added}\nFeeds checked: ${r.checked}\nFailed feeds: ${r.failed.length}\nUse /today to view the latest report.`;
  } else {
    // Future Skills 2027-2031 commands are consulted first, but only after every
    // existing news command above has had its chance, so nothing already working
    // can change behaviour. It returns null for anything it does not own, which
    // then falls through to the original skill handler untouched.
    const learned = await handleLearningCommand(env, command, arg, chatId);
    if (learned) {
      reply = learned.text;
    } else {
      // Skill Development commands. ensureSeeded is best-effort: a curriculum
      // problem must not break the existing news commands.
      try {
        await ensureSeeded(env);
        const result = await handleSkillCommand(env, command, arg);
        if (result) {
          reply = result.text;
          await tryTelegram(env, chatId, reply, result.keyboard);
        } else if (/^[1-4]$/.test(message.text.trim())) {
          reply = await handleQuizAnswer(env, message.text.trim());
          if (reply === null) reply="I don't recognize that command. Send /help to see available commands.";
        } else {
          reply = "I don't recognize that command. Send /help to see available commands.";
        }
      } catch (e) {
        console.error("skill command failed", command, String(e.message || e));
        reply = "⚠️ The skill module hit a problem. Try again in a moment.";
      }
    }
  }
  if (reply !== SKIP_REPLY) await tryTelegram(env,chatId,reply);
  return json({ok:true});
}
// ---------------------------------------------------------------------------
// Up Skill PWA: account routes
// ---------------------------------------------------------------------------
async function handleAuth(request, env, url) {
  const route = url.pathname.replace(/^\/api\/auth/, "") || "/";
  const secure = new URL(request.url).protocol === "https:";
  const meta = { ip: request.headers.get("cf-connecting-ip") || "anon" };

  if (route === "/register" && request.method === "POST") {
    try {
      const body = await readBody(request);
      const { id, email } = await registerUser(env, body, meta);
      const session = await createSession(env, id);
      return new Response(JSON.stringify({ ok: true, user: { id, email } }), {
        status: 201,
        headers: { "content-type": "application/json", "set-cookie": userSessionCookie(session.token, secure) },
      });
    } catch (e) {
      return json({ error: e.message || "Could not create the account" }, e.status || 400);
    }
  }

  if (route === "/login" && request.method === "POST") {
    try {
      const body = await readBody(request);
      const user = await loginUser(env, body, meta);
      await ensureEnrolment(env, user.id);
      const session = await createSession(env, user.id);
      return new Response(JSON.stringify({ ok: true, user: publicUser(user) }), {
        status: 200,
        headers: { "content-type": "application/json", "set-cookie": userSessionCookie(session.token, secure) },
      });
    } catch (e) {
      return json({ error: e.message || "Could not sign in" }, e.status || 400);
    }
  }

  if (route === "/logout" && request.method === "POST") {
    await logoutUser(env, request);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json", "set-cookie": clearSessionCookie() },
    });
  }

  if (route === "/me" && request.method === "GET") {
    const user = await currentUser(env, request);
    if (!user) return json({ authenticated: false }, 401);
    return json({ authenticated: true, user: publicUser(user) });
  }

  return json({ error: "Not found" }, 404);
}

function publicUser(u) {
  return {
    id: u.id,
    email: u.email,
    displayName: u.display_name,
    role: u.role,
    locale: u.locale,
    level: u.level,
    occupation: u.occupation,
    dailyMinutes: u.daily_minutes,
    goals: u.goals,
    onboardingDone: !!u.onboarding_done,
  };
}

// ---------------------------------------------------------------------------
// Up Skill PWA: authenticated learning routes
// ---------------------------------------------------------------------------
async function handlePlatform(request, env, url) {
  const route = url.pathname.replace(/^\/api\/platform/, "") || "/";

  // Seed the published curriculum before any content read. Idempotent and cheap
  // once seeded, because seedLessons short-circuits on an already-full table.
  try {
    await seedLessons(env);
  } catch (e) {
    return json({ error: "Curriculum could not be initialised", detail: String(e.message || e) }, 500);
  }

  const user = await currentUser(env, request);

  // The 2027-2031 surface (catalog, levels, roadmap, Business Lab, assessment,
  // proficiency, coach, privacy, admin) is handled first. It performs its own
  // per-route auth so that published catalog routes stay reachable without a
  // session while everything user-specific stays locked.
  const next = await handlePlatformNext(request, env, url, user);
  if (next) return next;

  if (route === "/health" && request.method === "GET") {
    const { results } = await env.DB.prepare(`SELECT COUNT(*) n FROM lessons`).all();
    const { results: tr } = await env.DB
      .prepare(`SELECT locale, COUNT(*) n, SUM(CASE WHEN review_status='human_reviewed' THEN 1 ELSE 0 END) reviewed FROM lesson_translations GROUP BY locale`)
      .all();
    return json({ ok: true, lessons: results?.[0]?.n || 0, locales: LOCALES, translations: tr || [] });
  }

  // Every remaining platform route requires a signed-in account.
  if (!user) return json({ error: "Sign in required" }, 401);

  try {
    switch (route) {
      case "/profile": {
        if (request.method === "GET") return json({ user: publicUser(user) });
        if (request.method === "POST" || request.method === "PATCH") {
          const body = await readBody(request);
          await updateProfile(env, user.id, body);
          const fresh = await currentUser(env, request);
          return json({ ok: true, user: publicUser(fresh) });
        }
        break;
      }
      case "/lessons": {
        if (request.method === "GET") {
          const lessons = await listLessonsForUser(env, user.id, url.searchParams.get("locale") || user.locale);
          return json({ lessons });
        }
        break;
      }
      case "/lesson": {
        if (request.method === "GET") {
          const day = Number.parseInt(url.searchParams.get("day"), 10);
          if (!Number.isInteger(day) || day < 1 || day > 30) {
            return json({ error: "day must be between 1 and 30" }, 400);
          }
          const locale = url.searchParams.get("locale") || user.locale;
          const lesson = await getLessonForUser(env, day, locale);
          if (!lesson) return json({ error: "Lesson not found" }, 404);
          const { results: prog } = await env.DB
            .prepare(`SELECT status, minutes, completed_at FROM lesson_progress WHERE user_id=? AND lesson_id=?`)
            .bind(user.id, lesson.id).all();
          return json({ lesson, progress: prog?.[0] || null });
        }
        if (request.method === "POST") {
          const body = await readBody(request);
          const day = Number.parseInt(body.day, 10);
          if (!Number.isInteger(day) || day < 1 || day > 30) {
            return json({ error: "day must be between 1 and 30" }, 400);
          }
          return json(await recordLessonCompletion(env, user.id, day, body));
        }
        break;
      }
      case "/progress": {
        if (request.method === "GET") {
          return json(await platformProgress(env, user.id, url.searchParams.get("locale") || user.locale));
        }
        break;
      }
      default:
        return json({ error: "Not found" }, 404);
    }
  } catch (e) {
    return json({ error: e.message || "Request could not be completed" }, e.status || 500);
  }
  return json({ error: "Not found" }, 404);
}

export default {
  async fetch(request,env,ctx) {
    const url=new URL(request.url);
    try {
      if(url.pathname==="/api/health") return json({ok:true,app:env.APP_NAME||"Economic Intelligence",time:new Date().toISOString(),timezone:env.TIMEZONE||"Asia/Phnom_Penh",telegramConfigured:!!env.TELEGRAM_BOT_TOKEN});
      if(url.pathname==="/api/telegram/webhook" && request.method==="POST") return await handleTelegram(request,env);
      if(url.pathname==="/api/news" && request.method==="GET") {
        const stories=await getStories(env,{limit:url.searchParams.get("limit"),region:url.searchParams.get("region"),q:url.searchParams.get("q"),priority:url.searchParams.get("priority")});
        const {results:stats=[]}=await env.DB.prepare(`SELECT COUNT(*) total,
          SUM(CASE WHEN priority='RED' THEN 1 ELSE 0 END) red,
          SUM(CASE WHEN priority='ORANGE' THEN 1 ELSE 0 END) orange,
          SUM(CASE WHEN region='Cambodia' THEN 1 ELSE 0 END) cambodia
          FROM stories`).all();
        return json({stories,stats:stats[0]||{total:0,red:0,orange:0,cambodia:0},mode:"live"});
      }
      if(url.pathname==="/api/refresh" && request.method==="POST") {
        const auth=request.headers.get("authorization")||"";
        if(!env.ADMIN_SECRET || auth!=="Bearer "+env.ADMIN_SECRET) return new Response("Unauthorized",{status:401});
        const result=await collect(env);
        return json({ok:true,...result});
      }
      if(url.pathname==="/api/telegram/test" && request.method==="POST") {
        const auth=request.headers.get("authorization")||"";
        if(!env.ADMIN_SECRET || auth!=="Bearer "+env.ADMIN_SECRET) return new Response("Unauthorized",{status:401});
        if(!env.ALLOWED_CHAT_ID) return json({error:"Set ALLOWED_CHAT_ID first"},400);
        await telegram(env,env.ALLOWED_CHAT_ID,"✅ Economic Intelligence website connected to Telegram.");
        return json({ok:true});
      }
      if(url.pathname.startsWith("/api/auth")) return await handleAuth(request, env, url);
      if(url.pathname.startsWith("/api/platform")) return await handlePlatform(request, env, url);
      if(url.pathname.startsWith("/api/catalog")||url.pathname.startsWith("/api/lab")) {
        // Catalog and exercise browsing are published content and need no
        // session. Submission, coach and admin routes live under /api/platform
        // and are authenticated there.
        const user=await currentUser(env,request);
        const next=await handlePlatformNext(request,env,url,user);
        return next||json({error:"Not found"},404);
      }
      if(url.pathname==="/api/skills/daily/preview" && request.method==="POST") {
        const auth=await authorize(request,env);
        if(!auth.ok) return json({error:"Unauthorized"},401);
        await ensureSeeded(env);
        const body=await readBody(request);
        // weekday 0=Sun..6=Sat lets Saturday and Sunday be tested on any day.
        const wd=Number.parseInt(body.weekday,10);
        const built=await buildDailyLesson(env,{weekday:Number.isInteger(wd)?wd:undefined});
        return json({ok:true,type:built.type,day:built.day||null,length:built.text.length,text:built.text});
      }
      if(url.pathname==="/api/skills/daily/send" && request.method==="POST") {
        const auth=await authorize(request,env);
        if(!auth.ok) return json({error:"Unauthorized"},401);
        const body=await readBody(request);
        // force=true bypasses today's claim so the message can be re-tested.
        const force=body.force===true||body.force==="true"||body.force===1;
        const result=await sendDailyLesson(env,{force, date:body.date});
        return json(result, 200);
      }
      if(url.pathname==="/api/skills/deliveries" && request.method==="GET") {
        const auth=await authorize(request,env);
        if(!auth.ok) return json({error:"Unauthorized"},401);
        const {results}=await env.DB.prepare(`SELECT * FROM lesson_deliveries ORDER BY delivered_date DESC LIMIT 30`).all();
        return json({deliveries:results||[]});
      }
      if(url.pathname.startsWith("/api/skills")) return await handleSkills(request, env, url);
      if(url.pathname.startsWith("/api/")) return json({error:"Not found"},404);
      return env.ASSETS.fetch(request);
    } catch(e) {
      return json({error:"Internal service error",detail:String(e.message||e)},500);
    }
  },
  async scheduled(event,env,ctx) {
    // One cron string covers three Cambodia-time slots, keeping this Worker at a
    // single cron slot on the account (Workers Free allows 5 per account):
    //   0 0,11,23 * * *  ->  00:00, 11:00, 23:00 UTC
    //                     ->  07:00, 18:00, and 06:00 next day Asia/Phnom_Penh
    const when=new Date(event.scheduledTime);
    const minutes=ictMinutes(when);
    // 23:00 UTC + 7h = 06:00 Cambodia = 360 minutes past local midnight.
    if(minutes===360) ctx.waitUntil(sendDailyLesson(env));
    else ctx.waitUntil(sendScheduledReport(env));
  }
};
