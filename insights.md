# Insights Feed — Design & Implementation Plan

## Concept

A Twitter/X-style AI-generated feed of personalized health insight cards at `/dashboard/insights`.
Each card correlates 1–3 health trackers using real user data + OpenRouter AI.
No Python needed — 100% TypeScript/Next.js + Supabase + OpenRouter.

---

## Feed Card Layout (ASCII)

Card type and feedback sit **outside and below** the card. Hashtags appear on all card types.
Up to 20–50 cards per day (user-selectable). Mix of Insight, Prediction, Suggestion, Pattern.

```
 ┌──────────┐┌──────────┐┌──────────┐
 │ #period  ││ #fitness ││  #vibe   │                           Ask Fiona ›
 └──────────┘└──────────┘└──────────┘──────────────────────────────────────┐
 │  During your Luteal Phase, your light yoga sessions coincided with       │
 │  higher energy and calm mood — just like last cycle. You logged yoga     │
 │  3x this week which is consistent with your best week last cycle.        │
 └──────────────────────────────────────────────────────────────────────────┘
 Insight                                                 Helpful   Not Helpful


 ┌──────────┐┌──────────┐
 │ #period  ││ #symptoms│                                       Ask Fiona ›
 └──────────┘└──────────┘──────────────────────────────────────────────────┐
 │  Your Ovulation Phase starts in approximately 3 days. Based on your      │
 │  last cycle, expect higher energy and reduced cramp severity around      │
 │  days 12–14.                                                             │
 └──────────────────────────────────────────────────────────────────────────┘
 Prediction                                              Helpful   Not Helpful


 ┌──────────┐┌──────────┐
 │ #sleep   ││ #fitness │                                       Ask Fiona ›
 └──────────┘└──────────┘──────────────────────────────────────────────────┐
 │  You averaged 6 hours of sleep last week, which may explain why you      │
 │  skipped workouts on Tuesday and Thursday. Sleep affects glycogen        │
 │  synthesis and workout motivation directly.                              │
 └──────────────────────────────────────────────────────────────────────────┘
 Insight                                                 Helpful   Not Helpful


 ┌──────────┐┌──────────┐
 │#nutrition││ #symptoms│                                       Ask Fiona ›
 └──────────┘└──────────┘──────────────────────────────────────────────────┐
 │  You haven't logged meals this week. Bromelain found in pineapple is     │
 │  known to reduce menstrual cramp severity — worth adding during your     │
 │  current phase.                                                          │
 └──────────────────────────────────────────────────────────────────────────┘
 Suggestion                                              Helpful   Not Helpful


 ┌──────────┐┌──────────┐┌──────────┐
 │  #sleep  ││  #vibe   ││ #fitness │                           Ask Fiona ›
 └──────────┘└──────────┘└──────────┘──────────────────────────────────────┐
 │  Last Luteal Phase you slept 7+ hours, logged calm mood, and completed   │
 │  4 workouts. This time your sleep is down and mood scores are lower.     │
 │  Prioritizing sleep may help recover your energy pattern.                │
 └──────────────────────────────────────────────────────────────────────────┘
 Pattern                                                 Helpful   Not Helpful
```

**Ask Fiona expanded (inline, within the same card):**

```
 ┌──────────┐┌──────────┐
 │ #sleep   ││ #fitness │                                            Close ✕
 └──────────┘└──────────┘──────────────────────────────────────────────────┐
 │  You averaged 6 hours of sleep last week, which may explain why you      │
 │  skipped workouts on Tuesday and Thursday.                               │
 ├──────────────────────────────────────────────────────────────────────────┤
 │  Fiona                                                                   │
 │  Sleep deprivation reduces glycogen synthesis and raises cortisol,       │
 │  making it harder to motivate yourself to exercise...                    │
 │                                                                          │
 │  [ Ask a follow-up...                                            Send › ]│
 └──────────────────────────────────────────────────────────────────────────┘
 Insight                                                 Helpful   Not Helpful
```

---

## Trackers (6) + Daily Journal

| Tracker    | DB Tables                          | Hashtag    | Badge Color  |
|------------|------------------------------------|------------|--------------|
| Period     | period_logs, cycles                | #period    | rose-500     |
| Symptoms   | symptom_logs, symptom_types        | #symptoms  | orange-500   |
| Vibe Check | mood_logs                          | #vibe      | violet-500   |
| Nutrition  | nutrition_logs, meal_entries       | #nutrition | emerald-500  |
| Fitness    | workout_logs, workout_types        | #fitness   | sky-500      |
| Sleep      | sleep_logs                         | #sleep     | indigo-500   |
| Journal    | daily_notes                        | (context)  | —            |

---

## Feed Count Control (Top Right of Page)

- Dropdown selector: **20 / 30 / 40 / 50** feeds (increment of 10)
- Default: 20
- When user increases the count: auto-refresh triggers and generates the additional cards
- If AI can't find more unique correlations to fill the count, remaining slots are filled with:
  - **Helpful tips** for the current cycle phase (general but evidence-based)
  - **Predictions** for the upcoming phase (e.g., "Your ovulation phase starts in ~3 days — expect higher energy")
- Filler cards are visually distinguished (e.g., subtle "Tip" or "Prediction" label instead of tracker hashtags)

---

## Generation Strategy

### On-Demand with Same-Day Caching
- First visit of the day: trigger `POST /api/insights/generate`
- Cached in `insight_feeds` table (UNIQUE per user per day)
- Changing the feed count triggers a top-up request (generate remaining cards up to the new count)
- No cron jobs needed — fully on-demand for school project scope

### What the AI Receives
- Current cycle phase + cycle day
- 14-day window of all tracker data (averages + notable values)
- Previous same-phase data from last cycle (for comparison)
- Suppressed correlation keys (patterns the user flagged)
- Target card count requested

### What the AI Returns
- JSON array of card objects (no markdown, structured output only)
- Each card: `{ id, hashtags, body, suggestion, correlationKey, isFallback, cardType }`
- `cardType`: `"insight"` | `"tip"` | `"prediction"` (for filler cards)

---

## Correlation Rules

1. Each insight correlates **1–3 trackers**
2. AI compares current vs previous same-phase data for personalized suggestions
3. Fallback to general advice if tracker data is missing
4. Variety target per generation:
   - 2+ single-tracker observations
   - 4+ two-tracker correlations
   - 2+ three-tracker correlations
   - 2+ previous-phase comparisons
   - Fill remainder with tips/predictions

---

## Feedback System

Buttons: **Helpful** | **Not Helpful**

### Flagging Logic
- "Helpful" → stored, no suppression
- "Not Helpful" → flags the **specific data correlation pattern**, not the tracker
  - The tracker (#sleep) still appears in other insights
  - Only this exact correlation (e.g., "sleep_avg_hours:6 + workouts_skipped:true") is flagged
- After **5 flags** on the same correlation key → `suppressed = true`
- Suppressed patterns are excluded from future AI prompts

### Correlation Key Format
Deterministic string using sorted hashtags + binned data values:
```
"fitness+sleep|sleep_avg_hours:6|workouts_skipped:true"
```
Values are binned (rounded) so the same real-world pattern maps to the same key across days.

---

## Ask Fiona — Inline Expansion

- Clicking "Ask Fiona" expands the card in-place (Framer Motion layout animation)
- Like Grok in X — no page navigation
- Auto-sends: `"Explain this insight to me in more detail: [card body]"`
- User can ask follow-up questions in the same expanded area
- Reuses existing `FionaMessage`, `FionaInput`, and `/api/fiona/chat` route
- Only one card can be expanded at a time (opening another collapses the current one)
- Collapsing preserves the chat history visually until the card is closed

---

## Past Feeds

- Horizontal scrollable date chip row at the top of the page
- Shows dates where feeds were generated (last 30 days)
- Clicking a date loads that day's stored feed from `insight_feeds` table
- Feedback state is pre-merged into each card when loading past feeds

---

## Demo Mode

- Detected via `sessionStorage.getItem("demo") === "true"` or `?demo=true`
- Static demo data used (no DB queries)
- Cards generated but NOT saved to DB
- Feedback buttons visually work but don't persist

---

## File Structure

### New Files
```
insightschema.sql                              — DB schema (apply in Supabase SQL editor)

lib/insightUtils.ts                            — Types, HASHTAG_CONFIG, buildInsightContext(),
                                                 buildInsightPrompt(), parseInsightResponse(),
                                                 buildCorrelationKey()

app/api/insights/generate/route.ts             — POST: generate + cache feed
app/api/insights/feed/route.ts                 — GET: fetch feed for a given date
app/api/insights/feedback/route.ts             — POST: Helpful/Not Helpful + flag suppression

components/insights/InsightHashtagBadge.tsx    — Single colored badge pill
components/insights/InsightFionaChat.tsx       — Inline Fiona mini-chat per card
components/insights/InsightCard.tsx            — Full card: badges + body + feedback + Fiona
components/insights/InsightFeedSkeleton.tsx    — Pulse skeleton while generating
components/insights/InsightEmptyState.tsx      — Error/empty state with retry
components/insights/InsightLoadPrevious.tsx    — Date chip row for past feeds
components/insights/InsightFeedCountSelector.tsx — Feed count dropdown (20/30/40/50)
components/insights/InsightsFeed.tsx           — Page brain: all state + orchestration

app/dashboard/insights/page.tsx               — REPLACE existing file entirely
```

### Existing Files to Modify
- `lib/fionaUtils.ts` — Extract `streamFionaResponse` as a named export for reuse in InsightFionaChat

---

## API Routes

### `POST /api/insights/generate`
Body: `{ accessToken, userId, targetCount }`
1. Auth via `createServerSupabaseClient(accessToken)`
2. If today's feed exists with fewer cards than `targetCount`, top up (don't regenerate all)
3. Fetch suppressed correlation keys
4. Call `buildInsightContext()` — parallel queries, 14-day window + previous same phase
5. Build prompt with `targetCount` and suppressed keys
6. POST to OpenRouter `openai/gpt-4o-mini` (non-streaming, max_tokens: 4000)
7. Parse JSON → validate → fill remainder with tips/predictions if short
8. Upsert into `insight_feeds`, return full feed

### `GET /api/insights/feed`
Query: `?date=YYYY-MM-DD` (default today), Authorization header
- Returns feed + pre-merged feedback reactions per card index

### `POST /api/insights/feedback`
Body: `{ accessToken, userId, feedId, cardIndex, reaction, correlationKey }`
1. Upsert `insight_feedback`
2. If "not_helpful": upsert `insight_correlation_flags`, increment flag_count
3. If flag_count >= 5: set suppressed = true

---

## Component Hierarchy

```
app/dashboard/insights/page.tsx
  └── InsightsFeed.tsx
        ├── [header row]
        │     ├── "Your Insights" title + current phase badge
        │     └── InsightFeedCountSelector.tsx (dropdown top-right: 20/30/40/50)
        ├── InsightLoadPrevious.tsx      (date chips)
        ├── InsightFeedSkeleton.tsx      (during generation)
        ├── InsightEmptyState.tsx        (on error)
        └── InsightCard.tsx × N         (stagger animation)
              ├── InsightHashtagBadge.tsx × 1-3  (or "Tip"/"Prediction" label)
              ├── [card body + suggestion]
              ├── [Ask Fiona button top-right]
              ├── [Helpful / Not Helpful buttons bottom-right]
              └── InsightFionaChat.tsx  (AnimatePresence — only one open at time)
                    ├── FionaMessage.tsx (reused from components/fiona/)
                    └── FionaInput.tsx  (reused from components/fiona/)
```

---

## DB Schema

See `insightschema.sql` for full SQL. Tables:
- `insight_feeds` — one row per user per day, `cards` stored as JSONB array
- `insight_feedback` — one row per card per user (`helpful` or `not_helpful`)
- `insight_correlation_flags` — tracks flag counts per correlation key, suppresses at 5

---

## Verification Steps

1. Apply `insightschema.sql` in Supabase SQL editor
2. Visit `/dashboard/insights` → skeleton appears → cards load after ~5-10s
3. Verify 1–3 correctly colored hashtag badges per card
4. Verify "Tip" and "Prediction" cards appear if feed count exceeds available correlations
5. Change feed count dropdown from 20 → 30 → verify new cards generate and append
6. Click "Ask Fiona" → card expands, auto-message streams in, follow-up works
7. Click "Not Helpful" → reaction saved; same card can toggle to "Helpful"
8. Flag 5+ cards with same tracker combo → check `suppressed = true` in DB
9. Regenerate feed → suppressed correlation absent from new cards
10. Click past date chip → loads that day's feed from DB
11. Demo mode via `?demo=true` → feed works without auth, no DB writes
