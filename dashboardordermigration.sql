-- Run this in your Supabase SQL editor

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS dashboard_card_order TEXT[];

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS profile_card_size TEXT DEFAULT '1x2';

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS insights_card_size TEXT DEFAULT '1x1';
