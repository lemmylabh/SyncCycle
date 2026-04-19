-- Add is_admin column to user_profiles
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- Promote the 7 admin users (looked up by email in auth.users)
UPDATE user_profiles
SET is_admin = true
WHERE id IN (
  SELECT id FROM auth.users
  WHERE email IN (
    'alisa.adamska@code.berlin',
    'manish.labh@code.berlin',
    'fiona.haege@code.berlin',
    'sameeksha.mehta@code.berlin',
    'jane.morut@code.berlin',
    'stephen.quaicoe@code.berlin',
    'tarinumu.egbuson@code.berlin'
  )
);
