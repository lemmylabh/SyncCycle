-- Add partner_enabled flag to user_profiles
-- When false, partner accounts linked to this user will see a disabled screen.

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS partner_enabled boolean NOT NULL DEFAULT true;
