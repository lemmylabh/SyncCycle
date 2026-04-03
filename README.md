# Syncycle

**Your cycle. Your power.**

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)

SyncCycle is a data-driven wellness app that maps your menstrual cycle to your real life — predicting how each phase affects your energy, mood, performance, and body, so you can stop reacting and start planning.

---

## The Problem

Most period trackers tell you *when* your period is coming. That's it.

- They don't explain why you feel exhausted in week three or why your focus drops mid-cycle
- They don't connect your symptoms to your hormones, or your hormones to your habits
- They offer no guidance on how to adjust your workouts, nutrition, or schedule around your cycle
- The result: millions of people go through each month blindsided — by fatigue, mood swings, brain fog, and pain — with no real plan

---

## The Solution

SyncCycle connects the dots.

- Tracks your cycle phases and learns from your daily logs
- Gives you a personalised picture of how hormones shape your energy, mood, and performance
- Delivers phase-aware predictions *before* symptoms hit — not after
- Pairs you with an AI wellness coach who actually knows your history

Not averages. Not generic advice. Your cycle, your patterns, your plan.

---

## Features

**Phase Intelligence**
- Tracks all four hormonal phases: menstrual, follicular, ovulatory, and luteal
- Predicts how each phase affects your energy, focus, physical capacity, and emotional state
- Personalised to your cycle length and history — not a generic 28-day average

**Fiona, Your AI Wellness Coach**
- Streaming AI coach trained on cycle science
- Aware of your personal logs and current phase in real time
- Ask anything — how you're feeling, what to expect this week, how to adjust your routine

**Smart Dashboard**
- 8 cards at a glance: Cycle Phase, Mood & Vibe, Symptom Heatmap, Nutrition, Fitness, Sleep, AI Insights, Profile
- Non-scrollable grid on desktop, swipeable on mobile
- Each card shows freshness status and a quick-log action

**Personalized Insights Feed**
- AI-generated recommendations built from your logged data, not population averages
- Improves over time as you log more
- Rate each insight to sharpen future suggestions

**Full Tracker Suite**
- Dedicated pages for workouts, meals, sleep, symptoms, mood, and journal entries
- Every log is tied to your cycle phase automatically
- Visualised as charts, heatmaps, and timelines on the dashboard

**Guided Onboarding**
- Four-screen setup: personal info, cycle profile, body signals, lifestyle preferences
- Builds your baseline from day one so predictions start immediately
- No cold starts

**Mobile-First Design**
- Swipe-based navigation between dashboard pages
- Fiona chat accessible as a floating popup
- Fully responsive — works on any screen size

**Demo Mode**
- No account or setup required
- Pre-loaded with real data — Fiona, dashboard, trackers, and insights all active
- One click on the sign-in page

---

## Built With

- [Next.js 16](https://nextjs.org) — App Router with Turbopack
- [Supabase](https://supabase.com) — PostgreSQL database, authentication, and file storage
- [OpenRouter](https://openrouter.ai) — AI inference (GPT-4o Mini) for Fiona and Insights
- [TypeScript 5](https://www.typescriptlang.org) — strict mode throughout
- [Tailwind CSS 4](https://tailwindcss.com) — utility-first styling
- [Framer Motion](https://www.framer.com/motion/) — animations and transitions
- [Recharts](https://recharts.org) — fitness and sleep charts

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- An [OpenRouter](https://openrouter.ai) API key

### Install

```bash
git clone https://github.com/your-username/synccycle.git
cd synccycle
npm install
```

### Configure Environment

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENROUTER_API_KEY=your_openrouter_api_key
```

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API → `anon public` key |
| `OPENROUTER_API_KEY` | [openrouter.ai/keys](https://openrouter.ai/keys) |

### Set Up the Database

In your Supabase project, open the **SQL Editor** and run the files in `sql-schemas/` in order:

1. Open your Supabase project → SQL Editor
2. Run files `01` through `18` sequentially
3. Each file builds on the previous — order matters

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Demo Mode

No setup needed. Try the full app instantly:

- Click **"Continue as Demo"** on the sign-in page
- Or append `?demo=true` to any dashboard URL
- Pre-loaded with real data — Fiona, dashboard, trackers, and insights all active

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server (Turbopack) |
| `npm run build` | Build for production |
| `npm start` | Start the production server |
| `npm run lint` | Run ESLint |
