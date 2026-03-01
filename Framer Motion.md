# Integrating Framer Motion into CycleSync (Controlled & Intentional)

We are adding Framer Motion to enhance UX — not redesign the app.

## Stack Context
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase

## Goal

Add subtle, professional animations only where they improve usability and perceived polish.

CycleSync is a health app.  
The motion style must feel:
- Calm
- Soft
- Trustworthy
- Professional

Not flashy. Not startup-landing-page energy.

---

## Where Framer Motion SHOULD Be Used

### 1. Page Transitions
Used when navigating between:
- Login → Dashboard
- Dashboard → Cycle Input
- Profile → Dashboard

Guidelines:
- Fade + slight vertical movement (6–10px)
- Duration: 0.2–0.3s
- No exaggerated motion

Example pattern:
- initial: opacity 0, small Y offset
- animate: opacity 1, Y 0
- exit: opacity 0, small negative Y offset

---

### 2. Dashboard Cards
Used for:
- Cycle status card
- Prediction card
- Mood summary
- Insights

Guidelines:
- Subtle hover lift (2–4px)
- Soft spring
- No scaling unless extremely subtle (1.01 max)

Goal: Make cards feel tactile, not animated.

---

### 3. Sidebar Active Indicator
Instead of abrupt background switching:
- Animate the active highlight sliding between items
- Smooth layout transition
- No bounce

This gives a premium feel without visual noise.

---

### 4. Modal / Dialog Transitions
Used for:
- Add Cycle Entry
- Edit Profile
- Settings dialogs

Guidelines:
- Fade + slight scale (0.95 → 1)
- Fast (0.2–0.25s)
- Clean exit animation

Should feel intentional and smooth.

---

## Where NOT To Use Motion

Do NOT animate:
- Every button
- Form inputs
- Static text
- Background decorations
- Random UI elements
- Loading spinners (unless extremely subtle)

Avoid:
- Parallax
- Floating effects
- Dramatic scaling
- Long easing curves
- Overshooting springs

---

## Performance Rules

- Keep animations under 300ms
- Avoid layout thrashing
- Use `layout` only when needed
- Animate opacity and transform (not width/height when possible)
- Maintain accessibility (respect reduced motion preferences)

---

## Instruction to Claude

When implementing:

- Do NOT redesign layout
- Do NOT change spacing
- Do NOT change colors
- Do NOT modify typography
- Only add motion where specified
- Keep animations subtle and minimal

The goal is enhancement, not reinvention.

---

## Motion Philosophy

CycleSync should feel:
- Stable
- Reassuring
- Gentle
- Intentional

Motion should support clarity — never distract from health data.

Less is more.