# SyncCycle — Final Database Schema

This consolidated schema incorporates the **4 Tracker system** (Period, Symptoms, Vibe-Check, and Journal) and the **Enhanced User Profile** for a complete SyncCycle foundation.

## Design Principles

- **UUID primary keys** on all tables (`gen_random_uuid()`).
- **Performance:** Indexes on `(user_id, log_date DESC)` for all daily logging tables.
- **Security:** Row Level Security (RLS) enabled for all user-owned rows.
- **Integrity:** Foreign keys use `ON DELETE CASCADE` to ensure clean data removal.

---

# 1. User Infrastructure

## `user_profiles`

Expanded to include biological calibration, goals, and onboarding status.

```sql
CREATE TABLE user_profiles (
  id                     uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name           text,
  avatar_url             text,

  date_of_birth          date,

  -- Biological Calibration
  average_cycle_length   integer NOT NULL DEFAULT 28,
  average_period_length  integer NOT NULL DEFAULT 5,
  is_regular             boolean DEFAULT true,
  tracking_start_date    date,

  -- Contextual Onboarding Data
  app_goal               text CHECK (
    app_goal IN ('track_health', 'avoid_pregnancy', 'conceive', 'manage_symptoms')
  ),
  contraceptive_use      text CHECK (
    contraceptive_use IN ('none','pill','iud','implant','injection','patch','other')
  ),

  -- System Settings
  timezone               text NOT NULL DEFAULT 'UTC',
  onboarding_completed   boolean NOT NULL DEFAULT false,

  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);
```

## `cycles`

Tracks sequential cycles for historical analysis.

```sql
CREATE TABLE cycles (
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
```

CREATE INDEX idx_cycles_user_date ON cycles (user_id, start_date DESC);

---

## `symptom_types`

Master lookup table — pre-seeded, not editable by users.

```sql
CREATE TABLE symptom_types (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL UNIQUE,
  label          text NOT NULL,
  category       text NOT NULL CHECK (category IN ('physical','emotional','energy')),
  icon           text NOT NULL DEFAULT '●',
  display_order  integer NOT NULL DEFAULT 0
);
```

**Seed data:**
```sql
INSERT INTO symptom_types (name, label, category, icon, display_order) VALUES
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
('insomnia',          'Insomnia',          'energy',    '🌙', 17);
```

---

# 2. The 4 Daily Trackers

## Tracker 1: Period Flow (`period_logs`)

Captured during the menstrual phase.

```sql
CREATE TABLE period_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cycle_id    uuid NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
  log_date    date NOT NULL,
  flow_level  smallint NOT NULL CHECK (flow_level BETWEEN 0 AND 4),
  color       text CHECK (
    color IN ('bright_red','dark_red','pink','brown','black')
  ),
  clots       boolean NOT NULL DEFAULT false,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),

  UNIQUE (user_id, log_date)
);

CREATE INDEX idx_period_logs_user_date ON period_logs (user_id, log_date DESC);
```

## Tracker 2: Symptoms (`symptom_logs`)

Tracks physical and emotional changes.

```sql
CREATE TABLE symptom_logs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cycle_id         uuid REFERENCES cycles(id) ON DELETE SET NULL,
  log_date         date NOT NULL,
  symptom_type_id  uuid NOT NULL REFERENCES symptom_types(id),
  severity         smallint NOT NULL CHECK (severity BETWEEN 1 AND 5),
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),

  UNIQUE (user_id, log_date, symptom_type_id)
);

CREATE INDEX idx_symptom_logs_user_date ON symptom_logs (user_id, log_date DESC);
```

## Tracker 3: Vitality & Mood (`mood_logs`)

Focuses on energy levels and internal well-being.

```sql
CREATE TABLE mood_logs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cycle_id       uuid REFERENCES cycles(id) ON DELETE SET NULL,
  log_date       date NOT NULL,
  mood_score     smallint NOT NULL CHECK (mood_score BETWEEN 1 AND 5),
  energy_score   smallint NOT NULL CHECK (energy_score BETWEEN 1 AND 5),
  libido_score   smallint CHECK (libido_score BETWEEN 1 AND 5),
  notes          text,

  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),

  UNIQUE (user_id, log_date)
);

CREATE INDEX idx_mood_logs_user_date ON mood_logs (user_id, log_date DESC);
```

## Tracker 4: Daily Journal (`daily_notes`)

A flexible space for broader life context.

```sql
CREATE TABLE daily_notes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date    date NOT NULL,
  content     text NOT NULL,

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  UNIQUE (user_id, log_date)
);
```

---

# 3. Automation & Functions

## Cycle Phase Logic

Computes the current cycle state from `start_date`.

```sql
CREATE OR REPLACE FUNCTION get_current_cycle(p_user_id uuid)
RETURNS TABLE (
  cycle_id uuid,
  start_date date,
  cycle_day integer,
  phase text
)
LANGUAGE sql STABLE AS $$
  SELECT
    id AS cycle_id,
    start_date,
    (CURRENT_DATE - start_date + 1)::integer AS cycle_day,
    CASE
      WHEN (CURRENT_DATE - start_date + 1) BETWEEN 1  AND 5  THEN 'menstrual'
      WHEN (CURRENT_DATE - start_date + 1) BETWEEN 6  AND 13 THEN 'follicular'
      WHEN (CURRENT_DATE - start_date + 1) BETWEEN 14 AND 16 THEN 'ovulatory'
      ELSE 'luteal'
    END AS phase
  FROM cycles
  WHERE user_id = p_user_id
  ORDER BY start_date DESC
  LIMIT 1;
$$;
```

## Automatic Profile Creation

Triggered after new Supabase Auth signup.

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER AS $$
BEGIN
  INSERT INTO user_profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

## Utility: Phase Name from Day

Pure helper — returns phase name given a cycle day number.

```sql
CREATE OR REPLACE FUNCTION get_cycle_phase(cycle_day integer, cycle_length integer DEFAULT 28)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN cycle_day BETWEEN 1  AND 5            THEN 'menstrual'
    WHEN cycle_day BETWEEN 6  AND 13           THEN 'follicular'
    WHEN cycle_day BETWEEN 14 AND 16           THEN 'ovulatory'
    WHEN cycle_day BETWEEN 17 AND cycle_length THEN 'luteal'
    ELSE 'unknown'
  END;
$$;
```

## Auto-update `updated_at`

```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON cycles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON mood_logs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON daily_notes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

# 4. Security (RLS)

Apply to all user-owned tables. Users can only read/write their own rows.

```sql
-- Template — repeat for: cycles, period_logs, symptom_logs, mood_logs, daily_notes
ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON <table_name>
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "insert_own" ON <table_name>
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own" ON <table_name>
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "delete_own" ON <table_name>
  FOR DELETE USING (auth.uid() = user_id);
```

`user_profiles` — keyed on `id` (not `user_id`):
```sql
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "insert_own" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "update_own" ON user_profiles FOR UPDATE USING (auth.uid() = id);
```

`symptom_types` — public read, no user writes:
```sql
ALTER TABLE symptom_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read" ON symptom_types FOR SELECT USING (true);
```

---

# 5. TypeScript Types

For `lib/types.ts`:

```typescript
export type Phase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';

export interface UserProfile {
  id: string;
  display_name: string | null;
  date_of_birth: string | null;
  avatar_url: string | null;
  average_cycle_length: number;
  average_period_length: number;
  is_regular: boolean | null;
  tracking_start_date: string | null;
  app_goal: 'track_health' | 'avoid_pregnancy' | 'conceive' | 'manage_symptoms' | null;
  contraceptive_use: string | null;
  timezone: string;
  onboarding_completed: boolean;
}

export interface Cycle {
  id: string;
  user_id: string;
  cycle_number: number;
  start_date: string;
  end_date: string | null;
  cycle_length: number | null;
  notes: string | null;
}

export interface PeriodLog {
  id: string;
  user_id: string;
  cycle_id: string;
  log_date: string;
  flow_level: 0 | 1 | 2 | 3 | 4;
  color: 'bright_red' | 'dark_red' | 'pink' | 'brown' | 'black' | null;
  clots: boolean;
  notes: string | null;
}

export interface SymptomType {
  id: string;
  name: string;
  label: string;
  category: 'physical' | 'emotional' | 'energy';
  icon: string;
  display_order: number;
}

export interface SymptomLog {
  id: string;
  user_id: string;
  cycle_id: string | null;
  log_date: string;
  symptom_type_id: string;
  severity: 1 | 2 | 3 | 4 | 5;
  notes: string | null;
}

export interface MoodLog {
  id: string;
  user_id: string;
  cycle_id: string | null;
  log_date: string;
  mood_score: 1 | 2 | 3 | 4 | 5;
  energy_score: 1 | 2 | 3 | 4 | 5;
  libido_score: (1 | 2 | 3 | 4 | 5) | null;
  notes: string | null;
}

export interface DailyNote {
  id: string;
  user_id: string;
  log_date: string;
  content: string;
}
```