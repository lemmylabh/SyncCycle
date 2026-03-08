"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useDashboardLayout } from "@/hooks/useDashboardLayout";
import {
  type LucideIcon,
  Activity, BatteryLow, Check, ChevronLeft, ChevronRight, Flame, Frown,
  Heart, Laugh, Meh, Moon, Smile, Snowflake,
  Sparkles, Star, TrendingUp, Waves, Wind, Zap,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

type Score = 1 | 2 | 3 | 4 | 5;

interface MoodLog {
  log_date: string;
  mood_score: Score;
  energy_score: Score;
  libido_score: Score | null;
  notes: string | null;
}

interface TrendEntry {
  log_date: string;
  mood_score: Score;
  energy_score: Score;
  libido_score: Score | null;
}

// ── Constants ───────────────────────────────────────────────────────────────

const MOOD_LABELS: Record<Score, string> = {
  1: "Very Low", 2: "Low", 3: "Okay", 4: "Good", 5: "Excellent",
};
const ENERGY_LABELS: Record<Score, string> = {
  1: "Drained", 2: "Tired", 3: "Moderate", 4: "Energised", 5: "Electric",
};
const LIBIDO_LABELS: Record<Score, string> = {
  1: "Very Low", 2: "Low", 3: "Neutral", 4: "High", 5: "Very High",
};

const MOOD_ICONS: Record<Score, LucideIcon> = {
  1: Frown, 2: Frown, 3: Meh, 4: Smile, 5: Laugh,
};
const ENERGY_ICONS: Record<Score, LucideIcon> = {
  1: BatteryLow, 2: Moon, 3: Activity, 4: Zap, 5: Flame,
};
const LIBIDO_ICONS: Record<Score, LucideIcon> = {
  1: Snowflake, 2: Wind, 3: Star, 4: Heart, 5: Sparkles,
};

// Fallback icons for empty state header
const MOOD_DEFAULT   = Meh;
const ENERGY_DEFAULT = Zap;
const LIBIDO_DEFAULT = Star;

// Ring colours
const RING_MOOD    = { track: "#6d28d9", fill: "#a78bfa", label: "Mood",   text: "text-violet-400"  };
const RING_ENERGY  = { track: "#0e7490", fill: "#22d3ee", label: "Energy", text: "text-cyan-400"    };
const RING_LIBIDO  = { track: "#be185d", fill: "#f472b6", label: "Libido", text: "text-pink-400"    };

// Phase insight tags
const PHASE_TAGS: { label: string; Icon: LucideIcon }[] = [
  { label: "Menstrual: rest",   Icon: Waves    },
  { label: "Follicular: rise",  Icon: Zap      },
  { label: "Ovulatory: peak",   Icon: Sparkles },
  { label: "Luteal: reflect",   Icon: Moon     },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function localDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function formatDay(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short",
  });
}

// ── SVG Ring component ───────────────────────────────────────────────────────

function ScoreRing({
  score,
  ring,
  size = 120,
  stroke = 10,
}: {
  score: Score | null;
  ring: typeof RING_MOOD;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const filled = score ? (score / 5) * circ : 0;
  const cx = size / 2;

  return (
    <svg width={size} height={size} className="-rotate-90" style={{ display: "block" }}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={ring.track} strokeWidth={stroke} opacity={0.25} />
      <circle
        cx={cx} cy={cx} r={r}
        fill="none"
        stroke={ring.fill}
        strokeWidth={stroke}
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.5s ease" }}
      />
    </svg>
  );
}

// ── Score selector bubble row ────────────────────────────────────────────────

function ScorePicker({
  value,
  onChange,
  icons,
  labels,
  ring,
}: {
  value: Score | null;
  onChange: (v: Score) => void;
  icons: Record<Score, LucideIcon>;
  labels: Record<Score, string>;
  ring: typeof RING_MOOD;
}) {
  const scores: Score[] = [1, 2, 3, 4, 5];
  return (
    <div className="flex gap-2 flex-wrap">
      {scores.map((s) => {
        const active = value === s;
        const Icon = icons[s];
        return (
          <button
            key={s}
            onClick={() => onChange(s)}
            title={labels[s]}
            className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border transition-all duration-200 ${
              active
                ? "border-white/30 scale-105 shadow-lg"
                : "border-white/5 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/15"
            }`}
            style={active ? { background: `${ring.track}55`, borderColor: ring.fill } : undefined}
          >
            <Icon size={20} />
            <span className={`text-[10px] font-semibold tracking-wide ${active ? "text-white" : "text-gray-500"}`}>
              {s}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Trend Chart (7-day SVG line) ─────────────────────────────────────────────

function TrendChart({ data }: { data: TrendEntry[] }) {
  if (data.length === 0) return null;

  const W = 280;
  const H = 120;
  const PAD = { top: 10, right: 16, bottom: 28, left: 24 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const points = (key: "mood_score" | "energy_score" | "libido_score") =>
    data.map((d, i) => {
      const val = d[key] ?? 0;
      const x = PAD.left + (i / Math.max(data.length - 1, 1)) * chartW;
      const y = PAD.top + chartH - ((val / 5) * chartH);
      return `${x},${y}`;
    }).join(" ");

  const dots = (key: "mood_score" | "energy_score" | "libido_score", color: string) =>
    data.map((d, i) => {
      const val = d[key];
      if (!val) return null;
      const x = PAD.left + (i / Math.max(data.length - 1, 1)) * chartW;
      const y = PAD.top + chartH - ((val / 5) * chartH);
      return <circle key={i} cx={x} cy={y} r={3} fill={color} />;
    });

  const hasLibido = data.some(d => d.libido_score !== null);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {[1, 2, 3, 4, 5].map(v => {
        const y = PAD.top + chartH - ((v / 5) * chartH);
        return (
          <g key={v}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="white" strokeOpacity={0.04} />
            <text x={PAD.left - 4} y={y + 4} fontSize={8} fill="#6b7280" textAnchor="end">{v}</text>
          </g>
        );
      })}
      <polyline points={points("mood_score")} fill="none" stroke="#a78bfa" strokeWidth={2} strokeLinejoin="round" />
      {dots("mood_score", "#a78bfa")}
      <polyline points={points("energy_score")} fill="none" stroke="#22d3ee" strokeWidth={2} strokeLinejoin="round" />
      {dots("energy_score", "#22d3ee")}
      {hasLibido && (
        <>
          <polyline points={points("libido_score")} fill="none" stroke="#f472b6" strokeWidth={2} strokeLinejoin="round" strokeDasharray="4 2" />
          {dots("libido_score", "#f472b6")}
        </>
      )}
      {data.map((d, i) => {
        const x = PAD.left + (i / Math.max(data.length - 1, 1)) * chartW;
        const label = new Date(d.log_date + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short" });
        return <text key={i} x={x} y={H - 4} fontSize={8} fill="#6b7280" textAnchor="middle">{label}</text>;
      })}
    </svg>
  );
}

// ── Demo data ────────────────────────────────────────────────────────────────

function buildDemoTrend(): TrendEntry[] {
  const today = new Date();
  const moods:   Score[] = [3, 2, 3, 4, 4, 5, 4];
  const energy:  Score[] = [2, 2, 3, 3, 4, 5, 4];
  const libido:  (Score | null)[] = [2, null, 3, 3, 4, 5, 4];

  return Array.from({ length: 7 }, (_, i) => ({
    log_date: localDateStr(addDays(today, i - 6)),
    mood_score:   moods[i],
    energy_score: energy[i],
    libido_score: libido[i],
  }));
}

function buildDemoToday(): MoodLog {
  return {
    log_date: localDateStr(new Date()),
    mood_score: 4,
    energy_score: 4,
    libido_score: 4,
    notes: "Feeling pretty good today! Had a productive morning and a good workout.",
  };
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function VibeCheckPage() {
  const searchParams = useSearchParams();
  const isDemo =
    searchParams.get("demo") === "true" ||
    (typeof window !== "undefined" && sessionStorage.getItem("demo") === "true");
  const cellSize  = useDashboardLayout();
  const gridWidth = 4 * cellSize + 3 * 16;

  const [selectedDate, setSelectedDate] = useState(localDateStr(new Date()));
  const [moodScore,   setMoodScore]   = useState<Score | null>(null);
  const [energyScore, setEnergyScore] = useState<Score | null>(null);
  const [libidoScore, setLibidoScore] = useState<Score | null>(null);
  const [notes, setNotes]             = useState("");
  const [trend, setTrend]     = useState<TrendEntry[]>([]);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [loading, setLoading] = useState(true);

  // ── Load ───────────────────────────────────────────────────────────────────

  const loadDay = useCallback(async (dateStr: string) => {
    if (isDemo) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [logRes, trendRes] = await Promise.all([
      supabase.from("mood_logs").select("mood_score,energy_score,libido_score,notes")
        .eq("user_id", user.id).eq("log_date", dateStr).maybeSingle(),
      supabase.from("mood_logs").select("log_date,mood_score,energy_score,libido_score")
        .eq("user_id", user.id)
        .gte("log_date", localDateStr(addDays(new Date(dateStr + "T00:00:00"), -6)))
        .lte("log_date", dateStr).order("log_date"),
    ]);

    if (logRes.data) {
      setMoodScore(logRes.data.mood_score as Score);
      setEnergyScore(logRes.data.energy_score as Score);
      setLibidoScore((logRes.data.libido_score ?? null) as Score | null);
      setNotes(logRes.data.notes ?? "");
    } else {
      setMoodScore(null); setEnergyScore(null); setLibidoScore(null); setNotes("");
    }
    setTrend((trendRes.data ?? []) as TrendEntry[]);
    setLoading(false);
  }, [isDemo]);

  useEffect(() => {
    if (isDemo) {
      const today = buildDemoToday();
      setMoodScore(today.mood_score);
      setEnergyScore(today.energy_score);
      setLibidoScore(today.libido_score);
      setNotes(today.notes ?? "");
      setTrend(buildDemoTrend());
      setLoading(false);
      return;
    }
    loadDay(selectedDate);
  }, [isDemo, selectedDate, loadDay]);

  // ── Save ───────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!moodScore || !energyScore) return;
    if (isDemo) { setSaved(true); setTimeout(() => setSaved(false), 2000); return; }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { data: cycleData } = await supabase.from("cycles").select("id")
      .eq("user_id", user.id).lte("start_date", selectedDate)
      .order("start_date", { ascending: false }).limit(1).maybeSingle();

    await supabase.from("mood_logs").upsert(
      { user_id: user.id, cycle_id: cycleData?.id ?? null, log_date: selectedDate,
        mood_score: moodScore, energy_score: energyScore,
        libido_score: libidoScore ?? null, notes: notes.trim() || null },
      { onConflict: "user_id,log_date" },
    );

    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    await loadDay(selectedDate);
  };

  // ── Weekly averages ────────────────────────────────────────────────────────

  const avg = (key: "mood_score" | "energy_score" | "libido_score") => {
    const vals = trend.map(d => d[key]).filter((v): v is Score => v !== null);
    if (!vals.length) return null;
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  };

  const isToday = selectedDate === localDateStr(new Date());

  // ── Render ─────────────────────────────────────────────────────────────────

  // Derive current icons for header display
  const MoodHeaderIcon   = moodScore   ? MOOD_ICONS[moodScore]   : MOOD_DEFAULT;
  const EnergyHeaderIcon = energyScore ? ENERGY_ICONS[energyScore] : ENERGY_DEFAULT;
  const LibidoHeaderIcon = libidoScore ? LIBIDO_ICONS[libidoScore] : LIBIDO_DEFAULT;

  return (
    <div className="flex justify-center px-4 py-5">
      <div className="w-full space-y-4" style={{ maxWidth: gridWidth }}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-xl font-bold tracking-tight">Vibe Check</h1>
            <p className="text-gray-500 text-xs mt-0.5">Track mood, energy &amp; libido</p>
          </div>
          {isDemo && (
            <span className="text-xs bg-violet-500/20 text-violet-400 border border-violet-500/30 px-2 py-0.5 rounded-full">Demo</span>
          )}
        </div>

        {/* Date navigator */}
        <div className="bg-[var(--card-bg)] card-glass border border-[var(--border)] rounded-2xl flex items-center justify-between px-5 py-3">
          <button
            onClick={() => setSelectedDate(localDateStr(addDays(new Date(selectedDate + "T00:00:00"), -1)))}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={15} />
          </button>
          <div className="text-center">
            <p className="text-white font-semibold text-sm">{formatDay(selectedDate)}</p>
            {isToday && <p className="text-violet-400 text-xs mt-0.5">Today</p>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { const next = addDays(new Date(selectedDate + "T00:00:00"), 1); if (next <= new Date()) setSelectedDate(localDateStr(next)); }}
              disabled={isToday}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
            >
              <ChevronRight size={15} />
            </button>
            {!isToday && (
              <button
                onClick={() => setSelectedDate(localDateStr(new Date()))}
                className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white transition-all"
              >Today</button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4">

            {/* ── Left: Score inputs ── */}
            <div className="space-y-4">

              {/* Score rings summary */}
              <div className="bg-[var(--card-bg)] card-glass rounded-2xl border border-[var(--border)] p-5">
                <p className="text-gray-400 text-xs uppercase tracking-widest mb-4">Today&apos;s Scores</p>
                <div className="flex items-center justify-around gap-4 flex-wrap">
                  {[
                    { ring: RING_MOOD,   score: moodScore,   Icon: MoodHeaderIcon,   labels: MOOD_LABELS   },
                    { ring: RING_ENERGY, score: energyScore, Icon: EnergyHeaderIcon, labels: ENERGY_LABELS },
                    { ring: RING_LIBIDO, score: libidoScore, Icon: LibidoHeaderIcon, labels: LIBIDO_LABELS },
                  ].map(({ ring, score, Icon, labels }) => (
                    <div key={ring.label} className="flex flex-col items-center gap-1.5">
                      <div className="relative">
                        <ScoreRing score={score} ring={ring} size={88} stroke={8} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                          <Icon size={18} className={ring.text} />
                          {score && <span className="text-white font-bold text-xs leading-none">{score}</span>}
                        </div>
                      </div>
                      <span className={`text-xs font-semibold ${ring.text}`}>{ring.label}</span>
                      {score && <span className="text-gray-500 text-[10px] -mt-0.5">{labels[score]}</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Mood picker */}
              <div className="bg-[var(--card-bg)] card-glass rounded-2xl border border-[var(--border)] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <MoodHeaderIcon size={18} className="text-violet-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-white text-sm font-semibold">Mood</p>
                    <p className="text-gray-500 text-xs">How are you feeling emotionally?</p>
                  </div>
                  {moodScore && <span className="text-violet-300 text-xs font-semibold">{MOOD_LABELS[moodScore]}</span>}
                </div>
                <ScorePicker value={moodScore} onChange={setMoodScore} icons={MOOD_ICONS} labels={MOOD_LABELS} ring={RING_MOOD} />
              </div>

              {/* Energy picker */}
              <div className="bg-[var(--card-bg)] card-glass rounded-2xl border border-[var(--border)] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <EnergyHeaderIcon size={18} className="text-cyan-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-white text-sm font-semibold">Energy</p>
                    <p className="text-gray-500 text-xs">What&apos;s your physical energy level?</p>
                  </div>
                  {energyScore && <span className="text-cyan-300 text-xs font-semibold">{ENERGY_LABELS[energyScore]}</span>}
                </div>
                <ScorePicker value={energyScore} onChange={setEnergyScore} icons={ENERGY_ICONS} labels={ENERGY_LABELS} ring={RING_ENERGY} />
              </div>

              {/* Libido picker */}
              <div className="bg-[var(--card-bg)] card-glass rounded-2xl border border-[var(--border)] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <LibidoHeaderIcon size={18} className="text-pink-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-white text-sm font-semibold">Libido <span className="text-gray-500 font-normal text-xs">(optional)</span></p>
                    <p className="text-gray-500 text-xs">Understand your hormonal drive</p>
                  </div>
                  {libidoScore && <span className="text-pink-300 text-xs font-semibold">{LIBIDO_LABELS[libidoScore]}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <ScorePicker value={libidoScore} onChange={setLibidoScore} icons={LIBIDO_ICONS} labels={LIBIDO_LABELS} ring={RING_LIBIDO} />
                  {libidoScore && (
                    <button onClick={() => setLibidoScore(null)} className="ml-auto text-gray-600 hover:text-gray-400 text-xs transition-colors whitespace-nowrap">Clear</button>
                  )}
                </div>
              </div>

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={saving || !moodScore || !energyScore}
                className={[
                  "w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[0.99]",
                  saved
                    ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                    : !moodScore || !energyScore
                    ? "bg-white/5 border border-white/5 text-gray-600 cursor-not-allowed"
                    : "bg-white/8 border border-white/10 text-white hover:bg-white/12",
                ].join(" ")}
              >
                {saved ? <><Check size={14} className="inline mr-1" />Saved!</> : saving ? "Saving…" : isDemo ? "Demo Mode — Sign in to Save" : "Save Vibe Check"}
              </button>
            </div>

            {/* ── Right: Trend + stats ── */}
            <div className="space-y-4">

              {/* 7-day trend chart */}
              <div className="bg-[var(--card-bg)] card-glass rounded-2xl border border-[var(--border)] p-5">
                <p className="text-gray-400 text-xs uppercase tracking-widest mb-3">7-Day Trend</p>
                {trend.length > 1 ? (
                  <>
                    <TrendChart data={trend} />
                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                      <div className="flex items-center gap-1.5"><div className="w-5 h-0.5 rounded bg-[#a78bfa]" /><span className="text-gray-500 text-xs">Mood</span></div>
                      <div className="flex items-center gap-1.5"><div className="w-5 h-0.5 rounded bg-[#22d3ee]" /><span className="text-gray-500 text-xs">Energy</span></div>
                      {trend.some(d => d.libido_score !== null) && (
                        <div className="flex items-center gap-1.5"><div className="w-5 border-t border-dashed border-[#f472b6]" /><span className="text-gray-500 text-xs">Libido</span></div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <TrendingUp size={28} className="text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Log a few days to see your trend</p>
                  </div>
                )}
              </div>

              {/* Weekly averages */}
              <div className="bg-[var(--card-bg)] card-glass rounded-2xl border border-[var(--border)] p-5">
                <p className="text-gray-400 text-xs uppercase tracking-widest mb-3">7-Day Averages</p>
                <div className="space-y-3">
                  {[
                    { key: "mood_score"   as const, label: "Mood",   ring: RING_MOOD   },
                    { key: "energy_score" as const, label: "Energy", ring: RING_ENERGY },
                    { key: "libido_score" as const, label: "Libido", ring: RING_LIBIDO },
                  ].map(({ key, label, ring }) => {
                    const a = avg(key);
                    const score = a ? Math.round(parseFloat(a)) as Score : null;
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <div className="relative w-9 h-9 flex-shrink-0">
                          <ScoreRing score={score} ring={ring} size={36} stroke={3.5} />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-white text-[9px] font-bold">{a ?? "–"}</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className={`text-xs font-semibold ${ring.text}`}>{label}</p>
                          {a ? (
                            <div className="flex items-center gap-0.5 mt-0.5">
                              {[1,2,3,4,5].map(i => (
                                <div key={i} className="h-1 flex-1 rounded-full"
                                  style={{ background: i <= Math.round(parseFloat(a)) ? ring.fill : "#ffffff15" }} />
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-600 text-xs mt-0.5">No data yet</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Phase insight */}
              <div className="bg-[var(--card-bg)] card-glass rounded-2xl border border-violet-500/20 p-5">
                <p className="text-violet-400 text-xs uppercase tracking-widest mb-2">Hormonal Insight</p>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Mood, energy &amp; libido naturally fluctuate across your cycle. Track daily to reveal your unique pattern.
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {PHASE_TAGS.map(({ label, Icon }) => (
                    <span key={label} className="flex items-center gap-1 text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                      <Icon size={10} />{label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Recent entries */}
              {trend.length > 0 && (
                <div className="bg-[var(--card-bg)] card-glass rounded-2xl border border-[var(--border)] p-5">
                  <p className="text-gray-400 text-xs uppercase tracking-widest mb-3">Recent Entries</p>
                  <div className="space-y-1">
                    {[...trend].reverse().slice(0, 5).map(entry => {
                      const MIcon = MOOD_ICONS[entry.mood_score];
                      const EIcon = ENERGY_ICONS[entry.energy_score];
                      const LIcon = entry.libido_score ? LIBIDO_ICONS[entry.libido_score] : null;
                      return (
                        <div key={entry.log_date} className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
                          <span className="text-gray-500 text-xs">
                            {new Date(entry.log_date + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-0.5 text-xs text-violet-400 font-semibold"><MIcon size={11} />&nbsp;{entry.mood_score}</span>
                            <span className="flex items-center gap-0.5 text-xs text-cyan-400 font-semibold"><EIcon size={11} />&nbsp;{entry.energy_score}</span>
                            {LIcon && entry.libido_score && (
                              <span className="flex items-center gap-0.5 text-xs text-pink-400 font-semibold"><LIcon size={11} />&nbsp;{entry.libido_score}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
