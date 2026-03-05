# CycleSync Mobile UX Implementation Plan

This document defines the **complete mobile UX plan for CycleSync**, including navigation structure, interaction behavior, floating actions, AI assistant integration, and ASCII wireframes.

The document is designed so **Claude Code can directly implement the mobile UI** from this specification.

---

# 1. Product Principles

The mobile experience should feel:

* Fast
* Minimal
* Thumb-friendly
* AI-assisted
* Journal-centric

Key design rules:

* **No sidebar on mobile**
* **Swipe navigation between Dashboard and Insights**
* **Trackers accessed via a centered dropdown**
* **Voice journaling for fast daily capture**
* **AI assistant available globally**
* **All quick actions use popups, not page navigation**

---

# 2. Mobile Navigation Architecture

The mobile layout contains **three UI layers**:

1. Top Navigation Bar
2. Swipeable Main Pages
3. Floating Action Button (FAB)

Main pages:

```
Dashboard
Insights
```

Users can **swipe horizontally between them**.

---

# 3. Top Navigation Bar

The top bar uses a **Left / Center / Right layout**.

```
┌─────────────────────────────────────────┐
│           Trackers ▾            👤      │
└─────────────────────────────────────────┘
```

### Center Element

```
Trackers ▾
```

Opens a dropdown with all trackers grouped by category.

### Right Element

```
👤 Profile
```

Profile dropdown contains:

```
Profile
Settings
Sign Out
```

---

# 4. Tracker Dropdown Structure

Trackers appear grouped by category.

Example dropdown:

```
Trackers
────────────────

Cycle
• Period

Health
• Symptoms
• Vitality

Lifestyle
• Nutrition
• Sleep
• Mood

Reflection
• Journal
```

Selecting a tracker navigates to that tracker page.

---

# 5. Swipe Navigation Between Pages

Users can **freely swipe left and right** between the two main pages.

```
Dashboard  ⇄  Insights
```

The swipe animation must be **smooth and gesture-driven**.

---

# 6. Page Indicator

A small indicator at the top shows which page is active.

Example:

```
Dashboard     Insights
─────────
```

or

```
Dashboard     Insights
              ─────────
```

The underline moves smoothly when swiping.

---

# 7. Floating Action Button (Mobile)

A **global Floating Action Button (FAB)** exists across the mobile app.

Position:

Bottom right corner.

```
┌───────────────────────────────┐
│                               │
│                               │
│                               │
│                           ＋   │
└───────────────────────────────┘
```

When tapped it opens a **bottom sheet menu**.

---

# 8. FAB Menu Options

When expanded, the FAB reveals two actions.

```
┌──────────────────────────────┐
│                              │
│   🎤 Record Your Day         │
│                              │
│   ✦ Ask Fiona                │
│                              │
└──────────────────────────────┘
```

Both actions open **popup modals** rather than navigating to a new page.

---

# 9. Record Your Day (Voice Journal)

Purpose:

Allow users to **quickly record a voice reflection of their day**.

The system will:

1. Record audio
2. Transcribe speech to text
3. Append transcription to today's journal
4. Delete the voice file immediately

This ensures **privacy-first voice journaling**.

---

# 10. Voice Recording Popup

```
┌──────────────────────────────────┐
│ Record Your Day                  │
│                                  │
│             🎤                   │
│                                  │
│        Tap to start              │
│                                  │
│  ● Recording...                  │
│                                  │
│     Stop         Cancel          │
└──────────────────────────────────┘
```

Interaction flow:

```
Tap microphone
↓
Recording starts
↓
User stops recording
↓
Audio sent for transcription
↓
Text added to journal
↓
Audio deleted
```

Confirmation message:

```
✓ Added to today's journal
```

---

# 11. Ask Fiona (AI Assistant)

Ask Fiona opens a **chat popup modal**, not a page.

The assistant should feel **present but unobtrusive**.

It is accessible from **anywhere in the mobile app**.

---

# 12. Ask Fiona Popup UI

```
┌──────────────────────────────────┐
│ ✦ Ask Fiona                      │
│                                  │
│ Fiona: Hi Alex, how can I help?  │
│                                  │
│                                  │
│ [ User messages appear here ]    │
│                                  │
│                                  │
│ ──────────────────────────────   │
│ Type your message...      Send   │
└──────────────────────────────────┘
```

Assistant behavior rules:

* Sensitive and supportive tone
* Wellness guidance only
* No medical diagnosis
* No prescriptive treatment

Fiona acts as a **coach and reflection partner**.

---

# 13. Dashboard Page (Mobile)

The Dashboard shows **today’s cycle context and quick insights**.

Example layout:

```
┌─────────────────────────────────┐
│ Trackers ▾                👤    │
├─────────────────────────────────┤
│                                 │
│        Cycle Day 12             │
│                                 │
│     🟣 Luteal Phase             │
│                                 │
│                                 │
│ Today's Summary                 │
│                                 │
│ Mood: Calm                      │
│ Energy: Medium                  │
│ Sleep: 7h                       │
│                                 │
│                                 │
│ Suggestions                     │
│                                 │
│ • Light exercise recommended    │
│ • Magnesium rich foods          │
│                                 │
│                          ＋      │
└─────────────────────────────────┘
```

---

# 14. Insights Page (Mobile)

Insights shows **patterns detected from trackers**.

Example layout:

```
┌─────────────────────────────────┐
│ Trackers ▾                👤    │
├─────────────────────────────────┤
│                                 │
│ Insights                        │
│                                 │
│ Cycle Pattern                   │
│ ─────────────                   │
│ Mood dips appear 2 days before  │
│ menstruation                    │
│                                 │
│ Energy Trends                   │
│ ─────────────                   │
│ Highest energy during ovulation │
│                                 │
│ Sleep Correlation               │
│ ─────────────                   │
│ Poor sleep during late luteal   │
│                                 │
│                          ＋      │
└─────────────────────────────────┘
```

---

# 15. Journal Page (Mobile)

Journal displays written and voice-transcribed entries.

```
┌─────────────────────────────────┐
│ Trackers ▾                👤    │
├─────────────────────────────────┤
│                                 │
│ Journal                         │
│                                 │
│ Today                           │
│                                 │
│ "Today I felt tired but calmer  │
│ after going for a walk."        │
│                                 │
│                                 │
│ Add note...                     │
│                                 │
│                          ＋      │
└─────────────────────────────────┘
```

Voice transcriptions will **automatically append entries**.

---

# 16. Desktop Differences

Desktop keeps the **sidebar layout**.

Example:

```
┌───────────────┬──────────────────────────┐
│ Dashboard     │                          │
│ Trackers      │        Main Page         │
│ Insights      │                          │
│ Journal       │                          │
│               │                          │
└───────────────┴──────────────────────────┘
```

Key desktop rules:

* FAB only appears on **Journal page**
* FAB contains **only one action**

```
🎤 Record Your Day
```

Desktop does **not include Ask Fiona in FAB**.

Ask Fiona may appear as a **chat button inside the UI**.

---





Voice recording:

Use the **browser MediaRecorder API**.

Transcription:

Use **Whisper API or equivalent speech-to-text**.

Privacy rule:

```
Audio must be deleted after transcription.
```

Journal entries stored in:

```
journal_entries
```

---

# 18. Interaction Flows

### Voice Journaling Flow

```
Tap FAB
↓
Record Your Day
↓
Record voice
↓
Transcription
↓
Saved to Journal
↓
Audio deleted
```

---

### AI Assistant Flow

```
Tap FAB
↓
Ask Fiona
↓
Chat popup
↓
User conversation
↓
Contextual coaching
```

---

### Page Navigation

```
Swipe left/right
Dashboard ⇄ Insights
```

---

# End of Mobile UX Plan
