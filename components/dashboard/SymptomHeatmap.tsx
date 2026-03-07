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

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const todayIdx = days.findIndex(d => d.isToday);
  const hasToday = heatmap?.grid?.some(row => todayIdx >= 0 && row[todayIdx] > 0) ?? false;
  const hasYesterday = todayIdx > 0 && (heatmap?.grid?.some(row => row[todayIdx - 1] > 0) ?? false);
  const freshnessClass = hasToday ? "bg-green-400" : hasYesterday ? "bg-amber-400" : "bg-white/20";

  return (
    <div className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-5 flex flex-col h-full overflow-hidden hover:scale-[1.01] transition-transform duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">This Week</p>
          <h2 className="text-white text-base font-semibold">Symptoms</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${freshnessClass}`} />
          <a
            href="/dashboard/symptoms"
            className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            aria-label="Log symptoms"
          >
            <span className="text-gray-400 text-xs font-bold leading-none">+</span>
          </a>
        </div>
      </div>

      {heatmap && heatmap.symptoms.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <p className="text-gray-400 text-sm font-medium">Feeling good this week ✓</p>
          <p className="text-gray-600 text-xs">No symptoms logged</p>
          <a href="/dashboard/symptoms" className="mt-2 text-rose-400 text-xs hover:text-rose-300 transition-colors">
            Log Symptoms →
          </a>
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <table className="w-full">
            <thead>
              <tr>
                <th className="w-16 pb-1" />
                {days.map((d) => (
                  <th key={d.label} className="pb-1 text-center">
                    <span className={`text-[9px] uppercase font-medium ${d.isToday ? "text-white" : "text-gray-600"}`}>
                      {d.label.charAt(0)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmap?.symptoms.map((symptom, si) => (
                <tr key={symptom}>
                  <td className="py-0.5 pr-2 text-gray-500 text-[10px] whitespace-nowrap truncate max-w-[64px]">
                    {symptom}
                  </td>
                  {heatmap.grid[si].map((severity, di) => (
                    <td key={di} className="py-0.5 text-center">
                      <div
                        className={`w-5 h-5 rounded mx-auto ${severityClasses[severity] ?? "bg-white/5"} transition-colors`}
                        title={severity > 0 ? `${symptom}: ${severity}/5` : undefined}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
