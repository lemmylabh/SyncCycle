"use client";

import React from "react";
import { useDashboardLayout } from "@/hooks/useDashboardLayout";
import { useDashboardCardOrder } from "@/hooks/useDashboardCardOrder";
import { ProfileCard } from "@/components/dashboard/ProfileCard";
import { CyclePhaseCard } from "@/components/dashboard/CyclePhaseCard";
import { Vibe } from "@/components/dashboard/Vibe";
import { SymptomHeatmap } from "@/components/dashboard/SymptomHeatmap";
import { NutritionCard } from "@/components/dashboard/NutritionCard";
import { FitnessCard } from "@/components/dashboard/FitnessCard";
import { SleepCard } from "@/components/dashboard/SleepCard";
import { InsightsCard } from "@/components/dashboard/InsightsCard";
import { FionaCard } from "@/components/dashboard/FionaCard";

function renderCard(key: string): React.ReactNode {
  switch (key) {
    case "period":    return <CyclePhaseCard />;
    case "mood":      return <Vibe />;
    case "symptoms":  return <SymptomHeatmap />;
    case "nutrition": return <NutritionCard />;
    case "fitness":   return <FitnessCard />;
    case "sleep":     return <SleepCard />;
    case "insights":  return <InsightsCard />;
    case "fiona":     return <FionaCard />;
    default:          return null;
  }
}

export default function DashboardPage() {
  const cellSize = useDashboardLayout();
  const { cardOrder, profileCardSize, insightsCardSize } = useDashboardCardOrder();

  const VALID_KEYS = new Set(["period", "mood", "symptoms", "nutrition", "fitness", "sleep", "insights", "fiona"]);
  const orderedCards = cardOrder.filter(k => k && VALID_KEYS.has(k));

  return (
    <>
      {/* ── Mobile view (< lg) — scrollable ──────────────────────── */}
      <div className="lg:hidden overflow-y-auto h-[calc(100vh-64px)]">
        <div className="p-4 grid grid-cols-1 gap-4" style={{ gridAutoRows: "300px" }}>
          {orderedCards.map(k => (
            <React.Fragment key={k}>{renderCard(k)}</React.Fragment>
          ))}
        </div>
      </div>

      {/* ── Desktop view (≥ lg) — 4×2 grid ──────────────────────── */}
      <div className="hidden lg:flex items-center justify-center p-4 h-[calc(100vh-72px)] overflow-hidden">
        <div
          className="grid gap-4"
          style={{
            '--cell': `${cellSize}px`,
            gridTemplateColumns: `repeat(4, ${cellSize}px)`,
            gridTemplateRows: `repeat(2, ${cellSize}px)`,
            gridAutoFlow: "row dense",
          } as React.CSSProperties}
        >
          <ProfileCard size={profileCardSize} />
          {orderedCards.map(k => {
            const spanStyle: React.CSSProperties = k === "insights" ? {
              gridColumn: (insightsCardSize === "2x1" || insightsCardSize === "2x2") ? "span 2" : undefined,
              gridRow:    (insightsCardSize === "1x2" || insightsCardSize === "2x2") ? "span 2" : undefined,
            } : {};
            return (
              <div key={k} className="h-full overflow-hidden" style={spanStyle}>
                {k === "insights"
                  ? <InsightsCard maxCards={insightsCardSize === "1x2" || insightsCardSize === "2x2" ? 5 : 2} />
                  : renderCard(k)}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
