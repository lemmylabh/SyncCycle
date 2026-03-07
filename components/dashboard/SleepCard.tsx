"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Plus } from "lucide-react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, ReferenceLine, Tooltip, ResponsiveContainer } from "recharts";

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

function formatDuration(minutes: number | null): string {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m > 0 ? m + "m" : ""}`.trim() : `${m}m`;
}

function freshnessColor(lastDate: string | null): string {
  if (!lastDate) return "bg-white/20";
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (lastDate === today) return "bg-green-400";
  if (lastDate === yesterday) return "bg-amber-400";
  return "bg-white/20";
}

const QUALITY_LABELS = ["", "Poor", "Fair", "Okay", "Good", "Great"];
const QUALITY_COLORS = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"];

const CustomBar = (props: any) => {
  const { x, y, width, height, day, hours } = props;
  const h = Math.max(height ?? 0, 0);
  return (
    <g role="img" aria-label={`${day ?? ""}: ${hours ?? 0}h sleep`}>
      <rect
        x={x} y={h > 0 ? y : y - 2}
        width={width} height={h > 0 ? h : 2}
        fill={h > 0 ? "#818cf8" : "rgba(129,140,248,0.15)"}
        rx={h > 0 ? 3 : 1}
      />
    </g>
  );
};

export function SleepCard() {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<{ day: string; hours: number }[]>([]);
  const [lastNight, setLastNight] = useState<{ duration: number | null; quality: number | null } | null>(null);
  const [lastDate, setLastDate] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const days = getLast7Days();
      const { data } = await supabase
        .from("sleep_logs")
        .select("log_date,duration_minutes,quality_score")
        .eq("user_id", user.id)
        .gte("log_date", days[0].iso)
        .lte("log_date", days[6].iso)
        .order("log_date", { ascending: false });

      const dayMap: Record<string, { hours: number; quality: number }> = {};
      if (data && data.length > 0) {
        for (const log of data) {
          dayMap[log.log_date as string] = {
            hours: Math.round(((log.duration_minutes ?? 0) / 60) * 10) / 10,
            quality: log.quality_score ?? 0,
          };
        }
        setLastDate(data[0].log_date as string);
        setLastNight({
          duration: data[0].duration_minutes,
          quality: data[0].quality_score,
        });
      }
      setChartData(days.map(d => ({ day: d.label, hours: dayMap[d.iso]?.hours ?? 0 })));
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-5 animate-pulse space-y-3 h-full">
        <div className="flex justify-between">
          <div className="space-y-2">
            <div className="h-2 w-16 bg-white/10 rounded" />
            <div className="h-4 w-12 bg-white/10 rounded" />
          </div>
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-white/10 mt-1" />
            <div className="w-6 h-6 rounded-full bg-white/10" />
          </div>
        </div>
        <div className="h-28 bg-white/5 rounded-xl" />
        <div className="h-3 w-2/3 bg-white/10 rounded" />
      </div>
    );
  }

  const hasData = lastNight !== null;
  const qualityColor = lastNight?.quality ? QUALITY_COLORS[lastNight.quality] : "#6b7280";

  return (
    <div className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-5 flex flex-col gap-3 h-full overflow-hidden hover:scale-[1.01] transition-transform duration-200">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Last 7 Days</p>
          <h2 className="text-white text-base font-semibold">Sleep</h2>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${freshnessColor(lastDate)}`}
            title={lastDate ? "Last logged: " + lastDate : "No sleep logged"}
          />
          <Link
            href="/dashboard/sleep"
            className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            aria-label="Log sleep"
          >
            <Plus size={12} className="text-gray-400" />
          </Link>
        </div>
      </div>

      {/* Chart */}
      <figure aria-label="Sleep hours over last 7 days" className="h-24 flex-shrink-0">
        <figcaption className="sr-only">
          {chartData.map(d => `${d.day}: ${d.hours}h`).join(", ")}
        </figcaption>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="30%" margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6b7280", fontSize: 10 }}
            />
            <YAxis hide domain={[0, 10]} />
            <ReferenceLine
              y={8}
              stroke="rgba(255,255,255,0.12)"
              strokeDasharray="3 3"
              label={{ value: "8h", position: "insideTopRight", fill: "#6b7280", fontSize: 9 }}
            />
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-[#0f0f13] border border-white/10 rounded-lg px-2 py-1 text-xs text-white">
                    {payload[0].value}h
                  </div>
                );
              }}
            />
            <Bar dataKey="hours" shape={<CustomBar />} />
          </BarChart>
        </ResponsiveContainer>
      </figure>

      {/* Footer */}
      {hasData ? (
        <div className="flex-1 flex flex-col justify-end space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-gray-400 text-sm font-medium">{formatDuration(lastNight.duration)}</p>
            {lastNight.quality && (
              <span className="text-xs font-medium" style={{ color: qualityColor }}>
                {QUALITY_LABELS[lastNight.quality]}
              </span>
            )}
          </div>
          {lastNight.quality && (
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(i => (
                <div
                  key={i}
                  className="h-1 flex-1 rounded-full transition-colors"
                  style={{ background: i <= (lastNight.quality ?? 0) ? qualityColor : "rgba(255,255,255,0.08)" }}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-end">
          <Link
            href="/dashboard/sleep"
            className="block text-center py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium hover:bg-indigo-500/20 transition-colors"
          >
            Log Sleep →
          </Link>
        </div>
      )}
    </div>
  );
}
