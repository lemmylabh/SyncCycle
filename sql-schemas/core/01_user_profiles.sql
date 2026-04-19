-- =============================================================================
-- SyncCycle — user_profiles table
-- Consolidated from: schema.sql + UserOnboardingSchema.sql + profilemigration.sql
--                    + dashboardordermigration.sql + goalmigration.sql
--                    + trackermigration.sql
-- Run this FIRST. All other tables depend on auth.users existing (Supabase Auth).
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS user_profiles (
  id                     uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name           text,
  avatar_url             text,
  date_of_birth          date,

  -- Biological Calibration
  average_cycle_length   integer NOT NULL DEFAULT 28,
  average_period_length  integer NOT NULL DEFAULT 5,
  tracking_start_date    date,

  -- Onboarding: cycle profile
  cycle_regularity       text CHECK (cycle_regularity IN ('regular', 'somewhat_irregular', 'very_unpredictable', 'not_sure')),
  typical_flow           text CHECK (typical_flow IN ('light', 'moderate', 'heavy', 'varies')),
  baseline_symptoms      text[] DEFAULT '{}',
  diagnosed_conditions   text[] DEFAULT '{}',

  -- Onboarding: goals & contraception
  app_goal               text CHECK (app_goal IN (
    'track_health',
    'manage_symptoms',
    'optimize_fitness',
    'build_routine'
  )),
  contraceptive_use      text CHECK (contraceptive_use IN (
    'none', 'pill', 'hormonal_iud', 'copper_iud', 'implant', 'patch', 'condom', 'other'
  )),

  -- Onboarding: trackers & notifications
  enabled_trackers       text[] DEFAULT '{}',
  notification_types     text[] DEFAULT '{}',
  notification_advance_days integer CHECK (notification_advance_days IN (1, 3, 7)),

  -- Profile extras
  pronouns               text CHECK (pronouns IN ('she_her', 'they_them', 'prefer_not_to_say', 'custom')),
  about_me               text,
  interests              text[],

  -- Dashboard layout preferences
  dashboard_card_order   text[],
  profile_card_size      text DEFAULT '1x2',
  insights_card_size     text DEFAULT '1x1',

  -- Fiona AI tracker access
  fiona_tracker_access   text[] DEFAULT ARRAY['period', 'mood', 'fitness', 'nutrition', 'sleep', 'symptoms'],

  -- System
  timezone               text NOT NULL DEFAULT 'UTC',
  onboarding_completed   boolean NOT NULL DEFAULT false,
  is_admin               boolean NOT NULL DEFAULT false,

  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own" ON user_profiles;
DROP POLICY IF EXISTS "insert_own" ON user_profiles;
DROP POLICY IF EXISTS "update_own" ON user_profiles;

CREATE POLICY "select_own" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "insert_own" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "update_own" ON user_profiles FOR UPDATE USING (auth.uid() = id);

COMMIT;
