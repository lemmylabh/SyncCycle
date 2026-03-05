"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Phase, computePhase, PHASE_CONFIG } from "@/lib/cycleUtils";

interface PhaseAvg {
  phase: Phase;
  mood: number;
  energy: number;
  count: number;
}

interface InsightsData {
  moodOverall: number;
  moodByPhase: PhaseAvg[];
  energyByPhase: PhaseAvg[];
  sleepHours: number;
  sleepQuality: number;
  cycleLengths: number[];
  dataPoints: number;
}

function localDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function DotRating({ value, max = 5, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full"
          style={{ background: i < Math.round(value) ? color : "#ffffff15" }}
        />
      ))}
    </div>
  );
}

function InsightCard({
  title,
  children,
  delay,
}: {
  title: string;
  children: React.ReactNode;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="bg-[#1e1e2a] rounded-2xl p-4 border border-white/5"
    >
      <p className="text-gray-400 text-[11px] uppercase tracking-widest mb-3">{title}</p>
      {children}
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-[#1e1e2a] rounded-2xl p-4 border border-white/5 space-y-3 animate-pulse">
      <div className="h-3 w-24 bg-white/5 rounded" />
      <div className="h-5 w-40 bg-white/5 rounded" />
      <div className="h-4 w-32 bg-white/5 rounded" />
    </div>
  );
}

export default function InsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo] = useState(
    () => typeof window !== "undefined" && sessionStorage.getItem("demo") === "true"
  );

  useEffect(() => {
    if (isDemo) {
      // Demo data
      setData({
        moodOverall: 3.4,
        moodByPhase: [
          { phase: "follicular", mood: 4.1, energy: 4.2, count: 8 },
          { phase: "ovulatory", mood: 4.3, energy: 4.5, count: 4 },
          { phase: "luteal", mood: 2.9, energy: 2.8, count: 10 },
          { phase: "menstrual", mood: 2.5, energy: 2.3, count: 5 },
        ],
        energyByPhase: [],
        sleepHours: 6.9,
        sleepQuality: 3.2,
        cycleLengths: [28, 27, 29],
        dataPoints: 27,
      });
      setLoading(false);
      return;
    }

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      const userId = session.user.id;
      const today = localDateStr(new Date());
      const thirtyDaysAgo = localDateStr(addDays(new Date(), -30));

      const [moodRes, sleepRes, cyclesRes, profileRes] = await Promise.all([
        supabase
          .from("mood_logs")
          .select("log_date, mood_score, energy_score")
          .eq("user_id", userId)
          .gte("log_date", thirtyDaysAgo)
          .lte("log_date", today)
          .order("log_date", { ascending: true }),
        supabase
          .from("sleep_logs")
          .select("log_date, duration_minutes, quality_score")
          .eq("user_id", userId)
          .gte("log_date", thirtyDaysAgo)
          .lte("log_date", today),
        supabase
          .from("cycles")
          .select("start_date, cycle_length")
          .eq("user_id", userId)
          .order("start_date", { ascending: false })
          .limit(4),
        supabase
          .from("user_profiles")
          .select("average_cycle_length, average_period_length")
          .eq("id", userId)
          .maybeSingle(),
      ]);

      const avgCycleLen = profileRes.data?.average_cycle_length ?? 28;
      const avgPeriodLen = profileRes.data?.average_period_length ?? 5;

      // Get the most recent cycle start to compute phase per date
      const latestCycle = cyclesRes.data?.[0];
      const latestStart = latestCycle?.start_date ?? null;

      // Compute phase for a given date
      function phaseForDate(dateStr: string): Phase {
        if (!latestStart) return "follicular";
        const start = new Date(latestStart + "T00:00:00");
        const d = new Date(dateStr + "T00:00:00");
        const day = Math.max(1, Math.floor((d.getTime() - start.getTime()) / 86400000) + 1);
        const wrapped = ((day - 1 + avgCycleLen * 10) % avgCycleLen) + 1;
        return computePhase(wrapped, avgPeriodLen, avgCycleLen);
      }

      // Mood + energy per phase
      const phaseMap: Record<Phase, { mood: number[]; energy: number[] }> = {
        menstrual: { mood: [], energy: [] },
        follicular: { mood: [], energy: [] },
        ovulatory: { mood: [], energy: [] },
        luteal: { mood: [], energy: [] },
      };

      let moodSum = 0;
      const moodLogs = moodRes.data ?? [];
      moodLogs.forEach((m: Record<string, unknown>) => {
        const phase = phaseForDate(m.log_date as string);
        phaseMap[phase].mood.push(m.mood_score as number);
        phaseMap[phase].energy.push(m.energy_score as number);
        moodSum += m.mood_score as number;
      });

      const moodOverall = moodLogs.length > 0 ? moodSum / moodLogs.length : 0;

      const moodByPhase: PhaseAvg[] = (Object.keys(phaseMap) as Phase[])
        .filter((p) => phaseMap[p].mood.length > 0)
        .map((p) => ({
          phase: p,
          mood: phaseMap[p].mood.reduce((a, b) => a + b, 0) / phaseMap[p].mood.length,
          energy: phaseMap[p].energy.length > 0
            ? phaseMap[p].energy.reduce((a, b) => a + b, 0) / phaseMap[p].energy.length
            : 0,
          count: phaseMap[p].mood.length,
        }))
        .sort((a, b) => b.mood - a.mood);

      // Sleep
      const sleepLogs = sleepRes.data ?? [];
      const validSleep = sleepLogs.filter((s: Record<string, unknown>) => s.duration_minutes != null);
      const sleepHours = validSleep.length > 0
        ? validSleep.reduce((sum: number, s: Record<string, unknown>) => sum + (s.duration_minutes as number), 0) / validSleep.length / 60
        : 0;
      const sleepQuality = sleepLogs.length > 0
        ? sleepLogs.reduce((sum: number, s: Record<string, unknown>) => sum + (s.quality_score as number), 0) / sleepLogs.length
        : 0;

      // Cycle lengths
      const cycleLengths = (cyclesRes.data ?? [])
        .map((c: Record<string, unknown>) => c.cycle_length as number)
        .filter(Boolean)
        .slice(0, 3);

      setData({
        moodOverall,
        moodByPhase,
        energyByPhase: moodByPhase,
        sleepHours,
        sleepQuality,
        cycleLengths,
        dataPoints: moodLogs.length,
      });
      setLoading(false);
    })();
  }, [isDemo]);

  const hasData = !loading && data && data.dataPoints > 0;

  return (
    <div className="p-5 pb-24 space-y-4 max-w-lg mx-auto">
      <motion.h1
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-white font-bold text-xl mb-2"
      >
        Insights
      </motion.h1>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : !hasData ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-[#1e1e2a] rounded-2xl p-6 border border-white/5 text-center"
        >
          <p className="text-2xl mb-3">📊</p>
          <p className="text-white font-semibold mb-1">Not enough data yet</p>
          <p className="text-gray-400 text-sm">Log mood, sleep, and symptoms for at least a week to see your patterns.</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {/* Mood Trends */}
          <InsightCard title="Mood Trends" delay={0.05}>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-white text-2xl font-bold">{data!.moodOverall.toFixed(1)}</span>
              <span className="text-gray-500 text-sm">/ 5 avg over 30 days</span>
            </div>
            {data!.moodByPhase.slice(0, 4).map((p) => (
              <div key={p.phase} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: PHASE_CONFIG[p.phase].ring }}
                  />
                  <span className="text-gray-300 text-sm">{PHASE_CONFIG[p.phase].label.replace(" Phase", "")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DotRating value={p.mood} color={PHASE_CONFIG[p.phase].ring} />
                  <span className="text-gray-500 text-xs w-6 text-right">{p.mood.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </InsightCard>

          {/* Energy Patterns */}
          <InsightCard title="Energy Patterns" delay={0.1}>
            {data!.moodByPhase.length > 0 ? (
              <>
                {(() => {
                  const sorted = [...data!.moodByPhase].sort((a, b) => b.energy - a.energy);
                  const peak = sorted[0];
                  const dip = sorted[sorted.length - 1];
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-xs">Peak phase</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium" style={{ color: PHASE_CONFIG[peak.phase].ring }}>
                            {PHASE_CONFIG[peak.phase].label.replace(" Phase", "")}
                          </span>
                          <span className="text-gray-500 text-xs">{peak.energy.toFixed(1)}/5</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-xs">Lowest phase</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium" style={{ color: PHASE_CONFIG[dip.phase].ring }}>
                            {PHASE_CONFIG[dip.phase].label.replace(" Phase", "")}
                          </span>
                          <span className="text-gray-500 text-xs">{dip.energy.toFixed(1)}/5</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </>
            ) : (
              <p className="text-gray-500 text-sm">No energy data logged yet.</p>
            )}
          </InsightCard>

          {/* Sleep Quality */}
          <InsightCard title="Sleep Quality" delay={0.15}>
            {data!.sleepHours > 0 ? (
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-white text-2xl font-bold">{data!.sleepHours.toFixed(1)}h</span>
                  <span className="text-gray-500 text-sm">avg / night</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-xs">Quality</span>
                  <DotRating value={data!.sleepQuality} color="#a855f7" />
                  <span className="text-gray-500 text-xs">{data!.sleepQuality.toFixed(1)}/5</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No sleep data logged yet.</p>
            )}
          </InsightCard>

          {/* Cycle Regularity */}
          <InsightCard title="Cycle Regularity" delay={0.2}>
            {data!.cycleLengths.length >= 2 ? (
              <div className="space-y-2">
                <div className="flex gap-3">
                  {data!.cycleLengths.map((len, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <span className="text-white font-bold text-lg">{len}</span>
                      <span className="text-gray-600 text-[10px]">days</span>
                    </div>
                  ))}
                </div>
                {(() => {
                  const diff = Math.max(...data!.cycleLengths) - Math.min(...data!.cycleLengths);
                  return (
                    <p className="text-gray-400 text-sm">
                      {diff <= 2 ? "Very consistent cycle length" : diff <= 5 ? "Slightly variable cycle" : "Variable cycle — normal range"}
                    </p>
                  );
                })()}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Log at least 2 cycles to see regularity.</p>
            )}
          </InsightCard>
        </div>
      )}
    </div>
  );
}
