# Khmer24 Growth System — Economic Intelligence + Skill Development

A cloud-first business intelligence dashboard for Cambodia → ASEAN → Global, combined with a
personal skill development system that turns daily learning into real business growth at Khmer24.

Everything runs on Cloudflare after deployment. Your computer is only used to deploy.

**Live deployment:** `https://economic-intelligence-dashboard.upskillkh.workers.dev`

| | |
| --- | --- |
| Cloudflare account | `upskillkh@gmail.com` (`4e5183ecd6abf6c6e0345fec49e0ad3f`) |
| D1 database | `economic-intelligence-db` (`af176e6a-8321-4142-8708-5e255cb0a50c`) |
| Dashboard | `/` — economic intelligence |
| Skill Development | `/skills.html` — sign in with `ADMIN_SECRET` |
| Telegram bot | `@upskill4mebot` |

## Included

### Economic Intelligence

- Responsive business intelligence website with search, region filters, priority tags, regional coverage, and opportunity prompts.
- Cloudflare Worker API and D1 database.
- RSS collector across 25 verified feeds (ASEAN, markets, world, and Cambodia-specific).
- Telegram news commands: `/today`, `/cambodia`, `/asean`, `/global`, `/opportunities`, `/refresh`.
- Automatic Telegram briefings at **07:00 and 18:00 Cambodia time**.
- Private admin endpoints protected by `ADMIN_SECRET`.
- Telegram webhook protected by Telegram's webhook secret header.

### My Skill Development

- **Today's Learning Plan** — a 30-minute routine of 10 min learn, 10 min analyse, 10 min apply, with checkboxes, notes, minutes and completion state.
- **The Five Core Skills** — Strategic Thinking, Sales & Revenue Growth, Leadership & Management, Financial & Data Analysis, Digital & AI Skills, each with progress tracking.
- **30-Day Skill Development Plan** — 30 unique lessons on a fixed rotation, every lesson with an objective, explanation, Cambodian business case, exercise, work action, reflection question and quiz.
- **Apply to My Business** — 10 assignment templates plus editable records for problem, analysis, solution, expected result, actual result, lessons learned and next action.
- **Progress Tracker** — overall completion, per-skill progress, weekly chart, streak, study minutes, quiz accuracy and skills needing improvement. Every number is computed from saved rows in D1.
- **Learning Journal** — one editable entry per day covering learned, applied, worked well, did not work, improve and next action.
- **30-day final assessment** with per-skill sections and summary prompts.

### Telegram skill commands

`/learn`, `/complete`, `/skills`, `/lesson 1-30`, `/progress`, `/quiz`, `/practice`, `/journal`,
`/reminder_on`, `/reminder_off` — all alongside the existing news commands.

### Daily learning reminder

A skill lesson is delivered automatically at **06:00 Cambodia time**. `/reminder_on` and
`/reminder_off` enable and disable that automatic delivery. See
[Daily Skill Lesson](#daily-skill-lesson-at-0600-cambodia-time).

## Architecture

```
Browser -> Cloudflare Worker -> Cloudflare D1
Cloudflare Cron -> RSS feeds -> D1 -> Telegram Bot API
Cloudflare Cron -> 07:30 learning reminder -> Telegram
Telegram webhook -> Worker -> D1 -> Telegram Bot API
```

## Source layout

| Path | Purpose |
| --- | --- |
| `src/worker.js` | Worker entry: news API, RSS collector, Telegram dispatch, skill API, cron |
| `src/skills.js` | Skill domain logic: seeding, progress, streak, journal, assignments |
| `src/skills-data.js` | The 30-lesson curriculum, 5 skills, 10 assignments, assessment |
| `src/skills-telegram.js` | Telegram message formatting and command handlers |
| `src/auth.js` | HMAC-signed session cookie protecting personal data |
| `public/index.html` | Economic Intelligence dashboard |
| `public/skills.html` | My Skill Development dashboard |
| `migrations/0001_init.sql` | News table (original) |
| `migrations/0002_skills.sql` | Skill Development tables |
| `migrations/0003_seed_skills.sql` | Seeds the five skills, idempotently |
| `migrations/0004_skill_delivery.sql` | Daily delivery tracking and reflections |
| `src/skills-daily.js` | 06:00 lesson, weekly rotation, Sunday review, inline keyboards |
| `tests/curriculum.test.mjs` | Offline curriculum integrity checks |
| `tests/api.test.mjs` | Live API integration tests |

## Requirements

- Cloudflare account
- Node.js LTS and npm for deployment from your computer
- Telegram bot token from `@BotFather`
- Your Telegram numeric chat ID
- Optional custom domain

Your computer is only used to upload/deploy the project. The deployed service runs on Cloudflare.

### Windows PowerShell note

If `npm` or `npx` fails with `npm.ps1 cannot be loaded because running scripts is disabled`,
either use the `.cmd` wrappers (`npm.cmd`, `npx.cmd`) or run this once in an Administrator
PowerShell:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### Authorising wrangler for your account

Wrangler must be signed in to the Cloudflare account that owns the Worker. The device flow avoids
any localhost callback problems:

```powershell
npx wrangler login --device
```

Verify with `npx wrangler whoami` — it must print `upskillkh@gmail.com`, otherwise every deploy
command will target a different account.


## Deployment guide

### 1. Install Node.js and open the project folder

Install Node.js LTS from https://nodejs.org/ . Extract this ZIP. Open Command Prompt/PowerShell in the extracted `economic-intelligence-cloudflare` folder.

Run:

```bash
npm install
npx wrangler login
```

A browser will open so you can authorize Wrangler with Cloudflare.

### 2. Create a Cloudflare D1 database

Run:

```bash
npx wrangler d1 create economic-intelligence-db
```

Cloudflare prints a `database_id`. Copy it into `wrangler.toml`, replacing:

```toml
database_id = "REPLACE_WITH_YOUR_D1_DATABASE_ID"
```

Keep the database name as `economic-intelligence-db`.

### 3. Apply the database migration

```bash
npx wrangler d1 migrations apply economic-intelligence-db --remote
```

Confirm the migration completes successfully before deploying.

### 4. Add secrets to Cloudflare

Create your Telegram bot with `@BotFather` if you have not already. Never paste the bot token into the website source or share it in chat.

Set the secrets with Wrangler:

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put ALLOWED_CHAT_ID
npx wrangler secret put TELEGRAM_WEBHOOK_SECRET
npx wrangler secret put ADMIN_SECRET
```

Enter each value when prompted:
- `TELEGRAM_BOT_TOKEN`: token from BotFather.
- `ALLOWED_CHAT_ID`: your personal numeric Telegram chat ID (not the bot username).
- `TELEGRAM_WEBHOOK_SECRET`: generate a long random string using a password manager. Use only letters, numbers, `_`, and `-` to avoid URL-encoding problems.
- `ADMIN_SECRET`: a different long random secret used for manual RSS collection and testing the bot connection.

If you want the bot to be usable by multiple users, change the access policy intentionally before sharing it. The default is a private personal bot.

### 5. Deploy the website and Worker

```bash
npx wrangler deploy
```

Wrangler will print the live `workers.dev` URL. Open it in a browser. The dashboard should load; before the first collection it will show clearly labelled sample placeholders.

### 6. Register Telegram webhook

Replace `YOUR_WORKER_URL`, `YOUR_BOT_TOKEN`, and `YOUR_WEBHOOK_SECRET` with your values. Run the command in a terminal (keep the token private):

```bash
curl "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook?url=YOUR_WORKER_URL/api/telegram/webhook&secret_token=YOUR_WEBHOOK_SECRET"
```

The response should include `"ok":true`. Do not publish a URL containing your bot token.

Then open Telegram and send `/start` to your bot.

### 7. Collect the first stories

The scheduled Worker runs at 07:00 and 18:00 Cambodia time. To collect immediately, call the secured admin endpoint from a terminal. Replace values locally; do not share your admin secret:

```bash
curl -X POST "YOUR_WORKER_URL/api/refresh" -H "Authorization: Bearer YOUR_ADMIN_SECRET"
```

Then reload the website. Alternatively, click **Refresh data** and enter the admin secret when prompted.

### 8. Test health and Telegram

Open:

```text
YOUR_WORKER_URL/api/health
```

To send a Telegram test message, run:

```bash
curl -X POST "YOUR_WORKER_URL/api/telegram/test" -H "Authorization: Bearer YOUR_ADMIN_SECRET"
```

## Daily Skill Lesson at 06:00 Cambodia time

A skill lesson is delivered to your Telegram bot automatically every morning. **6:00 AM Cambodia
(UTC+7) = 23:00 UTC the previous day**, so the cron entry is `23` in the hour field.

```toml
crons = ["0 0,11,23 * * *"]
```

| UTC | Cambodia | What happens |
| --- | --- | --- |
| 00:00 | 07:00 | Economic news briefing |
| 11:00 | 18:00 | Economic news briefing |
| 23:00 | 06:00 (next day) | **Daily skill development lesson** |

The handler converts `scheduled.scheduledTime` to Cambodia local time. If that is 360 minutes past
local midnight it sends the daily lesson, otherwise it sends the news briefing.

### Weekly rotation

| Day | Focus |
| --- | --- |
| Monday | Strategic Thinking |
| Tuesday | Sales & Revenue Growth |
| Wednesday | Leadership & Management |
| Thursday | Financial & Data Analysis |
| Friday | Digital & AI Skills |
| Saturday | Practical Business Application |
| Sunday | Weekly review, quiz and reflection |

Selection scans forward from the current programme pointer for the first **uncompleted** lesson of
that day's skill, wrapping once. Completing a lesson advances the pointer, so the programme never
restarts at Day 1. Sending a message does **not** advance anything — only `/complete` or the
**Mark Complete** button does.

### Idempotency and retries

`lesson_deliveries` has `UNIQUE(delivered_date)`. The scheduled run claims that row before sending:

- claim succeeds -> send, then mark `sent`
- row already `sent` -> skip, return `already_delivered`
- send fails -> mark `failed` with a truncated error, so a later run retries without ever sending a
  second message for the same date

Verified: three consecutive scheduled-style runs on the same day produced exactly one message and
one delivery row.

### Message format

The lesson follows the seven-section structure: Today's Learning, Why It Matters, Real Business
Example, Today's Practical Exercise, Apply It to Khmer24, Today's Challenge, and Track My Progress,
closing with the motivational line. Messages are built to fit one Telegram send (about 2,300
characters) and are split on newlines if they ever exceed 3,900.

### Inline buttons

Lessons carry **✅ Mark Complete**, **🧠 Take Quiz** and **📝 Write Reflection**. Buttons arrive as
`callback_query`, so the webhook must allow them:

```
allowed_updates = ["message", "callback_query"]
```

If you ever re-register the webhook, include that or the buttons will not respond. Button presses
are only honoured from `ALLOWED_CHAT_ID`, and completion writes through the same validated code path
as `/complete`, so both update your saved progress identically.

### Testing without waiting until morning

```bash
# See exactly what would be sent today (does not send)
curl -X POST "$SITE/api/skills/daily/preview" -H "Authorization: Bearer $ADMIN_SECRET" -d '{}'

# Preview any weekday: 0=Sun 1=Mon ... 6=Sat
curl -X POST "$SITE/api/skills/daily/preview" -H "Authorization: Bearer $ADMIN_SECRET" -d '{"weekday":0}'

# Really send it now, ignoring today's claim
curl -X POST "$SITE/api/skills/daily/send" -H "Authorization: Bearer $ADMIN_SECRET" -d '{"force":true}'

# Run exactly as the cron would; safe to repeat
curl -X POST "$SITE/api/skills/daily/send" -H "Authorization: Bearer $ADMIN_SECRET" -d '{}'

# Inspect delivery history
curl "$SITE/api/skills/deliveries" -H "Authorization: Bearer $ADMIN_SECRET"
```

`/learn` in Telegram sends the same daily lesson on demand, so you can always see it before 06:00.

## API routes

### News (existing, unchanged)

- `GET /api/health` — service status (does not reveal secrets)
- `GET /api/news?limit=500&region=Cambodia&q=bank&priority=RED` — news and summary statistics
- `POST /api/refresh` — protected RSS collection; requires `Authorization: Bearer ADMIN_SECRET`
- `POST /api/telegram/test` — protected test message to the configured chat
- `POST /api/telegram/webhook` — incoming Telegram updates; protected by webhook secret

### Skill Development (all require authorization)

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/skills/login` | Exchange the secret for a session cookie |
| POST | `/api/skills/logout` | Clear the session |
| GET | `/api/skills/session` | Check authentication |
| GET | `/api/skills/today` | Today's lesson, routine and session state |
| GET | `/api/skills/plan` | The full 30-day plan |
| GET | `/api/skills/lesson?day=N` | One lesson (answer key withheld) |
| GET | `/api/skills/progress` | Full progress tracker |
| POST | `/api/skills/progress` | Save lesson completion (idempotent) |
| POST | `/api/skills/quiz` | Grade a quiz answer |
| GET/POST | `/api/skills/journal` | Read or save journal entries |
| GET/POST | `/api/skills/assignments` | Read or save business assignments |
| GET | `/api/skills/assignments/templates` | Assignment templates |
| GET/POST | `/api/skills/preferences` | Reminder on/off |
| GET | `/api/skills/assessment` | 30-day final assessment |
| POST | `/api/skills/daily/preview` | Render today's lesson without sending (`weekday` override) |
| POST | `/api/skills/daily/send` | Run the delivery path (`force:true` to re-send) |
| GET | `/api/skills/deliveries` | Delivery history and failure log |

## Skill Development

### Opening it

Go to `YOUR_WORKER_URL/skills.html`, or click **My Skill Development** in the dashboard sidebar.
You are asked for `ADMIN_SECRET` — the same secret used for the news refresh button. A signed,
HttpOnly session cookie is then issued for 12 hours.

### How personal data is protected

Every `/api/skills/*` route requires authorization. Two forms are accepted:

1. `Authorization: Bearer <ADMIN_SECRET>` — for scripts and curl.
2. A signed session cookie from `POST /api/skills/login` — for the browser.

The cookie is HMAC-signed with `ADMIN_SECRET` and never contains the secret, so a stolen cookie
cannot be escalated back into the admin secret. All SQL uses bound parameters and all input is
length-capped server-side. Quiz answers are never sent to the browser; they are graded server-side.

### Curriculum seeding

Lesson content lives in `src/skills-data.js`, not in SQL, so it is versioned in one place. On the
first request after the tables exist, the Worker upserts the 30 lessons using `INSERT OR IGNORE`
against the `UNIQUE(day)` column, so seeding is idempotent and never duplicates a lesson. Each lesson
also has an `UPDATE` upsert, so curriculum edits are picked up on the next cold start.

### Progress correctness

All progress is derived from saved rows. Nothing is hardcoded:

- Lesson completion counts distinct completed `learning_sessions` rows.
- Per-skill percentages come from `GROUP BY skill` over the lesson and session tables.
- The streak walks backwards day by day from today in Cambodia time.
- Quiz accuracy uses `COUNT`/`SUM` over `quiz_attempts`.

`UNIQUE(session_date, day)` on `learning_sessions` makes marking the same day complete twice an
update rather than a duplicate insert. A day only counts as complete when all three routine steps are
ticked. `reminder_log` has `UNIQUE(kind, sent_date)` so a retried cron cannot double-send a reminder.

Assignment updates only write the fields present in the request, so editing one box never clears the rest.

## RSS feeds and limitations

The collector uses 25 feeds, all verified reachable from the deployed Worker. Each run pulls up to 15 items per feed and writes them to D1 in batches of 50.

**Feed reachability must be tested from the Worker, not from your own machine.** Cloudflare Workers egress from different IP addresses than your browser, and publishers filter per IP, so a feed can work locally and still return 403 from the Worker. A temporary admin-only `/api/probe` endpoint was used to confirm which feeds actually work from the deployed runtime; every feed listed here was verified that way rather than assumed.

### Cambodia coverage

Cambodia was initially collecting zero stories. Root cause and resolution:

- **Khmer Times** and **Phnom Penh Post** return HTTP 403 specifically to Cloudflare Workers egress, under both a bot and a browser user agent. This is IP-based filtering and cannot be bypassed in code. Both were removed.
- **Google News topic search** returns HTTP 503 from Workers, so it cannot be used as a fallback route.
- **Bing News RSS** responds but returns stale, low-quality results dated 2016-2024 behind `bing.com/news/apiclick.aspx` redirect URLs, so it was rejected despite returning 200.
- Working replacements: **Cambodia Daily**, **Thaiger Cambodia** (tag feed), **ASEAN Brief Cambodia** (search feed), plus **Lowy Interpreter** and **Thaiger SE Asia** for regional analysis.

Cambodia Daily publishes in Khmer. Its headlines contain no English keywords, so they fall to GREEN priority and would otherwise be attributed to Global. Feeds can declare a `defaultRegion`, which applies when keyword matching finds nothing, so Cambodia Daily rows are attributed to Cambodia. Verified that Khmer text is stored and served intact (no replacement characters).

Always open the original source and verify significant claims. Priority labels are heuristic triage, not a financial forecast or factual rating of the publisher.

### Classification accuracy

Region, category, and high-impact matching use alphanumeric word boundaries rather than substring matching. Substring matching produced false positives that corrupted the data: `"riel"` matched inside `"Espriella"` and tagged an unrelated Colombia story as Cambodia, and `"war"` matched inside `"award"`, `"toward"`, and `"warms"`, inflating the RED count roughly threefold (26 false REDs versus 9 genuine ones).

This starter does not include paid news APIs, paid AI analysis, user login, or a public multi-user admin panel. These can be added later. Do not add a private bot token to frontend code.

## Local development (optional)

Copy `.dev.vars.example` to `.dev.vars` and fill test credentials. Never commit `.dev.vars`.

```bash
npm run db:migrate:local
npm run dev
```

Use a separate test bot for local testing. Production is Cloudflare-hosted.

### Why not a `.env` file?

Cloudflare Workers does not load `.env` files. Wrangler reads secrets from **`.dev.vars`** for local
development and from encrypted Cloudflare secrets for production. A `.env` file would simply be ignored,
and the Worker would start with missing credentials.

| Purpose | File / command |
| --- | --- |
| Local secrets | `.dev.vars` (gitignored, never committed) |
| Local non-secret config | `[vars]` in `wrangler.toml` |
| Production secrets | `npx wrangler secret put NAME` |


## Troubleshooting

- **D1 error / missing table:** rerun the remote migration and check the `database_id` in `wrangler.toml`.
- **No live stories:** call `/api/refresh` with the admin secret; inspect `npx wrangler tail` for logs. Some feeds may fail.
- **Bot doesn't respond:** check webhook registration, the bot token, allowed chat ID, and `TELEGRAM_WEBHOOK_SECRET`. Use `getWebhookInfo` in Telegram Bot API.
- **No scheduled report:** confirm cron triggers are deployed and all Telegram secrets are set. Use `npx wrangler tail`.
- **Dashboard says preview mode:** `/api/news` may be failing or the database is empty. Open `/api/health` and inspect Worker logs.
- **Leaked token:** revoke it immediately with BotFather and replace the Cloudflare secret.

## Tests

Two suites. Neither needs a paid service.

### Curriculum integrity (offline, no database)

```bash
npm run check:curriculum
```

Validates 5 skills, 30 lessons, unique titles/explanations/examples, the exact day-to-skill rotation,
6 lessons per skill, 4 quiz options with a valid answer index, answer-index spread, substantive field
lengths, and absence of HTML tags or placeholders.

**Result: 24/24 passed.**

### API integration (needs a deployed Worker)

```bash
npm test
```

Uses `ADMIN_SECRET` from `.dev.vars`, or set `BASE_URL` and `ADMIN_SECRET` in the environment.
Covers authorization on private routes, session cookie issuing and expiry, curriculum reads, input
validation (`day=0`, `day=31`, `day=abc`, `day=-5`), idempotent completion, a partial routine not
counting as complete, quiz grading, journal create/edit, assignment create/partial-update,
preferences, assessment, and that the existing news API and stored news are unaffected.

**Result: 57/57 passed** against the live deployment with the 354 existing news stories intact.

### Manual checks

1. Open `YOUR_WORKER_URL/api/health` — expect `"ok":true`
2. Open `YOUR_WORKER_URL/api/skills/today` — expect `401`
3. Open `YOUR_WORKER_URL/api/skills/plan` with the `Authorization` header — expect 30 lessons
4. Send `/skills`, `/learn`, `/progress` in Telegram
5. Open `/skills.html`, sign in, tick the three routine blocks, save, and confirm Progress shows `1/30`
6. Resize the browser to phone width and confirm the layout still works

## What you must do manually

These cannot be automated:

1. **`npx wrangler login`** — opens a browser to authorize Wrangler.
2. **Create the Telegram bot** via @BotFather. Use a dedicated bot: Telegram permits one webhook per token, so reusing a token already deployed elsewhere breaks that service.
3. **Set the four secrets** with `npx wrangler secret put`.
4. **Register the webhook** once, after the first deploy.
5. **Send `/start`** to your bot so Telegram can deliver anything.
6. **Find your numeric chat ID** — send `/start`, then run `node telegram-check.cjs`.
7. **Enable daily lessons** — send `/reminder_on`, or use the toggle on the Telegram tab. Do not promise a 06:00 lesson before the cron trigger is deployed *and* this is switched on.
8. **Push to GitHub** — see the note below. `gh` is not required; Git Credential Manager handles it.

### Rotating ADMIN_SECRET

`ADMIN_SECRET` protects the Refresh button and every personal learning record. It must change in
**two** places, because a mismatch produces a confusing "Incorrect secret":

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"   # 1. generate
npx wrangler secret put ADMIN_SECRET                                             # 2. Cloudflare
# 3. edit the ADMIN_SECRET= line in .dev.vars                                     # 3. local
```

Verify before walking away — the new secret returns 200 and the old one 401:

```bash
curl -X POST "$SITE/api/skills/login" -H "content-type: application/json" -d '{"secret":"NEW"}'
```

Cloudflare takes a short moment to propagate a new secret. A `401` straight after `secret put`
usually means propagation rather than a failed rotation, so wait a minute and retest before assuming
it broke. Logins tolerate leading and trailing whitespace, so a stray space from copy-paste will not
lock you out.

### GitHub push: watch for the wrong account

This machine already had a GitHub credential cached for **`khmer24newskh-News`**, while the target
repository lives under **`upskillkh`**. A push then fails with a misleading message:

```text
remote: Permission to upskillkh/UpSkill.git denied to khmer24newskh-News.
fatal: ... 403
```

Nothing is wrong with the repository — the cached identity simply lacks write access. Check and fix:

```powershell
git credential-manager github list               # shows the cached account
git credential-manager github logout "<account>" # remove it
git push -u origin main                          # re-prompts; sign in as upskillkh
```

Git Credential Manager opens a browser window for this, so no token ever needs pasting into a chat.

## Known limitations

- Single user. There is no per-person login; one shared `ADMIN_SECRET` protects all personal data.
- Cambodia coverage depends on publishers that permit Cloudflare Workers traffic. Khmer Times and Phnom Penh Post return 403 from Workers, so Cambodia stories arrive via Cambodia Daily and regional feeds.
- Cambodia Daily publishes in Khmer, so its headlines do not match English priority keywords and usually score GREEN. A `defaultRegion` on the feed keeps them attributed to Cambodia.
- Priority labels are heuristic triage, not a financial forecast.
- Cron triggers are approximate and may fire slightly off the minute.

## Recommended next phase

1. Official-source economic indicators (National Bank of Cambodia, MEF, ADB).
2. AI-assisted story analysis using a server-side API key.
3. A weekly Cambodia market report.
4. Real per-user authentication and role-based access.
5. Export to PDF and a searchable opportunity tracker.
6. Lessons 31-90 as a second program, reusing the same tables.
