-- =============================================================================
-- SyncCycle — symptom_logs table (Tracker 2: Symptoms)
-- Tracks physical and emotional changes per day.
-- Requires: 02_cycles.sql, 04_symptom_types.sql
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS symptom_logs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cycle_id         uuid REFERENCES cycles(id) ON DELETE SET NULL,
  log_date         date NOT NULL,
  symptom_type_id  uuid NOT NULL REFERENCES symptom_types(id),
  severity         smallint NOT NULL CHECK (severity BETWEEN 1 AND 5),
  -- 1=very mild  2=mild  3=moderate  4=severe  5=very severe
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),

  UNIQUE (user_id, log_date, symptom_type_id)
);

CREATE INDEX IF NOT EXISTS idx_symptom_logs_user_date ON symptom_logs (user_id, log_date DESC);

-- RLS
ALTER TABLE symptom_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own" ON symptom_logs;
DROP POLICY IF EXISTS "insert_own" ON symptom_logs;
DROP POLICY IF EXISTS "update_own" ON symptom_logs;
DROP POLICY IF EXISTS "delete_own" ON symptom_logs;

CREATE POLICY "select_own" ON symptom_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own" ON symptom_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own" ON symptom_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own" ON symptom_logs FOR DELETE USING (auth.uid() = user_id);

COMMIT;
