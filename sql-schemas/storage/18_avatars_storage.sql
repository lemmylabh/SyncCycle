-- =============================================================================
-- SyncCycle — Supabase Storage: avatars bucket
-- Consolidated from: profilemigration.sql + UserOnboardingSchema.sql
-- Creates the public avatars bucket and scoped RLS policies.
-- Path format: avatars/{user_id}/avatar (or avatar.jpg, avatar.png, etc.)
--
-- NOTE: If storage.buckets INSERT fails (permissions issue), create the bucket
-- manually in Supabase Dashboard → Storage → New Bucket:
--   Name: avatars | Public: true
-- Then re-run only the policy section below.
-- Requires: Supabase project with pg_storage extension enabled
-- =============================================================================

BEGIN;

-- Create or ensure the avatars bucket is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies to allow clean re-run
DROP POLICY IF EXISTS "avatar_select_own" ON storage.objects;
DROP POLICY IF EXISTS "avatar_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "avatar_update_own" ON storage.objects;
DROP POLICY IF EXISTS "avatar_delete_own" ON storage.objects;

-- Users can read their own avatar (scoped to their user_id folder)
CREATE POLICY "avatar_select_own" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can upload to their own folder only
CREATE POLICY "avatar_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update their own avatar
CREATE POLICY "avatar_update_own" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own avatar
CREATE POLICY "avatar_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

COMMIT;
