-- =============================================================================
-- SyncCycle — Insights Feed Schema
-- Apply in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- Requires existing auth.users from Supabase Auth
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. INSIGHT_FEEDS
--    One row per user per day. Cards are stored as a JSONB array.
--    Card shape: {
--      id: string (uuid),
--      hashtags: string[],          -- e.g. ["sleep", "fitness"]
--      body: string,                -- AI-generated insight text
--      suggestion: string | null,   -- Optional action tip
--      correlationKey: string,      -- For flag suppression matching
--      isFallback: boolean,         -- true = general advice (missing data)
--      cardType: "insight" | "prediction" | "suggestion" | "pattern"
--    }
-- =============================================================================

CREATE TABLE IF NOT EXISTS insight_feeds (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feed_date    DATE        NOT NULL,
  phase        TEXT        NOT NULL,    -- menstrual | follicular | ovulatory | luteal
  target_count SMALLINT    NOT NULL DEFAULT 20,  -- feed count requested (20/30/40/50)
  cards        JSONB       NOT NULL DEFAULT '[]',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, feed_date)
);

CREATE INDEX IF NOT EXISTS idx_insight_feeds_user_date
  ON insight_feeds (user_id, feed_date DESC);

ALTER TABLE insight_feeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own feeds"
  ON insight_feeds FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feeds"
  ON insight_feeds FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feeds"
  ON insight_feeds FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================================================
-- 2. INSIGHT_FEEDBACK
--    One row per card per user. Tracks Helpful / Not Helpful reactions.
--    card_index is the 0-based position in insight_feeds.cards JSONB array.
-- =============================================================================

CREATE TABLE IF NOT EXISTS insight_feedback (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feed_id     UUID        NOT NULL REFERENCES insight_feeds(id) ON DELETE CASCADE,
  card_index  SMALLINT    NOT NULL,
  reaction    TEXT        NOT NULL CHECK (reaction IN ('helpful', 'not_helpful')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, feed_id, card_index)
);

CREATE INDEX IF NOT EXISTS idx_insight_feedback_user
  ON insight_feedback (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_insight_feedback_feed
  ON insight_feedback (feed_id);

ALTER TABLE insight_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own feedback"
  ON insight_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback"
  ON insight_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feedback"
  ON insight_feedback FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================================================
-- 3. INSIGHT_CORRELATION_FLAGS
--    Tracks how many times a specific data correlation pattern has been flagged
--    as "Not Helpful" by the user. Suppressed at 5 flags.
--
--    correlation_key format (built in TypeScript):
--      Sorted hashtags joined by "+" then "|" then sorted binned data values
--      e.g. "fitness+sleep|sleep_avg_hours:6|workouts_skipped:true"
--
--    Important: this flags the correlation between data VALUES, not the trackers.
--    Example: "sleep avg 6h + skipped workouts" is flagged, not "#sleep" itself.
--    #sleep will still appear in other correlations that are not flagged.
-- =============================================================================

CREATE TABLE IF NOT EXISTS insight_correlation_flags (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  correlation_key TEXT        NOT NULL,
  flag_count      SMALLINT    NOT NULL DEFAULT 1,
  suppressed      BOOLEAN     NOT NULL DEFAULT false,
  last_flagged    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, correlation_key)
);

CREATE INDEX IF NOT EXISTS idx_correlation_flags_user_suppressed
  ON insight_correlation_flags (user_id, suppressed);

CREATE INDEX IF NOT EXISTS idx_correlation_flags_user_key
  ON insight_correlation_flags (user_id, correlation_key);

ALTER TABLE insight_correlation_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own flags"
  ON insight_correlation_flags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own flags"
  ON insight_correlation_flags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flags"
  ON insight_correlation_flags FOR UPDATE
  USING (auth.uid() = user_id);

COMMIT;

-- =============================================================================
-- NOTES
-- =============================================================================
-- After applying, verify tables were created:
--   SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public'
--   AND table_name LIKE 'insight%';
--
-- To reset during development (drops all data):
--   DROP TABLE IF EXISTS insight_correlation_flags CASCADE;
--   DROP TABLE IF EXISTS insight_feedback CASCADE;
--   DROP TABLE IF EXISTS insight_feeds CASCADE;
-- =============================================================================
