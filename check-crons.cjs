// Report cron trigger usage per Worker across every Cloudflare account the
// current wrangler login can see. No hardcoded account IDs, so this keeps
// working after an account migration.
//
//   node check-crons.cjs

const fs = require('fs');
const path = require('path');
const os = require('os');

const cfgPath = path.join(os.homedir(), 'AppData', 'Roaming', 'xdg.config', '.wrangler', 'config', 'default.toml');

let token;
try {
  const cfg = fs.readFileSync(cfgPath, 'utf8');
  token = cfg.match(/oauth_token\s*=\s*"([^"]+)"/)[1];
} catch {
  console.error('wrangler OAuth token not found. Run: npx wrangler login --device');
  process.exit(1);
}

const headers = { Authorization: `Bearer ${token}` };
const api = (p) => fetch(`https://api.cloudflare.com/client/v4${p}`, { headers }).then((r) => r.json());

(async () => {
  const accounts = await api('/accounts');
  if (!accounts.success || !accounts.result?.length) {
    console.error('Could not list accounts. Run: npx wrangler whoami');
    process.exit(1);
  }

  let grandTotal = 0;
  for (const acc of accounts.result) {
    console.log(`\naccount: ${acc.name}  (${acc.id})`);

    const scripts = await api(`/accounts/${acc.id}/workers/scripts`);
    const list = scripts.result || [];
    let total = 0;

    for (const w of list) {
      const r = await api(`/accounts/${acc.id}/workers/scripts/${w.id}/schedules`);
      const schedules = (r.result && r.result.schedules) || [];
      total += schedules.length;
      console.log(`  ${w.id.padEnd(42)} ${String(schedules.length).padStart(2)}  ${schedules.map((s) => s.cron).join('  |  ')}`);
    }
    console.log(`  ${'TOTAL'.padEnd(42)} ${String(total).padStart(2)} / 5  (Workers Free limit)`);
    grandTotal += total;
  }

  console.log(`\nAll accounts: ${grandTotal}/5 cron slots in use.`);
})();
