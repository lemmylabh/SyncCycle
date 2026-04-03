-- =============================================================================
-- SyncCycle — nutrition_logs table (Nutrition Tracker — daily summary)
-- One daily summary row per user. Individual meals go in meal_entries.
-- Requires: 02_cycles.sql, 08_functions_triggers.sql
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS nutrition_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cycle_id      uuid REFERENCES cycles(id) ON DELETE SET NULL,
  log_date      date NOT NULL,

  water_ml      integer CHECK (water_ml >= 0),
  calories_kcal integer CHECK (calories_kcal >= 0),
  protein_g     numeric(6,1),
  carbs_g       numeric(6,1),
  fat_g         numeric(6,1),
  fiber_g       numeric(5,1),
  notes         text,

  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  UNIQUE (user_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user_date ON nutrition_logs (user_id, log_date DESC);

DROP TRIGGER IF EXISTS set_updated_at ON nutrition_logs;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON nutrition_logs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own" ON nutrition_logs;
DROP POLICY IF EXISTS "insert_own" ON nutrition_logs;
DROP POLICY IF EXISTS "update_own" ON nutrition_logs;
DROP POLICY IF EXISTS "delete_own" ON nutrition_logs;

CREATE POLICY "select_own" ON nutrition_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own" ON nutrition_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own" ON nutrition_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own" ON nutrition_logs FOR DELETE USING (auth.uid() = user_id);

COMMIT;
