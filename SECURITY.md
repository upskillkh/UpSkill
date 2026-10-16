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
