-- =============================================================================
-- SyncCycle — Full Database Schema
-- Paste this entire file into: Supabase Dashboard → SQL Editor → Run
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. USER PROFILES
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id                     uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name           text,
  avatar_url             text,
  date_of_birth          date,

  -- Biological Calibration
  average_cycle_length   integer NOT NULL DEFAULT 28,
  average_period_length  integer NOT NULL DEFAULT 5,
  is_regular             boolean DEFAULT true,
  tracking_start_date    date,

  -- Contextual Onboarding Data
  app_goal               text CHECK (
    app_goal IN ('track_health', 'avoid_pregnancy', 'conceive', 'manage_symptoms')
  ),
  contraceptive_use      text CHECK (
    contraceptive_use IN ('none','pill','iud','implant','injection','patch','other')
  ),

  -- System Settings
  timezone               text NOT NULL DEFAULT 'UTC',
  onboarding_completed   boolean NOT NULL DEFAULT false,

  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 2. CYCLES
-- =============================================================================

CREATE TABLE IF NOT EXISTS cycles (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cycle_number   integer NOT NULL,
  start_date     date NOT NULL,
  end_date       date,
  cycle_length   integer GENERATED ALWAYS AS (end_date - start_date) STORED,
  notes          text,

  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),

  UNIQUE (user_id, cycle_number)
);

CREATE INDEX IF NOT EXISTS idx_cycles_user_date ON cycles (user_id, start_date DESC);

-- =============================================================================
-- 3. SYMPTOM TYPES (lookup table — seeded below)
-- =============================================================================

CREATE TABLE IF NOT EXISTS symptom_types (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL UNIQUE,
  label          text NOT NULL,
  category       text NOT NULL CHECK (category IN ('physical','emotional','energy')),
  icon           text NOT NULL DEFAULT '●',
  display_order  integer NOT NULL DEFAULT 0
);

INSERT INTO symptom_types (name, label, category, icon, display_order)
VALUES
  -- Physical
  ('cramps',            'Cramps',            'physical',  '🌊', 1),
  ('bloating',          'Bloating',          'physical',  '💨', 2),
  ('headache',          'Headache',          'physical',  '🤕', 3),
  ('breast_tenderness', 'Breast Tenderness', 'physical',  '💗', 4),
  ('backache',          'Back Ache',         'physical',  '🔙', 5),
  ('nausea',            'Nausea',            'physical',  '🤢', 6),
  ('acne',              'Acne',              'physical',  '✦',  7),
  ('spotting',          'Spotting',          'physical',  '🩸', 8),
  -- Emotional
  ('mood_swings',       'Mood Swings',       'emotional', '🎭', 9),
  ('anxiety',           'Anxiety',           'emotional', '😰', 10),
  ('irritability',      'Irritability',      'emotional', '😤', 11),
  ('brain_fog',         'Brain Fog',         'emotional', '🌫️', 12),
  ('low_mood',          'Low Mood',          'emotional', '😔', 13),
  ('cravings',          'Cravings',          'emotional', '🍫', 14),
  -- Energy
  ('fatigue',           'Fatigue',           'energy',    '😴', 15),
  ('high_energy',       'High Energy',       'energy',    '⚡', 16),
  ('insomnia',          'Insomnia',          'energy',    '🌙', 17)
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- 4. PERIOD LOGS (Tracker 1)
-- =============================================================================

CREATE TABLE IF NOT EXISTS period_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cycle_id    uuid NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
  log_date    date NOT NULL,
  flow_level  smallint NOT NULL CHECK (flow_level BETWEEN 0 AND 4),
  -- 0=spotting  1=light  2=medium  3=heavy  4=very heavy
  color       text CHECK (color IN ('bright_red','dark_red','pink','brown','black')),
  clots       boolean NOT NULL DEFAULT false,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),

  UNIQUE (user_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_period_logs_user_date ON period_logs (user_id, log_date DESC);

-- =============================================================================
-- 5. SYMPTOM LOGS (Tracker 2)
-- =============================================================================

CREATE TABLE IF NOT EXISTS symptom_logs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cycle_id         uuid REFERENCES cycles(id) ON DELETE SET NULL,
  log_date         date NOT NULL,
  symptom_type_id  uuid NOT NULL REFERENCES symptom_types(id),
  severity         smallint NOT NULL CHECK (severity BETWEEN 1 AND 5),
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),

  UNIQUE (user_id, log_date, symptom_type_id)
);

CREATE INDEX IF NOT EXISTS idx_symptom_logs_user_date ON symptom_logs (user_id, log_date DESC);

-- =============================================================================
-- 6. MOOD LOGS (Tracker 3 — Vibe Check)
-- =============================================================================

CREATE TABLE IF NOT EXISTS mood_logs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cycle_id       uuid REFERENCES cycles(id) ON DELETE SET NULL,
  log_date       date NOT NULL,
  mood_score     smallint NOT NULL CHECK (mood_score BETWEEN 1 AND 5),
  energy_score   smallint NOT NULL CHECK (energy_score BETWEEN 1 AND 5),
  libido_score   smallint CHECK (libido_score BETWEEN 1 AND 5),
  notes          text,

  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),

  UNIQUE (user_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_mood_logs_user_date ON mood_logs (user_id, log_date DESC);

-- =============================================================================
-- 7. DAILY NOTES (Tracker 4 — Journal)
-- =============================================================================

CREATE TABLE IF NOT EXISTS daily_notes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date    date NOT NULL,
  content     text NOT NULL,

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  UNIQUE (user_id, log_date)
);

-- =============================================================================
-- 8. FUNCTIONS
-- =============================================================================

-- Returns current cycle info (cycle day + phase) for a given user
CREATE OR REPLACE FUNCTION get_current_cycle(p_user_id uuid)
RETURNS TABLE (
  cycle_id   uuid,
  start_date date,
  cycle_day  integer,
  phase      text
) LANGUAGE sql STABLE AS $$
  SELECT
    id AS cycle_id,
    start_date,
    (CURRENT_DATE - start_date + 1)::integer AS cycle_day,
    CASE
      WHEN (CURRENT_DATE - start_date + 1) BETWEEN 1  AND 5  THEN 'menstrual'
      WHEN (CURRENT_DATE - start_date + 1) BETWEEN 6  AND 13 THEN 'follicular'
      WHEN (CURRENT_DATE - start_date + 1) BETWEEN 14 AND 16 THEN 'ovulatory'
      ELSE 'luteal'
    END AS phase
  FROM cycles
  WHERE user_id = p_user_id
  ORDER BY start_date DESC
  LIMIT 1;
$$;

-- Pure utility: returns phase name from cycle day number
CREATE OR REPLACE FUNCTION get_cycle_phase(cycle_day integer, cycle_length integer DEFAULT 28)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN cycle_day BETWEEN 1  AND 5            THEN 'menstrual'
    WHEN cycle_day BETWEEN 6  AND 13           THEN 'follicular'
    WHEN cycle_day BETWEEN 14 AND 16           THEN 'ovulatory'
    WHEN cycle_day BETWEEN 17 AND cycle_length THEN 'luteal'
    ELSE 'unknown'
  END;
$$;

-- Auto-creates a user_profiles row after signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO user_profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Auto-updates updated_at on any row update
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =============================================================================
-- 9. TRIGGERS
-- =============================================================================

-- Auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at
DROP TRIGGER IF EXISTS set_updated_at ON user_profiles;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON cycles;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON cycles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON mood_logs;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON mood_logs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON daily_notes;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON daily_notes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- 10. ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- user_profiles (keyed on id, not user_id)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own" ON user_profiles;
DROP POLICY IF EXISTS "insert_own" ON user_profiles;
DROP POLICY IF EXISTS "update_own" ON user_profiles;
CREATE POLICY "select_own" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "insert_own" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "update_own" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- cycles
ALTER TABLE cycles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own" ON cycles;
DROP POLICY IF EXISTS "insert_own" ON cycles;
DROP POLICY IF EXISTS "update_own" ON cycles;
DROP POLICY IF EXISTS "delete_own" ON cycles;
CREATE POLICY "select_own" ON cycles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own" ON cycles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own" ON cycles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own" ON cycles FOR DELETE USING (auth.uid() = user_id);

-- symptom_types (public read, no user writes)
ALTER TABLE symptom_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read" ON symptom_types;
CREATE POLICY "public_read" ON symptom_types FOR SELECT USING (true);

-- period_logs
ALTER TABLE period_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own" ON period_logs;
DROP POLICY IF EXISTS "insert_own" ON period_logs;
DROP POLICY IF EXISTS "update_own" ON period_logs;
DROP POLICY IF EXISTS "delete_own" ON period_logs;
CREATE POLICY "select_own" ON period_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own" ON period_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own" ON period_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own" ON period_logs FOR DELETE USING (auth.uid() = user_id);

-- symptom_logs
ALTER TABLE symptom_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own" ON symptom_logs;
DROP POLICY IF EXISTS "insert_own" ON symptom_logs;
DROP POLICY IF EXISTS "update_own" ON symptom_logs;
DROP POLICY IF EXISTS "delete_own" ON symptom_logs;
CREATE POLICY "select_own" ON symptom_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own" ON symptom_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own" ON symptom_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own" ON symptom_logs FOR DELETE USING (auth.uid() = user_id);

-- mood_logs
ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own" ON mood_logs;
DROP POLICY IF EXISTS "insert_own" ON mood_logs;
DROP POLICY IF EXISTS "update_own" ON mood_logs;
DROP POLICY IF EXISTS "delete_own" ON mood_logs;
CREATE POLICY "select_own" ON mood_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own" ON mood_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own" ON mood_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own" ON mood_logs FOR DELETE USING (auth.uid() = user_id);

-- daily_notes
ALTER TABLE daily_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own" ON daily_notes;
DROP POLICY IF EXISTS "insert_own" ON daily_notes;
DROP POLICY IF EXISTS "update_own" ON daily_notes;
DROP POLICY IF EXISTS "delete_own" ON daily_notes;
CREATE POLICY "select_own" ON daily_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own" ON daily_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own" ON daily_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own" ON daily_notes FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- Done!
-- =============================================================================

COMMIT;
