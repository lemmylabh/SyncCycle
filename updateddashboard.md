# SyncCycle Dashboard — Redesign Plan

## Overview

The dashboard is redesigned as a **non-scrollable health snapshot hub**. It uses a 4-column × 2-row grid on desktop, with the Profile Card anchoring the left column across both rows. Every card shows **real Supabase data**. Charts use **Recharts** (React-native, tree-shakeable, best TypeScript fit for this stack).

Design goals:
- Non-scrollable on desktop
- Quick health overview at a glance
- Each tracker represented by one card with one main visual
- Dashboard acts as a navigation hub to individual tracker pages

---

## Grid Layout

```
h-[calc(100vh-64px)] p-4 grid grid-cols-4 grid-rows-2 gap-4 overflow-hidden

+---------------+---------------+---------------+---------------+
|               |               |               |               |
|   PROFILE     |     PERIOD    |     VIBE      |   SYMPTOMS    |
|   (row-span   |               |               |               |
|      -2)      +---------------+---------------+---------------+
|               |               |               |               |
|               |   NUTRITION   |    FITNESS    |     SLEEP     |
|               |               |               |               |
+---------------+---------------+---------------+---------------+
```

Mobile: stacks to 1 column (`grid-cols-1`), renders `<MobileDashboardWrapper />` unchanged.

---

## DB Migration

Add 3 new fields to `user_profiles` (run in Supabase SQL editor via `profilemigration.sql`):

```sql
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS pronouns TEXT,
  ADD COLUMN IF NOT EXISTS about_me TEXT,
  ADD COLUMN IF NOT EXISTS interests TEXT[];
```

---

## Card 1 — Profile Card (new `components/dashboard/ProfileCard.tsx`)

**Spans 2 rows (full left column)**

**Data:** `user_profiles` — display_name, avatar_url, date_of_birth, pronouns, about_me, interests, app_goal, average_cycle_length, tracking_start_date

**Layout:**

```
+---------------------+
|  [Hero image]       |  <- avatar_url if set
|  full width         |     else: gradient initials circle
|  ~55% of card       |     (rose→purple gradient, 3xl initials)
|                     |
| ▓▓▓ gradient overlay at bottom of image ▓▓▓ |
|  Alex Rivera · 27   |  <- name + age from date_of_birth
|  [she/her]          |  <- pronouns pill badge
+---------------------+
|  About me           |
|  Morning runner...  |  <- about_me (2 line clamp)
|                     |
|  Interests          |
|  [Yoga] [Hiking]... |  <- interests as pill tags
|                     |
|  Goal               |
|  [Track Health]     |  <- app_goal badge
|                     |
|  28-day cycle       |
|  Since Jan 2025     |  <- tracking_start_date
+---------------------+
```

- Edit icon (pencil, top-right) opens `<EditProfileModal />`
- Edit modal fields: Display Name, DOB, Pronouns, About Me, Interests, Goal, Avg Cycle Length, Avg Period Length, Avatar upload

**Avatar Upload:** click "Change photo" → file input → upload to Supabase Storage `avatars` bucket → update avatar_url

---

## Card 2 — Period Card (update `components/dashboard/CyclePhaseCard.tsx`)

**Data:** `cycles` + `user_profiles` — existing fetch logic unchanged

**Visual: SVG progress ring (existing, reused)**

```
Cycle Phase
─────────────────────────────
      [gradient bg by phase]

         ╭─────╮
        ╱       ╲
       │  Day 22 │   <- SVG ring
        ╲  of 28╱
         ╰─────╯

      Luteal Phase
   Rest & reflect

  [28-day cycle]  [6 days to period]
```

- Reuse existing `cfg.gradient`, SVG ring, pills
- Only change: wrap in `<Link href="/dashboard/period">`
- Phase colors unchanged: Menstrual rose · Follicular purple · Ovulatory pink · Luteal violet

---

## Card 3 — Vibe Card (redesign `components/dashboard/MoodEnergy.tsx` → rename to `Vibe.tsx`)

**Data:** `mood_logs` — last 7 days

**Visual: 7-day emoji timeline**

```
Vibe Check
─────────────────────────────
  M    T    W    T    F    S    S
  😟   😐   🙂   😄   🙂   😐   😊

Mood     Calm    😊
Energy   Medium  ⚡

[ Log Today → ]  (shown if today not logged)
Last logged: Yesterday
```

- mood_score 1–5 maps to: 😞 😟 😐 🙂 😄
- No Recharts — custom 7-circle row
- Links to `/dashboard/vibe-check`

---

## Card 4 — Symptoms Card (redesign `components/dashboard/SymptomHeatmap.tsx`)

**Data:** `symptom_logs` + `symptom_types` — last 7 days, top 5 by total severity

**Visual: Per-symptom heatmap rows**

```
Symptoms
─────────────────────────────
         M   T   W   T   F   S   S
Cramps   ▢   ▢   ■   ■   ▢   ■   ▢
Fatigue  ▢   ■   ■   ▢   ▢   ■   ▢
Headache ▢   ▢   ▢   ■   ▢   ▢   ▢
Bloating ■   ▢   ▢   ▢   ■   ▢   ▢
Anxiety  ▢   ▢   ■   ▢   ▢   ▢   ■
```

- Color scale: none `bg-white/5` · 1–2 `bg-rose-900/60` · 3 `bg-rose-700/70` · 4 `bg-rose-500` · 5 `bg-rose-400`
- Today's column header highlighted with rose dot
- "No symptoms logged" empty state
- No Recharts — pure HTML table cells
- Links to `/dashboard/symptoms`

---

## Card 5 — Nutrition Card (update `components/dashboard/NutritionCard.tsx`)

**Data:** `nutrition_logs` — today's entry (water_ml, calories_kcal, protein_g, carbs_g, fat_g)

**Visual: Progress bars + hydration dots**

```
Nutrition
─────────────────────────────
Hydration
💧💧💧💧💧◻◻◻  5 / 8 glasses

Calories
█████████░░  1,840 / 2,000 kcal

Macros
Protein  ████░░░  72g
Carbs    ██████░  190g
Fat      ███░░░░  45g

Nothing logged today  (empty state)
```

- Water: water_ml / 250 = glasses filled (8 total)
- Calories: progress div (width %)
- Macros: 3 mini progress bars
- No Recharts — custom div progress bars (inline style width)
- Links to `/dashboard/nutrition`

---

## Card 6 — Fitness Card (update `components/dashboard/FitnessCard.tsx`)

**Data:** `workout_logs` — last 7 days, sum duration_minutes per day

**Visual: Recharts BarChart**

```
Fitness
─────────────────────────────
min
60 │          ██
45 │  ██      ██  ██
30 │  ██  ██  ██  ██
   └─────────────────
    M   T   W   T   F   S   S

Last: Yoga · 30 min · ●●●○○
240 min this week
```

- Purple fill bars
- Below: last workout type + duration + intensity dots
- "No workouts logged" empty state
- Links to `/dashboard/fitness`

---

## Card 7 — Sleep Card (update `components/dashboard/SleepCard.tsx`)

**Data:** `sleep_logs` — last 7 days

**Visual: Recharts BarChart**

```
Sleep
─────────────────────────────
 h                    ── 8h goal line
 8 │      ██
 7 │  ██  ██  ██
 6 │  ██  ██  ██  ██
   └─────────────────
    M   T   W   T   F   S   S

Last night  7h 23m  [Good ✓]
Last logged: Yesterday
```

- X-axis: day labels (M T W T F S S)
- Y-axis: hours (duration_minutes / 60)
- ReferenceLine at 8h (goal)
- Quality badge: color-coded 1–5 (red → green)
- Links to `/dashboard/sleep`

---

## EditProfileModal (`components/dashboard/EditProfileModal.tsx`)

Full-screen overlay (`fixed inset-0 z-50 bg-black/70`), centered card (`bg-[#1e1e2a] rounded-2xl max-w-lg w-full`).

**Sections:**
1. Avatar — shows current image or initials; "Change photo" button
2. Personal — Display Name, Date of Birth, Pronouns
3. About — About Me (textarea), Interests (comma-separated input → TEXT[])
4. Cycle Settings — App Goal (select), Avg Cycle Length, Avg Period Length

**Save:** `supabase.from("user_profiles").update({...}).eq("id", user.id)` → closes modal → ProfileCard re-fetches

---

## Components Retired from `app/dashboard/page.tsx`

These are removed from the desktop grid (files kept):
- `PhaseDonut`
- `TodaySnapshot`
- `CycleCalendar`
- `QuickInsights`

---

## Files Summary

| File | Action |
|------|--------|
| `components/dashboard/ProfileCard.tsx` | CREATE |
| `components/dashboard/EditProfileModal.tsx` | CREATE |
| `components/dashboard/Vibe.tsx` | CREATE (renamed from MoodEnergy.tsx) |
| `components/dashboard/CyclePhaseCard.tsx` | Add Link to /dashboard/period |
| `components/dashboard/SymptomHeatmap.tsx` | REDESIGN internals |
| `components/dashboard/NutritionCard.tsx` | REDESIGN visuals |
| `components/dashboard/FitnessCard.tsx` | ADD Recharts BarChart |
| `components/dashboard/SleepCard.tsx` | ADD Recharts BarChart |
| `app/dashboard/page.tsx` | REPLACE grid layout |
| `profilemigration.sql` | CREATE (SQL to run in Supabase) |

---

## Accessibility — aria-labels per bar

Both Recharts cards (Sleep, Fitness) use a **custom bar shape** component so each bar is individually labelled for screen readers.

```tsx
// Shared AccessibleBar shape (put in lib/chartUtils.tsx)
const AccessibleBar = (props: any) => {
  const { x, y, width, height, label, fill } = props;
  return (
    <g role="img" aria-label={label}>
      <rect x={x} y={y} width={width} height={height} fill={fill} rx={3} />
    </g>
  );
};

// Usage in SleepCard / FitnessCard:
<figure aria-label="Sleep duration over last 7 days">
  <figcaption className="sr-only">{data.map(d => `${d.day} ${d.value}`).join(", ")}</figcaption>
  <ResponsiveContainer>
    <BarChart data={data}>
      <Bar dataKey="value" shape={<AccessibleBar />} />
    </BarChart>
  </ResponsiveContainer>
</figure>
```

- `figcaption` with `sr-only` gives screen readers a full text summary
- Individual `<g aria-label="Monday: 7.5h">` labels each bar
- Same pattern applied to both SleepCard and FitnessCard

---

## Missing Data Fallback Plan

Every card handles 3 distinct states:

| State | Trigger | UI |
|-------|---------|-----|
| Loading | Supabase fetch in progress | `animate-pulse` skeleton (already exists on all cards) |
| Never logged | Query returns null / empty array | Centered icon + message + CTA button |
| Partial data | Some days missing from last 7 | 0-value entries with visual indicator |

**Card-specific fallbacks:**

**Period** — no cycle in DB:
```
[ 🌸 ]
Add your last period to get started
[ Start Tracking → ]   links to /dashboard/period
```

**Vibe** — no mood_logs at all:
```
[ 😶 ]
Start tracking your mood
[ Log Today → ]   links to /dashboard/vibe-check
```
Missing days in the 7-day row render as `⬜` (gray neutral circle, no emoji).

**Symptoms** — no symptom_logs this week:
```
Feeling good this week ✓
No symptoms logged
```
Missing day cells render as `bg-white/5` (already handled by severity = 0).

**Nutrition** — no nutrition_log today:
```
Nothing logged today
[ Log Nutrition → ]   links to /dashboard/nutrition
```
All progress bars render at 0% width.

**Fitness** — no workout_logs at all:
```
[ 🏃 ]
No workouts logged this week
[ Log Workout → ]   links to /dashboard/fitness
```
Missing days in chart render as `value: 0` bars with dashed stroke outline.

**Sleep** — no sleep_log for last night:
```
Last night  —  [Not logged]
```
Missing days in chart render as `value: 0` bars with dashed stroke outline.

**Profile** — `display_name` is null: fall back to the email prefix (e.g. `alex@...` → shows "Alex").

---

## Polish Details

**Phase-tinted card borders**
Each tracker card gets `border-l-2` colored by the user's current cycle phase:
- Menstrual: `border-rose-500`
- Follicular: `border-purple-500`
- Ovulatory: `border-pink-400`
- Luteal: `border-violet-500`

Pass `phase` as a prop from `page.tsx` (fetched once from `CyclePhaseCard` logic, hoisted).

**Data freshness dot**
Small colored dot in the top-right corner of each tracker card:
- Green (`bg-green-400`) = logged today
- Amber (`bg-amber-400`) = logged yesterday
- Gray (`bg-white/20`) = 2+ days ago

**Streak badge**
On Vibe, Sleep, and Fitness cards: if user logged 3+ consecutive days, show `🔥 X-day streak` as a small badge below the title.

**Hover scale**
All 7 cards (except Profile): `hover:scale-[1.01] transition-transform duration-200` on the card wrapper so clicking feels tactile.

**Log now micro-CTA**
Each tracker card has a small `+` icon button (top-right, next to freshness dot) linking directly to that tracker's log page. Keeps logging friction low — one click from dashboard.

---

## Recharts — 2 cards only (keep bundle lean)

```typescript
import { BarChart, Bar, XAxis, YAxis, ReferenceLine, Tooltip, ResponsiveContainer } from "recharts";
```

- `FitnessCard`: workout minutes per day bar chart
- `SleepCard`: hours per day bar chart, 8h reference line

All other cards use native div/SVG/table visuals.

---

## Implementation Order

1. Run `npm install recharts`
2. Create `profilemigration.sql` → user runs in Supabase
3. Create `ProfileCard.tsx` + `EditProfileModal.tsx`
4. Update `CyclePhaseCard.tsx` (add Link)
5. Create `Vibe.tsx` (redesign of MoodEnergy.tsx)
6. Redesign `SymptomHeatmap.tsx`
7. Update `NutritionCard.tsx`
8. Update `FitnessCard.tsx` (add Recharts)
9. Update `SleepCard.tsx` (add Recharts)
10. Replace `app/dashboard/page.tsx` grid

---

## Verification Checklist

- [ ] `npm run dev` — no errors
- [ ] ProfileCard shows initials if no avatar_url; edit modal opens, saves, refreshes
- [ ] FitnessCard + SleepCard render Recharts bars
- [ ] FitnessCard + SleepCard show 0-value dashed bars for days with no data
- [ ] SymptomsCard shows 5 rows with heatmap; "Feeling good this week" empty state
- [ ] VibeCard shows ⬜ for missing days; full empty state if never logged
- [ ] NutritionCard shows 0% bars + CTA if nothing logged today
- [ ] PeriodCard shows "Start Tracking" CTA if no cycle in DB
- [ ] All 7 cards link to their tracker pages
- [ ] All 7 cards show data freshness dot (green/amber/gray)
- [ ] All 7 cards show + micro-CTA icon linking to log page
- [ ] Recharts bars have aria-label per bar + sr-only figcaption
- [ ] Phase border color updates with current cycle phase
- [ ] Mobile: MobileDashboardWrapper renders, desktop grid hidden
- [ ] `npm run build` — no TypeScript errors
