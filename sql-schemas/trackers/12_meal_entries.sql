-- =============================================================================
-- SyncCycle — meal_entries table (individual meals within a nutrition day)
-- Multiple entries per day allowed (breakfast, lunch, dinner, snack, supplement).
-- Requires: 01_user_profiles.sql
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS meal_entries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date      date NOT NULL,
  meal_type     text NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'supplement')),
  description   text NOT NULL,
  calories_kcal integer,
  protein_g     numeric(6,1),
  carbs_g       numeric(6,1),
  fat_g         numeric(6,1),

  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meal_entries_user_date ON meal_entries (user_id, log_date DESC);

-- RLS
ALTER TABLE meal_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own" ON meal_entries;
DROP POLICY IF EXISTS "insert_own" ON meal_entries;
DROP POLICY IF EXISTS "update_own" ON meal_entries;
DROP POLICY IF EXISTS "delete_own" ON meal_entries;

CREATE POLICY "select_own" ON meal_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own" ON meal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own" ON meal_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own" ON meal_entries FOR DELETE USING (auth.uid() = user_id);

COMMIT;
