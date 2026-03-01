"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { cycleDay } from "@/lib/cycleUtils";

interface Stat {
  label: string;
  value: string | number;
  unit: string;
  color: string;
}

export function TodaySnapshot() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stat[]>([]);

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

      const avgCycleLen = profile?.average_cycle_length ?? cycle?.cycle_length ?? 28;
      let day = 1;
      let daysUntil: number | string = "—";

      if (cycle) {
        day = cycleDay(cycle.start_date);
        daysUntil = Math.max(0, avgCycleLen - day);
      }

      setStats([
        { label: "Cycle Day",         value: cycle ? day : "—",       unit: "",  color: "#f43f5e" },
        { label: "Days Until Period",  value: daysUntil,                unit: "",  color: "#a855f7" },
        { label: "Avg Cycle Length",   value: avgCycleLen,              unit: "d", color: "#f472b6" },
      ]);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-6 animate-pulse space-y-2">
        <div className="h-2.5 w-12 bg-white/10 rounded mb-4" />
        <div className="h-5 w-24 bg-white/10 rounded mb-4" />
        {[0,1,2].map(i => (
          <div key={i} className="flex justify-between py-3.5 border-b border-white/5">
            <div className="h-4 w-32 bg-white/10 rounded" />
            <div className="h-7 w-12 bg-white/10 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-6 flex flex-col gap-2">
      <div className="mb-2">
        <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Today</p>
        <h2 className="text-white text-lg font-semibold">Snapshot</h2>
      </div>

      <div className="flex flex-col divide-y divide-white/5">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center justify-between py-3.5">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
              <span className="text-gray-400 text-sm">{s.label}</span>
            </div>
            <span className="text-white text-2xl font-bold">
              {s.value}
              {s.unit && <span className="text-base font-normal text-gray-400 ml-0.5">{s.unit}</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
