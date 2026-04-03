-- =============================================================================
-- SyncCycle — tips table
-- Global tips/advice shown to all users. Not user-specific.
-- Public read when is_active = true.
-- Requires: nothing (standalone table)
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS tips (
  id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  title       varchar(40)  NOT NULL CHECK (char_length(title) <= 40),
  description varchar(120) NOT NULL CHECK (char_length(description) <= 120),
  is_active   boolean      NOT NULL DEFAULT true,
  created_at  timestamptz  NOT NULL DEFAULT now()
);

-- RLS — public read for active tips only
ALTER TABLE tips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tips_public_read" ON tips;
CREATE POLICY "tips_public_read" ON tips FOR SELECT USING (is_active = true);

-- Seed tips
INSERT INTO tips (title, description) VALUES
  ('Stay consistent',          'Log your data daily to unlock better insights over time.'),
  ('Enable AI Insights',       'Turn on AI to get smarter, personalised recommendations.'),
  ('Track your symptoms',      'Small daily logs reveal patterns that surprise you.'),
  ('Rest is productive',       'Honouring rest in the luteal phase improves performance later.'),
  ('Nutrition timing matters', 'Iron-rich foods during your period replenish what your body needs.'),
  ('Move with your cycle',     'High-intensity training works best in the follicular phase.'),
  ('Check in with Fiona',      'Ask Fiona anything — she knows your cycle inside out.'),
  ('Sleep shapes your cycle',  'Poor sleep lengthens the luteal phase and worsens PMS.'),
  ('Patterns take time',       'After 2–3 cycles, SyncCycle''s predictions get much more accurate.');

COMMIT;
