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
DROP POLICY IF EXISTS "inviter_select" ON partner_invites;
DROP POLICY IF EXISTS "inviter_insert" ON partner_invites;
CREATE POLICY "inviter_select" ON partner_invites
  FOR SELECT USING (auth.uid() = inviter_id);
CREATE POLICY "inviter_insert" ON partner_invites
  FOR INSERT WITH CHECK (auth.uid() = inviter_id);

-- ── Helper: returns the linked_to UUID if the caller is a partner, else NULL ──
CREATE OR REPLACE FUNCTION public.partner_linked_to()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT linked_to FROM public.user_profiles
  WHERE id = auth.uid() AND role = 'partner'
  LIMIT 1;
$$;

-- ── Allow partner to read the linked (inviter) user's data ───────────────────

DROP POLICY IF EXISTS "partner_select_linked_profile"  ON user_profiles;
DROP POLICY IF EXISTS "partner_select_linked_cycles"    ON cycles;
DROP POLICY IF EXISTS "partner_select_linked_period"    ON period_logs;
DROP POLICY IF EXISTS "partner_select_linked_symptoms"  ON symptom_logs;
DROP POLICY IF EXISTS "partner_select_linked_mood"      ON mood_logs;
DROP POLICY IF EXISTS "partner_select_linked_workouts"  ON workout_logs;
DROP POLICY IF EXISTS "partner_select_linked_nutrition" ON nutrition_logs;
DROP POLICY IF EXISTS "partner_select_linked_sleep"     ON sleep_logs;
DROP POLICY IF EXISTS "partner_select_linked_insights"  ON insight_feeds;

CREATE POLICY "partner_select_linked_profile"  ON user_profiles  FOR SELECT USING (id      = public.partner_linked_to());
CREATE POLICY "partner_select_linked_cycles"   ON cycles         FOR SELECT USING (user_id = public.partner_linked_to());
CREATE POLICY "partner_select_linked_period"   ON period_logs    FOR SELECT USING (user_id = public.partner_linked_to());
CREATE POLICY "partner_select_linked_symptoms" ON symptom_logs   FOR SELECT USING (user_id = public.partner_linked_to());
CREATE POLICY "partner_select_linked_mood"     ON mood_logs      FOR SELECT USING (user_id = public.partner_linked_to());
CREATE POLICY "partner_select_linked_workouts" ON workout_logs   FOR SELECT USING (user_id = public.partner_linked_to());
CREATE POLICY "partner_select_linked_nutrition"ON nutrition_logs FOR SELECT USING (user_id = public.partner_linked_to());
CREATE POLICY "partner_select_linked_sleep"    ON sleep_logs     FOR SELECT USING (user_id = public.partner_linked_to());
CREATE POLICY "partner_select_linked_insights" ON insight_feeds  FOR SELECT USING (user_id = public.partner_linked_to());

COMMIT;
