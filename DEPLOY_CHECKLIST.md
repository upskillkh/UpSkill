# Cloudflare deployment checklist

- [ ] Install Node.js LTS
- [ ] Extract ZIP and run `npm install`
- [ ] Run `npx wrangler login`
- [ ] Create D1 database and copy database ID into `wrangler.toml`
- [ ] Apply remote D1 migration
- [ ] Set `TELEGRAM_BOT_TOKEN`
- [ ] Set `ALLOWED_CHAT_ID`
- [ ] Set `TELEGRAM_WEBHOOK_SECRET`
- [ ] Set `ADMIN_SECRET`
- [ ] Run `npx wrangler deploy`
- [ ] Register Telegram webhook using the deployed Worker URL
- [ ] Send `/start` to the bot
- [ ] Run secured `/api/refresh`
- [ ] Open website and verify real news appears
- [ ] Check scheduled cron triggers and Worker logs
