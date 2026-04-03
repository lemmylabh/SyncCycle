-- =============================================================================
-- SyncCycle — Functions and Triggers
-- Shared utilities used across all tables.
-- Run AFTER all core tables (01–07) have been created.
-- =============================================================================

BEGIN;

-- =============================================================================
-- FUNCTIONS
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

-- Pure utility: returns phase name given a cycle day number
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

-- Auto-creates a user_profiles row after Supabase Auth signup
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
-- TRIGGERS
-- =============================================================================

-- Auto-create profile row on auth signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at on core tables
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

COMMIT;
