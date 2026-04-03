-- =============================================================================
-- SyncCycle — period_logs table (Tracker 1: Period Flow)
-- Captured during the menstrual phase. One log per day per user.
-- Requires: 02_cycles.sql
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS period_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cycle_id    uuid NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
  log_date    date NOT NULL,
  flow_level  smallint NOT NULL CHECK (flow_level BETWEEN 0 AND 4),
  -- 0=spotting  1=light  2=medium  3=heavy  4=very heavy
  color       text CHECK (color IN ('bright_red', 'dark_red', 'pink', 'brown', 'black')),
  clots       boolean NOT NULL DEFAULT false,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),

  UNIQUE (user_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_period_logs_user_date ON period_logs (user_id, log_date DESC);

-- RLS
ALTER TABLE period_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own" ON period_logs;
DROP POLICY IF EXISTS "insert_own" ON period_logs;
DROP POLICY IF EXISTS "update_own" ON period_logs;
DROP POLICY IF EXISTS "delete_own" ON period_logs;

CREATE POLICY "select_own" ON period_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own" ON period_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own" ON period_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own" ON period_logs FOR DELETE USING (auth.uid() = user_id);

COMMIT;
