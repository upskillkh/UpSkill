// Report current cron trigger usage per worker on the account.
const fs = require('fs');
const path = require('path');
const os = require('os');

const cfgPath = path.join(os.homedir(), 'AppData', 'Roaming', 'xdg.config', '.wrangler', 'config', 'default.toml');
const accountId = 'd31d2f7e8dab240f38a8bc37901b0f82';
const cfg = fs.readFileSync(cfgPath, 'utf8');
const token = cfg.match(/oauth_token\s*=\s*"([^"]+)"/)[1];

(async () => {
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const j = await r.json();
  let total = 0;
  for (const w of j.result || []) {
    const s = await (
      await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${w.id}/schedules`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    ).json();
    const list = (s.result && s.result.schedules) || [];
    total += list.length;
    console.log(`${w.id}  (${list.length}):  ${list.map((x) => x.cron).join('  |  ') || '(none)'}`);
  }
  console.log(`\nTOTAL ${total}/5 cron slots used`);
})();
