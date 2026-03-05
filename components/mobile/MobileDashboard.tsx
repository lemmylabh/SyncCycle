"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Phase, PHASE_CONFIG } from "@/lib/cycleUtils";

interface MobileDashboardProps {
  userId: string | null;
  isDemo: boolean;
  currentPhase: Phase | null;
  cycleDay: number | null;
  cycleLength: number;
  periodLength: number;
}

const PHASE_RECS: Record<Phase, string[]> = {
  menstrual: [
    "Rest and prioritize warmth today",
    "Iron-rich foods like spinach & lentils help",
    "Gentle yoga or a slow walk is perfect",
  ],
  follicular: [
    "Great day to start something new",
    "Your body loves high-intensity training now",
    "Social plans and creative work thrive",
  ],
  ovulatory: [
    "Your peak energy window — go for it",
    "Best time for important conversations",
    "Try something you've been putting off",
  ],
  luteal: [
    "Wind down and reduce commitments",
    "Complex carbs & magnesium support your mood",
    "Yoga, swimming, or light strength work",
  ],
};

const PHASE_ICONS: Record<Phase, string> = {
  menstrual: "🌑",
  follicular: "🌒",
  ovulatory: "🌕",
  luteal: "🌖",
};

interface TodaySummary {
  moodScore: number | null;
  energyScore: number | null;
  sleepHours: number | null;
  sleepQuality: number | null;
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

export function MobileDashboard({
  userId,
  isDemo,
  currentPhase,
  cycleDay,
  cycleLength,
  periodLength,
}: MobileDashboardProps) {
  const [summary, setSummary] = useState<TodaySummary | null>(null);
  const [loading, setLoading] = useState(true);

  const phase = currentPhase ?? "follicular";
  const phaseInfo = PHASE_CONFIG[phase];

  useEffect(() => {
    if (isDemo) {
      setSummary({ moodScore: 3, energyScore: 4, sleepHours: 7.5, sleepQuality: 4 });
      setLoading(false);
      return;
    }

    if (!userId) {
      setLoading(false);
      return;
    }

    (async () => {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

      const [moodRes, sleepRes] = await Promise.all([
        supabase
          .from("mood_logs")
          .select("mood_score, energy_score")
          .eq("user_id", userId)
          .eq("log_date", todayStr)
          .maybeSingle(),
        supabase
          .from("sleep_logs")
          .select("duration_minutes, quality_score")
          .eq("user_id", userId)
          .eq("log_date", todayStr)
          .maybeSingle(),
      ]);

      setSummary({
        moodScore: moodRes.data?.mood_score ?? null,
        energyScore: moodRes.data?.energy_score ?? null,
        sleepHours: sleepRes.data?.duration_minutes ? sleepRes.data.duration_minutes / 60 : null,
        sleepQuality: sleepRes.data?.quality_score ?? null,
      });
      setLoading(false);
    })();
  }, [userId, isDemo]);

  return (
    <div className="p-4 pb-24 space-y-4">
      {/* Phase Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-2xl p-4"
        style={{
          background: `linear-gradient(135deg, ${phaseInfo.ring}25, ${phaseInfo.ring}08)`,
          border: `1px solid ${phaseInfo.ring}30`,
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-bold text-lg">
              {PHASE_ICONS[phase]} {phaseInfo.label}
            </p>
            <p className="text-sm mt-0.5" style={{ color: phaseInfo.ring }}>
              {phaseInfo.tagline}
            </p>
          </div>
          {cycleDay && (
            <div className="text-right">
              <p className="text-white font-bold text-3xl leading-none">{cycleDay}</p>
              <p className="text-gray-500 text-xs mt-0.5">of {cycleLength}</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Today's Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.06 }}
        className="bg-[#1e1e2a] rounded-2xl p-4 border border-white/5"
      >
        <p className="text-gray-400 text-[11px] uppercase tracking-widest mb-3">Today&apos;s Summary</p>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-4 bg-white/5 rounded w-32" />
            <div className="h-4 bg-white/5 rounded w-28" />
          </div>
        ) : (
          <div className="space-y-3">
            {summary?.moodScore != null ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Mood</span>
                  <div className="flex items-center gap-2">
                    <DotRating value={summary.moodScore} color={phaseInfo.ring} />
                    <span className="text-gray-500 text-xs">{summary.moodScore}/5</span>
                  </div>
                </div>
                {summary.energyScore != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Energy</span>
                    <div className="flex items-center gap-2">
                      <DotRating value={summary.energyScore} color="#f59e0b" />
                      <span className="text-gray-500 text-xs">{summary.energyScore}/5</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-600 text-sm">No mood logged today</p>
            )}

            {summary?.sleepHours != null ? (
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Sleep</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-300 text-sm font-medium">
                    {summary.sleepHours.toFixed(1)}h
                  </span>
                  {summary.sleepQuality != null && (
                    <span className="text-gray-500 text-xs">· quality {summary.sleepQuality}/5</span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-600 text-sm">No sleep logged today</p>
            )}
          </div>
        )}
      </motion.div>

      {/* Suggestions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.12 }}
        className="bg-[#1e1e2a] rounded-2xl p-4 border border-white/5"
      >
        <p className="text-gray-400 text-[11px] uppercase tracking-widest mb-3">Today&apos;s Suggestions</p>
        <div className="space-y-2.5">
          {PHASE_RECS[phase].map((rec, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span
                className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: phaseInfo.ring }}
              />
              <span className="text-gray-300 text-sm leading-snug">{rec}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* No cycle prompt */}
      {!cycleDay && !isDemo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-[#1e1e2a] rounded-2xl p-4 border border-rose-500/20 text-center"
        >
          <p className="text-rose-400 text-sm font-medium mb-1">Log your cycle to get personalised insights</p>
          <p className="text-gray-500 text-xs">Go to Period tracker to add your last period start date.</p>
        </motion.div>
      )}
    </div>
  );
}
