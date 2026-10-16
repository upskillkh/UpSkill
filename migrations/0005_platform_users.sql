-- 0005_platform_users.sql
-- Up Skill PWA: multi-user platform foundation.
--
-- This migration adds real accounts WITHOUT touching the Economic Intelligence
-- news schema or `stories`. All news records survive untouched.
--
-- Tables that currently carry a single-user UNIQUE constraint are rebuilt with
-- (user_id, ...) uniqueness, because SQLite cannot ALTER a UNIQUE constraint.
-- Rows are copied first, so personal learning data is preserved. The first
-- owner account (id = 1) receives the existing records.

PRAGMA foreign_keys = OFF;

-- ---------------------------------------------------------------------------
-- Accounts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  email          TEXT    NOT NULL UNIQUE,
  password_hash  TEXT    NOT NULL,
  password_salt  TEXT    NOT NULL,
  display_name   TEXT    NOT NULL DEFAULT '',
  role           TEXT    NOT NULL DEFAULT 'user',      -- user | admin
  locale         TEXT    NOT NULL DEFAULT 'en',        -- en | km
  level          TEXT    NOT NULL DEFAULT 'beginner',  -- beginner | intermediate | advanced
  occupation     TEXT    NOT NULL DEFAULT '',
  daily_minutes  INTEGER NOT NULL DEFAULT 30,
  goals          TEXT    NOT NULL DEFAULT '',
  status         TEXT    NOT NULL DEFAULT 'active',    -- active | suspended | deleted
  onboarding_done INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TEXT
);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Server-side sessions. Only a SHA-256 hash of the token is stored.
CREATE TABLE IF NOT EXISTS sessions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT    NOT NULL UNIQUE,
  expires_at TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen  TEXT
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_exp  ON sessions(expires_at);

-- The existing owner of the personal data in this deployment.
INSERT OR IGNORE INTO users
  (id, email, password_hash, password_salt, display_name, role, locale, level,
   daily_minutes, goals, status, onboarding_done)
VALUES
  (1, 'owner@upskill.local', 'MIGRATED_NO_PASSWORD', 'MIGRATED_NO_PASSWORD',
   'Owner', 'admin', 'en', 'beginner', 30,
   'Preserved records from the pre-platform personal dashboard', 'active', 1);

-- ---------------------------------------------------------------------------
-- Content system: language-neutral lesson + per-language translations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lessons (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  slug         TEXT    NOT NULL UNIQUE,
  day          INTEGER NOT NULL UNIQUE,
  skill_key    TEXT    NOT NULL REFERENCES skills(key),
  difficulty   TEXT    NOT NULL DEFAULT 'beginner',   -- beginner | intermediate | advanced
  est_minutes  INTEGER NOT NULL DEFAULT 20,
  status       TEXT    NOT NULL DEFAULT 'draft',      -- draft | review | published | retired
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TEXT
);
CREATE INDEX IF NOT EXISTS idx_lessons_status ON lessons(status);
CREATE INDEX IF NOT EXISTS idx_lessons_skill  ON lessons(skill_key);

CREATE TABLE IF NOT EXISTS lesson_translations (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  lesson_id      INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  locale         TEXT    NOT NULL,                     -- en | km
  title          TEXT    NOT NULL DEFAULT '',
  objective      TEXT    NOT NULL DEFAULT '',
  explanation    TEXT    NOT NULL DEFAULT '',
  example        TEXT    NOT NULL DEFAULT '',
  exercise       TEXT    NOT NULL DEFAULT '',
  action         TEXT    NOT NULL DEFAULT '',
  reflection     TEXT    NOT NULL DEFAULT '',
  quiz_question  TEXT    NOT NULL DEFAULT '',
  quiz_options   TEXT    NOT NULL DEFAULT '[]',
  quiz_answer    INTEGER NOT NULL DEFAULT 0,
  quiz_explain   TEXT    NOT NULL DEFAULT '',
  review_status  TEXT    NOT NULL DEFAULT 'machine',  -- machine | human_reviewed | rejected
  reviewed_at    TEXT,
  created_at     TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TEXT,
  UNIQUE(lesson_id, locale)
);
CREATE INDEX IF NOT EXISTS idx_translations_locale ON lesson_translations(locale);

-- ---------------------------------------------------------------------------
-- Enrolment and per-learner progress
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS enrollments (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id            INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  program            TEXT    NOT NULL DEFAULT '30day',
  status             TEXT    NOT NULL DEFAULT 'active',  -- active | completed | paused
  pointer            INTEGER NOT NULL DEFAULT 1,
  current_lesson_id  INTEGER,
  started_at         TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at       TEXT,
  UNIQUE(user_id, program)
);

CREATE TABLE IF NOT EXISTS lesson_progress (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id    INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  status       TEXT    NOT NULL DEFAULT 'started',   -- started | completed
  minutes      INTEGER NOT NULL DEFAULT 0,
  notes        TEXT    NOT NULL DEFAULT '',
  started_at   TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  UNIQUE(user_id, lesson_id)
);
CREATE INDEX IF NOT EXISTS idx_progress_user ON lesson_progress(user_id, status);

-- ---------------------------------------------------------------------------
-- Rebuild single-user tables so they are scoped per account
-- ---------------------------------------------------------------------------

-- learning_sessions: UNIQUE(session_date, day) -> UNIQUE(user_id, session_date, day)
CREATE TABLE IF NOT EXISTS learning_sessions_new (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL DEFAULT 1 REFERENCES users(id) ON DELETE CASCADE,
  session_date  TEXT    NOT NULL,
  day           INTEGER NOT NULL,
  skill         TEXT    NOT NULL,
  step_learned  INTEGER NOT NULL DEFAULT 0,
  step_analyzed INTEGER NOT NULL DEFAULT 0,
  step_applied  INTEGER NOT NULL DEFAULT 0,
  minutes       INTEGER NOT NULL DEFAULT 0,
  notes         TEXT    NOT NULL DEFAULT '',
  completed     INTEGER NOT NULL DEFAULT 0,
  completed_at  TEXT,
  created_at    TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TEXT,
  UNIQUE(user_id, session_date, day)
);
INSERT OR IGNORE INTO learning_sessions_new
  (user_id, session_date, day, skill, step_learned, step_analyzed, step_applied,
   minutes, notes, completed, completed_at, created_at, updated_at)
SELECT 1, session_date, day, skill, step_learned, step_analyzed, step_applied,
       minutes, notes, completed, completed_at, created_at, updated_at
  FROM learning_sessions;
DROP TABLE learning_sessions;
ALTER TABLE learning_sessions_new RENAME TO learning_sessions;
CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON learning_sessions(user_id, session_date);

-- learning_journal: UNIQUE(entry_date) -> UNIQUE(user_id, entry_date)
CREATE TABLE IF NOT EXISTS learning_journal_new (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL DEFAULT 1 REFERENCES users(id) ON DELETE CASCADE,
  entry_date   TEXT    NOT NULL,
  learned      TEXT    NOT NULL DEFAULT '',
  applied      TEXT    NOT NULL DEFAULT '',
  worked_well  TEXT    NOT NULL DEFAULT '',
  did_not_work TEXT    NOT NULL DEFAULT '',
  improve      TEXT    NOT NULL DEFAULT '',
  next_action  TEXT    NOT NULL DEFAULT '',
  mood         INTEGER,
  created_at   TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TEXT,
  UNIQUE(user_id, entry_date)
);
INSERT OR IGNORE INTO learning_journal_new
  (user_id, entry_date, learned, applied, worked_well, did_not_work, improve,
   next_action, mood, created_at, updated_at)
SELECT 1, entry_date, learned, applied, worked_well, did_not_work, improve,
       next_action, mood, created_at, updated_at
  FROM learning_journal;
DROP TABLE learning_journal;
ALTER TABLE learning_journal_new RENAME TO learning_journal;

-- reflections: UNIQUE(entry_date) -> UNIQUE(user_id, entry_date)
CREATE TABLE IF NOT EXISTS reflections_new (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL DEFAULT 1 REFERENCES users(id) ON DELETE CASCADE,
  entry_date TEXT    NOT NULL,
  day        INTEGER,
  prompt     TEXT    NOT NULL DEFAULT '',
  body       TEXT    NOT NULL DEFAULT '',
  source     TEXT    NOT NULL DEFAULT 'telegram',
  created_at TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT,
  UNIQUE(user_id, entry_date)
);
INSERT OR IGNORE INTO reflections_new
  (user_id, entry_date, day, prompt, body, source, created_at, updated_at)
SELECT 1, entry_date, day, prompt, body, source, created_at, updated_at
  FROM reflections;
DROP TABLE reflections;
ALTER TABLE reflections_new RENAME TO reflections;

-- lesson_deliveries: UNIQUE(delivered_date) -> UNIQUE(user_id, delivered_date)
CREATE TABLE IF NOT EXISTS lesson_deliveries_new (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        INTEGER NOT NULL DEFAULT 1 REFERENCES users(id) ON DELETE CASCADE,
  delivered_date TEXT    NOT NULL,
  day            INTEGER NOT NULL,
  skill          TEXT    NOT NULL,
  weekday        INTEGER NOT NULL DEFAULT 0,
  message_type   TEXT    NOT NULL DEFAULT 'lesson',
  status         TEXT    NOT NULL DEFAULT 'pending',
  attempts       INTEGER NOT NULL DEFAULT 0,
  delivered_at   TEXT,
  last_error     TEXT,
  created_at     TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TEXT,
  UNIQUE(user_id, delivered_date)
);
INSERT OR IGNORE INTO lesson_deliveries_new
  (user_id, delivered_date, day, skill, weekday, message_type, status, attempts,
   delivered_at, last_error, created_at, updated_at)
SELECT 1, delivered_date, day, skill, weekday, message_type, status, attempts,
       delivered_at, last_error, created_at, updated_at
  FROM lesson_deliveries;
DROP TABLE lesson_deliveries;
ALTER TABLE lesson_deliveries_new RENAME TO lesson_deliveries;

-- quiz_attempts: no UNIQUE constraint, so a plain column add is safe.
ALTER TABLE quiz_attempts ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1 REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE quiz_attempts ADD COLUMN locale  TEXT    NOT NULL DEFAULT 'en';
CREATE INDEX IF NOT EXISTS idx_quiz_user ON quiz_attempts(user_id);

-- business_assignments: no UNIQUE constraint, plain add is safe.
ALTER TABLE business_assignments ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1 REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE business_assignments ADD COLUMN visibility TEXT NOT NULL DEFAULT 'private';
CREATE INDEX IF NOT EXISTS idx_assign_user ON business_assignments(user_id);

-- skill_progress was a single-row rollup; it is superseded by lesson_progress.
DROP TABLE IF EXISTS skill_progress;

-- ---------------------------------------------------------------------------
-- Telegram linking, AI coach, notifications, billing placeholders
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS telegram_links (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id           INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  chat_id           TEXT,
  username          TEXT    NOT NULL DEFAULT '',
  link_code         TEXT    NOT NULL DEFAULT '',
  verified_at       TEXT,
  reminder_enabled  INTEGER NOT NULL DEFAULT 0,
  reminder_hour     INTEGER NOT NULL DEFAULT 6,
  reminder_minute   INTEGER NOT NULL DEFAULT 0,
  locale_override   TEXT,
  created_at        TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TEXT
);
CREATE INDEX IF NOT EXISTS idx_tg_chat ON telegram_links(chat_id);

CREATE TABLE IF NOT EXISTS coach_sessions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  locale     TEXT    NOT NULL DEFAULT 'en',
  kind       TEXT    NOT NULL DEFAULT 'chat',   -- chat | recommendation | assessment
  prompt     TEXT    NOT NULL DEFAULT '',
  response   TEXT    NOT NULL DEFAULT '',
  model      TEXT    NOT NULL DEFAULT '',
  tokens     INTEGER NOT NULL DEFAULT 0,
  consent_at TEXT,
  created_at TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_coach_user ON coach_sessions(user_id, created_at);

CREATE TABLE IF NOT EXISTS notification_deliveries (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id      INTEGER,
  kind           TEXT    NOT NULL DEFAULT 'lesson',
  scheduled_for  TEXT    NOT NULL,
  status         TEXT    NOT NULL DEFAULT 'pending',  -- pending | sent | failed | skipped
  attempts       INTEGER NOT NULL DEFAULT 0,
  sent_at        TEXT,
  error          TEXT,
  created_at     TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, kind, scheduled_for)
);
CREATE INDEX IF NOT EXISTS idx_notify_status ON notification_deliveries(status);

-- Composite key only: SQLite rejects a second PRIMARY KEY alongside AUTOINCREMENT.
CREATE TABLE IF NOT EXISTS ai_usage (
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day       TEXT    NOT NULL,
  requests  INTEGER NOT NULL DEFAULT 0,
  tokens    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan        TEXT    NOT NULL DEFAULT 'free',   -- free | pro | team
  status      TEXT    NOT NULL DEFAULT 'active', -- active | cancelled | past_due
  provider    TEXT    NOT NULL DEFAULT '',
  external_id TEXT    NOT NULL DEFAULT '',
  started_at  TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ends_at     TEXT,
  UNIQUE(user_id, plan)
);

PRAGMA foreign_keys = ON;
