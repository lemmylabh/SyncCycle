-- =============================================================================
-- SyncCycle — daily_notes table (Tracker 4: Journal)
-- Free-text daily journal entries. One note per day per user.
-- Requires: 01_user_profiles.sql, 08_functions_triggers.sql
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS daily_notes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date    date NOT NULL,
  content     text NOT NULL,

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  UNIQUE (user_id, log_date)
);

-- RLS
ALTER TABLE daily_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own" ON daily_notes;
DROP POLICY IF EXISTS "insert_own" ON daily_notes;
DROP POLICY IF EXISTS "update_own" ON daily_notes;
DROP POLICY IF EXISTS "delete_own" ON daily_notes;

CREATE POLICY "select_own" ON daily_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own" ON daily_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own" ON daily_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own" ON daily_notes FOR DELETE USING (auth.uid() = user_id);

COMMIT;
