-- ── Partner Account System ────────────────────────────────────────────────────
-- Run this migration in the Supabase SQL editor.

BEGIN;

-- Add role + linked_to columns to user_profiles
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS role      text NOT NULL DEFAULT 'primary'
    CHECK (role IN ('primary', 'partner')),
  ADD COLUMN IF NOT EXISTS linked_to uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Partner invite tokens
CREATE TABLE IF NOT EXISTS partner_invites (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  token       text        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  email       text        NOT NULL,
  inviter_id  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '72 hours'),
  used_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE partner_invites ENABLE ROW LEVEL SECURITY;

-- Inviter can read and create their own invites
CREATE POLICY "inviter_select" ON partner_invites
  FOR SELECT USING (auth.uid() = inviter_id);

CREATE POLICY "inviter_insert" ON partner_invites
  FOR INSERT WITH CHECK (auth.uid() = inviter_id);

COMMIT;
