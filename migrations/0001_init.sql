CREATE TABLE IF NOT EXISTS stories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT DEFAULT '',
  source TEXT DEFAULT '',
  published TEXT DEFAULT '',
  collected TEXT NOT NULL,
  region TEXT DEFAULT 'Global',
  category TEXT DEFAULT 'Other',
  priority TEXT DEFAULT 'GREEN',
  score INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_stories_collected ON stories(collected);
CREATE INDEX IF NOT EXISTS idx_stories_region ON stories(region);
CREATE INDEX IF NOT EXISTS idx_stories_priority ON stories(priority);
