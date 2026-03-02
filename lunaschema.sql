CREATE TABLE IF NOT EXISTS luna_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Chat',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS luna_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES luna_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_luna_sessions_user ON luna_sessions (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_luna_messages_session ON luna_messages (session_id, created_at ASC);

ALTER TABLE luna_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE luna_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own sessions" ON luna_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own messages" ON luna_messages FOR ALL USING (auth.uid() = user_id);
