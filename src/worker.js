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
async function telegram(env, chatId, text) {
  if (!env.TELEGRAM_BOT_TOKEN || !chatId) return false;
  const chunks = [];
  let remaining=String(text);
  while (remaining.length>3900) {
    let cut=remaining.lastIndexOf("\n",3900);
    if(cut<1000) cut=3900;
    chunks.push(remaining.slice(0,cut)); remaining=remaining.slice(cut).trimStart();
  }
  if(remaining) chunks.push(remaining);
  for (const chunk of chunks) {
    const res=await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({chat_id:chatId,text:chunk,disable_web_page_preview:true})
    });
    if(!res.ok) throw new Error("Telegram sendMessage failed: "+res.status);
  }
  return true;
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
// Telegram delivers to chats the bot cannot reach (wrong id, blocked, kicked).
// A failed reply must not surface as a non-200, or Telegram retries in a loop.
async function tryTelegram(env, chatId, text) {
  try {
    await telegram(env, chatId, text);
  } catch (e) {
    console.error("telegram reply failed for chat", chatId, String(e.message || e));
  }
}
async function handleTelegram(request, env) {
  if(!env.TELEGRAM_BOT_TOKEN) return json({error:"Telegram bot is not configured"},503);
  if(env.TELEGRAM_WEBHOOK_SECRET) {
    const provided=request.headers.get("x-telegram-bot-api-secret-token")||"";
    if(provided!==env.TELEGRAM_WEBHOOK_SECRET) return new Response("Forbidden",{status:403});
  }
  const update=await request.json();
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
  const command=message.text.trim().split(/\s+/)[0].split("@")[0].toLowerCase();
  let reply="";
  if(command==="/start" || command==="/help") {
    reply="👋 Welcome to Economic Intelligence.\n\n/today — latest business intelligence\n/cambodia — Cambodia-focused stories\n/asean — ASEAN stories\n/global — global stories\n/opportunities — business opportunity prompts\n/refresh — collect new RSS stories\n/help — show commands";
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
  } else reply="I don't recognize that command. Send /help to see available commands.";
  await tryTelegram(env,chatId,reply);
  return json({ok:true});
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
      if(url.pathname.startsWith("/api/")) return json({error:"Not found"},404);
      return env.ASSETS.fetch(request);
    } catch(e) {
      return json({error:"Internal service error",detail:String(e.message||e)},500);
    }
  },
  async scheduled(event,env,ctx) {
    ctx.waitUntil(sendScheduledReport(env));
  }
};
