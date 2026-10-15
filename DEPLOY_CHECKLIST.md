# Deployment checklist

## A. First-time setup (new machine or new account)

- [ ] Install Node.js LTS
- [ ] Extract the ZIP and run `npm install`
- [ ] On Windows PowerShell, either run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` in an
      Administrator prompt, or use the `.cmd` wrappers (`npm.cmd`, `npx.cmd`) throughout
- [ ] Run `npx wrangler login`
- [ ] Create the D1 database: `npx wrangler d1 create economic-intelligence-db`
- [ ] Copy the printed `database_id` into `wrangler.toml`

## B. Database migrations

- [ ] `npx wrangler d1 migrations apply economic-intelligence-db --remote`
- [ ] Confirm all four migrations report success:
      `0001_init.sql`, `0002_skills.sql`, `0003_seed_skills.sql`, `0004_skill_delivery.sql`
- [ ] Confirm existing news is intact: `npx wrangler d1 execute economic-intelligence-db --remote --command "SELECT COUNT(*) FROM stories"`

## C. Secrets (never put these in `wrangler.toml` or frontend code)

- [ ] `npx wrangler secret put TELEGRAM_BOT_TOKEN` — from a **dedicated** @BotFather bot
- [ ] `npx wrangler secret put ALLOWED_CHAT_ID` — your numeric chat ID
- [ ] `npx wrangler secret put TELEGRAM_WEBHOOK_SECRET`
- [ ] `npx wrangler secret put ADMIN_SECRET` — protects personal learning data

## D. Deploy

- [ ] Set `SITE_URL` in `wrangler.toml` `[vars]` to the deployed workers.dev URL
- [ ] `npx wrangler deploy`
- [ ] Note the printed URL, e.g. `https://<name>.<account>.workers.dev`
- [ ] Verify `https://<url>/api/health` returns `"ok": true`

## E. Telegram

- [ ] Register the webhook (one-time, after the first deploy). **`allowed_updates` must include
      `callback_query` or the lesson buttons will not respond:**

```bash
curl "https://api.telegram.org/botYOUR_TOKEN/setWebhook?url=YOUR_URL/api/telegram/webhook&secret_token=YOUR_WEBHOOK_SECRET&allowed_updates=%5B%22message%22,%22callback_query%22%5D"
```

- [ ] Response contains `"ok": true`
- [ ] Send `/start` to the bot
- [ ] Try `/skills`, `/learn`, `/progress`, `/complete`
- [ ] Confirm the scheduled slots: `wrangler.toml` shows `crons = ["0 0,11,23 * * *"]`
      meaning 07:00, 18:00 and 06:00 Cambodia time

## E2. Daily 06:00 lesson

- [ ] Reminders are on: send `/reminder_on` in Telegram (or use the website toggle)
- [ ] Preview today's message without sending it:

```bash
curl -X POST "YOUR_URL/api/skills/daily/preview" -H "Authorization: Bearer YOUR_ADMIN_SECRET" -d '{}'
```

- [ ] Preview Sunday's review without waiting: `{"weekday":0}`
- [ ] Send it once, for real: `{"force":true}`
- [ ] Run the scheduled path twice and confirm the second returns `"already_delivered"`:
      `{"force":false}`
- [ ] Confirm exactly one row for today: `curl "YOUR_URL/api/skills/deliveries" -H "Authorization: Bearer YOUR_ADMIN_SECRET"`
- [ ] Tap **✅ Mark Complete** in Telegram and confirm progress increases

## F. Skill Development first run

- [ ] Open `https://<url>/skills.html`
- [ ] Sign in with `ADMIN_SECRET`
- [ ] Today's lesson loads (Day 1)
- [ ] Tick all three routine blocks and press **Save today's progress**
- [ ] Confirm the Progress Tracker now shows `1/30`
- [ ] Open **Apply to My Business** and start an assignment
- [ ] Write a Learning Journal entry
- [ ] In Telegram send `/reminder_on`

## G. Verification

- [ ] `npm test` → all checks pass (requires `ADMIN_SECRET` in `.dev.vars`)
- [ ] `npm run check:curriculum` → 24/24
- [ ] News dashboard still loads at `https://<url>/`
- [ ] `npx wrangler tail` shows no errors

## H. Things that must be done manually (cannot be automated)

1. **Authorizing Wrangler with Cloudflare** — `npx wrangler login` opens a browser.
2. **Creating the Telegram bot** — only @BotFather can issue tokens.
3. **Registering the webhook** — must happen once after the first deploy, and must include `callback_query` in `allowed_updates`.
4. **Sending `/start` to the bot** — required before Telegram can deliver anything.
5. **Knowing your numeric chat ID** — send `/start`, then run `node telegram-check.cjs`.
6. **Enabling daily lessons** — send `/reminder_on`. Do not promise a 06:00 lesson before the cron
   trigger is deployed *and* this is switched on.
7. **GitHub push** — run `gh auth login` first if the CLI is not authenticated.

## I. Known limitations to be aware of

- Cambodia coverage depends on publishers that allow Cloudflare Workers traffic. Khmer Times and
  Phnom Penh Post block it, so Cambodia coverage comes from Cambodia Daily and regional feeds.
- The 06:00 daily lesson only arrives after the Worker is deployed with the cron trigger AND
  `/reminder_on` has been sent. Do not promise a lesson before both are done.
- Workers Free allows 5 cron triggers per account. The project uses exactly one cron string
  (`0 0,11,23 * * *`) which covers 07:00, 18:00 and 06:00 Cambodia time.
- Cloudflare cron is approximate. A 06:00 lesson can arrive a minute or two either side of 06:00.
- Personal data is single-user and protected by one shared secret. There is no per-user login.
