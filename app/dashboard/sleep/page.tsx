"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useDashboardLayout } from "@/hooks/useDashboardLayout";
import {
  type LucideIcon,
  Moon, Star, Clock, AlarmClock, Check, Minus, Plus,
  ChevronLeft, ChevronRight, Sparkles, Info, TrendingUp,
  Frown, Meh, Smile, Laugh,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface SleepLog {
  bedtime: string | null;
  wake_time: string | null;
  duration_minutes: number | null;
  quality_score: number;
  interruptions: number;
  notes: string | null;
}

interface SleepTrend {
  log_date: string;
  duration_minutes: number | null;
  quality_score: number;
}

// ── Constants ───────────────────────────────────────────────────────────────

const QUALITY_ICONS: LucideIcon[] = [Frown, Frown, Meh, Smile, Laugh];
const QUALITY_LABELS = ["Terrible", "Poor", "Fair", "Good", "Excellent"];
const QUALITY_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#6366f1"];

// ── Helpers ─────────────────────────────────────────────────────────────────

function localDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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

function computeDuration(bed: string, wake: string): number {
  if (!bed || !wake) return 0;
  const [bh, bm] = bed.split(":").map(Number);
  const [wh, wm] = wake.split(":").map(Number);
  let bedMins = bh * 60 + bm;
  const wakeMins = wh * 60 + wm;
  if (bedMins >= wakeMins) bedMins -= 24 * 60;
  return Math.max(0, wakeMins - bedMins);
}

function formatDuration(minutes: number | null): string | null {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function timeFromTs(ts: string | null): string {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch { return ""; }
}

function buildTimestamp(logDate: string, timeStr: string, isPrevDay: boolean): string {
  const [year, month, day] = logDate.split("-").map(Number);
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date(year, month - 1, day);
  if (isPrevDay) d.setDate(d.getDate() - 1);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

// ── SleepArc ─────────────────────────────────────────────────────────────────

function SleepArc({ durationMinutes, qualityScore }: { durationMinutes: number; qualityScore: number }) {
  const size = 180;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const cx = size / 2;
  const arcFraction = 0.75;
  const arcLength = circ * arcFraction;
  const fill = durationMinutes > 0 ? Math.min(durationMinutes / 600, 1) : 0;
  const fillLength = fill * arcLength;
  const color = qualityScore >= 1 && qualityScore <= 5 ? QUALITY_COLORS[qualityScore - 1] : "rgba(255,255,255,0.08)";
  const dur = formatDuration(durationMinutes);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[135deg]">
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke} strokeDasharray={`${arcLength} ${circ}`} strokeLinecap="round" />
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={color}
          strokeWidth={stroke} strokeDasharray={`${fillLength} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s ease, stroke 0.5s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
        <Moon size={18} className="text-indigo-400" />
        {dur ? (
          <>
            <span className="text-white font-bold text-xl leading-none">{dur}</span>
            <span className="text-white/40 text-[11px] mt-0.5">
              {qualityScore ? QUALITY_LABELS[qualityScore - 1] : "No rating"}
            </span>
          </>
        ) : (
          <span className="text-white/25 text-sm mt-1">Log tonight</span>
        )}
      </div>
    </div>
  );
}

// ── SleepBarChart ─────────────────────────────────────────────────────────────

function SleepBarChart({ data }: { data: SleepTrend[] }) {
  if (!data.length) return null;
  const maxH = 72;
  const barW = 28;
  const gap = 6;
  const padL = 14;
  const totalW = padL + data.length * (barW + gap) - gap + 12;
  const idealY = maxH - (480 / 600) * maxH;

  return (
    <svg viewBox={`0 0 ${totalW} ${maxH + 24}`} className="w-full">
      <line x1={padL} x2={totalW - 12} y1={idealY} y2={idealY}
        stroke="#6366f1" strokeWidth={1} strokeDasharray="4 2" opacity={0.35} />
      <text x={totalW - 4} y={idealY + 3} fontSize={7} fill="#818cf8" opacity={0.6} textAnchor="end">8h</text>
      {data.map((d, i) => {
        const dur = d.duration_minutes ?? 0;
        const barH = Math.max((dur / 600) * maxH, dur > 0 ? 4 : 2);
        const x = padL + i * (barW + gap);
        const y = maxH - barH;
        const color = d.quality_score >= 1 && d.quality_score <= 5
          ? QUALITY_COLORS[d.quality_score - 1] : "rgba(255,255,255,0.04)";
        const label = new Date(d.log_date + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short" });
        return (
          <g key={d.log_date}>
            <rect x={x} y={y} width={barW} height={Math.max(barH, 2)} rx={5}
              fill={dur > 0 ? color : "rgba(255,255,255,0.04)"} fillOpacity={dur > 0 ? 0.8 : 1} />
            {dur > 0 && (
              <text x={x + barW / 2} y={y - 3} fontSize={8} fill="rgba(255,255,255,0.35)" textAnchor="middle">
                {Math.floor(dur / 60)}h
              </text>
            )}
            <text x={x + barW / 2} y={maxH + 15} fontSize={8} fill="rgba(255,255,255,0.25)" textAnchor="middle">{label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Demo data ─────────────────────────────────────────────────────────────────

function buildDemoTrend(): SleepTrend[] {
  const today = new Date();
  return [420, 360, 480, 510, 390, 450, 480].map((dur, i) => ({
    log_date: localDateStr(addDays(today, i - 6)),
    duration_minutes: dur,
    quality_score: [3, 2, 4, 4, 3, 4, 5][i],
  }));
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SleepPage() {
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "true" ||
    (typeof window !== "undefined" && sessionStorage.getItem("demo") === "true");

  const cellSize = useDashboardLayout();
  const GAP = 16;
  const gridWidth = 4 * cellSize + 3 * GAP;

  const [selectedDate, setSelectedDate] = useState(localDateStr(new Date()));
  const [bedtime, setBedtime] = useState("23:00");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [qualityScore, setQualityScore] = useState(0);
  const [interruptions, setInterruptions] = useState(0);
  const [trend, setTrend] = useState<SleepTrend[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const durationMinutes = computeDuration(bedtime, wakeTime);
  const isToday = selectedDate === localDateStr(new Date());

  const loadDay = useCallback(async (dateStr: string) => {
    if (isDemo) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const weekAgo = localDateStr(addDays(new Date(dateStr + "T00:00:00"), -6));
    const [logRes, trendRes] = await Promise.all([
      supabase.from("sleep_logs").select("*")
        .eq("user_id", user.id).eq("log_date", dateStr).maybeSingle(),
      supabase.from("sleep_logs").select("log_date,duration_minutes,quality_score")
        .eq("user_id", user.id).gte("log_date", weekAgo).lte("log_date", dateStr).order("log_date"),
    ]);

    const log = logRes.data as SleepLog | null;
    if (log) {
      setBedtime(timeFromTs(log.bedtime) || "23:00");
      setWakeTime(timeFromTs(log.wake_time) || "07:00");
      setQualityScore(log.quality_score ?? 0);
      setInterruptions(log.interruptions ?? 0);
    } else {
      setBedtime("23:00"); setWakeTime("07:00");
      setQualityScore(0); setInterruptions(0);
    }
    setTrend((trendRes.data ?? []) as SleepTrend[]);
    setLoading(false);
  }, [isDemo]);

  useEffect(() => {
    if (isDemo) {
      setQualityScore(4); setInterruptions(1);
      setTrend(buildDemoTrend());
      setLoading(false);
      return;
    }
    loadDay(selectedDate);
  }, [isDemo, selectedDate, loadDay]);

  const handleSave = async () => {
    if (!qualityScore) return;
    if (isDemo) { setSaved(true); setTimeout(() => setSaved(false), 2000); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { data: cycleData } = await supabase.from("cycles").select("id")
      .eq("user_id", user.id).lte("start_date", selectedDate)
      .order("start_date", { ascending: false }).limit(1).maybeSingle();

    const [bh] = bedtime.split(":").map(Number);
    const [wh] = wakeTime.split(":").map(Number);
    const bedIsPrev = bh >= wh;

    await supabase.from("sleep_logs").upsert({
      user_id: user.id,
      cycle_id: (cycleData as { id: string } | null)?.id ?? null,
      log_date: selectedDate,
      bedtime: buildTimestamp(selectedDate, bedtime, bedIsPrev),
      wake_time: buildTimestamp(selectedDate, wakeTime, false),
      duration_minutes: durationMinutes,
      quality_score: qualityScore,
      interruptions,
      notes: null,
    }, { onConflict: "user_id,log_date" });

    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    await loadDay(selectedDate);
  };

  // Trend stats
  const withData = trend.filter(t => (t.duration_minutes ?? 0) > 0);
  const avgDur = withData.length
    ? Math.round(withData.reduce((a, b) => a + (b.duration_minutes ?? 0), 0) / withData.length) : null;
  const avgQual = withData.length
    ? (withData.reduce((a, b) => a + b.quality_score, 0) / withData.length).toFixed(1) : null;
  const bestSleep = withData.length
    ? Math.max(...withData.map(t => t.duration_minutes ?? 0)) : null;
  const deficit = avgDur ? Math.max(0, 480 - avgDur) : null;

  const stats = [
    { label: "Avg Duration", value: formatDuration(avgDur) ?? "—",                        Icon: Clock,      color: "text-indigo-400"  },
    { label: "Avg Quality",  value: avgQual ? `${avgQual}/5` : "—",                       Icon: Star,       color: "text-amber-400"   },
    { label: "Best Sleep",   value: formatDuration(bestSleep) ?? "—",                     Icon: Sparkles,   color: "text-emerald-400" },
    { label: "Avg Deficit",  value: deficit !== null ? (deficit === 0 ? "On track!" : `-${formatDuration(deficit)}`) : "—",
      Icon: AlarmClock, color: deficit === 0 ? "text-emerald-400" : "text-rose-400" },
  ];

  return (
    <div className="flex justify-center px-4 py-5">
      <div className="w-full space-y-4" style={{ maxWidth: gridWidth }}>

        {/* Header + date nav */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--card-bg)] card-glass rounded-2xl border border-[var(--border)] px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-indigo-400/10 flex items-center justify-center flex-shrink-0">
                <Moon size={16} className="text-indigo-400" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-white leading-none">Sleep</h1>
                <p className="text-white/35 text-xs mt-0.5">Quality & rest tracking</p>
              </div>
              {isDemo && (
                <span className="text-[10px] bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 px-2 py-0.5 rounded-full">
                  Demo
                </span>
              )}
            </div>

            {/* Date nav */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setSelectedDate(localDateStr(addDays(new Date(selectedDate + "T00:00:00"), -1)))}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all">
                <ChevronLeft size={14} />
              </button>
              <div className="text-center min-w-[90px]">
                <p className="text-white text-xs font-semibold">{formatDay(selectedDate)}</p>
                {isToday && <p className="text-indigo-400 text-[10px]">Tonight</p>}
              </div>
              <button
                onClick={() => { const n = addDays(new Date(selectedDate + "T00:00:00"), 1); if (n <= new Date()) setSelectedDate(localDateStr(n)); }}
                disabled={isToday}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronRight size={14} />
              </button>
              <button onClick={() => setSelectedDate(localDateStr(new Date()))}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-white/40 hover:text-white transition-all">
                Today
              </button>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-7 h-7 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-4">

            {/* ── Left column ─────────────────────────────────────────────── */}
            <div className="space-y-4">

              {/* Arc hero */}
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.08 }}
                className="bg-[var(--card-bg)] card-glass rounded-2xl border border-[var(--border)] p-6 flex flex-col items-center gap-3">
                <SleepArc durationMinutes={durationMinutes} qualityScore={qualityScore} />
                <AnimatePresence>
                  {durationMinutes > 0 && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="text-white/30 text-xs text-center">
                      {bedtime} → {wakeTime}&nbsp;&nbsp;·&nbsp;&nbsp;
                      {durationMinutes >= 480
                        ? <span className="text-emerald-400">✓ 8h goal met</span>
                        : <span className="text-amber-400">{formatDuration(480 - durationMinutes)} below goal</span>}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Sleep window */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
                className="bg-[var(--card-bg)] card-glass rounded-2xl border border-[var(--border)] p-5">
                <p className="text-white/40 text-[11px] uppercase tracking-widest mb-4">Sleep Window</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-1.5 text-[11px] text-white/35 mb-2 uppercase tracking-widest">
                      <Moon size={10} className="text-indigo-400" /> Bedtime
                    </label>
                    <input type="time" value={bedtime} onChange={e => setBedtime(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500/40 transition-colors [color-scheme:dark]" />
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-[11px] text-white/35 mb-2 uppercase tracking-widest">
                      <AlarmClock size={10} className="text-amber-400" /> Wake Time
                    </label>
                    <input type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500/40 transition-colors [color-scheme:dark]" />
                  </div>
                </div>
                <AnimatePresence>
                  {durationMinutes > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="mt-3 flex items-center justify-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl py-2.5">
                        <Clock size={13} className="text-indigo-400" />
                        <span className="text-indigo-300 text-sm font-semibold">{formatDuration(durationMinutes)} of sleep</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Quality score */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
                className="bg-[var(--card-bg)] card-glass rounded-2xl border border-[var(--border)] p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-white text-sm font-semibold">Sleep Quality</p>
                    <p className="text-white/30 text-xs mt-0.5">How rested did you feel?</p>
                  </div>
                  <AnimatePresence mode="wait">
                    {qualityScore > 0 && (
                      <motion.span key={qualityScore} initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                        className="text-sm font-bold"
                        style={{ color: QUALITY_COLORS[qualityScore - 1] }}>
                        {QUALITY_LABELS[qualityScore - 1]}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex gap-2">
                  {QUALITY_ICONS.map((QIcon, i) => {
                    const score = i + 1;
                    const active = qualityScore === score;
                    return (
                      <motion.button key={score} onClick={() => setQualityScore(score)}
                        whileTap={{ scale: 0.9 }}
                        className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all duration-200 ${
                          active ? "scale-105" : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10"
                        }`}
                        style={active ? { background: `${QUALITY_COLORS[i]}20`, borderColor: `${QUALITY_COLORS[i]}55` } : undefined}>
                        <QIcon size={20} style={active ? { color: QUALITY_COLORS[i] } : { color: "rgba(255,255,255,0.2)" }} />
                        <span className={`text-[10px] font-semibold ${active ? "text-white" : "text-white/20"}`}>{score}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>

              {/* Interruptions stepper */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-[var(--card-bg)] card-glass rounded-2xl border border-[var(--border)] p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-white text-sm font-semibold">Interruptions</p>
                  <p className="text-white/30 text-xs mt-0.5">Times you woke during the night</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button onClick={() => setInterruptions(Math.max(0, interruptions - 1))}
                    className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all">
                    <Minus size={14} />
                  </button>
                  <span className="text-white font-bold text-xl w-6 text-center">{interruptions}</span>
                  <button onClick={() => setInterruptions(Math.min(10, interruptions + 1))}
                    className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all">
                    <Plus size={14} />
                  </button>
                </div>
              </motion.div>

              {/* Save */}
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.24 }}
                onClick={handleSave} disabled={saving || !qualityScore}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  saved
                    ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                    : !qualityScore
                    ? "bg-white/5 border border-white/[0.06] text-white/25 cursor-not-allowed"
                    : "bg-white/8 border border-white/10 text-white hover:bg-white/12 active:scale-[0.99]"
                }`}>
                {saved ? <><Check size={13} className="inline mr-2" />Logged!</>
                  : saving ? "Saving…"
                  : isDemo ? "Demo Mode — Sign in to Save"
                  : "Log Sleep"}
              </motion.button>
            </div>

            {/* ── Right column ─────────────────────────────────────────────── */}
            <div className="space-y-4">

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-2">
                {stats.map((s, i) => (
                  <motion.div key={s.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    className="bg-[var(--card-bg)] card-glass rounded-xl border border-[var(--border)] p-3.5">
                    <s.Icon size={13} className={`${s.color} mb-1.5`} />
                    <p className="text-white font-bold text-base leading-none">{s.value}</p>
                    <p className="text-white/30 text-[11px] mt-0.5">{s.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* 7-day chart */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
                className="bg-[var(--card-bg)] card-glass rounded-2xl border border-[var(--border)] p-5">
                <p className="text-white/40 text-[11px] uppercase tracking-widest mb-3">7-Day Sleep</p>
                {trend.length > 0 ? (
                  <>
                    <SleepBarChart data={trend} />
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                      {QUALITY_COLORS.map((c, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-sm" style={{ background: c }} />
                          <span className="text-white/25 text-[10px]">{QUALITY_LABELS[i]}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center py-8">
                    <TrendingUp size={28} className="text-white/10 mb-2" />
                    <p className="text-white/25 text-sm">Log sleep to see trends</p>
                  </div>
                )}
              </motion.div>

              {/* Cycle insight */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
                className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Info size={12} className="text-indigo-400" />
                  <p className="text-indigo-400 text-[11px] uppercase tracking-widest">Sleep & Your Cycle</p>
                </div>
                <p className="text-white/60 text-sm leading-relaxed">
                  Progesterone rise in the luteal phase can increase drowsiness but reduce deep sleep quality. Track consistently to spot your patterns.
                </p>
              </motion.div>

              {/* Recent nights */}
              {trend.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="bg-[var(--card-bg)] card-glass rounded-2xl border border-[var(--border)] p-5">
                  <p className="text-white/40 text-[11px] uppercase tracking-widest mb-3">Recent Nights</p>
                  <div className="space-y-1.5">
                    {[...trend].reverse().slice(0, 5).map(entry => {
                      const QIcon = entry.quality_score >= 1 ? QUALITY_ICONS[entry.quality_score - 1] : null;
                      return (
                        <div key={entry.log_date}
                          className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
                          <span className="text-white/35 text-xs">
                            {new Date(entry.log_date + "T00:00:00").toLocaleDateString("en-GB", {
                              weekday: "short", day: "numeric", month: "short",
                            })}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-white text-xs font-semibold">
                              {formatDuration(entry.duration_minutes) ?? "—"}
                            </span>
                            {QIcon
                              ? <QIcon size={13} style={{ color: QUALITY_COLORS[entry.quality_score - 1] }} />
                              : <span className="text-white/20 text-xs">—</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
