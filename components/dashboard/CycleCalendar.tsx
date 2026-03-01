"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { cycleDay as computeCycleDay } from "@/lib/cycleUtils";

function getPhaseForDay(day: number): string {
  if (day < 1)  return "future";
  if (day <= 5)  return "menstrual";
  if (day <= 13) return "follicular";
  if (day <= 16) return "ovulatory";
  if (day <= 35) return "luteal";
  return "future";
}

const phaseColors: Record<string, string> = {
  menstrual:  "bg-rose-500",
  follicular: "bg-purple-500",
  ovulatory:  "bg-pink-400",
  luteal:     "bg-violet-500",
  future:     "bg-white/10",
};

const phaseTextColors: Record<string, string> = {
  menstrual:  "text-rose-300",
  follicular: "text-purple-300",
  ovulatory:  "text-pink-300",
  luteal:     "text-violet-300",
  future:     "text-gray-600",
};

const phaseLegend = [
  { label: "Menstrual",  color: "bg-rose-500" },
  { label: "Follicular", color: "bg-purple-500" },
  { label: "Ovulatory",  color: "bg-pink-400" },
  { label: "Luteal",     color: "bg-violet-500" },
];

function getWeekDays(cycleStartDate: string | null) {
  const today = new Date();
  const monday = new Date(today);
  const dow = today.getDay();
  monday.setDate(today.getDate() + (dow === 0 ? -6 : 1 - dow));

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = d.toISOString().split("T")[0];
    const offset = Math.round((d.getTime() - today.getTime()) / 86400000);
    let day = 0;
    if (cycleStartDate) {
      const startOffset = computeCycleDay(cycleStartDate) - 1;
      day = startOffset + offset + 1;
    }
    return {
      weekday: d.toLocaleDateString("en", { weekday: "short" }),
      date: d.getDate(),
      iso,
      cycleDay: day,
      phase: cycleStartDate ? getPhaseForDay(day) : "future",
      isToday: offset === 0,
      idx: i,
    };
  });
}

export function CycleCalendar() {
  const [loading, setLoading] = useState(true);
  const [cycleStartDate, setCycleStartDate] = useState<string | null>(null);
  const [symptomDates, setSymptomDates] = useState<Set<string>>(new Set());
  const [periodDates, setPeriodDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const today = new Date();
      const todayIso = today.toISOString().split("T")[0];

      // Get monday of current week
      const monday = new Date(today);
      const dow = today.getDay();
      monday.setDate(today.getDate() + (dow === 0 ? -6 : 1 - dow));
      const mondayIso = monday.toISOString().split("T")[0];

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const sundayIso = sunday.toISOString().split("T")[0];

      const [{ data: cycle }, { data: symLogs }, { data: perLogs }] = await Promise.all([
        supabase.from("cycles").select("start_date")
          .eq("user_id", user.id).lte("start_date", todayIso)
          .order("start_date", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("symptom_logs").select("log_date")
          .eq("user_id", user.id).gte("log_date", mondayIso).lte("log_date", sundayIso),
        supabase.from("period_logs").select("log_date")
          .eq("user_id", user.id).gte("log_date", mondayIso).lte("log_date", sundayIso),
      ]);

      if (cycle) setCycleStartDate(cycle.start_date);
      setSymptomDates(new Set((symLogs ?? []).map(l => l.log_date as string)));
      setPeriodDates(new Set((perLogs ?? []).map(l => l.log_date as string)));
      setLoading(false);
    })();
  }, []);

  const now = new Date();
  const monthYear = now.toLocaleDateString("en", { month: "long", year: "numeric" });
  const weekDays = getWeekDays(cycleStartDate);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-6 animate-pulse">
        <div className="flex justify-between mb-5">
          <div className="space-y-2">
            <div className="h-2.5 w-24 bg-white/10 rounded" />
            <div className="h-5 w-36 bg-white/10 rounded" />
          </div>
          <div className="h-4 w-28 bg-white/10 rounded" />
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array(7).fill(0).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className="h-3 w-6 bg-white/10 rounded" />
              <div className="w-9 h-9 rounded-full bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Weekly View</p>
          <h2 className="text-white text-lg font-semibold">Cycle Calendar</h2>
        </div>
        <span className="text-gray-500 text-sm">{monthYear}</span>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((d) => {
          const hasPeriod = periodDates.has(d.iso);
          const hasSymptom = symptomDates.has(d.iso);
          const phaseColor = hasPeriod ? "bg-rose-500" : phaseColors[d.phase];
          return (
            <div key={d.idx} className="flex flex-col items-center gap-1.5">
              <span className={`text-[10px] uppercase font-medium ${d.isToday ? "text-white" : "text-gray-500"}`}>
                {d.weekday}
              </span>
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold
                  ${phaseColor}
                  ${d.isToday ? "ring-2 ring-white ring-offset-2 ring-offset-[#1e1e2a]" : ""}
                  ${d.phase === "future" && !hasPeriod ? phaseTextColors[d.phase] : "text-white"}
                `}
              >
                {d.date}
              </div>
              {hasSymptom ? (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              ) : (
                <span className="w-1.5 h-1.5" />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 mt-5">
        {phaseLegend.map((p) => (
          <div key={p.label} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${p.color}`} />
            <span className="text-gray-400 text-xs">{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
