"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { cycleDay, computePhase, PHASE_CONFIG, type Phase } from "@/lib/cycleUtils";
import Link from "next/link";
import { Plus } from "lucide-react";

const SIZE = 110;
const STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CyclePhaseCard() {
  const [loading, setLoading] = useState(true);
  const [day, setDay] = useState(1);
  const [cycleLen, setCycleLen] = useState(28);
  const [phase, setPhase] = useState<Phase>("follicular");
  const [daysLeft, setDaysLeft] = useState(14);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const today = new Date().toISOString().split("T")[0];
      const [{ data: cycle }, { data: profile }] = await Promise.all([
        supabase.from("cycles").select("start_date,cycle_length")
          .eq("user_id", user.id).lte("start_date", today)
          .order("start_date", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("user_profiles")
          .select("average_cycle_length,average_period_length")
          .eq("id", user.id).maybeSingle(),
      ]);

      if (cycle) {
        const d = cycleDay(cycle.start_date);
        const cl = profile?.average_cycle_length ?? cycle.cycle_length ?? 28;
        const pl = profile?.average_period_length ?? 5;
        const ph = computePhase(d, pl, cl);
        setDay(d);
        setCycleLen(cl);
        setPhase(ph);
        setDaysLeft(Math.max(0, cl - d));
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-4 animate-pulse space-y-3 h-full overflow-hidden">
        <div className="space-y-2">
          <div className="h-2.5 w-20 bg-white/10 rounded" />
          <div className="h-5 w-36 bg-white/10 rounded" />
          <div className="h-3 w-48 bg-white/10 rounded" />
        </div>
        <div className="flex justify-center">
          <div className="w-[110px] h-[110px] rounded-full bg-white/5" />
        </div>
        <div className="flex gap-2">
          <div className="h-6 w-24 bg-white/10 rounded-full" />
          <div className="h-6 w-32 bg-white/10 rounded-full" />
        </div>
      </div>
    );
  }

  const cfg = PHASE_CONFIG[phase];
  const progress = Math.min(day / cycleLen, 1);
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  const hasCycle = day > 0;

  return (
    <div className={`rounded-2xl border border-white/5 p-4 bg-gradient-to-br ${cfg.gradient} bg-[#1e1e2a] flex flex-col gap-3 h-full overflow-hidden hover:scale-[1.01] transition-transform duration-200`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Current Phase</p>
          <h2 className="text-white text-lg font-semibold">{cfg.label}</h2>
          <p className="text-gray-400 text-sm mt-0.5">{cfg.tagline}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${hasCycle ? "bg-green-400" : "bg-white/20"}`} />
          <Link
            href="/dashboard/period"
            className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            aria-label="Go to period tracker"
          >
            <Plus size={12} className="text-white/70" />
          </Link>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="relative" style={{ width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
            <circle cx={SIZE/2} cy={SIZE/2} r={RADIUS} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={STROKE} />
            <circle
              cx={SIZE/2} cy={SIZE/2} r={RADIUS}
              fill="none" stroke={cfg.ring} strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-white text-xl font-bold">{day}</span>
            <span className="text-gray-400 text-xs">of {cycleLen}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <span className="px-3 py-1 rounded-full bg-white/5 text-gray-300 text-xs">
          {cycleLen}-day cycle
        </span>
        <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs">
          {daysLeft} days to next period
        </span>
      </div>
    </div>
  );
}
