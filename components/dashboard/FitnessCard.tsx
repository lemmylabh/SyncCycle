"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Dumbbell, ExternalLink } from "lucide-react";

export function FitnessCard() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [avgIntensity, setAvgIntensity] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const today = new Date();
      const todayIso = today.toISOString().split("T")[0];
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 6);
      const weekAgoIso = weekAgo.toISOString().split("T")[0];

      const { data } = await supabase
        .from("workout_logs")
        .select("duration_minutes,intensity")
        .eq("user_id", user.id)
        .gte("log_date", weekAgoIso)
        .lte("log_date", todayIso);

      if (data && data.length > 0) {
        setSessions(data.length);
        setTotalMinutes(data.reduce((s, w) => s + (w.duration_minutes ?? 0), 0));
        const avg = data.reduce((s, w) => s + (w.intensity ?? 0), 0) / data.length;
        setAvgIntensity(Math.round(avg * 10) / 10);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-5 animate-pulse space-y-3">
        <div className="h-2.5 w-14 bg-white/10 rounded" />
        <div className="h-6 w-16 bg-white/10 rounded" />
        <div className="h-3 w-full bg-white/10 rounded" />
      </div>
    );
  }

  const hasData = sessions > 0;

  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5 flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dumbbell size={14} className="text-cyan-400" />
          <p className="text-cyan-400 text-xs uppercase tracking-widest">Fitness</p>
        </div>
        <a href="/dashboard/fitness" className="text-gray-600 hover:text-gray-400 transition-colors">
          <ExternalLink size={13} />
        </a>
      </div>

      {hasData ? (
        <>
          <div>
            <p className="text-white text-2xl font-bold">{sessions} <span className="text-base font-normal text-gray-400">sessions</span></p>
            <p className="text-cyan-400 text-xs mt-0.5">this week</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-white/[0.04] px-3 py-2">
              <p className="text-white text-sm font-semibold">{totalMinutes}m</p>
              <p className="text-gray-500 text-[10px]">total time</p>
            </div>
            <div className="rounded-lg bg-white/[0.04] px-3 py-2">
              <p className="text-white text-sm font-semibold">{avgIntensity}/5</p>
              <p className="text-gray-500 text-[10px]">avg intensity</p>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-2 flex-1 justify-center">
          <p className="text-gray-500 text-sm">No workouts this week</p>
          <a href="/dashboard/fitness" className="text-cyan-400 text-xs hover:text-cyan-300 transition-colors">
            Log Workout →
          </a>
        </div>
      )}
    </div>
  );
}
