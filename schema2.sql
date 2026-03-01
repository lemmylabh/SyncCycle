-- =============================================================================
-- SyncCycle — Extended Trackers Schema (Nutrition, Fitness, Sleep)
-- Paste this entire file into: Supabase Dashboard → SQL Editor → Run
-- Requires schema.sql to have been applied first (depends on cycles table
-- and the set_updated_at() function defined there).
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. WORKOUT TYPES (lookup table — seeded below)
-- =============================================================================

CREATE TABLE IF NOT EXISTS workout_types (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL UNIQUE,
  label          text NOT NULL,
  category       text NOT NULL CHECK (category IN ('cardio','strength','flexibility','mindfulness','sport')),
  icon           text NOT NULL DEFAULT '●',
  display_order  integer NOT NULL DEFAULT 0
);

INSERT INTO workout_types (name, label, category, icon, display_order)
VALUES
  -- Cardio
  ('running',           'Running',           'cardio',       '🏃', 1),
  ('cycling',           'Cycling',           'cardio',       '🚴', 2),
  ('swimming',          'Swimming',          'cardio',       '🏊', 3),
  ('hiit',              'HIIT',              'cardio',       '🔥', 4),
  ('walking',           'Walking',           'cardio',       '🚶', 5),
  ('dancing',           'Dancing',           'cardio',       '💃', 6),
  -- Strength
  ('strength_training', 'Strength Training', 'strength',     '🏋️', 7),
  ('pilates',           'Pilates',           'strength',     '🤸', 8),
  -- Flexibility
  ('yoga',              'Yoga',              'flexibility',  '🧘', 9),
  ('stretching',        'Stretching',        'flexibility',  '🙆', 10),
  -- Mindfulness
  ('meditation',        'Meditation',        'mindfulness',  '🧠', 11),
  ('breathwork',        'Breathwork',        'mindfulness',  '🌬️', 12),
  -- Sport
  ('sport',             'Sport / Other',     'sport',        '⚽', 13)
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- 2. WORKOUT LOGS (Fitness Tracker)
-- =============================================================================

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

-- =============================================================================
-- 3. NUTRITION LOGS (Nutrition Tracker — daily summary)
-- =============================================================================

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

-- =============================================================================
-- 4. MEAL ENTRIES (individual meals within a nutrition day)
-- =============================================================================

CREATE TABLE IF NOT EXISTS meal_entries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date      date NOT NULL,
  meal_type     text NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner','snack','supplement')),
  description   text NOT NULL,
  calories_kcal integer,
  protein_g     numeric(6,1),
  carbs_g       numeric(6,1),
  fat_g         numeric(6,1),

  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meal_entries_user_date ON meal_entries (user_id, log_date DESC);

-- =============================================================================
-- 5. SLEEP LOGS (Sleep Tracker)
-- =============================================================================

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

-- =============================================================================
-- 6. TRIGGERS (set_updated_at function is defined in schema.sql)
-- =============================================================================

DROP TRIGGER IF EXISTS set_updated_at ON nutrition_logs;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON nutrition_logs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON sleep_logs;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON sleep_logs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- workout_types (public read, no user writes)
ALTER TABLE workout_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read" ON workout_types;
CREATE POLICY "public_read" ON workout_types FOR SELECT USING (true);

-- workout_logs
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own" ON workout_logs;
DROP POLICY IF EXISTS "insert_own" ON workout_logs;
DROP POLICY IF EXISTS "update_own" ON workout_logs;
DROP POLICY IF EXISTS "delete_own" ON workout_logs;
CREATE POLICY "select_own" ON workout_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own" ON workout_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own" ON workout_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own" ON workout_logs FOR DELETE USING (auth.uid() = user_id);

-- nutrition_logs
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own" ON nutrition_logs;
DROP POLICY IF EXISTS "insert_own" ON nutrition_logs;
DROP POLICY IF EXISTS "update_own" ON nutrition_logs;
DROP POLICY IF EXISTS "delete_own" ON nutrition_logs;
CREATE POLICY "select_own" ON nutrition_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own" ON nutrition_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own" ON nutrition_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own" ON nutrition_logs FOR DELETE USING (auth.uid() = user_id);

-- meal_entries
ALTER TABLE meal_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own" ON meal_entries;
DROP POLICY IF EXISTS "insert_own" ON meal_entries;
DROP POLICY IF EXISTS "update_own" ON meal_entries;
DROP POLICY IF EXISTS "delete_own" ON meal_entries;
CREATE POLICY "select_own" ON meal_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own" ON meal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own" ON meal_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own" ON meal_entries FOR DELETE USING (auth.uid() = user_id);

-- sleep_logs
ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own" ON sleep_logs;
DROP POLICY IF EXISTS "insert_own" ON sleep_logs;
DROP POLICY IF EXISTS "update_own" ON sleep_logs;
DROP POLICY IF EXISTS "delete_own" ON sleep_logs;
CREATE POLICY "select_own" ON sleep_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own" ON sleep_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own" ON sleep_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own" ON sleep_logs FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- Done!
-- =============================================================================

COMMIT;
