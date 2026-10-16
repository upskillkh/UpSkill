-- 0006_rate_limits.sql
-- Small fixed-window counter backing auth and AI rate limiting.
-- Kept separate so it can be dropped or archived independently of user data.

CREATE TABLE IF NOT EXISTS rate_limits (
  bucket     TEXT PRIMARY KEY,
  count      INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_ratelimit_updated ON rate_limits(updated_at);
