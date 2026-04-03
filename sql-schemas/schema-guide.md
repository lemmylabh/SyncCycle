# SyncCycle — SQL Schemas

This folder contains the complete, canonical database schema for SyncCycle. All files are numbered and must be run **in order** on a fresh Supabase project.

> **For new developers:** Do not use any SQL files from outside this folder. The old root-level `.sql` files have been consolidated here. Migration history is baked into each table file — you only need to run these files once, in order.

---

## Prerequisites

1. A Supabase project with **Authentication enabled** (Auth → Settings → Enable Email provider)
2. Access to **SQL Editor** in the Supabase Dashboard
3. The `pg_storage` extension enabled (needed for file `18` — usually on by default)

---

## Run Order

Paste each file into **Supabase Dashboard → SQL Editor → New Query → Run**.

### Core (run first)

| File | Table | Notes |
|------|-------|-------|
| [core/01_user_profiles.sql](core/01_user_profiles.sql) | `user_profiles` | Run first — all other tables depend on auth.users |
| [core/02_cycles.sql](core/02_cycles.sql) | `cycles` | Menstrual cycle records |
| [core/03_period_logs.sql](core/03_period_logs.sql) | `period_logs` | Period flow tracking |
| [core/04_symptom_types.sql](core/04_symptom_types.sql) | `symptom_types` | Lookup table + 17 seeded symptoms |
| [core/05_symptom_logs.sql](core/05_symptom_logs.sql) | `symptom_logs` | Daily symptom entries |
| [core/06_mood_logs.sql](core/06_mood_logs.sql) | `mood_logs` | Mood, energy, libido scores |
| [core/07_daily_notes.sql](core/07_daily_notes.sql) | `daily_notes` | Free-text journal entries |
| [core/08_functions_triggers.sql](core/08_functions_triggers.sql) | Functions + triggers | Run after 01–07 |

### Trackers

| File | Table | Notes |
|------|-------|-------|
| [trackers/09_workout_types.sql](trackers/09_workout_types.sql) | `workout_types` | Lookup table + 13 seeded workout types |
| [trackers/10_workout_logs.sql](trackers/10_workout_logs.sql) | `workout_logs` | Fitness tracking |
| [trackers/11_nutrition_logs.sql](trackers/11_nutrition_logs.sql) | `nutrition_logs` | Daily nutrition summary |
| [trackers/12_meal_entries.sql](trackers/12_meal_entries.sql) | `meal_entries` | Individual meal entries |
| [trackers/13_sleep_logs.sql](trackers/13_sleep_logs.sql) | `sleep_logs` | Sleep tracking |

### Features

| File | Tables | Notes |
|------|--------|-------|
| [features/14_fiona.sql](features/14_fiona.sql) | `fiona_sessions`, `fiona_messages` | AI chat feature |
| [features/15_insights.sql](features/15_insights.sql) | `insight_feeds`, `insight_feedback`, `insight_correlation_flags` | AI insights feed |
| [features/16_tips.sql](features/16_tips.sql) | `tips` | Global tips content (seeded) |
| [features/17_leads.sql](features/17_leads.sql) | `leads` | Landing page email capture |

### Storage

| File | What it does |
|------|-------------|
| [storage/18_avatars_storage.sql](storage/18_avatars_storage.sql) | Creates the `avatars` Supabase Storage bucket + RLS policies |

> **If `18` fails** with a permissions error on `storage.buckets`, create the bucket manually in the Supabase Dashboard → Storage → New Bucket (name: `avatars`, public: true), then re-run only the `CREATE POLICY` statements from that file.

---

## Demo Data (optional)

After running files 01–18, you can seed the demo account with 6 months of realistic data:

```
seed/seed-demo.sql
```

- Demo user email: `demo@syncycle.ai`
- Demo user UUID: `f7750356-6363-40f6-86da-4f112d9cb0a9`
- Safe to re-run — it clears and repopulates the demo account each time

> **Important:** The demo user must exist in `auth.users` before running the seed. Create the account via the app's sign-up flow or in Supabase Dashboard → Authentication → Users.

---

## Table Map (feature → files)

| Feature | Tables |
|---------|--------|
| Auth / onboarding | `user_profiles` (01) |
| Cycle tracking | `cycles` (02), `period_logs` (03) |
| Symptom tracking | `symptom_types` (04), `symptom_logs` (05) |
| Mood / Vibe Check | `mood_logs` (06) |
| Journal | `daily_notes` (07) |
| Fitness tracker | `workout_types` (09), `workout_logs` (10) |
| Nutrition tracker | `nutrition_logs` (11), `meal_entries` (12) |
| Sleep tracker | `sleep_logs` (13) |
| Fiona (AI chat) | `fiona_sessions`, `fiona_messages` (14) |
| Insights feed | `insight_feeds`, `insight_feedback`, `insight_correlation_flags` (15) |
| Tips carousel | `tips` (16) |
| CRM / leads | `leads` (17) |
| Avatar uploads | Supabase Storage `avatars` bucket (18) |

---

## Security Model

All user-owned tables use **Row Level Security (RLS)** with policies scoped to `auth.uid()`. Users can only read, insert, update, and delete their own rows. Lookup tables (`symptom_types`, `workout_types`, `tips`) are public read-only.

---

## Verification

After running all files, confirm in SQL Editor:

```sql
-- Check all tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Should return 19 tables:
-- cycles, daily_notes, fiona_messages, fiona_sessions, insight_correlation_flags,
-- insight_feedback, insight_feeds, leads, meal_entries, mood_logs, nutrition_logs,
-- period_logs, sleep_logs, symptom_logs, symptom_types, tips, user_profiles,
-- workout_logs, workout_types
```
