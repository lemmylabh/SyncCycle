# Glass Theme Changelog

This file tracks every change made as part of the Glass theme. Update it whenever a component is modified for Glass.

---

## Foundation (2026-03-08)

### Theme System
- **`lib/themeContext.tsx`** — NEW. `ThemeProvider` + `useTheme()` hook. Persists selection to `localStorage` under key `synccycle-theme`. Applies `data-theme="dark"` or `data-theme="glass"` to `document.documentElement`.

### CSS Variables (`app/globals.css`)
Added theme tokens under `[data-theme]` selectors:

| Token | Dark | Glass |
|---|---|---|
| `--page-bg` | `#0f0f13` | `#000000` |
| `--sidebar-bg` | `#161620` | `rgba(255,255,255,0.04)` |
| `--navbar-bg` | `#0f0f13` | `rgba(0,0,0,0.55)` |
| `--card-bg` | `#1e1e2a` | `rgba(255,255,255,0.06)` |
| `--border` | `rgba(255,255,255,0.05)` | `rgba(255,255,255,0.10)` |
| `--border-md` | `rgba(255,255,255,0.10)` | `rgba(255,255,255,0.18)` |

Glass structural rules:
- `.navbar-panel` and `.sidebar-panel` get `backdrop-filter: blur(14px)`
- `.page-shell` background: black base + cobalt-blue radial bloom (47% 33%) + dark-violet radial bloom (82% 65%)

### Theme Selector (`components/dashboard/ThemeSelector.tsx`)
- NEW component. Palette icon button in the Navbar (between bell and avatar).
- Dropdown with Dark / Glass options; active option shows a checkmark.
- Purple dot indicator on the icon when Glass is active.

### Structural Shell Updates
All structural bg classes converted from hardcoded hex to CSS vars:

| File | Change |
|---|---|
| `app/dashboard/layout.tsx` | `bg-[#0f0f13]` → `bg-[var(--page-bg)]` + `page-shell` class on shell divs. Wrapped with `ThemeProvider`. |
| `components/dashboard/Navbar.tsx` | `bg-[#0f0f13]` → `bg-[var(--navbar-bg)]` + `navbar-panel` class. `ThemeSelector` added to right section. |
| `components/dashboard/Sidebar.tsx` | `bg-[#161620]` → `bg-[var(--sidebar-bg)]` + `sidebar-panel` class. |

---

## Background Update (2026-03-08)

### `app/globals.css`
- `--page-bg` updated: `#0f0f1a` → `#000000`
- `--navbar-bg` updated: `rgba(15,15,26,0.65)` → `rgba(0,0,0,0.55)` (matches black base, cleaner glass panel)
- `.page-shell` background replaced with user-defined gradient:
  ```css
  background-color: #000000;
  background-image:
    radial-gradient(at 47% 33%, hsl(240.00, 100%, 27%) 0, transparent 59%),
    radial-gradient(at 82% 65%, hsl(290.47, 100%, 21%) 0, transparent 55%);
  ```

---

## Premium Card Glass + Panel Depth (2026-03-08)

### `app/globals.css`
- `.navbar-panel` blur increased 14px → 20px + added `box-shadow` edge glow
- `.sidebar-panel` blur increased 14px → 20px + added `box-shadow` edge glow
- `.card-glass` — NEW class: `backdrop-filter: blur(14px)` + elevated `box-shadow` (depth + inset highlight) + brighter `border-color`
- `.profile-overlay` — NEW override: gradient fades to black instead of `#1e1e2a` in glass mode

### Dashboard Cards — all 7 converted
`bg-[#1e1e2a]` → `bg-[var(--card-bg)] card-glass` | `border-white/5` → `border-[var(--border)]`

| Component | File |
|---|---|
| ProfileCard | `components/dashboard/ProfileCard.tsx` |
| CyclePhaseCard | `components/dashboard/CyclePhaseCard.tsx` |
| NutritionCard | `components/dashboard/NutritionCard.tsx` |
| Vibe | `components/dashboard/Vibe.tsx` |
| FitnessCard | `components/dashboard/FitnessCard.tsx` |
| SymptomHeatmap | `components/dashboard/SymptomHeatmap.tsx` |
| SleepCard | `components/dashboard/SleepCard.tsx` |

Also: `ProfileCard.tsx` line 121 gradient overlay gets `profile-overlay` class so it blends with glass bg.

---

## Background — Premium Black (2026-03-08)

### `app/globals.css`
- `.page-shell` updated to pure premium black: `#000000` base with a single centered elliptical radial gradient (`#111111` → `#000000` at 70%) for subtle OLED-style depth. No color casts.

---

## Pending / Next Steps

- [ ] Fiona panel — apply glass styling
- [ ] Modal backgrounds (OnboardingModal, EditProfileModal) — glass variant
- [ ] Color tinting — layer subtle tint into card backgrounds
- [ ] MobileTopBar — glass treatment for mobile shell
- [ ] Tooltip backgrounds in FitnessCard/SleepCard — convert `bg-[#0f0f13]` to CSS var
