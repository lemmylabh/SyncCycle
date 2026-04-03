-- =============================================================================
-- SyncCycle — Fiona AI chat tables
-- fiona_sessions: one session per chat thread per user
-- fiona_messages: all messages within a session
-- Requires: 01_user_profiles.sql
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS fiona_sessions (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      text        NOT NULL DEFAULT 'New Chat',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fiona_messages (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid        NOT NULL REFERENCES fiona_sessions(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text        NOT NULL CHECK (role IN ('user', 'assistant')),
  content    text        NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fiona_sessions_user    ON fiona_sessions (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_fiona_messages_session ON fiona_messages (session_id, created_at ASC);

-- RLS
ALTER TABLE fiona_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiona_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own sessions" ON fiona_sessions;
DROP POLICY IF EXISTS "Users own messages" ON fiona_messages;

CREATE POLICY "Users own sessions" ON fiona_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own messages" ON fiona_messages FOR ALL USING (auth.uid() = user_id);

COMMIT;
