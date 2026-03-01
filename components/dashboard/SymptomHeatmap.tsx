"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface HeatmapData {
  symptoms: string[];
  grid: number[][];   // symptoms × 7 days, severity 0-5
  days: { label: string; date: number; isToday: boolean }[];
}

function getWeekDates(): { iso: string; label: string; date: number; isToday: boolean }[] {
  const today = new Date();
  const monday = new Date(today);
  const dow = today.getDay();
  monday.setDate(today.getDate() + (dow === 0 ? -6 : 1 - dow));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      iso: d.toISOString().split("T")[0],
      label: d.toLocaleDateString("en", { weekday: "short" }),
      date: d.getDate(),
      isToday: d.toDateString() === today.toDateString(),
    };
  });
}

const severityClasses = [
  "bg-white/5",
  "bg-rose-900/60",
  "bg-rose-700/70",
  "bg-rose-500",
  "bg-rose-400",
  "bg-rose-300",
];

export function SymptomHeatmap() {
  const [loading, setLoading] = useState(true);
  const [heatmap, setHeatmap] = useState<HeatmapData | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const weekDates = getWeekDates();
      const monday = weekDates[0].iso;
      const sunday = weekDates[6].iso;

      const { data: logs } = await supabase
        .from("symptom_logs")
        .select("log_date, severity, symptom_types(label)")
        .eq("user_id", user.id)
        .gte("log_date", monday)
        .lte("log_date", sunday);

      if (!logs || logs.length === 0) {
        setHeatmap({
          symptoms: [],
          grid: [],
          days: weekDates,
        });
        setLoading(false);
        return;
      }

      // Count how many days each symptom appears
      const symptomDayCount: Record<string, number> = {};
      for (const log of logs) {
        const label = (log.symptom_types as unknown as { label: string } | null)?.label ?? "Unknown";
        symptomDayCount[label] = (symptomDayCount[label] ?? 0) + 1;
      }

      // Top 5 symptoms by frequency
      const top5 = Object.entries(symptomDayCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([label]) => label);

      // Build severity grid: symptoms × days
      const dateIndex = Object.fromEntries(weekDates.map((d, i) => [d.iso, i]));
      const grid: number[][] = top5.map(() => Array(7).fill(0));

      for (const log of logs) {
        const label = (log.symptom_types as unknown as { label: string } | null)?.label ?? "Unknown";
        const si = top5.indexOf(label);
        const di = dateIndex[log.log_date as string];
        if (si !== -1 && di !== undefined) {
          grid[si][di] = Math.max(grid[si][di], log.severity ?? 1);
        }
      }

      setHeatmap({ symptoms: top5, grid, days: weekDates });
      setLoading(false);
    })();
  }, []);

  const days = heatmap?.days ?? getWeekDates();

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-6 animate-pulse">
        <div className="h-2.5 w-24 bg-white/10 rounded mb-2" />
        <div className="h-5 w-40 bg-white/10 rounded mb-6" />
        <div className="space-y-3">
          {[0,1,2,3,4].map(i => (
            <div key={i} className="flex gap-2">
              <div className="h-7 w-24 bg-white/10 rounded" />
              {Array(7).fill(0).map((_, j) => (
                <div key={j} className="h-7 w-7 bg-white/10 rounded-md flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-6">
      <div className="mb-4">
        <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Weekly View</p>
        <h2 className="text-white text-lg font-semibold">Symptom Heatmap</h2>
      </div>

      {heatmap && heatmap.symptoms.length === 0 ? (
        <p className="text-gray-500 text-sm py-8 text-center">No symptoms logged this week</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[360px]">
            <thead>
              <tr>
                <th className="w-24 pb-3" />
                {days.map((d) => (
                  <th key={d.label} className="pb-3 text-center w-10">
                    <div className={`flex flex-col items-center gap-0.5 ${d.isToday ? "text-white" : "text-gray-500"}`}>
                      <span className="text-[10px] uppercase font-medium">{d.label}</span>
                      <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${d.isToday ? "bg-rose-500 text-white" : ""}`}>
                        {d.date}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmap?.symptoms.map((symptom, si) => (
                <tr key={symptom}>
                  <td className="py-1.5 pr-3 text-gray-400 text-xs whitespace-nowrap">{symptom}</td>
                  {heatmap.grid[si].map((severity, di) => (
                    <td key={di} className="py-1.5 text-center">
                      <div
                        className={`w-7 h-7 rounded-md mx-auto ${severityClasses[severity] ?? "bg-white/5"} transition-colors`}
                        title={`${symptom}: severity ${severity}/5`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center gap-2 mt-4">
        <span className="text-gray-500 text-xs">None</span>
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className={`w-5 h-5 rounded ${severityClasses[s]}`} />
        ))}
        <span className="text-gray-500 text-xs">Severe</span>
      </div>
    </div>
  );
}
