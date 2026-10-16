# Deployment checklist — Up Skill PWA

Live: `https://economic-intelligence-dashboard.upskillkh.workers.dev`

| | |
| --- | --- |
| Cloudflare account | `upskillkh@gmail.com` (`4e5183ecd6abf6c6e0345fec49e0ad3f`) |
| Worker | `economic-intelligence-dashboard` |
| D1 | `economic-intelligence-db` (`af176e6a-8321-4142-8708-5e255cb0a50c`) |
| Cron | `0 0,11,23 * * *` — 06:00 lesson, 07:00 and 18:00 news (1 of 5 slots) |
| Telegram bot | `@upskill4mebot` |

## 0. Confirm the account first

```powershell
npx wrangler whoami    # must print upskillkh@gmail.com
```

Every command below creates resources in the account you are signed in to.

## 1. Database

```powershell
npx wrangler d1 create economic-intelligence-db
```
Copy the `database_id` into `wrangler.toml`. Then:

```powershell
npx wrangler d1 migrations apply economic-intelligence-db --remote
```

All six migrations must report success:

- `0001_init.sql` — news table
- `0002_skills.sql` — skill development tables
- `0003_seed_skills.sql` — five skills
- `0004_skill_delivery.sql` — daily delivery tracking
- `0005_platform_users.sql` — **multi-user platform** (rebuilds four single-user
  tables with `user_id` scoping; copies existing rows to owner account id 1)
- `0006_rate_limits.sql` — rate limiting

> **Rehearse locally first.** `0005` rebuilds tables and SQLite cannot undo it
> once applied. Run `npx wrangler d1 migrations apply economic-intelligence-db --local`
> before the remote run.

Verify the news survived:

```powershell
npx wrangler d1 execute economic-intelligence-db --remote --command "SELECT COUNT(*) FROM stories"
```

## 2. Secrets

```powershell
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put ALLOWED_CHAT_ID
npx wrangler secret put TELEGRAM_WEBHOOK_SECRET
npx wrangler secret put ADMIN_SECRET
```

The AI coach secret is optional; without it the coach returns a clear
"not configured" message and everything else keeps working.

## 3. Deploy

```powershell
npx wrangler deploy
```

Set `SITE_URL` in `wrangler.toml` `[vars]` to the deployed URL first.

## 4. Routes to check

| URL | Expect |
| --- | --- |
| `/` | Economic Intelligence dashboard, live news |
| `/welcome.html` | Up Skill PWA landing, registration |
| `/skills.html` | Learning plan (needs `ADMIN_SECRET` today) |
| `/manifest.webmanifest` | PWA manifest |
| `/sw.js` | Service worker |
| `/api/health` | `"ok": true` |
| `/api/platform/health` | `{"lessons":30}` |

## 5. Telegram webhook

One-time, after the first deploy. **`callback_query` is required** or the lesson
buttons do nothing:

```bash
curl "https://api.telegram.org/botYOUR_TOKEN/setWebhook?url=https://YOUR_URL/api/telegram/webhook&secret_token=YOUR_WEBHOOK_SECRET&allowed_updates=%5B%22message%22,%22callback_query%22%5D"
```

Send `/start`, then `/skills`, `/learn`, `/progress`.

## 6. Run the tests

```powershell
npm run check:curriculum   # 24 offline content checks
npm test                   # 95 legacy API checks
npm run test:platform      # 41 multi-user checks
```

All three must pass before you ship. If the platform suite reports 429, the
registration rate limiter is shared across runs:

```powershell
npx wrangler d1 execute economic-intelligence-db --remote --command "DELETE FROM rate_limits"
```

## 7. Manual steps you must do

1. **Set the owner account password.** The account created by migration 0005 has
   placeholder credentials. It must be replaced before anyone relies on it.
2. **Create a GitHub fine-grained token** if you want the Web CLI to work. The
   `gh` CLI is not required; Git Credential Manager handles the push.
3. **Decide on translation review.** Khmer lessons are marked
   `review_status = 'machine'` and should be human-reviewed before being
   presented as vetted content.
4. **Register a real contact address** in `welcome.html` in place of
   `support@upskill.example`.

## 8. Rollback

Migrations are additive, so rolling back the Worker alone is safe:

```powershell
# redeploy the previous version
npx wrangler deployments list --name economic-intelligence-dashboard
npx wrangler rollback [VERSION_ID] --name economic-intelligence-dashboard
```

The tables from `0005` and `0006` are simply left unused. **Do not delete them**
— they still hold the migrated personal records.

There is no down-migration for `0005` because SQLite cannot restore a dropped
UNIQUE constraint. If you must revert the schema, restore from the export:

```powershell
npx wrangler d1 export economic-intelligence-db --remote --output backup.sql
```

## 9. Known limitations

- Registration has no email verification and no password reset.
- `/api/skills/*` still uses one shared secret; the personal dashboard has not
  been moved onto real accounts yet.
- AI coach, admin content management, multi-user Telegram linking and
  subscriptions are schema-ready but not implemented.
