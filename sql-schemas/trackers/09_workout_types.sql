-- =============================================================================
-- SyncCycle — workout_types table (lookup / seed)
-- Global lookup table pre-seeded with 13 workout categories.
-- Not user-editable. Public read.
-- Requires: nothing (standalone lookup table)
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS workout_types (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL UNIQUE,
  label          text NOT NULL,
  category       text NOT NULL CHECK (category IN ('cardio', 'strength', 'flexibility', 'mindfulness', 'sport')),
  icon           text NOT NULL DEFAULT '●',
  display_order  integer NOT NULL DEFAULT 0
);

INSERT INTO workout_types (name, label, category, icon, display_order)
VALUES
  -- Cardio
  ('running',           'Running',           'cardio',       '🏃', 1),
  ('cycling',           'Cycling',           'cardio',       '🚴', 2),
  ('swimming',          'Swimming',          'cardio',       '🏊', 3),
  ('hiit',              'HIIT',              'cardio',       '🔥', 4),
  ('walking',           'Walking',           'cardio',       '🚶', 5),
  ('dancing',           'Dancing',           'cardio',       '💃', 6),
  -- Strength
  ('strength_training', 'Strength Training', 'strength',     '🏋️', 7),
  ('pilates',           'Pilates',           'strength',     '🤸', 8),
  -- Flexibility
  ('yoga',              'Yoga',              'flexibility',  '🧘', 9),
  ('stretching',        'Stretching',        'flexibility',  '🙆', 10),
  -- Mindfulness
  ('meditation',        'Meditation',        'mindfulness',  '🧠', 11),
  ('breathwork',        'Breathwork',        'mindfulness',  '🌬️', 12),
  -- Sport
  ('sport',             'Sport / Other',     'sport',        '⚽', 13)
ON CONFLICT (name) DO NOTHING;

-- RLS — public read, no user writes
ALTER TABLE workout_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read" ON workout_types;
CREATE POLICY "public_read" ON workout_types FOR SELECT USING (true);

COMMIT;
