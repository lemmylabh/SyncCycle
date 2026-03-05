import { CyclePhaseCard } from "@/components/dashboard/CyclePhaseCard";
import { PhaseDonut } from "@/components/dashboard/PhaseDonut";
import { TodaySnapshot } from "@/components/dashboard/TodaySnapshot";
import { SymptomHeatmap } from "@/components/dashboard/SymptomHeatmap";
import { MoodEnergy } from "@/components/dashboard/MoodEnergy";
import { CycleCalendar } from "@/components/dashboard/CycleCalendar";
import { QuickInsights } from "@/components/dashboard/QuickInsights";
import { AnimatedCard } from "@/components/dashboard/AnimatedCard";
import { SleepCard } from "@/components/dashboard/SleepCard";
import { FitnessCard } from "@/components/dashboard/FitnessCard";
import { NutritionCard } from "@/components/dashboard/NutritionCard";
import { JournalCard } from "@/components/dashboard/JournalCard";
import { MobileDashboardWrapper } from "@/components/mobile/MobileDashboardWrapper";

export default function DashboardPage() {
  return (
    <>
      {/* ── Mobile view (< lg) ─────────────────────────────────── */}
      <div className="lg:hidden">
        <MobileDashboardWrapper />
      </div>

      {/* ── Desktop view (≥ lg) — unchanged ────────────────────── */}
      <div className="hidden lg:block p-6 space-y-4">
        {/* Row 1: 3 equal cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatedCard delay={0}>
            <CyclePhaseCard />
          </AnimatedCard>
          <AnimatedCard delay={0.05}>
            <PhaseDonut />
          </AnimatedCard>
          <AnimatedCard delay={0.1}>
            <TodaySnapshot />
          </AnimatedCard>
        </div>

        {/* Row 2: 2/3 + 1/3 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <AnimatedCard delay={0.15} className="lg:col-span-2">
            <SymptomHeatmap />
          </AnimatedCard>
          <AnimatedCard delay={0.2}>
            <MoodEnergy />
          </AnimatedCard>
        </div>

        {/* Row 3: 2/3 + 1/3 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <AnimatedCard delay={0.25} className="lg:col-span-2">
            <CycleCalendar />
          </AnimatedCard>
          <AnimatedCard delay={0.3}>
            <QuickInsights />
          </AnimatedCard>
        </div>

        {/* Row 4: Tracker summaries — Sleep, Fitness, Nutrition, Journal */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <AnimatedCard delay={0.35}>
            <SleepCard />
          </AnimatedCard>
          <AnimatedCard delay={0.4}>
            <FitnessCard />
          </AnimatedCard>
          <AnimatedCard delay={0.45}>
            <NutritionCard />
          </AnimatedCard>
          <AnimatedCard delay={0.5}>
            <JournalCard />
          </AnimatedCard>
        </div>
      </div>
    </>
  );
}
