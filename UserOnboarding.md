# CycleSync — User Onboarding Implementation Spec

## Overview

A 4-screen onboarding **modal** (not full-screen) that appears automatically after signup on first dashboard load. Collects enough data for AI-based cycle predictions from day one. Triggered by `user_profiles.onboarding_completed = false`, skipped in demo mode.

---

## Trigger Logic

**File:** `app/dashboard/layout.tsx`

After auth resolves via `onAuthStateChange`, the layout queries:
```ts
supabase.from("user_profiles").select("onboarding_completed").eq("id", userId).single()
```
If `onboarding_completed` is `false` (default for all new signups), `<OnboardingModal>` renders. On submit, it upserts `onboarding_completed: true` and the modal closes. On subsequent logins the modal never appears.

Demo mode (`sessionStorage.demo = "true"`) bypasses the check entirely.

---

## Modal UI

- **Overlay:** `fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm`
- **Card:** `bg-[#1e1e2a] rounded-2xl max-w-lg w-full mx-4 max-h-[90vh]` (not full-screen)
- **Scrollable body** for long screen content
- **Framer Motion** `AnimatePresence` slide transitions between screens (x: ±60px)
- **Progress indicator** at top of card — 4 dots with labels + fill bar

---

## File Structure

```
components/onboarding/
  OnboardingModal.tsx          # Main shell: state, navigation, save logic
  OnboardingProgress.tsx       # 4-step dots + progress bar
  AvatarUpload.tsx             # Circular photo upload with drag-and-drop preview
  screens/
    Screen1AboutYou.tsx        # Avatar, name, DOB, pronouns, goal
    Screen2YourCycle.tsx       # Last period, duration slider, length slider, regularity
    Screen3BodySignals.tsx     # Symptoms chips, flow, diagnosed conditions
    Screen4Lifestyle.tsx       # Birth control, trackers, reminders, advance notice
```

---

## Screen 1 — About You

| Field | Input Type | Required | DB Column |
|---|---|---|---|
| Profile photo | Circular upload zone (drag/click) | Optional | `user_profiles.avatar_url` via Storage |
| Name | Text input | Optional | `user_profiles.display_name` |
| Date of birth | `<input type="date">` native picker | **Required** | `user_profiles.date_of_birth` |
| Pronouns | Tap chips: She/Her · They/Them · Prefer not to say | Optional | `user_profiles.pronouns` |
| Main goal | Large tap cards (1 of 5) | **Required** | `user_profiles.app_goal` |

**Goal options:** `track_health` · `conceive` · `avoid_pregnancy` · `perimenopause_tracking` · `manage_symptoms`

**Next enabled when:** `date_of_birth` + `app_goal` are set.

---

## Screen 2 — Your Cycle

| Field | Input Type | Required | DB Column |
|---|---|---|---|
| Last period start date | `<input type="date">` | **Required** | `cycles` table (cycle_number=1) |
| Period duration | Slider 2–10 days (default 5) | **Required** | `user_profiles.average_period_length` |
| Typical cycle length | Slider 21–40 days (default 28) | **Required** | `user_profiles.average_cycle_length` |
| Cycle regularity | Tap cards (2×2 grid) | Optional | `user_profiles.cycle_regularity` |

**Regularity options:** `regular` · `somewhat_irregular` · `very_unpredictable` · `not_sure`

**Next enabled when:** `last_period_date` is set. Sliders have sensible defaults so they're always valid.

---

## Screen 3 — Body Signals

| Field | Input Type | Required | DB Column |
|---|---|---|---|
| Typical symptoms | Multi-select chips (tap to toggle) | Optional | `user_profiles.baseline_symptoms text[]` |
| Typical flow | Tap cards (2×2 grid) | Optional | `user_profiles.typical_flow` |
| Diagnosed conditions | Multi-select chips | Optional | `user_profiles.diagnosed_conditions text[]` |

**Symptom options:** cramps · bloating · headache · acne · breast_tenderness · backache · fatigue · mood_swings · cravings · none (exclusive)

**Flow options:** `light` · `moderate` · `heavy` · `varies`

**Condition options:** pcos · endometriosis · fibroids · thyroid_issues · pmdd · none · prefer_not_to_say (none/prefer_not_to_say are mutually exclusive with others)

**Screen is fully skippable.**

---

## Screen 4 — Lifestyle & Health

| Field | Input Type | Required | DB Column |
|---|---|---|---|
| Birth control | Tap chips (single-select) | Optional | `user_profiles.contraceptive_use` |
| Trackers to enable | Multi-select chips | Optional | `user_profiles.enabled_trackers text[]` |
| Reminder types | Multi-select chips | Optional | `user_profiles.notification_types text[]` |
| Advance notice | 3-option tap row (shown only if reminders selected) | Optional | `user_profiles.notification_advance_days` |

**Birth control options:** none · pill · hormonal_iud · copper_iud · implant · patch · condom · other

**Tracker options:** mood · fitness · nutrition · sleep · symptoms

**Reminder options:** period_prediction · ovulation_window · daily_tracking

**Advance notice options:** 1 · 3 · 7 (days before)

**Screen is fully skippable. "Finish" button submits all data.**

---

## Data Save (on Finish)

Executed in order by `OnboardingModal.tsx`:

1. **Avatar upload** (if file selected):
   ```ts
   supabase.storage.from("avatars").upload(`${userId}/avatar.${ext}`, file, { upsert: true })
   // then getPublicUrl() → save to profilePayload.avatar_url
   ```

2. **Upsert user_profiles** with all collected fields + `onboarding_completed: true`

3. **Insert first cycle** (if last period date provided):
   ```ts
   supabase.from("cycles").upsert({ user_id, cycle_number: 1, start_date: lastPeriodDate }, { onConflict: "user_id,cycle_number" })
   ```

4. **Close modal** — dashboard renders normally with data populated.

---

## SQL Migration

**File:** `UserOnboardingSchema.sql`

Run after `schema.sql`. Key changes:
- `ALTER TABLE user_profiles` — drop `is_regular`, add all new onboarding columns
- Update `app_goal` CHECK to include `perimenopause_tracking`
- Update `contraceptive_use` CHECK (split `iud` → `hormonal_iud`/`copper_iud`, add `condom`)
- Create `avatars` Supabase Storage bucket (public) with per-user RLS policies

---

## Required Fields Summary

| Field | Screen |
|---|---|
| Date of birth | 1 |
| App goal | 1 |
| Last period start date | 2 |
| Period duration (slider) | 2 |
| Cycle length (slider) | 2 |

All other fields are optional and skippable.

---

## Verification Checklist

- [ ] Sign up → dashboard loads → onboarding modal appears as centered popup (not full-screen)
- [ ] Skip all optional fields → Finish → `user_profiles.onboarding_completed = true`
- [ ] Sign out + sign back in → modal does NOT reappear
- [ ] Upload avatar → file in `avatars/{user_id}/avatar.*` → `avatar_url` saved in user_profiles
- [ ] Provide last period date → row in `cycles` table with `cycle_number = 1`
- [ ] Demo mode → modal never appears
- [ ] Screen 1 Next is disabled until DOB + goal are filled
- [ ] Screen 2 Next is disabled until last period date is filled
- [ ] Screens 3 & 4 have Skip button available
