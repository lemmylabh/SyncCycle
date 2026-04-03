-- =============================================================================
-- SyncCycle — cycles table
-- Tracks sequential menstrual cycles per user for historical analysis.
-- Requires: 01_user_profiles.sql
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS cycles (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cycle_number   integer NOT NULL,
  start_date     date NOT NULL,
  end_date       date,
  cycle_length   integer GENERATED ALWAYS AS (end_date - start_date) STORED,
  notes          text,

  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),

  UNIQUE (user_id, cycle_number)
);

CREATE INDEX IF NOT EXISTS idx_cycles_user_date ON cycles (user_id, start_date DESC);

-- RLS
ALTER TABLE cycles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own" ON cycles;
DROP POLICY IF EXISTS "insert_own" ON cycles;
DROP POLICY IF EXISTS "update_own" ON cycles;
DROP POLICY IF EXISTS "delete_own" ON cycles;

CREATE POLICY "select_own" ON cycles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own" ON cycles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own" ON cycles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own" ON cycles FOR DELETE USING (auth.uid() = user_id);

COMMIT;
