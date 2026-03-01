# SyncCycle — Dashboard UI Plan

## Overview

The dashboard is the authenticated core of SyncCycle. It uses a **full dark theme** that deliberately contrasts with the light rose-pink landing page — a clear visual context shift from "marketing" to "product". The aesthetic mirrors the reference HR dashboard image but adapts every element for menstrual cycle tracking, replacing teal accents with the SyncCycle brand palette (rose, purple, pink).

---

## Color System

| Token            | Hex        | Tailwind Class              |
|------------------|------------|-----------------------------|
| Page background  | `#0f0f13`  | `bg-[#0f0f13]`              |
| Sidebar bg       | `#161620`  | `bg-[#161620]`              |
| Card bg          | `#1e1e2a`  | `bg-[#1e1e2a]`              |
| Card border      | white 5%   | `border border-white/5`     |
| Primary text     | `#ffffff`  | `text-white`                |
| Secondary text   | `#9ca3af`  | `text-gray-400`             |
| Accent 1         | `#f43f5e`  | `text-rose-500`             |
| Accent 2         | `#a855f7`  | `text-purple-500`           |
| Accent 3         | `#f472b6`  | `text-pink-400`             |
| Active nav bg    | rose 20%   | `bg-rose-500/20`            |
| Active nav border| rose       | `border-l-2 border-rose-500`|

**Phase color mapping:**
| Phase      | Color       |
|------------|-------------|
| Menstrual  | `rose-500`  |
| Follicular | `purple-500`|
| Ovulatory  | `pink-400`  |
| Luteal     | `violet-500`|

The global CSS (`--background: #fdf4f7`) applies only to the landing page. The dashboard layout wrapper overrides this with `bg-[#0f0f13] text-white` directly on the shell div.

---

## File Structure

```
app/dashboard/
├── layout.tsx              # Client shell: sidebar state, auth guard, Sidebar + Navbar
└── page.tsx                # Server Component: card grid

components/dashboard/
├── Sidebar.tsx             # Collapsible nav (client — manages mobile open/close)
├── Navbar.tsx              # Top bar: hamburger, search, bell, avatar dropdown
├── CyclePhaseCard.tsx      # Current phase + SVG progress ring + pills
├── PhaseDonut.tsx          # SVG donut chart of phase day distribution
├── TodaySnapshot.tsx       # 3 key stats (cycle day, days to period, avg length)
├── SymptomHeatmap.tsx      # 5 symptoms × 7 days severity grid
├── MoodEnergy.tsx          # Mood + energy SVG rings + Log Today CTA
├── CycleCalendar.tsx       # Horizontal weekly calendar colored by phase
└── QuickInsights.tsx       # Hardcoded phase-specific tips list
```

---

## Layout Shell (`app/dashboard/layout.tsx`)

```
┌─────────────────────────────────────────────────────────┐
│  Sidebar (240px, sticky)  │  Navbar (full width, 64px)  │
│                           │─────────────────────────────│
│  Logo                     │  main > {children}          │
│  ─────────────────        │                             │
│  MAIN                     │  (scrollable content area)  │
│    Dashboard              │                             │
│    Insights               │                             │
│  ─────────────────        │                             │
│  TRACKING                 │                             │
│    Log Today              │                             │
│    Period Tracker         │                             │
│    Symptoms               │                             │
│  ─────────────────        │                             │
│  WELLNESS                 │                             │
│    Nutrition              │                             │
│    Fitness                │                             │
│    Sleep                  │                             │
│  ─────────────────        │                             │
│  Ask Experts              │                             │
│  ─────────────────        │                             │
│  Settings                 │                             │
│  Sign Out                 │                             │
└─────────────────────────────────────────────────────────┘
```

**Auth guard**: `layout.tsx` checks session on mount with `supabase.auth.getSession()`. If no session, redirects to `/`. This replaces the guard that was in the old `page.tsx`.

**Mobile behavior**: Sidebar is a fixed `z-50` slide-in drawer (`-translate-x-full` → `translate-x-0`). Hamburger in Navbar toggles it. Backdrop (`z-40`, `bg-black/60`) closes it on tap.

---

## Sidebar Design

```
bg-[#161620], w-64, h-screen

Active item:   bg-rose-500/20  border-l-2 border-rose-500  text-rose-400  font-medium
Inactive item: text-gray-400   hover:bg-white/5  hover:text-white  transition-colors

Section labels: text-gray-500  text-[10px]  uppercase  tracking-widest
```

---

## Navbar Design

```
bg-[#0f0f13]  border-b border-white/5  h-16

Left:   [☰ hamburger, lg:hidden]  [Dashboard — page title]
Center: [search input, bg-white/5 border border-white/10 rounded-xl, md:block]
Right:  [🔔 bell + rose-500 badge dot]  [initials avatar → dropdown]
```

Dropdown menu (`bg-[#1e1e2a] border border-white/10 rounded-xl`): Settings, Sign Out.

---

## Dashboard Grid (`app/dashboard/page.tsx`)

```
Row 1 — grid-cols-3:
  [CyclePhaseCard]  [PhaseDonut]  [TodaySnapshot]

Row 2 — grid-cols-3:
  [SymptomHeatmap  col-span-2]  [MoodEnergy]

Row 3 — grid-cols-3:
  [CycleCalendar  col-span-2]  [QuickInsights]
```

Mobile stacks all cards to 1 column (`grid-cols-1`). Tablet uses 2 (`md:grid-cols-2`).

---

## Card Specifications

### CyclePhaseCard
- Gradient bg: `from-rose-900/30 to-purple-900/30` over `bg-[#1e1e2a]`
- SVG progress ring (`stroke-dasharray` / `stroke-dashoffset`) showing day X of cycle length
- Two status pills below the ring: cycle length + days until next period

### PhaseDonut
- Pure SVG donut using `stroke-dasharray` with `rotate()` transforms per segment
- 4 segments: Menstrual (rose), Follicular (purple), Ovulatory (pink), Luteal (violet)
- Legend: 2×2 grid of colored dot + label + day count

### TodaySnapshot
- 3 rows divided by `divide-y divide-white/5`
- Each row: colored dot + label + large number right-aligned

### SymptomHeatmap
- HTML `<table>` with 5 symptom rows × 7 day columns
- Cell color by severity: `bg-white/5` → `bg-rose-900/60` → `bg-rose-700/70` → `bg-rose-500` → `bg-rose-400`
- Today's column header highlighted with `bg-rose-500` date circle

### MoodEnergy
- Two SVG rings side-by-side (rose for mood, purple for energy)
- Emoji in ring center (😞→😄 scale)
- "Log Today" gradient button when not yet logged

### CycleCalendar
- 7 column grid (Mon–Sun)
- Each day: weekday label + phase-colored circle with date + symptom dot below
- Today: `ring-2 ring-white ring-offset-[#1e1e2a]` on the circle
- Phase color legend at bottom

### QuickInsights
- 4 tips, divided by `divide-y divide-white/5`
- Each tip: emoji + tip text + category badge pill
- "See all tips →" footer link in rose-400
- Tips are hardcoded per phase (no external API for MVP)

---

## Implementation Notes

1. **No chart library** — All data visualization uses pure SVG. No recharts, chart.js, etc.
2. **Mock data** — All cards use hardcoded data. Connect to Supabase tables (see `Supabase.md`) once schema is live.
3. **`CURRENT_PHASE` constant** — Shared mock value used across multiple components. Replace with a custom hook `useCycleData()` that fetches from Supabase once the DB is ready.
4. **Future pages** — New sidebar routes (`/dashboard/symptoms`, `/dashboard/log`, etc.) automatically inherit the shell from `layout.tsx`.
5. **Responsive** — `lg:grid-cols-3` → `md:grid-cols-2` → `grid-cols-1`. All cards are self-contained with no fixed widths.

---

## Future Enhancements (Post-MVP)
- Connect cards to live Supabase data via Server Components + `supabase.from(...)` calls
- `/dashboard/log` page: daily logging form (period flow, symptoms, mood, energy)
- `/dashboard/insights` page: historical charts, cycle pattern analysis
- Real-time updates via Supabase realtime subscriptions
- Push notifications for predicted period start
