-- =============================================================================
-- SyncCycle — mood_logs table (Tracker 3: Vibe Check)
-- Tracks mood, energy, and libido scores. One log per day per user.
-- Requires: 02_cycles.sql, 08_functions_triggers.sql
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS mood_logs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cycle_id       uuid REFERENCES cycles(id) ON DELETE SET NULL,
  log_date       date NOT NULL,
  mood_score     smallint NOT NULL CHECK (mood_score BETWEEN 1 AND 5),
  energy_score   smallint NOT NULL CHECK (energy_score BETWEEN 1 AND 5),
  libido_score   smallint CHECK (libido_score BETWEEN 1 AND 5),
  -- libido_score is optional — null = user skipped
  notes          text,

  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),

  UNIQUE (user_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_mood_logs_user_date ON mood_logs (user_id, log_date DESC);

-- RLS
ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own" ON mood_logs;
DROP POLICY IF EXISTS "insert_own" ON mood_logs;
DROP POLICY IF EXISTS "update_own" ON mood_logs;
DROP POLICY IF EXISTS "delete_own" ON mood_logs;

CREATE POLICY "select_own" ON mood_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own" ON mood_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own" ON mood_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own" ON mood_logs FOR DELETE USING (auth.uid() = user_id);

COMMIT;
