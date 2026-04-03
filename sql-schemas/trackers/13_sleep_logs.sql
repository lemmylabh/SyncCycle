-- =============================================================================
-- SyncCycle — sleep_logs table (Sleep Tracker)
-- One log per day per user. log_date = the date the user woke up (morning of).
-- Requires: 02_cycles.sql, 08_functions_triggers.sql
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS sleep_logs (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cycle_id           uuid REFERENCES cycles(id) ON DELETE SET NULL,
  log_date           date NOT NULL,
  -- log_date = the date you woke up (morning of)

  bedtime            timestamptz,
  sleep_onset        timestamptz,
  wake_time          timestamptz,
  -- duration_minutes is app-computed from (wake_time - sleep_onset) and stored here
  duration_minutes   integer CHECK (duration_minutes > 0),

  quality_score      smallint NOT NULL CHECK (quality_score BETWEEN 1 AND 5),
  -- 1=very poor  2=poor  3=fair  4=good  5=excellent
  interruptions      smallint NOT NULL DEFAULT 0 CHECK (interruptions >= 0),
  notes              text,

  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),

  UNIQUE (user_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_sleep_logs_user_date ON sleep_logs (user_id, log_date DESC);

DROP TRIGGER IF EXISTS set_updated_at ON sleep_logs;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON sleep_logs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own" ON sleep_logs;
DROP POLICY IF EXISTS "insert_own" ON sleep_logs;
DROP POLICY IF EXISTS "update_own" ON sleep_logs;
DROP POLICY IF EXISTS "delete_own" ON sleep_logs;

CREATE POLICY "select_own" ON sleep_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own" ON sleep_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own" ON sleep_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own" ON sleep_logs FOR DELETE USING (auth.uid() = user_id);

COMMIT;
