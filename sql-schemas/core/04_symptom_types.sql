-- =============================================================================
-- SyncCycle — symptom_types table (lookup / seed)
-- Global lookup table pre-seeded with 17 symptom types.
-- Not user-editable. Public read.
-- Requires: nothing (standalone lookup table)
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS symptom_types (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL UNIQUE,
  label          text NOT NULL,
  category       text NOT NULL CHECK (category IN ('physical', 'emotional', 'energy')),
  icon           text NOT NULL DEFAULT '●',
  display_order  integer NOT NULL DEFAULT 0
);

INSERT INTO symptom_types (name, label, category, icon, display_order)
VALUES
  -- Physical
  ('cramps',            'Cramps',            'physical',  '🌊', 1),
  ('bloating',          'Bloating',          'physical',  '💨', 2),
  ('headache',          'Headache',          'physical',  '🤕', 3),
  ('breast_tenderness', 'Breast Tenderness', 'physical',  '💗', 4),
  ('backache',          'Back Ache',         'physical',  '🔙', 5),
  ('nausea',            'Nausea',            'physical',  '🤢', 6),
  ('acne',              'Acne',              'physical',  '✦',  7),
  ('spotting',          'Spotting',          'physical',  '🩸', 8),
  -- Emotional
  ('mood_swings',       'Mood Swings',       'emotional', '🎭', 9),
  ('anxiety',           'Anxiety',           'emotional', '😰', 10),
  ('irritability',      'Irritability',      'emotional', '😤', 11),
  ('brain_fog',         'Brain Fog',         'emotional', '🌫️', 12),
  ('low_mood',          'Low Mood',          'emotional', '😔', 13),
  ('cravings',          'Cravings',          'emotional', '🍫', 14),
  -- Energy
  ('fatigue',           'Fatigue',           'energy',    '😴', 15),
  ('high_energy',       'High Energy',       'energy',    '⚡', 16),
  ('insomnia',          'Insomnia',          'energy',    '🌙', 17)
ON CONFLICT (name) DO NOTHING;

-- RLS — public read, no user writes
ALTER TABLE symptom_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read" ON symptom_types;
CREATE POLICY "public_read" ON symptom_types FOR SELECT USING (true);

COMMIT;
