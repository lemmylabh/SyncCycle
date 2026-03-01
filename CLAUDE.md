# SyncCycle

A data-driven web app that guides menstruating individuals through hormonal cycles and predicts physical, mental, and performance changes.

## Problem Statement

- **Lack of control, knowledge, and management** around menstrual cycles
- **Reduced quality of life** due to unpredictable symptoms
- **Energy and fitness impacts** - difficulty optimizing workouts, nutrition timing
- **Hormonal changes** that are hard to anticipate and work with

## Solution

SyncCycle provides personalized, data-driven insights to help users:
- Understand their unique cycle patterns
- Predict physical, mental, and performance changes
- Optimize daily activities around their hormonal phases
- Improve overall quality of life through cycle awareness

**Reference:** [trycyclesync.com](https://www.trycyclesync.com/) offers similar services.

## Current Features

- User authentication (sign in/sign up)
- User profile with personal data input
- Dashboard (main view)
- Cycle Data section (sidebar navigation)

## Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Database:** Supabase (PostgreSQL + Auth + Real-time)
- **Package Manager:** npm

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
├── components/           # React components
│   ├── ui/              # shadcn/ui components
│   └── ...              # Feature components
├── lib/                  # Utility functions, Supabase client
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
└── styles/               # Global styles
```

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
```

## Code Conventions

- Use TypeScript for all files (`.ts`, `.tsx`)
- Follow React Server Components patterns where applicable
- Use `cn()` utility for conditional Tailwind classes
- Prefer named exports for components
- Keep components small and focused
- Use Supabase client from `@/lib/supabase` for database operations

## Naming Conventions

- **Components:** PascalCase (`CycleTracker.tsx`)
- **Utilities/hooks:** camelCase (`useCycleData.ts`)
- **Types:** PascalCase with descriptive names (`CyclePhase`, `UserProfile`)
- **Database tables:** snake_case (`cycle_data`, `user_profiles`)

## Domain Terminology

- **Cycle:** The menstrual cycle (typically 21-35 days)
- **Phase:** Stage within a cycle (menstrual, follicular, ovulatory, luteal)
- **Cycle Day:** Day number within current cycle (Day 1 = first day of period)
- **Symptoms:** Physical or emotional changes tracked by user
