# SyncCycle Dashboard — Responsive Square Card Layout

## Problem

The desktop dashboard uses a **4 × 2 grid** where the **Profile Card spans the first column across two rows**, and the remaining **6 tracker cards should remain perfect squares**.

```
+---------------+---------------+---------------+---------------+
|               |               |               |               |
|   PROFILE     |     PERIOD    |     VIBE      |   SYMPTOMS    |
|   (row-span   |               |               |               |
|      -2)      +---------------+---------------+---------------+
|               |               |               |               |
|               |   NUTRITION   |    FITNESS    |     SLEEP     |
|               |               |               |               |
+---------------+---------------+---------------+---------------+
```

On some laptops or tablets, the **screen aspect ratio differs**, causing:

* Card **width to shrink**
* Card **height to stretch**
* Cards **no longer stay square**
* Content becomes cramped

Forcing `aspect-square` alone causes **content overflow**, because the grid still forces layout dimensions that do not fit.

---

# Solution

Use **aspect-ratio–aware layout switching**.

If the dashboard area **cannot fit 4×2 square cards**, automatically switch to a **3×3 grid layout** where:

* Column 1 remains the **Profile Card**
* The **6 tracker cards stay perfectly square**

---

# Layout Modes

## Layout A — Wide Screens (4 × 2)

Used when the screen is wide enough.

```
+--------+--------+--------+--------+
|Profile | Period |  Vibe  |Symptoms|
|        +--------+--------+--------+
|        |Nutrit. |Fitness | Sleep  |
+--------+--------+--------+--------+
```

Characteristics:

* 4 columns
* 2 rows
* Profile spans **row-span-2**
* All tracker cards **aspect-square**

---

## Layout B — Narrower Screens (3 × 3)

Used when aspect ratio cannot support 4×2 squares.

```
+--------+--------+--------+
|Profile | Period |  Vibe  |
|        +--------+--------+
|        |Symptoms|Nutrit. |
|        +--------+--------+
|        |Fitness | Sleep  |
+--------+--------+--------+
```

Characteristics:

* 3 columns
* 3 rows
* Profile still spans **row-span-2**
* Remaining cards remain **perfect squares**

---

# Implementation

## 1. Layout Detection Hook

Create a hook that determines which layout to use based on **viewport aspect ratio**.

```ts
// hooks/useDashboardLayout.ts

import { useEffect, useState } from "react";

export function useDashboardLayout() {
  const [layout, setLayout] = useState<"4x2" | "3x3">("4x2");

  useEffect(() => {
    function updateLayout() {
      const width = window.innerWidth;
      const height = window.innerHeight - 64; // subtract navbar height

      const ratio = width / height;

      if (ratio < 1.6) {
        setLayout("3x3");
      } else {
        setLayout("4x2");
      }
    }

    updateLayout();
    window.addEventListener("resize", updateLayout);

    return () => window.removeEventListener("resize", updateLayout);
  }, []);

  return layout;
}
```

---

# 2. Dashboard Page

The dashboard switches layouts dynamically.

```tsx
"use client";

import { useDashboardLayout } from "@/hooks/useDashboardLayout";

import { ProfileCard } from "@/components/dashboard/ProfileCard";
import { CyclePhaseCard } from "@/components/dashboard/CyclePhaseCard";
import { Vibe } from "@/components/dashboard/Vibe";
import { SymptomHeatmap } from "@/components/dashboard/SymptomHeatmap";
import { NutritionCard } from "@/components/dashboard/NutritionCard";
import { FitnessCard } from "@/components/dashboard/FitnessCard";
import { SleepCard } from "@/components/dashboard/SleepCard";

export default function DashboardPage() {
  const layout = useDashboardLayout();

  return (
    <>
      {/* Mobile Layout */}
      <div className="lg:hidden overflow-y-auto h-[calc(100vh-64px)]">
        <div className="p-4 grid grid-cols-1 gap-4 auto-rows-[300px]">
          <CyclePhaseCard />
          <Vibe />
          <SymptomHeatmap />
          <NutritionCard />
          <FitnessCard />
          <SleepCard />
        </div>
      </div>

      {/* Desktop Layout */}
      {layout === "4x2" ? (
        <div className="hidden lg:grid grid-cols-4 grid-rows-2 gap-4 p-4 h-[calc(100vh-64px)]">
          <ProfileCard className="row-span-2" />

          <CyclePhaseCard className="aspect-square" />
          <Vibe className="aspect-square" />
          <SymptomHeatmap className="aspect-square" />

          <NutritionCard className="aspect-square" />
          <FitnessCard className="aspect-square" />
          <SleepCard className="aspect-square" />
        </div>
      ) : (
        <div className="hidden lg:grid grid-cols-3 grid-rows-3 gap-4 p-4 h-[calc(100vh-64px)]">
          <ProfileCard className="row-span-2" />

          <CyclePhaseCard className="aspect-square" />
          <Vibe className="aspect-square" />

          <SymptomHeatmap className="aspect-square" />
          <NutritionCard className="aspect-square" />

          <FitnessCard className="aspect-square" />
          <SleepCard className="aspect-square" />
        </div>
      )}
    </>
  );
}
```

---

# 3. Card Components Must Accept `className`

Each dashboard card should allow layout classes to be passed in.

Example:

```tsx
export function Vibe({ className }: { className?: string }) {
  return (
    <div className={`rounded-xl bg-card p-4 ${className}`}>
      {/* Card content */}
    </div>
  );
}
```

Apply the same pattern to:

* CyclePhaseCard
* SymptomHeatmap
* NutritionCard
* FitnessCard
* SleepCard
* ProfileCard

---

# Result

This implementation ensures:

✔ Tracker cards remain **perfect squares**
✔ Dashboard remains **non-scrollable on desktop**
✔ Layout adapts automatically for **different laptop aspect ratios**
✔ iPads and smaller laptops switch to **3×3 layout**
✔ Profile card remains visually anchored on the left

The dashboard will now **fit cleanly across a wide range of screen sizes without breaking card proportions**.
