-- =============================================================================
-- SyncCycle — Insights Feed tables
-- insight_feeds: one AI-generated card feed per user per day (JSONB array)
-- insight_feedback: user reactions (helpful / not helpful) per card
-- insight_correlation_flags: suppressed data correlations after 5 "not helpful" flags
-- Requires: 01_user_profiles.sql
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. INSIGHT_FEEDS
-- One row per user per day. Cards stored as a JSONB array.
-- Card shape: {
--   id: string (uuid),
--   hashtags: string[],          -- e.g. ["sleep", "fitness"]
--   body: string,                -- AI-generated insight text
--   suggestion: string | null,   -- Optional action tip
--   correlationKey: string,      -- For flag suppression matching
--   isFallback: boolean,         -- true = general advice (missing data)
--   cardType: "insight" | "prediction" | "suggestion" | "pattern"
-- }
-- =============================================================================

CREATE TABLE IF NOT EXISTS insight_feeds (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feed_date    date        NOT NULL,
  phase        text        NOT NULL,  -- menstrual | follicular | ovulatory | luteal
  target_count smallint    NOT NULL DEFAULT 20,
  cards        jsonb       NOT NULL DEFAULT '[]',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),

  UNIQUE (user_id, feed_date)
);

CREATE INDEX IF NOT EXISTS idx_insight_feeds_user_date ON insight_feeds (user_id, feed_date DESC);

ALTER TABLE insight_feeds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own feeds"   ON insight_feeds;
DROP POLICY IF EXISTS "Users can insert own feeds" ON insight_feeds;
DROP POLICY IF EXISTS "Users can update own feeds" ON insight_feeds;

CREATE POLICY "Users can read own feeds"   ON insight_feeds FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own feeds" ON insight_feeds FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own feeds" ON insight_feeds FOR UPDATE USING (auth.uid() = user_id);

-- =============================================================================
-- 2. INSIGHT_FEEDBACK
-- One row per card per user. Tracks Helpful / Not Helpful reactions.
-- =============================================================================

CREATE TABLE IF NOT EXISTS insight_feedback (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feed_id     uuid        NOT NULL REFERENCES insight_feeds(id) ON DELETE CASCADE,
  card_index  smallint    NOT NULL,
  reaction    text        NOT NULL CHECK (reaction IN ('helpful', 'not_helpful')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  UNIQUE (user_id, feed_id, card_index)
);

CREATE INDEX IF NOT EXISTS idx_insight_feedback_user ON insight_feedback (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_insight_feedback_feed ON insight_feedback (feed_id);

ALTER TABLE insight_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own feedback"   ON insight_feedback;
DROP POLICY IF EXISTS "Users can insert own feedback" ON insight_feedback;
DROP POLICY IF EXISTS "Users can update own feedback" ON insight_feedback;

CREATE POLICY "Users can read own feedback"   ON insight_feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own feedback" ON insight_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own feedback" ON insight_feedback FOR UPDATE USING (auth.uid() = user_id);

-- =============================================================================
-- 3. INSIGHT_CORRELATION_FLAGS
-- Tracks flagged data correlation patterns. Suppressed after 5 "not helpful" flags.
-- correlation_key format: "hashtag1+hashtag2|binned_value_1|binned_value_2"
-- e.g. "fitness+sleep|sleep_avg_hours:6|workouts_skipped:true"
-- =============================================================================

CREATE TABLE IF NOT EXISTS insight_correlation_flags (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  correlation_key text        NOT NULL,
  flag_count      smallint    NOT NULL DEFAULT 1,
  suppressed      boolean     NOT NULL DEFAULT false,
  last_flagged    timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE (user_id, correlation_key)
);

CREATE INDEX IF NOT EXISTS idx_correlation_flags_user_suppressed ON insight_correlation_flags (user_id, suppressed);
CREATE INDEX IF NOT EXISTS idx_correlation_flags_user_key        ON insight_correlation_flags (user_id, correlation_key);

ALTER TABLE insight_correlation_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own flags"   ON insight_correlation_flags;
DROP POLICY IF EXISTS "Users can insert own flags" ON insight_correlation_flags;
DROP POLICY IF EXISTS "Users can update own flags" ON insight_correlation_flags;

CREATE POLICY "Users can read own flags"   ON insight_correlation_flags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own flags" ON insight_correlation_flags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own flags" ON insight_correlation_flags FOR UPDATE USING (auth.uid() = user_id);

COMMIT;
