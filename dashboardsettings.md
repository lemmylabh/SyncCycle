# CycleSync Dashboard Layout System (Final Plan)

## 🧠 Overview

A flexible, user-customizable dashboard built on a **fixed 4 × 2 grid (8 cells)** that:
- Always remains **fully filled (no gaps)**
- Supports **drag, drop, resize**
- Uses **controlled flexibility (not total freedom)**

---

## 📐 Grid System

- **Columns:** 4  
- **Rows:** 2  
- **Total Cells:** 8  

+----+----+----+----+
| A1 | A2 | A3 | A4 |
+----+----+----+----+
| B1 | B2 | B3 | B4 |
+----+----+----+----+

---

## 🧩 Card Types & Constraints

### 👤 Profile Card (PRIMARY CARD)
- Must always exist
- Cannot be deleted
- Can be resized:

| Size | Shape |
|------|------|
| 1×1 | Compact |
| 1×2 | Vertical (default) |
| 2×1 | Horizontal |

---

### 📊 Tracker Cards
- Size: **1×1 only**
- One per tracker
- Hidden if tracker disabled

---

### 💡 Insights Card
- Flexible + duplicable
- Sizes:

| Size | Shape |
|------|------|
| 2×1 | Horizontal (min) |
| 2×2 | Large (max) |

---

### 🤖 Ask Fiona Card
- Size: **1×1 only**
- Acts as filler / utility

---

## 🎯 Core Rule

> **The grid must ALWAYS be fully filled (8/8 cells). No gaps allowed.**

---

## 🧠 Layout Strategy Logic

### Step 1: Count Active Trackers
Trackers Active = 6 - Disabled

### Step 2: Calculate Remaining Cells
Remaining Cells = 8 - Active Trackers

### Step 3: Fill Remaining Cells Using Priority
1. Profile (adaptive size)  
2. Insights (resize first, duplicate if needed)  
3. Ask Fiona (fill 1×1 gaps)  

---

## 📊 Scenario Table (All Cases)

| Disabled | Active Trackers | Remaining Cells | Fill Strategy |
|----------|----------------|------------------|--------------|
| 1        | 5              | 3                | Profile (1×2) + Fiona |
| 2        | 4              | 4                | Profile (1×2) + Insights (2×1) |
| 3        | 3              | 5                | Profile (1×2) + Insights (2×2) |
| 4        | 2              | 6                | Profile (2×1) + Insights (2×2) + Fiona |
| 5        | 1              | 7                | Profile (2×1) + Insights (2×2) + Fiona |

---

## 🔍 Visual Layout Examples (ASCII)

### ✅ Case: 5 Active Trackers (1 Disabled)

+----+----+----+----+
| P  | T  | T  | T  |
| P  | T  | T  | F  |
+----+----+----+----+

Legend:
- P = Profile (1×2)
- T = Tracker
- F = Fiona

---

### ✅ Case: 4 Active Trackers

+----+----+----+----+
| P  | T  | T  | T  |
| P  | I  | I  | T  |
+----+----+----+----+

- I = Insights (2×1)

---

### ✅ Case: 3 Active Trackers

+----+----+----+----+
| P  | T  | T  | I  |
| P  | T  | I  | I  |
+----+----+----+----+

- Insights expands to 2×2

---

### ✅ Case: 2 Active Trackers

+----+----+----+----+
| P  | P  | T  | I  |
| T  | F  | I  | I  |
+----+----+----+----+

- Profile = 2×1
- Insights = 2×2

---

### ⚠️ Case: 1 Active Tracker (Hardest Case)

+----+----+----+----+
| P  | P  | I  | I  |
| T  | F  | I  | I  |
+----+----+----+----+

- Perfect fill:
  - Profile (2×1)
  - Insights (2×2)
  - Fiona (1×1)
  - 1 Tracker

---

## ⚙️ System Rules (CRITICAL)

### 1. No Gaps Rule
- Grid must always be fully occupied
- Enforced via:
  - Auto-placement
  - Smart resizing

---

### 2. Smart Reflow System
When:
- Card resized
- Card moved
- Tracker disabled

👉 System must:
- Recalculate layout
- Shift cards automatically
- Prevent empty cells

---

### 3. Snap-to-Grid Only
- No free placement
- Cards must:
  - Snap
  - Not overlap

---

### 4. Resize Constraints
- Only predefined sizes allowed
- No arbitrary scaling

---

### 5. Deck ↔ Canvas Behavior

#### Deck:
- Shows available cards
- Hides disabled tracker cards

#### Canvas:
- Active layout only

#### Drag Rules:
- Canvas → Deck = remove
- Deck → Canvas = add
- Large cards shrink in deck view

---

### 6. Editing Mode (Settings Only)
- Drag
- Resize
- Add/remove cards

👉 Locked in normal dashboard mode

---

## 🧠 Smart System Enhancements

### ✨ Auto-Arrange Button
- Automatically fills grid optimally

---

### ✨ Layout Suggestions
When imbalance detected:
- “Add Insights”
- “Resize Profile”
- “Fill empty space”

---

### ✨ Resize Preview (Ghost UI)
- Show future layout before applying

---

### ✨ Snap Suggestions
- Highlight best-fit positions

---

## ⚠️ Design Constraints (Important)

### DO:
- Keep system structured
- Use Insights as flexible filler
- Use Fiona for precision gaps
- Let Profile adapt layout

### DON'T:
- Allow unlimited resizing
- Allow freeform placement
- Overuse duplicate cards
- Reintroduce 2×2 Profile (too complex)

---

## 🧭 Final Principle

> **Controlled flexibility + intelligent auto-layout = clean, scalable dashboard**

This ensures:
- No broken layouts
- No empty states
- Consistent UX across all user configurations