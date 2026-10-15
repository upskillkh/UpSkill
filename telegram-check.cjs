// Temporary helper: verify Telegram credentials and discover the chat ID.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname);
const varsFile = path.join(root, '.dev.vars');
const vars = Object.fromEntries(
  fs.readFileSync(varsFile, 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.trim() && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const token = vars.TELEGRAM_BOT_TOKEN;
const api = (m) => fetch(`https://api.telegram.org/bot${token}/${m}`).then((r) => r.json());

(async () => {
  if (!token) {
    console.log('NO TOKEN in .dev.vars');
    process.exit(1);
  }

  const wh = await api('getWebhookInfo');
  if (wh.ok) {
    console.log('webhook url :', wh.result.url || '(none)');
    console.log('pending     :', wh.result.pending_update_count);
    console.log('last error  :', wh.result.last_error_message || '(none)');
  }

  const up = await api('getUpdates?limit=50');
  if (!up.ok) {
    console.log('getUpdates ERROR:', up.description);
    return;
  }
  console.log('pending updates:', up.result.length);

  const chats = {};
  for (const u of up.result) {
    const m = u.message || u.edited_message;
    if (!m || !m.chat) continue;
    const id = m.chat.id;
    chats[id] = chats[id] || {
      type: m.chat.type,
      name: [m.chat.first_name, m.chat.last_name].filter(Boolean).join(' '),
      username: m.chat.username || '',
      text: (m.text || '').slice(0, 40),
      count: 0,
    };
    chats[id].count++;
  }

  const ids = Object.keys(chats);
  if (!ids.length) {
    console.log('');
    console.log('>>> NO CHAT FOUND. Open Telegram, send /start to @Khmer24NewsBot, then rerun this script.');
    return;
  }
  console.log('');
  for (const id of ids) {
    const c = chats[id];
    console.log(`chat_id=${id}  type=${c.type}  name="${c.name}"  @${c.username || '-'}  msgs=${c.count}  last="${c.text}"`);
  }
})();
