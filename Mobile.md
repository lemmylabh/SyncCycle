# Mobile.md — SyncCycle Mobile UI Overhaul

## Context
Replaces the hamburger drawer sidebar on mobile with a purpose-built shell:
- Top bar with **Trackers ▾** dropdown + Profile avatar
- Horizontal **swipe navigation** between Dashboard ↔ Insights
- Global **FAB** (bottom-right) → Ask Fiona popup + Voice journaling stub
- **Simplified mobile dashboard** (Cycle Day, Phase, Today's Summary, Suggestions)

Desktop layout is **completely unchanged**. Breakpoint: `lg:` (1024px).

---

## New Files

```
components/mobile/
├── MobileTopBar.tsx        — "Trackers ▾" center + Profile avatar right
├── TrackerDropdown.tsx     — grouped tracker links (Cycle, Health, Lifestyle, Reflection)
├── MobilePageIndicator.tsx — Dashboard | Insights underline (Framer Motion layoutId)
├── MobileSwipeWrapper.tsx  — horizontal drag → router.push() for Dashboard ↔ Insights
├── MobileFAB.tsx           — fixed bottom-right FAB → bottom sheet (Record + Ask Fiona)
├── FionaPopup.tsx          — full-screen chat modal (reuses FionaChat/FionaInput/FionaMessage)
└── MobileDashboard.tsx     — simplified dashboard (Cycle Day, Phase, Summary, Suggestions)

app/dashboard/insights/
└── page.tsx                — Insights page (mood/energy/sleep patterns, last 30 days)
```

## Modified Files

- `app/dashboard/layout.tsx` — mobile shell + desktop shell (unchanged)
- `app/dashboard/page.tsx` — mobile branch renders MobileDashboard

---

## Mobile Shell Layout

```
┌─────────────────────────────────────────┐
│           Trackers ▾            👤      │  ← MobileTopBar
├─────────────────────────────────────────┤
│  Dashboard          Insights            │  ← MobilePageIndicator (swipe routes only)
│  ─────────                              │
├─────────────────────────────────────────┤
│                                         │
│         [Page Content]                  │  ← MobileSwipeWrapper (swipe routes)
│                                         │
│                                     ＋  │  ← MobileFAB (fixed)
└─────────────────────────────────────────┘
```

---

## FAB Bottom Sheet

```
┌──────────────────────────────┐
│   🎤 Record Your Day         │  ← stub (Voice.md)
│   ✦ Ask Fiona                │  ← opens FionaPopup
└──────────────────────────────┘
```

---

## Tracker Dropdown Groups

```
Cycle       → Period
Health      → Symptoms, Vibe Check
Lifestyle   → Nutrition, Fitness, Sleep
Reflection  → Journal
```

---

## Insights Page Pattern Cards

1. **Mood Trends** — avg/phase breakdown (last 30 days)
2. **Energy Patterns** — peak/dip phase
3. **Sleep Quality** — avg hours + quality
4. **Cycle Regularity** — last 3 cycle lengths

Uses `computePhase()` + `PHASE_CONFIG` from `lib/cycleUtils.ts`.

---

## Verification

1. < 1024px: MobileTopBar visible, desktop sidebar/navbar hidden
2. Trackers ▾ → grouped list → tap item → navigates
3. Swipe left on Dashboard → Insights (indicator animates); swipe right returns
4. FAB → bottom sheet → Ask Fiona → FionaPopup slides up, chat works
5. > 1024px: desktop layout completely unchanged
