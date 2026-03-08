"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { cycleDay, computePhase, PHASE_CONFIG, type Phase } from "@/lib/cycleUtils";
import Link from "next/link";
import { Plus } from "lucide-react";

const SIZE = 76;
const STROKE = 6;
const RADIUS = (SIZE - STROKE) / 2;          // 35
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;  // ≈ 219.91

const TIMELINE_PHASES: { key: Phase; abbr: string; color: string }[] = [
  { key: "menstrual",  abbr: "M", color: "#f43f5e" },
  { key: "follicular", abbr: "F", color: "#a855f7" },
  { key: "ovulatory",  abbr: "O", color: "#f472b6" },
  { key: "luteal",     abbr: "L", color: "#8b5cf6" },
];

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
      <div className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-4 animate-pulse flex flex-col gap-3 h-full overflow-hidden">
        <div className="h-2.5 w-20 bg-white/10 rounded" />
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-2 flex-1">
            <div className="h-5 w-36 bg-white/10 rounded" />
            <div className="h-3 w-28 bg-white/10 rounded" />
          </div>
          <div className="w-[76px] h-[76px] rounded-full bg-white/5 flex-shrink-0" />
        </div>
        <div className="flex gap-1">
          {[0,1,2,3].map(i => <div key={i} className="flex-1 h-6 bg-white/5 rounded-full" />)}
        </div>
        <div className="flex gap-2 mt-auto">
          <div className="h-6 w-14 bg-white/10 rounded-full" />
          <div className="h-6 w-32 bg-white/10 rounded-full" />
        </div>
      </div>
    );
  }

  const cfg = PHASE_CONFIG[phase];
  const hasCycle = day > 0;

  return (
    <div className={`rounded-2xl border border-white/5 p-4 bg-gradient-to-br ${cfg.gradient} bg-[#1e1e2a] flex flex-col gap-3 h-full overflow-hidden hover:scale-[1.01] transition-transform duration-200`}>

      {/* Row 1: label + dot + plus */}
      <div className="flex items-center justify-between">
        <p className="text-gray-400 text-xs uppercase tracking-widest">Current Phase</p>
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

      {/* Row 2: phase name + tagline left | ring right */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-white text-lg font-semibold leading-tight">{cfg.label}</h2>
          <p className="text-gray-400 text-sm mt-0.5 leading-snug">{cfg.tagline}</p>
        </div>
        <div className="relative flex-shrink-0" style={{ width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
            <circle cx={SIZE/2} cy={SIZE/2} r={RADIUS} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={STROKE} />
            <circle
              cx={SIZE/2} cy={SIZE/2} r={RADIUS}
              fill="none" stroke={cfg.ring} strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - Math.min(day / cycleLen, 1))}
              style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-white text-sm font-bold leading-none">{day}</span>
            <span className="text-gray-400 text-[9px] leading-none mt-0.5">of {cycleLen}</span>
          </div>
        </div>
      </div>

      {/* Row 3: 4-phase timeline strip */}
      <div className="flex items-center gap-1">
        {TIMELINE_PHASES.map((tp, i) => {
          const isActive = tp.key === phase;
          return (
            <div key={tp.key} className="flex items-center flex-1 gap-1">
              <div
                className={`flex-1 flex items-center justify-center rounded-full py-1 text-[11px] font-semibold transition-all duration-300 ${
                  isActive ? "font-bold" : "text-white/25 bg-white/5"
                }`}
                style={isActive ? { background: `${tp.color}28`, color: tp.color, border: `1px solid ${tp.color}55` } : undefined}
              >
                {tp.abbr}
              </div>
              {i < TIMELINE_PHASES.length - 1 && (
                <div className="w-2 h-px bg-white/10 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Row 4: bottom pills */}
      <div className="flex gap-2 flex-wrap mt-auto">
        <span className="px-3 py-1 rounded-full bg-white/5 text-gray-300 text-xs">Day {day}</span>
        <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs">{daysLeft} days to next period</span>
      </div>
    </div>
  );
}
