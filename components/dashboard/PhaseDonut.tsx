"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { cycleDay, computePhase } from "@/lib/cycleUtils";

const SIZE = 140;
const STROKE = 22;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 3;

interface PhaseSegment {
  label: string;
  days: number;
  color: string;
  pct: number;
}

function buildSegments(cycleLen: number, periodLen: number): PhaseSegment[] {
  const menstrual  = periodLen;
  const follicular = Math.max(1, 13 - periodLen);
  const ovulatory  = 3;
  const luteal     = Math.max(1, cycleLen - menstrual - follicular - ovulatory);
  return [
    { label: "Menstrual",  days: menstrual,  color: "#f43f5e", pct: (menstrual  / cycleLen) * 100 },
    { label: "Follicular", days: follicular, color: "#a855f7", pct: (follicular / cycleLen) * 100 },
    { label: "Ovulatory",  days: ovulatory,  color: "#f472b6", pct: (ovulatory  / cycleLen) * 100 },
    { label: "Luteal",     days: luteal,     color: "#8b5cf6", pct: (luteal     / cycleLen) * 100 },
  ];
}

function buildSvgSegments(phases: PhaseSegment[]) {
  let cumulativePct = 0;
  return phases.map((phase) => {
    const dashLen = (CIRCUMFERENCE * phase.pct) / 100 - GAP;
    const dashGap = CIRCUMFERENCE - dashLen;
    const rotation = -90 + (cumulativePct / 100) * 360;
    cumulativePct += phase.pct;
    return { ...phase, dashLen, dashGap, rotation };
  });
}

export function PhaseDonut() {
  const [loading, setLoading] = useState(true);
  const [phases, setPhases] = useState<PhaseSegment[]>(buildSegments(28, 5));
  const [cycleNumber, setCycleNumber] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const today = new Date().toISOString().split("T")[0];
      const [{ data: cycle }, { data: profile }] = await Promise.all([
        supabase.from("cycles").select("start_date,cycle_length,cycle_number")
          .eq("user_id", user.id).lte("start_date", today)
          .order("start_date", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("user_profiles")
          .select("average_cycle_length,average_period_length")
          .eq("id", user.id).maybeSingle(),
      ]);

      if (cycle) {
        const cl = profile?.average_cycle_length ?? cycle.cycle_length ?? 28;
        const pl = profile?.average_period_length ?? 5;
        setPhases(buildSegments(cl, pl));
        setCycleNumber(cycle.cycle_number ?? null);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-6 animate-pulse space-y-5">
        <div className="space-y-2">
          <div className="h-2.5 w-24 bg-white/10 rounded" />
          <div className="h-5 w-28 bg-white/10 rounded" />
        </div>
        <div className="flex justify-center">
          <div className="w-[140px] h-[140px] rounded-full bg-white/5" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[0,1,2,3].map(i => <div key={i} className="h-4 bg-white/10 rounded" />)}
        </div>
      </div>
    );
  }

  const segments = buildSvgSegments(phases);

  return (
    <div className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-6 flex flex-col gap-5">
      <div>
        <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Phase Overview</p>
        <h2 className="text-white text-lg font-semibold">This Cycle</h2>
      </div>

      <div className="flex justify-center">
        <div className="relative" style={{ width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            <circle cx={SIZE/2} cy={SIZE/2} r={RADIUS} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={STROKE} />
            {segments.map((seg) => (
              <circle
                key={seg.label}
                cx={SIZE/2} cy={SIZE/2} r={RADIUS}
                fill="none" stroke={seg.color} strokeWidth={STROKE}
                strokeLinecap="butt"
                strokeDasharray={`${seg.dashLen} ${seg.dashGap}`}
                transform={`rotate(${seg.rotation} ${SIZE/2} ${SIZE/2})`}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-white text-lg font-bold">Cycle</span>
            <span className="text-gray-400 text-xs">{cycleNumber !== null ? `#${cycleNumber}` : "—"}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {phases.map((p) => (
          <div key={p.label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
            <span className="text-gray-400 text-xs">{p.label}</span>
            <span className="text-white text-xs font-medium ml-auto">{p.days}d</span>
          </div>
        ))}
      </div>
    </div>
  );
}
