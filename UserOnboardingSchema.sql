-- =============================================================================
-- SyncCycle — Onboarding Schema Migration
-- Run AFTER schema.sql (extends user_profiles for onboarding data collection)
-- Paste into: Supabase Dashboard → SQL Editor → Run
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. ALTER user_profiles — Drop old column, add new onboarding columns
-- =============================================================================

-- Replace the too-blunt boolean with a proper enum-style text column
ALTER TABLE user_profiles DROP COLUMN IF EXISTS is_regular;

-- Pronouns (Screen 1)
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS pronouns text
  CHECK (pronouns IN ('she_her', 'they_them', 'prefer_not_to_say', 'custom'));

-- Cycle regularity replacing boolean is_regular (Screen 2)
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS cycle_regularity text
  CHECK (cycle_regularity IN ('regular', 'somewhat_irregular', 'very_unpredictable', 'not_sure'));

-- Typical flow description (Screen 3)
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS typical_flow text
  CHECK (typical_flow IN ('light', 'moderate', 'heavy', 'varies'));

-- Baseline symptoms the user usually experiences (Screen 3)
-- Values match symptom_types.name e.g. 'cramps', 'fatigue', 'bloating'
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS baseline_symptoms text[] DEFAULT '{}';

-- Diagnosed conditions (Screen 3)
-- Values: 'pcos', 'endometriosis', 'fibroids', 'thyroid_issues', 'pmdd', 'none', 'prefer_not_to_say'
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS diagnosed_conditions text[] DEFAULT '{}';

-- Which trackers the user wants enabled (Screen 4)
-- Values: 'mood', 'fitness', 'nutrition', 'sleep', 'symptoms'
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS enabled_trackers text[] DEFAULT '{}';

-- Reminder types the user opted into (Screen 4)
-- Values: 'period_prediction', 'ovulation_window', 'daily_tracking'
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS notification_types text[] DEFAULT '{}';

-- How many days before to send reminders (Screen 4)
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS notification_advance_days integer
  CHECK (notification_advance_days IN (1, 3, 7));

-- =============================================================================
-- 2. UPDATE CHECK constraints — app_goal & contraceptive_use
-- =============================================================================

-- app_goal: add 'perimenopause_tracking' (was missing from original 4-value set)
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_app_goal_check;
ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_app_goal_check
  CHECK (app_goal IN (
    'track_health',
    'avoid_pregnancy',
    'conceive',
    'manage_symptoms',
    'perimenopause_tracking'
  ));

-- contraceptive_use: split 'iud' into hormonal/copper, add 'condom', remove 'injection'
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_contraceptive_use_check;
ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_contraceptive_use_check
  CHECK (contraceptive_use IN (
    'none',
    'pill',
    'hormonal_iud',
    'copper_iud',
    'implant',
    'patch',
    'condom',
    'other'
  ));

-- =============================================================================
-- 3. SUPABASE STORAGE — avatars bucket
-- =============================================================================
-- NOTE: Run the following in Supabase Dashboard → Storage → New Bucket,
-- OR via the SQL below (requires pg_storage extension enabled in your project).
-- Bucket name: avatars | Public: true

-- If using the SQL approach (Supabase managed storage functions):
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS: users can only manage files under their own user_id prefix
-- Path format: avatars/{user_id}/avatar (or avatar.jpg, avatar.png, etc.)

DROP POLICY IF EXISTS "avatar_select_own" ON storage.objects;
DROP POLICY IF EXISTS "avatar_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "avatar_update_own" ON storage.objects;
DROP POLICY IF EXISTS "avatar_delete_own" ON storage.objects;

CREATE POLICY "avatar_select_own" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatar_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatar_update_own" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatar_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- =============================================================================
-- Done! user_profiles now has all onboarding fields.
-- The onboarding modal saves to user_profiles and inserts the first cycles row.
-- =============================================================================

COMMIT;
