# Security and privacy notes — Up Skill PWA

Last updated: 2026-10-16. Covers the multi-user platform layer added in
migrations `0005_platform_users.sql` and `0006_rate_limits.sql`.

## Accounts and authentication

- Passwords are hashed with **PBKDF2-SHA256, 100,000 iterations** using
  WebCrypto, with a unique 16-byte random salt per user. No plaintext is stored
  and no password is ever logged.
- There is no third-party auth dependency, so no new supply-chain surface.
- Sessions are 32-byte random tokens. Only a **SHA-256 hash** of the token is
  stored, so a database dump cannot be replayed as a login.
- Session cookies are `HttpOnly`, `SameSite=Lax`, and `Secure` over HTTPS.
  They are not readable from JavaScript, which limits the blast radius of any
  cross-site scripting bug.
- Sessions expire after 30 days and can be revoked by logging out.
- An unknown email still performs a PBKDF2 verification so response timing does
  not reveal which addresses are registered.

### The migrated owner account

Migration `0005` created user id 1 with placeholder credentials so that the
existing personal learning records had somewhere to belong. A real password has
since been set. **This account has `role = 'admin'`**, so it can reach anything
once the admin surface exists.

## Authorisation

- Every `/api/platform/*` route resolves a user from the signed cookie. There is
  no global "current user" and no route that trusts a user id from the request
  body, query string or header.
- Every learning query is filtered by `user_id`. This is enforced in the SQL,
  not in application code, so a forgotten `WHERE` clause is visible in review.
- Tables that previously carried a single-user UNIQUE constraint
  (`learning_sessions`, `learning_journal`, `reflections`, `lesson_deliveries`)
  were rebuilt with `(user_id, …)` uniqueness. This was verified rather than
  assumed: the platform suite registers two accounts and asserts that
  completing a lesson for one does not change the other's progress.
- The legacy `ADMIN_SECRET` guard still protects the original single-user
  routes. Both mechanisms coexist during the migration.

## ⚠️ The personal dashboard is currently OPEN (no sign-in)

**Read this before sharing the URL with anyone.**

On the owner's instruction, `PERSONAL_DASHBOARD_OPEN` in `src/worker.js` is set
to `true`. While it is true:

- **Every** `/api/skills/*` route is readable **and writable** with no
  credential of any kind — no password, no cookie, no token.
- Exposed data includes the learning journal, business assignments,
  reflections, quiz answers, progress records and reminder preferences.
- A visitor can also **write** to that data: post journal entries, complete
  lessons, and alter progress records.
- The hostname is a public `workers.dev` address. The link is the only secret,
  and it has been shared in chat history. Treat anything written there as
  potentially readable by anyone who obtains it.

What is **not** affected:

- `/api/platform/*` still requires a real signed-in account and still returns
  401 to anonymous callers. Registered users cannot read each other's records.
- `ADMIN_SECRET`, `TELEGRAM_BOT_TOKEN` and the Telegram webhook secret are
  unaffected and still required for the scheduled jobs.
- The news API, scheduled reports and Telegram bot are unchanged.

**To lock the dashboard again:** set `PERSONAL_DASHBOARD_OPEN = false` in
`src/worker.js` and run `npx wrangler deploy`. No client change is needed — the
sign-in form is still present in `public/skills.html` and works unchanged. The
test suites assert the open-mode policy, so update the three assertions named in
the commit that introduced it when you flip it back.

## AI Learning Coach

- The provider key (`AI_API_KEY`) is a Cloudflare **secret**. It is read only
  from the Worker environment and is never returned to a client, written to a
  log, or included in an error. `GET /api/platform/ai/status` reports only
  whether a key exists and which model, and it never calls the provider, so it
  cannot be used to probe or spend quota.
- **When no key is configured the coach does not pretend.** It returns a
  deterministic answer assembled from the learner's own records and sets
  `mode: "fallback"` and `isAI: false`. The UI states this in the learner's
  face. There is no code path that produces fabricated AI output.
- If a provider call fails or times out (20 s), the coach degrades to the same
  fallback rather than surfacing an error or an empty answer.
- Provider error bodies are never logged, because some providers echo request
  headers back in the error and that would put the key in the logs.
- Learner input is stripped of control characters, capped at 2,000 characters,
  and wrapped in `<learner_input>` delimiters. The system prompt states
  explicitly that the wrapped text is data and must never be followed as an
  instruction.
- Cost control: every call is counted in `ai_usage` per user per day and capped
  by the user's plan allowance. The remaining quota is returned to the client.
- Consent: a coach exchange is only written to `coach_sessions` when the
  request explicitly sends `consent: true`. History is readable and deletable by
  the owner of the account.
- **The model never judges ability.** Proficiency is computed in SQL from
  completed lessons, quiz answers and lab submissions. The assessment caveat is
  returned to the learner in their own language.

## Telegram

- The bot is restricted to `ALLOWED_CHAT_ID`. Unknown chats receive a refusal.
- The webhook endpoint rejects any request whose `x-telegram-secret` does not
  match `TELEGRAM_WEBHOOK_SECRET`.
- Learning commands are consulted **only after** every pre-existing news
  command, and return `null` for anything they do not own, so no existing
  command's behaviour can change. A failure inside a learning command returns a
  message and leaves the news commands working.
- Account linking uses a short single-use code (6 characters from a 32-symbol
  alphabet with no ambiguous `0/O/1/I`). A code is invalidated on use and is
  scoped to one account.
- `/unlink` clears the chat binding only. It does not touch the account.
- **Multi-user broadcast delivery is NOT enabled.** `telegram_links` and
  `notification_deliveries` exist and are enforced by a
  `UNIQUE(user_id, kind, scheduled_for)` constraint so duplicate sends are
  structurally impossible, but the scheduled job still delivers to the owner
  chat only. Enabling fan-out is a deliberate next step, not a default.

## Data integrity

- Migrations 0001-0006 pre-date this work and are untouched. Migrations 0007
  and 0008 are **additive only**: they create new tables and add columns to
  `skills`. No existing table is dropped, renamed or rewritten, so every stored
  news item and every learning record survives.
- Verified after applying: 617+ stories, 30 `skill_lessons`, 30 `lessons`, 60
  `lesson_translations`, all users, assignments and journal entries intact.
- News count assertions in the test suites use `>= 617`, not `== 617`. The live
  RSS collector adds stories continuously, so an exact-count assertion was a
  latent test failure that had nothing to do with the code under test.
- **Migration 0005 has no down-migration.** It rebuilds four tables to change a
  UNIQUE constraint, which SQLite cannot do with ALTER. Rolling that back means
  restoring from the D1 export taken before this work
  (`backup/pre-2027-*/d1-full.sql`).

## Abuse controls

| Action | Limit |
| --- | --- |
| Registration | 5 per IP per hour |
| Login | 10 per IP+email per 5 minutes |
| AI coach | Per-user daily request and token budget (see `ai_usage`) |

The limiter is a fixed-window counter in `rate_limits`. It is intentionally
simple: it is per-isolate accurate, not globally exact. A distributed flood
would need a Durable Object or WAF rule to be fully mitigated.

## Input validation

- All SQL uses bound parameters. No string interpolation into queries.
- Every free-text field is length-capped server-side, so an oversized payload is
  truncated rather than stored.
- `day` is validated as an integer in `1..30` on every route that accepts it.
- Email and password format are validated before any database work.
- Free-text fields are rendered with an escaping helper in the frontend.

## What is deliberately not cached

The service worker **never caches anything under `/api/`**. Lesson bodies,
progress, journal entries and coach conversations are per-user data; caching
them in shared Cache Storage would expose one account's records to the next
person who uses the same browser or device. Only the app shell and icons are
precached.

## AI data handling

- The AI provider key is read from a Cloudflare secret and never reaches the
  browser or the repository.
- Coach conversations are stored only after explicit per-user consent
  (`coach_sessions.consent_at`).
- Users can delete their stored coaching history.
- AI output is labelled as AI-generated in the interface.
- The progress API returns a disclaimer stating that lesson completion measures
  engagement, not professional competence.

## Known limitations

1. **No email verification.** Registration accepts any reachable address.
   Password reset is not implemented, so a user who forgets their password has no
   self-service recovery. Both need a transactional email provider.
2. **No CSRF tokens.** Sessions use `SameSite=Lax`, which blocks cross-site POST
   in modern browsers, but this is defence-in-depth rather than a formal CSRF
   defence. State-changing routes should eventually require an `Origin` check.
3. **Rate limiting is per-isolate**, so it is approximate under heavy load.
4. **`/api/skills/*` still uses a single shared secret.** It guards your
   personal dashboard, not user accounts. It should be retired once the personal
   dashboard is migrated onto real accounts.
5. **No audit log.** There is no record of who changed published content. This
   should be added before an admin interface ships.

## Data handling checklist before launch

- [ ] Serve only over HTTPS with HSTS.
- [ ] Decide a retention window for deleted accounts and implement it.
- [ ] Add email verification and password reset.
- [ ] Add `Origin` verification to state-changing routes.
- [ ] Add an admin audit log.
- [ ] Review whether lesson translations marked `review_status = 'machine'`
      should be visible publicly before they are human-reviewed.
