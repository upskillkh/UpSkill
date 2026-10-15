-- 0002_skills.sql
-- Personal Skill Development module.
-- Creates new tables only. The existing `stories` table and all stored news
-- are left untouched, and this migration is safe to re-run.

-- ---------------------------------------------------------------------------
-- Skills and curriculum
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS skills (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  key          TEXT    NOT NULL UNIQUE,
  name         TEXT    NOT NULL,
  description  TEXT    NOT NULL DEFAULT '',
  icon         TEXT    NOT NULL DEFAULT '',
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS skill_lessons (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  day           INTEGER NOT NULL UNIQUE,
  skill         TEXT    NOT NULL REFERENCES skills(key),
  title         TEXT    NOT NULL,
  objective     TEXT    NOT NULL DEFAULT '',
  explanation   TEXT    NOT NULL DEFAULT '',
  example       TEXT    NOT NULL DEFAULT '',
  exercise      TEXT    NOT NULL DEFAULT '',
  action        TEXT    NOT NULL DEFAULT '',
  reflection    TEXT    NOT NULL DEFAULT '',
  quiz_question TEXT    NOT NULL DEFAULT '',
  quiz_options  TEXT    NOT NULL DEFAULT '[]',
  quiz_answer   INTEGER NOT NULL DEFAULT 0,
  quiz_explain  TEXT    NOT NULL DEFAULT '',
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_skill_lessons_skill ON skill_lessons(skill);

-- Cached rollup per skill. Always recomputed from learning_sessions on read so
-- it can never drift away from the underlying records.
CREATE TABLE IF NOT EXISTS skill_progress (
  skill             TEXT    PRIMARY KEY REFERENCES skills(key),
  total_lessons     INTEGER NOT NULL DEFAULT 0,
  completed_lessons INTEGER NOT NULL DEFAULT 0,
  last_studied      TEXT,
  updated_at        TEXT
);

-- ---------------------------------------------------------------------------
-- Daily activity. UNIQUE(session_date, day) makes completion idempotent:
-- marking the same day complete twice updates the row instead of duplicating it.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS learning_sessions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  session_date  TEXT    NOT NULL,
  day           INTEGER NOT NULL REFERENCES skill_lessons(day),
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
  UNIQUE(session_date, day)
);
CREATE INDEX IF NOT EXISTS idx_sessions_date  ON learning_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_sessions_skill ON learning_sessions(skill);

-- ---------------------------------------------------------------------------
-- Quiz results
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  day        INTEGER NOT NULL,
  skill      TEXT    NOT NULL,
  question   TEXT    NOT NULL DEFAULT '',
  chosen     INTEGER,
  correct    INTEGER NOT NULL DEFAULT 0,
  created_at TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_quiz_day   ON quiz_attempts(day);
CREATE INDEX IF NOT EXISTS idx_quiz_skill ON quiz_attempts(skill);

-- ---------------------------------------------------------------------------
-- Apply to my business. Free-text records kept per assignment instance.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS business_assignments (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_key  TEXT,
  skill           TEXT    NOT NULL,
  title           TEXT    NOT NULL,
  prompt          TEXT    NOT NULL DEFAULT '',
  problem         TEXT    NOT NULL DEFAULT '',
  analysis        TEXT    NOT NULL DEFAULT '',
  solution        TEXT    NOT NULL DEFAULT '',
  expected_result TEXT    NOT NULL DEFAULT '',
  actual_result   TEXT    NOT NULL DEFAULT '',
  lessons_learned TEXT    NOT NULL DEFAULT '',
  next_action     TEXT    NOT NULL DEFAULT '',
  status          TEXT    NOT NULL DEFAULT 'draft',
  created_at      TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TEXT
);
CREATE INDEX IF NOT EXISTS idx_assignments_skill  ON business_assignments(skill);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON business_assignments(status);

-- ---------------------------------------------------------------------------
-- Learning journal. One entry per calendar day (Cambodia time), editable.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS learning_journal (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_date    TEXT    NOT NULL UNIQUE,
  learned       TEXT    NOT NULL DEFAULT '',
  applied       TEXT    NOT NULL DEFAULT '',
  worked_well   TEXT    NOT NULL DEFAULT '',
  did_not_work  TEXT    NOT NULL DEFAULT '',
  improve       TEXT    NOT NULL DEFAULT '',
  next_action   TEXT    NOT NULL DEFAULT '',
  mood          INTEGER,
  created_at    TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TEXT
);
CREATE INDEX IF NOT EXISTS idx_journal_date ON learning_journal(entry_date);

-- ---------------------------------------------------------------------------
-- Preferences and reminder de-duplication
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_preferences (
  key        TEXT NOT NULL,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (key)
);

-- Guards against duplicate Telegram reminders on the same day, even if the
-- cron fires twice or a Worker is retried.
CREATE TABLE IF NOT EXISTS reminder_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  kind       TEXT    NOT NULL,
  sent_date  TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(kind, sent_date)
);
