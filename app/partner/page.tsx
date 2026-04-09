"use client";

import React, { useEffect, useState } from "react";
import { ProfileCard } from "@/components/dashboard/ProfileCard";
import { CyclePhaseCard } from "@/components/dashboard/CyclePhaseCard";
import { Vibe } from "@/components/dashboard/Vibe";
import { SymptomHeatmap } from "@/components/dashboard/SymptomHeatmap";
import { NutritionCard } from "@/components/dashboard/NutritionCard";
import { FitnessCard } from "@/components/dashboard/FitnessCard";
import { SleepCard } from "@/components/dashboard/SleepCard";
import { FionaCard } from "@/components/dashboard/FionaCard";
import { InsightsFeed } from "@/components/insights/InsightsFeed";
import { useDashboardCardOrder } from "@/hooks/useDashboardCardOrder";

const GAP = 16;
const PAD = 32;

function usePartnerCellSize() {
  const [cellSize, setCellSize] = useState(240);

  useEffect(() => {
    function update() {
      const vw = window.innerWidth;
      const h = window.innerHeight - 72; // top bar height
      // 5 columns, 4 gaps, PAD on sides
      const byWidth  = Math.floor((vw - PAD - 4 * GAP) / 5);
      // 2 rows, 1 gap
      const byHeight = Math.floor((h - PAD - GAP) / 2);
      setCellSize(Math.max(Math.min(byWidth, byHeight), 140));
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return cellSize;
}

function renderCard(key: string): React.ReactNode {
  switch (key) {
    case "period":    return <CyclePhaseCard />;
    case "mood":      return <Vibe />;
    case "symptoms":  return <SymptomHeatmap />;
    case "nutrition": return <NutritionCard />;
    case "fitness":   return <FitnessCard />;
    case "sleep":     return <SleepCard />;
    case "fiona":     return <FionaCard />;
    default:          return null;
  }
}

export default function PartnerPage() {
  const cellSize = usePartnerCellSize();
  const { cardOrder, profileCardSize } = useDashboardCardOrder();

  const VALID_KEYS = new Set(["period", "mood", "symptoms", "nutrition", "fitness", "sleep", "fiona"]);
  // Exclude "insights" — InsightsFeed occupies the right panel instead
  const orderedCards = cardOrder.filter(k => k && VALID_KEYS.has(k));

  const leftPanelW = 3 * cellSize + 2 * GAP;
  const rightPanelW = 2 * cellSize + GAP;
  const gridH = 2 * cellSize + GAP;

  return (
    <>
      {/* ── Mobile (< lg) — stacked scrollable ──────────────────────── */}
      <div className="lg:hidden overflow-y-auto h-[calc(100vh-72px)]">
        <div className="p-4 grid grid-cols-1 gap-4" style={{ gridAutoRows: "300px" }}>
          <ProfileCard size={profileCardSize} />
          {orderedCards.map(k => (
            <React.Fragment key={k}>{renderCard(k)}</React.Fragment>
          ))}
        </div>
        <div className="p-4">
          <InsightsFeed />
        </div>
      </div>

      {/* ── Desktop (≥ lg) — 5-col layout ───────────────────────────── */}
      <div className="hidden lg:flex items-center justify-center p-4 h-[calc(100vh-72px)] overflow-hidden">
        <div className="flex gap-4" style={{ height: gridH }}>

          {/* Left: 3×2 card grid */}
          <div
            className="grid gap-4 flex-shrink-0"
            style={{
              width: leftPanelW,
              height: gridH,
              gridTemplateColumns: `repeat(3, ${cellSize}px)`,
              gridTemplateRows: `repeat(2, ${cellSize}px)`,
              gridAutoFlow: "row dense",
            }}
          >
            <ProfileCard size={profileCardSize} />
            {orderedCards.map(k => (
              <div key={k} className="h-full overflow-hidden">
                {renderCard(k)}
              </div>
            ))}
          </div>

          {/* Right: InsightsFeed full height */}
          <div
            className="flex-shrink-0 overflow-hidden rounded-2xl"
            style={{ width: rightPanelW, height: gridH }}
          >
            <InsightsFeed />
          </div>

        </div>
      </div>
    </>
  );
}
