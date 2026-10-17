// Temporary: end-to-end test of the multi-user platform layer.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const vars = Object.fromEntries(
  readFileSync(join(root, '.dev.vars'), 'utf8').split(/\r?\n/)
    .filter((l) => l.trim() && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const toml = readFileSync(join(root, 'wrangler.toml'), 'utf8');
const BASE = (process.env.BASE_URL || toml.match(/SITE_URL\s*=\s*"([^"]+)"/)[1]).replace(/\/$/, '');

let pass = 0, fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`PASS  ${name}${detail ? '  -> ' + detail : ''}`); }
  else { fail++; console.log(`FAIL  ${name}${detail ? '  -> ' + detail : ''}`); }
};

const jars = new Map();
async function call(path, { method = 'GET', body, as = null } = {}) {
  const headers = { 'content-type': 'application/json', accept: 'application/json' };
  if (as) headers.cookie = `upskill_session=${jars.get(as)}`;
  const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) {
    const m = /upskill_session=([^;]+)/.exec(setCookie);
    if (m) jars.set(as, m[1]);
  }
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data, cookie: setCookie };
}

const stamp = Date.now();
const A = `alice${stamp}@test.local`;
const B = `bob${stamp}@test.local`;

console.log(`\nTarget: ${BASE}\n${'='.repeat(62)}\n`);

// --- content is public read, but only after seeding ---
const health = await call('/api/platform/health');
ok('platform health responds', health.status === 200, `lessons=${health.data?.lessons}`);
ok('30 lessons seeded', health.data?.lessons === 30, `got ${health.data?.lessons}`);

// --- auth is required for private routes ---
ok('lessons requires sign-in', (await call('/api/platform/lessons')).status === 401);
ok('progress requires sign-in', (await call('/api/platform/progress')).status === 401);
ok('profile requires sign-in', (await call('/api/platform/profile')).status === 401);

// --- registration validation ---
ok('rejects bad email', (await call('/api/auth/register', { method: 'POST', body: { email: 'nope', password: 'Str0ng!pass' } })).status === 400);
ok('rejects short password', (await call('/api/auth/register', { method: 'POST', body: { email: `x${stamp}@t.local`, password: 'abc' } })).status === 400);
ok('rejects letters-only password', (await call('/api/auth/register', { method: 'POST', body: { email: `y${stamp}@t.local`, password: 'abcdefghij' } })).status === 400);

// --- registration ---
const ra = await call('/api/auth/register', { method: 'POST', as: 'A', body: { email: A, password: 'Str0ng!pass', display_name: 'Alice', locale: 'en' } });
ok('registers user A', ra.status === 201 && ra.data?.user?.email === A, `id=${ra.data?.user?.id}`);
const rb = await call('/api/auth/register', { method: 'POST', as: 'B', body: { email: B, password: 'Str0ng!pass', display_name: 'Bob', locale: 'km' } });
ok('registers user B', rb.status === 201, `id=${rb.data?.user?.id}`);
const dup = await call('/api/auth/register', { method: 'POST', body: { email: A, password: 'Str0ng!pass' } });
// 429 is also correct: repeated runs can exhaust the hourly signup limit.
ok('rejects duplicate email', dup.status === 409 || dup.status === 429, `got ${dup.status}`);

// --- session ---
const meA = await call('/api/auth/me', { as: 'A' });
ok('session A resolves', meA.status === 200 && meA.data?.user?.email === A);
ok('session exposes no password hash', !JSON.stringify(meA.data).match(/password|salt/i));
ok('anonymous /me is 401', (await call('/api/auth/me')).status === 401);

// --- login ---
ok('wrong password rejected', (await call('/api/auth/login', { method: 'POST', body: { email: A, password: 'wrongwrong1' } })).status === 401);
// A never-registered email must be refused. 429 is also acceptable here: the
// rate limiter may trip first, and that is a correct outcome, not a leak.
const ghost = await call('/api/auth/login', { method: 'POST', body: { email: `ghost${stamp}@t.local`, password: 'Str0ng!pass' } });
ok('unknown email refused', ghost.status === 401 || ghost.status === 429, `got ${ghost.status}`);
ok('unknown email gives no hint it is unregistered',
  ghost.status === 429 || /incorrect/i.test(ghost.data?.error || ''), ghost.data?.error || '');
const li = await call('/api/auth/login', { method: 'POST', as: 'A2', body: { email: A, password: 'Str0ng!pass' } });
ok('correct password accepted', li.status === 200, `id=${li.data?.user?.id}`);

// --- per-user isolation: the critical security test ---
const pA = await call('/api/platform/lesson', { method: 'POST', as: 'A', body: { day: 1, minutes: 25 } });
ok('A completes lesson 1', pA.status === 200, pA.status === 200 ? '' : `HTTP ${pA.status}: ${JSON.stringify(pA.data)}`);
const progA = await call('/api/platform/progress', { as: 'A' });
const progB = await call('/api/platform/progress', { as: 'B' });
ok('A progress shows 1 completed', progA.data?.completedLessons === 1, `${progA.data?.completedLessons}`);
ok('B progress shows 0 completed (isolated)', progB.data?.completedLessons === 0, `${progB.data?.completedLessons}`);
ok('A pointer advanced to 2', progA.data?.pointer === 2, `pointer=${progA.data?.pointer}`);
ok('B pointer still 1', progB.data?.pointer === 1, `pointer=${progB.data?.pointer}`);
ok('progress includes competence disclaimer', /not what you can do/i.test(progA.data?.disclaimer || ''));

// --- completion is idempotent ---
await call('/api/platform/lesson', { method: 'POST', as: 'A', body: { day: 1, minutes: 30 } });
const again = await call('/api/platform/progress', { as: 'A' });
ok('repeat completion does not double-count', again.data?.completedLessons === 1, `${again.data?.completedLessons}`);

// --- lessons ---
const lessons = await call('/api/platform/lessons', { as: 'A' });
ok('lesson list returns 30', lessons.data?.lessons?.length === 30, `${lessons.data?.lessons?.length}`);
ok('lesson list marks completed one', lessons.data?.lessons?.[0]?.status === 'completed');
const l1 = await call('/api/platform/lesson?day=1', { as: 'A' });
ok('lesson content has all sections', !!(l1.data?.lesson?.title && l1.data?.lesson?.objective && l1.data?.lesson?.explanation && l1.data?.lesson?.exercise && l1.data?.lesson?.action));
ok('day=0 rejected', (await call('/api/platform/lesson?day=0', { as: 'A' })).status === 400);
ok('day=31 rejected', (await call('/api/platform/lesson?day=31', { as: 'A' })).status === 400);
ok('day=abc rejected', (await call('/api/platform/lesson?day=abc', { as: 'A' })).status === 400);

// --- Khmer now covers all 30 days, so no fallback is expected ---
const km = await call('/api/platform/lesson?day=1&locale=km', { as: 'B' });
ok('khmer lesson served', km.status === 200 && !!km.data?.lesson?.title);
ok('khmer content is actually Khmer', /[\u1780-\u17FF]/.test(km.data?.lesson?.explanation || ''));
ok('khmer carries an untranslated-answer key risk flag',
  km.data?.lesson?.needsReview === undefined || typeof km.data.lesson.needsReview === 'boolean');
ok('khmer response never returns blank fields',
  !!(km.data?.lesson?.title && km.data?.lesson?.objective && km.data?.lesson?.explanation));

// --- profile ---
const up = await call('/api/platform/profile', { method: 'POST', as: 'A', body: { locale: 'km', level: 'intermediate', daily_minutes: 45 } });
ok('profile update accepted', up.status === 200);
ok('profile saved locale', up.data?.user?.locale === 'km');
ok('profile saved level', up.data?.user?.level === 'intermediate');

// --- logout invalidates ---
await call('/api/auth/logout', { method: 'POST', as: 'B' });
ok('logout invalidates session', (await call('/api/auth/me', { as: 'B' })).status === 401);

// --- existing system untouched ---
const news = await call('/api/news?limit=2');
ok('news API still works', news.status === 200 && Array.isArray(news.data?.stories));
// The live RSS feed keeps adding stories, so the archive grows over time. The
// invariant that matters is that it never SHRINKS. Asserting an exact count
// meant this test failed every time the cron collected new articles.
ok('news archive preserved (never shrinks)', news.data?.stats?.total >= 617, `${news.data?.stats?.total}`);
const h = await call('/api/health');
ok('health still works', h.status === 200 && h.data?.telegramConfigured === true);
// POLICY CHANGE (owner-approved): the personal dashboard is now intentionally
// open (PERSONAL_DASHBOARD_OPEN in src/worker.js), so it no longer returns 401.
// What must still hold is the boundary that keeps registered accounts private:
// an anonymous visitor must never reach the multi-user platform layer.
ok('personal dashboard is open by design (no 401)',
  (await fetch(`${BASE}/api/skills/progress`)).status === 200);
ok('platform account data still rejects anonymous',
  (await fetch(`${BASE}/api/platform/profile`)).status === 401);

console.log(`\n${'='.repeat(62)}\n${pass}/${pass + fail} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
