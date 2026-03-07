"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Plus } from "lucide-react";
import Link from "next/link";

const RING_MOOD   = { track: "#6d28d9", fill: "#a78bfa", label: "Mood",   text: "text-violet-400" };
const RING_ENERGY = { track: "#0e7490", fill: "#22d3ee", label: "Energy", text: "text-cyan-400"   };
const RING_LIBIDO = { track: "#be185d", fill: "#f472b6", label: "Libido", text: "text-pink-400"   };

type Ring = typeof RING_MOOD;

function freshnessColor(lastDate: string | null): string {
  if (!lastDate) return "bg-white/20";
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (lastDate === today) return "bg-green-400";
  if (lastDate === yesterday) return "bg-amber-400";
  return "bg-white/20";
}

function ScoreRing({ score, ring }: { score: number | null; ring: Ring }) {
  const size = 40; const stroke = 4;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const filled = score ? (score / 5) * circ : 0;
  const cx = size / 2;
  return (
    <svg width={size} height={size} className="-rotate-90" style={{ display: "block" }}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={ring.track} strokeWidth={stroke} opacity={0.25} />
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={ring.fill} strokeWidth={stroke}
        strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.5s ease" }} />
    </svg>
  );
}

export function Vibe() {
  const [loading, setLoading] = useState(true);
  const [avgs, setAvgs] = useState<{ mood: number | null; energy: number | null; libido: number | null }>({ mood: null, energy: null, libido: null });
  const [lastDate, setLastDate] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const today = new Date().toISOString().split("T")[0];
      const week = new Date(Date.now() - 6 * 86400000).toISOString().split("T")[0];

      const { data } = await supabase
        .from("mood_logs")
        .select("log_date,mood_score,energy_score,libido_score")
        .eq("user_id", user.id)
        .gte("log_date", week)
        .lte("log_date", today)
        .order("log_date", { ascending: false });

      if (data && data.length > 0) {
        setLastDate(data[0].log_date as string);
        const avg = (key: "mood_score" | "energy_score" | "libido_score") => {
          const vals = data.map(d => d[key]).filter((v): v is number => v !== null);
          return vals.length ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)) : null;
        };
        setAvgs({ mood: avg("mood_score"), energy: avg("energy_score"), libido: avg("libido_score") });
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-5 animate-pulse space-y-4 h-full overflow-hidden">
        <div className="flex justify-between">
          <div className="space-y-2">
            <div className="h-2 w-16 bg-white/10 rounded" />
            <div className="h-4 w-24 bg-white/10 rounded" />
          </div>
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-white/10 mt-1" />
            <div className="w-6 h-6 rounded-full bg-white/10" />
          </div>
        </div>
        {[0, 1, 2].map(i => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-2.5 w-12 bg-white/10 rounded" />
              <div className="h-1.5 w-full bg-white/10 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const hasAny = avgs.mood !== null || avgs.energy !== null || avgs.libido !== null;

  const rows = [
    { ring: RING_MOOD,   score: avgs.mood,   avg: avgs.mood },
    { ring: RING_ENERGY, score: avgs.energy, avg: avgs.energy },
    { ring: RING_LIBIDO, score: avgs.libido, avg: avgs.libido },
  ];

  return (
    <div className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-5 flex flex-col gap-3 h-full overflow-hidden hover:scale-[1.01] transition-transform duration-200">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Last 7 Days</p>
          <h2 className="text-white text-base font-semibold">Vibe Check</h2>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${freshnessColor(lastDate)}`}
            title={lastDate === today ? "Logged today" : lastDate ? "Not logged today" : "Never logged"}
          />
          <Link
            href="/dashboard/vibe-check"
            className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            aria-label="Log vibe check"
          >
            <Plus size={12} className="text-gray-400" />
          </Link>
        </div>
      </div>

      {/* Averages */}
      {hasAny ? (
        <div className="flex-1 flex flex-col justify-center space-y-3">
          {rows.map(({ ring, score, avg }) => (
            <div key={ring.label} className="flex items-center gap-3">
              <div className="relative w-10 h-10 flex-shrink-0">
                <ScoreRing score={score} ring={ring} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">{avg ?? "–"}</span>
                </div>
              </div>
              <div className="flex-1">
                <p className={`text-xs font-semibold ${ring.text}`}>{ring.label}</p>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-1 flex-1 rounded-full"
                      style={{ background: avg && i <= Math.round(avg) ? ring.fill : "#ffffff15" }} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-center gap-2">
          <p className="text-gray-500 text-xs text-center">No data this week</p>
          <Link
            href="/dashboard/vibe-check"
            className="block text-center py-2.5 rounded-xl bg-gradient-to-r from-violet-500/20 to-pink-500/20 border border-violet-500/20 text-violet-400 text-xs font-medium hover:from-violet-500/30 hover:to-pink-500/30 transition-all"
          >
            Log Today →
          </Link>
        </div>
      )}
    </div>
  );
}
