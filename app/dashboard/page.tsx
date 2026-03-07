import { ProfileCard } from "@/components/dashboard/ProfileCard";
import { CyclePhaseCard } from "@/components/dashboard/CyclePhaseCard";
import { Vibe } from "@/components/dashboard/Vibe";
import { SymptomHeatmap } from "@/components/dashboard/SymptomHeatmap";
import { NutritionCard } from "@/components/dashboard/NutritionCard";
import { FitnessCard } from "@/components/dashboard/FitnessCard";
import { SleepCard } from "@/components/dashboard/SleepCard";
import { MobileDashboardWrapper } from "@/components/mobile/MobileDashboardWrapper";

export default function DashboardPage() {
  return (
    <>
      {/* ── Mobile view (< lg) ─────────────────────────────────── */}
      <div className="lg:hidden">
        <MobileDashboardWrapper />
      </div>

      {/* ── Desktop view (≥ lg) — 4×2 non-scrollable grid ──────── */}
      <div className="hidden lg:grid grid-cols-4 grid-rows-2 gap-4 p-4 h-[calc(100vh-64px)] overflow-hidden">
        {/* Col 1, rows 1–2 */}
        <ProfileCard />

        {/* Col 2, row 1 */}
        <CyclePhaseCard />

        {/* Col 3, row 1 */}
        <Vibe />

        {/* Col 4, row 1 */}
        <SymptomHeatmap />

        {/* Col 2, row 2 */}
        <NutritionCard />

        {/* Col 3, row 2 */}
        <FitnessCard />

        {/* Col 4, row 2 */}
        <SleepCard />
      </div>
    </>
  );
}
