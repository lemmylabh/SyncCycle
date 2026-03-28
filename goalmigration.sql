-- Goal options migration
-- Removes: conceive, avoid_pregnancy, perimenopause_tracking
-- Adds:    optimize_fitness, build_routine

-- 1. Drop old check constraint
ALTER TABLE user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_app_goal_check;

-- 2. Migrate existing rows with removed goal values → track_health
UPDATE user_profiles
  SET app_goal = 'track_health'
  WHERE app_goal IN ('conceive', 'avoid_pregnancy', 'perimenopause_tracking');

-- 3. Add new check constraint with updated values
ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_app_goal_check
  CHECK (app_goal IN (
    'track_health',
    'manage_symptoms',
    'optimize_fitness',
    'build_routine'
  ));
