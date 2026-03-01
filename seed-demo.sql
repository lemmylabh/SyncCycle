-- =============================================================================
-- SyncCycle — Demo Account Seed Data
-- Demo user: demo@syncycle.ai  UUID: f7750356-6363-40f6-86da-4f112d9cb0a9
-- Generates 6 months of realistic, phase-appropriate data.
-- Safe to re-run: cleans and repopulates the demo account.
-- Run in: Supabase Dashboard → SQL Editor
-- =============================================================================

DO $$
DECLARE
  v_uid           uuid := 'f7750356-6363-40f6-86da-4f112d9cb0a9';
  v_cycle_id      uuid;
  v_cycle_start   date;
  v_log_date      date;
  d               int;
  i               int;

  -- Symptom type IDs (looked up by name)
  v_st_cramps      uuid;
  v_st_fatigue     uuid;
  v_st_bloating    uuid;
  v_st_headache    uuid;
  v_st_mood_swings uuid;
  v_st_backache    uuid;

  -- Workout type IDs (looked up by name)
  v_wt_running     uuid;
  v_wt_yoga        uuid;
  v_wt_strength    uuid;
  v_wt_walking     uuid;
  v_wt_stretching  uuid;

  -- Sleep variables
  v_duration       int;
  v_quality        smallint;
  v_bedtime        timestamptz;
  v_waketime       timestamptz;

  -- Workout variables
  v_wtype          uuid;
  v_intensity      smallint;
  v_dur            int;

  -- Nutrition variable
  v_kcal           int;

  -- Journal variables
  v_notes          text[];
  v_note_idx       int;

BEGIN
  PERFORM setseed(0.42);

  -- ─── Clean existing demo data (FK-safe order) ─────────────────────────────
  DELETE FROM sleep_logs     WHERE user_id = v_uid;
  DELETE FROM workout_logs   WHERE user_id = v_uid;
  DELETE FROM meal_entries   WHERE user_id = v_uid;
  DELETE FROM nutrition_logs WHERE user_id = v_uid;
  DELETE FROM symptom_logs   WHERE user_id = v_uid;
  DELETE FROM mood_logs      WHERE user_id = v_uid;
  DELETE FROM daily_notes    WHERE user_id = v_uid;
  DELETE FROM period_logs    WHERE user_id = v_uid;
  DELETE FROM cycles         WHERE user_id = v_uid;
  DELETE FROM user_profiles  WHERE id      = v_uid;

  -- ─── User profile ─────────────────────────────────────────────────────────
  INSERT INTO user_profiles (id, display_name, average_cycle_length, average_period_length)
  VALUES (v_uid, 'Alex', 28, 5);

  -- ─── Look up symptom type IDs ─────────────────────────────────────────────
  SELECT id INTO v_st_cramps      FROM symptom_types WHERE name = 'cramps';
  SELECT id INTO v_st_fatigue     FROM symptom_types WHERE name = 'fatigue';
  SELECT id INTO v_st_bloating    FROM symptom_types WHERE name = 'bloating';
  SELECT id INTO v_st_headache    FROM symptom_types WHERE name = 'headache';
  SELECT id INTO v_st_mood_swings FROM symptom_types WHERE name = 'mood_swings';
  SELECT id INTO v_st_backache    FROM symptom_types WHERE name = 'backache';

  -- ─── Look up workout type IDs ─────────────────────────────────────────────
  SELECT id INTO v_wt_running    FROM workout_types WHERE name = 'running';
  SELECT id INTO v_wt_yoga       FROM workout_types WHERE name = 'yoga';
  SELECT id INTO v_wt_strength   FROM workout_types WHERE name = 'strength_training';
  SELECT id INTO v_wt_walking    FROM workout_types WHERE name = 'walking';
  SELECT id INTO v_wt_stretching FROM workout_types WHERE name = 'stretching';

  -- ─── Journal entries pool ─────────────────────────────────────────────────
  v_notes := ARRAY[
    'Feeling more in tune with my body today. Took it slow and focused on rest.',
    'Had a great workout session. Energy levels are through the roof this week.',
    'Noticed some cramps today. Hot tea and a warm bath helped a lot.',
    'Really productive day. Mood has been steady and my focus is sharp.',
    'Tried a new recipe with lots of iron-rich foods. Feeling nourished.',
    'Struggled a bit with energy today but pushed through my morning walk.',
    'Meditation session was really grounding. Feeling calm and centered.',
    'Peak week — crushed my workout and felt amazing all day.',
    'A bit emotional today but journaling really helps process everything.',
    'Cycle tracking is genuinely changing how I plan my weeks. Game changer.'
  ];

  -- ─── Generate 6 cycles ────────────────────────────────────────────────────
  -- Cycle 6 starts CURRENT_DATE - 14 → today = day 15 (ovulatory phase)
  -- Formula: v_cycle_start = CURRENT_DATE - ((6 - i) * 28 + 14)

  FOR i IN 1..6 LOOP
    v_cycle_start := CURRENT_DATE - ((6 - i) * 28 + 14)::int;

    INSERT INTO cycles (user_id, cycle_number, start_date, end_date)
    VALUES (
      v_uid,
      i,
      v_cycle_start,
      CASE WHEN i < 6 THEN v_cycle_start + 27 ELSE NULL END
    )
    RETURNING id INTO v_cycle_id;

    FOR d IN 1..28 LOOP
      v_log_date := v_cycle_start + (d - 1);
      IF v_log_date > CURRENT_DATE THEN EXIT; END IF;

      -- ── PERIOD (days 1–5) ────────────────────────────────────────────────
      IF d <= 5 THEN
        INSERT INTO period_logs (user_id, cycle_id, log_date, flow_level, color, clots)
        VALUES (
          v_uid, v_cycle_id, v_log_date,
          CASE d WHEN 1 THEN 3 WHEN 2 THEN 4 WHEN 3 THEN 3 WHEN 4 THEN 2 ELSE 1 END,
          CASE WHEN d <= 3 THEN 'bright_red' ELSE 'dark_red' END,
          (d = 2)
        );
      END IF;

      -- ── SYMPTOMS (~70% of days, phase-appropriate) ───────────────────────
      IF random() < 0.7 THEN
        IF d <= 5 THEN
          -- Menstrual: cramps + occasional fatigue/backache
          INSERT INTO symptom_logs (user_id, cycle_id, log_date, symptom_type_id, severity)
          VALUES (v_uid, v_cycle_id, v_log_date, v_st_cramps, (3 + floor(random()*2))::smallint);
          IF random() < 0.6 THEN
            INSERT INTO symptom_logs (user_id, cycle_id, log_date, symptom_type_id, severity)
            VALUES (v_uid, v_cycle_id, v_log_date, v_st_fatigue, (2 + floor(random()*2))::smallint);
          END IF;
          IF random() < 0.35 THEN
            INSERT INTO symptom_logs (user_id, cycle_id, log_date, symptom_type_id, severity)
            VALUES (v_uid, v_cycle_id, v_log_date, v_st_backache, (2 + floor(random()*2))::smallint);
          END IF;
        ELSIF d BETWEEN 14 AND 16 THEN
          -- Ovulatory: mild bloating
          INSERT INTO symptom_logs (user_id, cycle_id, log_date, symptom_type_id, severity)
          VALUES (v_uid, v_cycle_id, v_log_date, v_st_bloating, (1 + floor(random()*2))::smallint);
        ELSIF d >= 22 THEN
          -- Late luteal: mood swings + occasional headache
          INSERT INTO symptom_logs (user_id, cycle_id, log_date, symptom_type_id, severity)
          VALUES (v_uid, v_cycle_id, v_log_date, v_st_mood_swings, (2 + floor(random()*2))::smallint);
          IF random() < 0.4 THEN
            INSERT INTO symptom_logs (user_id, cycle_id, log_date, symptom_type_id, severity)
            VALUES (v_uid, v_cycle_id, v_log_date, v_st_headache, (1 + floor(random()*2))::smallint);
          END IF;
        END IF;
      END IF;

      -- ── MOOD (~85% of days) ──────────────────────────────────────────────
      IF random() < 0.85 THEN
        INSERT INTO mood_logs (user_id, cycle_id, log_date, mood_score, energy_score, libido_score)
        VALUES (
          v_uid, v_cycle_id, v_log_date,
          -- Mood: low during menstrual, rising follicular, peak ovulatory, variable luteal
          CASE
            WHEN d <= 5  THEN (2 + floor(random()*2))::smallint
            WHEN d <= 13 THEN (3 + floor(random()*2))::smallint
            WHEN d <= 16 THEN 5
            ELSE              (2 + floor(random()*3))::smallint
          END,
          -- Energy: same pattern
          CASE
            WHEN d <= 5  THEN (1 + floor(random()*2))::smallint
            WHEN d <= 13 THEN (3 + floor(random()*2))::smallint
            WHEN d <= 16 THEN 5
            ELSE              (2 + floor(random()*2))::smallint
          END,
          -- Libido: ~60% logged, higher mid-cycle
          CASE
            WHEN random() < 0.4 THEN NULL
            ELSE (2 + floor(random()*3))::smallint
          END
        );
      END IF;

      -- ── SLEEP (~90% of days) ─────────────────────────────────────────────
      IF random() < 0.9 THEN
        v_duration := (360 + floor(random()*150))::int;  -- 6h to 8.5h
        v_quality  := CASE
                        WHEN v_duration < 390 THEN 2
                        WHEN v_duration < 420 THEN 3
                        WHEN v_duration < 450 THEN 4
                        ELSE 5
                      END;
        v_bedtime  := (v_log_date - 1)::timestamp + interval '23 hours';
        v_waketime := v_bedtime + (v_duration || ' minutes')::interval;

        INSERT INTO sleep_logs
          (user_id, cycle_id, log_date, bedtime, wake_time, duration_minutes, quality_score, interruptions)
        VALUES
          (v_uid, v_cycle_id, v_log_date, v_bedtime, v_waketime,
           v_duration, v_quality, (floor(random()*3))::smallint);
      END IF;

      -- ── WORKOUT (~50% of days, skip period days 1–2) ────────────────────
      IF d > 2 AND random() < 0.5 THEN
        IF d <= 5 OR d >= 22 THEN
          -- Menstrual / late luteal: gentle movement
          v_wtype     := CASE floor(random()*3)::int
                           WHEN 0 THEN v_wt_yoga
                           WHEN 1 THEN v_wt_walking
                           ELSE        v_wt_stretching
                         END;
          v_intensity := (1 + floor(random()*2))::smallint;
          v_dur       := (20 + floor(random()*25))::int;
        ELSIF d BETWEEN 14 AND 16 THEN
          -- Ovulatory: peak performance
          v_wtype     := CASE floor(random()*2)::int
                           WHEN 0 THEN v_wt_running
                           ELSE        v_wt_strength
                         END;
          v_intensity := (4 + floor(random()*2))::smallint;
          v_dur       := (40 + floor(random()*25))::int;
        ELSE
          -- Follicular / early luteal: moderate
          v_wtype     := CASE floor(random()*3)::int
                           WHEN 0 THEN v_wt_running
                           WHEN 1 THEN v_wt_strength
                           ELSE        v_wt_walking
                         END;
          v_intensity := (2 + floor(random()*3))::smallint;
          v_dur       := (30 + floor(random()*30))::int;
        END IF;

        INSERT INTO workout_logs (user_id, cycle_id, log_date, workout_type_id, duration_minutes, intensity)
        VALUES (v_uid, v_cycle_id, v_log_date, v_wtype, v_dur, v_intensity);
      END IF;

      -- ── NUTRITION (~80% of days) ─────────────────────────────────────────
      IF random() < 0.8 THEN
        v_kcal := (1600 + floor(random()*600))::int;  -- 1600–2200 kcal

        INSERT INTO nutrition_logs
          (user_id, cycle_id, log_date, calories_kcal, water_ml, protein_g, carbs_g, fat_g, fiber_g)
        VALUES (
          v_uid, v_cycle_id, v_log_date,
          v_kcal,
          (1200 + floor(random()*1000))::int,   -- 1200–2200ml water
          (100  + floor(random()*80))::numeric,  -- 100–180g protein
          (150  + floor(random()*120))::numeric, -- 150–270g carbs
          (40   + floor(random()*40))::numeric,  -- 40–80g fat
          (15   + floor(random()*20))::numeric   -- 15–35g fiber
        );
      END IF;

      -- ── JOURNAL (~35% of days) ───────────────────────────────────────────
      IF random() < 0.35 THEN
        v_note_idx := 1 + (floor(random() * array_length(v_notes, 1)))::int;
        -- Clamp to valid range
        IF v_note_idx > array_length(v_notes, 1) THEN
          v_note_idx := array_length(v_notes, 1);
        END IF;

        INSERT INTO daily_notes (user_id, log_date, content)
        VALUES (v_uid, v_log_date, v_notes[v_note_idx]);
      END IF;

    END LOOP; -- days
  END LOOP;   -- cycles

  RAISE NOTICE 'Demo seed complete. User: %, Cycles: 6', v_uid;
END;
$$;
