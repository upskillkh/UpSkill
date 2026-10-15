# Economic Intelligence Website — Cloudflare Edition

A cloud-first business intelligence dashboard for Cambodia → ASEAN → Global, with RSS collection, Cloudflare D1 storage, Telegram commands, and scheduled reports.

This project is a **deployment-ready starter**. It is not already deployed to your Cloudflare account. You must create the Cloudflare resources and add your private Telegram secrets using the steps below.

## Included

- Responsive business intelligence website with search, region filters, priority tags, regional coverage, and opportunity prompts.
- Cloudflare Worker API and D1 database.
- RSS collector for a set of business/economic feeds; feed availability can change.
- Telegram bot commands: `/start`, `/help`, `/today`, `/cambodia`, `/asean`, `/global`, `/opportunities`, `/refresh`.
- Automatic Telegram briefings at **07:00 and 18:00 Cambodia time** (Cloudflare cron uses UTC).
- Private admin endpoints protected by `ADMIN_SECRET`.
- Telegram webhook protected by Telegram's webhook secret header.
- Dashboard sample content is clearly labelled as a preview when the database has no collected stories.

## Architecture

Browser → Cloudflare Worker → Cloudflare D1  
Cloudflare Cron → RSS feeds → D1 → Telegram Bot API  
Telegram webhook → Worker → D1 → Telegram Bot API

Everything runs in the cloud after deployment; the website does not depend on your Windows PC.

## Requirements

- Cloudflare account
- Node.js LTS and npm for deployment from your computer
- Telegram bot token from `@BotFather`
- Your Telegram numeric chat ID
- Optional custom domain

Your computer is only used to upload/deploy the project. The deployed service runs on Cloudflare.

### Windows PowerShell note

PowerShell's default execution policy blocks `npm.ps1` and `npx.ps1`, which makes every `npm` / `npx` command in this guide fail with:

```text
npm.ps1 cannot be loaded because running scripts is disabled on this system
```

You have two options. Either is fine.

**Option A — use the `.cmd` wrappers (no system change, recommended to start).**
Replace every `npm` / `npx` in this guide with `npm.cmd` / `npx.cmd`:

```powershell
npm.cmd install
npx.cmd wrangler login
npx.cmd wrangler d1 create economic-intelligence-db
```

**Option B — allow the scripts once per user account.** Open PowerShell as Administrator and run:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

This permits locally created scripts, which is the normal setting for developer machines. It affects your user account only, not the whole machine.


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

## Scheduled reports

Cloudflare Workers cron expressions use UTC. This project uses:
- `0 0 * * *` = 07:00 Asia/Phnom_Penh
- `0 11 * * *` = 18:00 Asia/Phnom_Penh

The schedule is configured in `wrangler.toml`. Cron triggers are approximate scheduling infrastructure and may run with normal platform scheduling variation.

## API routes

- `GET /api/health` — service status (does not reveal secrets)
- `GET /api/news?limit=50&region=Cambodia&q=bank&priority=RED` — news and summary statistics
- `POST /api/refresh` — protected RSS collection; requires `Authorization: Bearer ADMIN_SECRET`
- `POST /api/telegram/test` — protected test message to the configured chat
- `POST /api/telegram/webhook` — incoming Telegram updates; protected by webhook secret

## RSS feeds and limitations

The collector attempts feeds from Khmer Times, CNA, CNBC (World and Finance), Nikkei Asia, ASEAN Briefing, and The Thaiger. Feed URLs and access policies change over time; a failed feed is skipped and the others continue. Some publishers block requests by source IP rather than by user agent, which code cannot work around: **Khmer Times currently returns HTTP 403 to Cloudflare Workers**, so Cambodia-specific coverage is limited until it is reachable. Always open the original source and verify significant claims. Priority labels are heuristic triage, not a financial forecast or factual rating of the publisher.

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

## Recommended next phase

After this version works, add:
1. official-source economic indicators,
2. AI-assisted story analysis using a server-side API key,
3. weekly Cambodia market report,
4. user authentication and role-based access,
5. export to PDF and a searchable opportunity tracker.
