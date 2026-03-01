"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Frown, Meh, Smile, SmilePlus } from "lucide-react";

const SIZE = 80;
const STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function scoreIcon(score: number) {
  if (score <= 1) return <Frown size={18} className="text-gray-400" />;
  if (score <= 2) return <Frown size={18} className="text-orange-400" />;
  if (score <= 3) return <Meh size={18} className="text-yellow-400" />;
  if (score <= 4) return <Smile size={18} className="text-green-400" />;
  return <SmilePlus size={18} className="text-emerald-400" />;
}

function Ring({ score, color, label }: { score: number; color: string; label: string }) {
  const pct = score / 5;
  const dashOffset = CIRCUMFERENCE * (1 - pct);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
          <circle cx={SIZE/2} cy={SIZE/2} r={RADIUS} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={STROKE} />
          <circle
            cx={SIZE/2} cy={SIZE/2} r={RADIUS}
            fill="none" stroke={color} strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {scoreIcon(score)}
        </div>
      </div>
      <div className="text-center">
        <p className="text-white text-sm font-semibold">{score}/5</p>
        <p className="text-gray-400 text-xs">{label}</p>
      </div>
    </div>
  );
}

export function MoodEnergy() {
  const [loading, setLoading] = useState(true);
  const [moodScore, setMoodScore] = useState(0);
  const [energyScore, setEnergyScore] = useState(0);
  const [loggedAt, setLoggedAt] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("mood_logs")
        .select("mood_score,energy_score,created_at")
        .eq("user_id", user.id)
        .eq("log_date", today)
        .maybeSingle();

      if (data) {
        setMoodScore(data.mood_score ?? 0);
        setEnergyScore(data.energy_score ?? 0);
        const t = new Date(data.created_at);
        setLoggedAt(t.toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" }));
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-6 animate-pulse space-y-5">
        <div className="space-y-2">
          <div className="h-2.5 w-12 bg-white/10 rounded" />
          <div className="h-5 w-24 bg-white/10 rounded" />
        </div>
        <div className="flex justify-around py-2">
          <div className="w-20 h-20 rounded-full bg-white/10" />
          <div className="w-20 h-20 rounded-full bg-white/10" />
        </div>
        <div className="h-8 bg-white/10 rounded-xl" />
      </div>
    );
  }

  const loggedToday = loggedAt !== null;

  return (
    <div className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-6 flex flex-col gap-5">
      <div>
        <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Today</p>
        <h2 className="text-white text-lg font-semibold">Wellbeing</h2>
      </div>

      {loggedToday ? (
        <>
          <div className="flex justify-around items-center py-2">
            <Ring score={moodScore} color="#f43f5e" label="Mood" />
            <div className="w-px h-16 bg-white/5" />
            <Ring score={energyScore} color="#a855f7" label="Energy" />
          </div>
          <p className="text-gray-500 text-xs text-center">Logged today at {loggedAt}</p>
        </>
      ) : (
        <>
          <div className="flex justify-around items-center py-2 opacity-30 pointer-events-none">
            <Ring score={3} color="#f43f5e" label="Mood" />
            <div className="w-px h-16 bg-white/5" />
            <Ring score={3} color="#a855f7" label="Energy" />
          </div>
          <a href="/dashboard/vibe-check"
            className="block w-full rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity text-center">
            Log Today
          </a>
        </>
      )}
    </div>
  );
}
