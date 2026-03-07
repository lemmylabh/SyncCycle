"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Plus } from "lucide-react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      iso: d.toISOString().split("T")[0],
      label: d.toLocaleDateString("en", { weekday: "short" }).charAt(0),
      isToday: i === 6,
    };
  });
}

function freshnessColor(lastDate: string | null): string {
  if (!lastDate) return "bg-white/20";
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (lastDate === today) return "bg-green-400";
  if (lastDate === yesterday) return "bg-amber-400";
  return "bg-white/20";
}

const CustomBar = (props: any) => {
  const { x, y, width, height, day, minutes } = props;
  const h = Math.max(height ?? 0, 0);
  return (
    <g role="img" aria-label={`${day ?? ""}: ${minutes ?? 0} min`}>
      <rect
        x={x} y={h > 0 ? y : y - 2}
        width={width} height={h > 0 ? h : 2}
        fill={h > 0 ? "#a855f7" : "rgba(168,85,247,0.15)"}
        rx={h > 0 ? 3 : 1}
      />
    </g>
  );
};

export function FitnessCard() {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<{ day: string; minutes: number }[]>([]);
  const [lastWorkout, setLastWorkout] = useState<{ type: string; minutes: number; intensity: number } | null>(null);
  const [weekTotal, setWeekTotal] = useState(0);
  const [lastDate, setLastDate] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const days = getLast7Days();
      const { data } = await supabase
        .from("workout_logs")
        .select("log_date,duration_minutes,intensity,workout_types(label)")
        .eq("user_id", user.id)
        .gte("log_date", days[0].iso)
        .lte("log_date", days[6].iso)
        .order("log_date", { ascending: false });

      const dayMinMap: Record<string, number> = {};
      if (data && data.length > 0) {
        for (const log of data) {
          dayMinMap[log.log_date as string] = (dayMinMap[log.log_date as string] ?? 0) + (log.duration_minutes ?? 0);
        }
        setWeekTotal(data.reduce((s, w) => s + (w.duration_minutes ?? 0), 0));
        setLastDate(data[0].log_date as string);
        const last = data[0];
        setLastWorkout({
          type: (last.workout_types as any)?.label ?? "Workout",
          minutes: last.duration_minutes ?? 0,
          intensity: last.intensity ?? 0,
        });
      }
      setChartData(days.map(d => ({ day: d.label, minutes: dayMinMap[d.iso] ?? 0 })));
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-5 animate-pulse space-y-3 h-full">
        <div className="flex justify-between">
          <div className="space-y-2">
            <div className="h-2 w-16 bg-white/10 rounded" />
            <div className="h-4 w-14 bg-white/10 rounded" />
          </div>
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-white/10 mt-1" />
            <div className="w-6 h-6 rounded-full bg-white/10" />
          </div>
        </div>
        <div className="h-28 bg-white/5 rounded-xl" />
        <div className="h-3 w-3/4 bg-white/10 rounded" />
      </div>
    );
  }

  const hasData = weekTotal > 0;

  return (
    <div className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-5 flex flex-col gap-3 h-full overflow-hidden hover:scale-[1.01] transition-transform duration-200">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">This Week</p>
          <h2 className="text-white text-base font-semibold">Fitness</h2>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${freshnessColor(lastDate)}`}
            title={lastDate ? "Last workout: " + lastDate : "No workouts this week"}
          />
          <Link
            href="/dashboard/fitness"
            className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            aria-label="Log workout"
          >
            <Plus size={12} className="text-gray-400" />
          </Link>
        </div>
      </div>

      {/* Chart */}
      <figure aria-label="Workout minutes over last 7 days" className="h-24 flex-shrink-0">
        <figcaption className="sr-only">
          {chartData.map(d => `${d.day}: ${d.minutes} minutes`).join(", ")}
        </figcaption>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="30%" margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6b7280", fontSize: 10 }}
            />
            <YAxis hide />
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-[#0f0f13] border border-white/10 rounded-lg px-2 py-1 text-xs text-white">
                    {payload[0].value} min
                  </div>
                );
              }}
            />
            <Bar dataKey="minutes" shape={<CustomBar />} />
          </BarChart>
        </ResponsiveContainer>
      </figure>

      {/* Footer */}
      {hasData ? (
        <div className="flex-1 flex flex-col justify-end space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-gray-500 text-xs truncate">
              Last: {lastWorkout?.type} · {lastWorkout?.minutes}m
            </p>
            <div className="flex gap-0.5 flex-shrink-0">
              {[1, 2, 3, 4, 5].map(i => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${i <= (lastWorkout?.intensity ?? 0) ? "bg-purple-400" : "bg-white/10"}`}
                />
              ))}
            </div>
          </div>
          <p className="text-gray-400 text-xs">{weekTotal} min this week</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-end">
          <Link
            href="/dashboard/fitness"
            className="block text-center py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium hover:bg-purple-500/20 transition-colors"
          >
            Log Workout →
          </Link>
        </div>
      )}
    </div>
  );
}
