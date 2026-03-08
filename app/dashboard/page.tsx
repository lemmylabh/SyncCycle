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
  const cellSize = useDashboardLayout();

  return (
    <>
      {/* ── Mobile view (< lg) — 6 cards scrollable ─────────────── */}
      <div className="lg:hidden overflow-y-auto h-[calc(100vh-64px)]">
        <div className="p-4 grid grid-cols-1 gap-4" style={{ gridAutoRows: "300px" }}>
          <CyclePhaseCard />
          <Vibe />
          <SymptomHeatmap />
          <NutritionCard />
          <FitnessCard />
          <SleepCard />
        </div>
      </div>

      {/* ── Desktop view (≥ lg) — always 4×2, square cells ──────── */}
      <div className="hidden lg:flex items-center justify-center p-4 h-[calc(100vh-72px)] overflow-hidden">
        <div
          className="grid gap-4"
          style={{
            '--cell': `${cellSize}px`,
            gridTemplateColumns: `repeat(4, ${cellSize}px)`,
            gridTemplateRows: `repeat(2, ${cellSize}px)`,
          } as React.CSSProperties}
        >
          <ProfileCard />
          <CyclePhaseCard />
          <Vibe />
          <SymptomHeatmap />
          <NutritionCard />
          <FitnessCard />
          <SleepCard />
        </div>
      </div>
    </>
  );
}
