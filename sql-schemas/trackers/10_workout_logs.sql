-- =============================================================================
-- SyncCycle — workout_logs table (Fitness Tracker)
-- Multiple workouts can be logged per day (no unique constraint on log_date).
-- Requires: 02_cycles.sql, 09_workout_types.sql
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS workout_logs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cycle_id          uuid REFERENCES cycles(id) ON DELETE SET NULL,
  log_date          date NOT NULL,
  workout_type_id   uuid NOT NULL REFERENCES workout_types(id),
  duration_minutes  integer NOT NULL CHECK (duration_minutes > 0),
  intensity         smallint NOT NULL CHECK (intensity BETWEEN 1 AND 5),
  -- 1=very easy  2=easy  3=moderate  4=hard  5=max effort
  calories_burned   integer CHECK (calories_burned > 0),
  heart_rate_avg    integer CHECK (heart_rate_avg BETWEEN 30 AND 220),
  notes             text,

  created_at        timestamptz NOT NULL DEFAULT now()
  -- No UNIQUE(user_id, log_date) — users may log multiple workouts per day
);

CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date ON workout_logs (user_id, log_date DESC);

-- RLS
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own" ON workout_logs;
DROP POLICY IF EXISTS "insert_own" ON workout_logs;
DROP POLICY IF EXISTS "update_own" ON workout_logs;
DROP POLICY IF EXISTS "delete_own" ON workout_logs;

CREATE POLICY "select_own" ON workout_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own" ON workout_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own" ON workout_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own" ON workout_logs FOR DELETE USING (auth.uid() = user_id);

COMMIT;
