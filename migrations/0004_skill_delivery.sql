-- 0004_skill_delivery.sql
-- Supports the automated 06:00 Asia/Phnom_Penh daily skill lesson.
--
-- Idempotency: UNIQUE(delivered_date) means one scheduled delivery per Cambodia
-- calendar day. If the cron fires twice (or a Worker is retried), the second run
-- inserts nothing and skips sending.
--
-- status holds 'pending' | 'sent' | 'failed' so a failed Telegram send can be
-- retried later without ever producing a second message for the same date.

CREATE TABLE IF NOT EXISTS lesson_deliveries (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  delivered_date TEXT    NOT NULL UNIQUE,          -- YYYY-MM-DD in Asia/Phnom_Penh
  day            INTEGER NOT NULL,
  skill          TEXT    NOT NULL,
  weekday        INTEGER NOT NULL DEFAULT 0,       -- 0=Sun .. 6=Sat
  message_type   TEXT    NOT NULL DEFAULT 'lesson',-- lesson | review | practice
  status         TEXT    NOT NULL DEFAULT 'pending',
  attempts       INTEGER NOT NULL DEFAULT 0,
  delivered_at   TEXT,
  last_error     TEXT,
  created_at     TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TEXT
);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON lesson_deliveries(status);

-- Reflection notes captured from the Telegram "Write Reflection" button.
CREATE TABLE IF NOT EXISTS reflections (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_date TEXT    NOT NULL UNIQUE,
  day        INTEGER,
  prompt     TEXT    NOT NULL DEFAULT '',
  body       TEXT    NOT NULL DEFAULT '',
  source     TEXT    NOT NULL DEFAULT 'telegram',
  created_at TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_reflections_date ON reflections(entry_date);
