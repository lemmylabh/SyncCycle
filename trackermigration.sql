-- Add fiona_tracker_access column to user_profiles
-- Run this in the Supabase SQL editor

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS fiona_tracker_access TEXT[]
  DEFAULT ARRAY['period', 'mood', 'fitness', 'nutrition', 'sleep', 'symptoms'];

-- Backfill existing rows that have enabled_trackers set
UPDATE user_profiles
SET fiona_tracker_access = enabled_trackers
WHERE enabled_trackers IS NOT NULL
  AND fiona_tracker_access IS NULL;
