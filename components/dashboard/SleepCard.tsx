"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Moon, ExternalLink } from "lucide-react";

function formatDuration(minutes: number | null): string {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const QUALITY_LABELS = ["", "Poor", "Fair", "Okay", "Good", "Great"];
const QUALITY_COLORS = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"];

export function SleepCard() {
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState<number | null>(null);
  const [quality, setQuality] = useState<number | null>(null);
  const [interruptions, setInterruptions] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("sleep_logs")
        .select("duration_minutes,quality_score,interruptions")
        .eq("user_id", user.id)
        .eq("log_date", today)
        .maybeSingle();

      if (data) {
        setDuration(data.duration_minutes);
        setQuality(data.quality_score);
        setInterruptions(data.interruptions ?? 0);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-5 animate-pulse space-y-3">
        <div className="h-2.5 w-12 bg-white/10 rounded" />
        <div className="h-6 w-20 bg-white/10 rounded" />
        <div className="h-3 w-full bg-white/10 rounded" />
      </div>
    );
  }

  const hasData = duration !== null || quality !== null;
  const qualityColor = quality ? QUALITY_COLORS[quality] : "#6b7280";

  return (
    <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5 flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Moon size={14} className="text-indigo-400" />
          <p className="text-indigo-400 text-xs uppercase tracking-widest">Sleep</p>
        </div>
        <a href="/dashboard/sleep" className="text-gray-600 hover:text-gray-400 transition-colors">
          <ExternalLink size={13} />
        </a>
      </div>

      {hasData ? (
        <>
          <div>
            <p className="text-white text-2xl font-bold">{formatDuration(duration)}</p>
            {quality && (
              <p className="text-xs mt-0.5" style={{ color: qualityColor }}>
                {QUALITY_LABELS[quality]} quality
              </p>
            )}
          </div>

          {/* Quality dots */}
          {quality && (
            <div className="flex gap-1">
              {[1,2,3,4,5].map(i => (
                <div
                  key={i}
                  className="h-1.5 flex-1 rounded-full transition-colors"
                  style={{ background: i <= quality ? qualityColor : "rgba(255,255,255,0.08)" }}
                />
              ))}
            </div>
          )}

          {interruptions !== null && interruptions > 0 && (
            <p className="text-gray-500 text-xs">{interruptions} interruption{interruptions !== 1 ? "s" : ""}</p>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-2 flex-1 justify-center">
          <p className="text-gray-500 text-sm">Nothing logged tonight</p>
          <a href="/dashboard/sleep" className="text-indigo-400 text-xs hover:text-indigo-300 transition-colors">
            Log Sleep →
          </a>
        </div>
      )}
    </div>
  );
}
