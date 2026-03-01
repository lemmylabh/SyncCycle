"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import {
  type LucideIcon,
  Dumbbell, Flame, Zap, Heart, Trophy, Activity,
  Timer, Target, Check, Plus, X, ChevronLeft, ChevronRight,
  ChevronDown, ChevronUp, TrendingUp, Brain, Wind,
  Bike, Waves, Music, Leaf, Move,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface WorkoutType {
  id: string;
  name: string;
  label: string;
  category: string;
  icon: string;
  display_order: number;
}

interface WorkoutLogWithType {
  id: string;
  log_date: string;
  workout_type_id: string;
  duration_minutes: number;
  intensity: number;
  calories_burned: number | null;
  heart_rate_avg: number | null;
  notes: string | null;
  created_at: string;
  workout_types: {
    name: string;
    label: string;
    icon: string;
    category: string;
  } | null;
}

interface WeekEntry {
  log_date: string;
  duration_minutes: number;
  intensity: number;
  workout_types: { category: string } | null;
}

// ── Constants ───────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  cardio: "#06b6d4",
  strength: "#f97316",
  flexibility: "#a855f7",
  mindfulness: "#14b8a6",
  sport: "#22c55e",
  all: "#6366f1",
};

const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  cardio: Zap,
  strength: Dumbbell,
  flexibility: Wind,
  mindfulness: Brain,
  sport: Trophy,
};

const WORKOUT_ICON_MAP: Record<string, LucideIcon> = {
  running: Activity,
  cycling: Bike,
  swimming: Waves,
  hiit: Flame,
  walking: Activity,
  dancing: Music,
  strength_training: Dumbbell,
  pilates: Wind,
  yoga: Leaf,
  stretching: Move,
  meditation: Brain,
  breathwork: Wind,
  sport: Trophy,
};

const INTENSITY_COLORS = ["#22c55e", "#84cc16", "#eab308", "#f97316", "#ef4444"];
const INTENSITY_LABELS = ["Easy", "Light", "Moderate", "Hard", "Max"];
const CATEGORIES = ["all", "cardio", "strength", "flexibility", "mindfulness", "sport"];

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

// ── WeekBarChart ──────────────────────────────────────────────────────────

function WeekBarChart({ chartData }: { chartData: { date: string; mins: number; color: string }[] }) {
  const maxH = 80;
  const maxMins = Math.max(...chartData.map(d => d.mins), 60);
  const barW = 30;
  const gap = 6;
  const padL = 12;
  const totalW = padL + chartData.length * (barW + gap) - gap + 12;

  return (
    <svg viewBox={`0 0 ${totalW} ${maxH + 26}`} className="w-full">
      {[30, 60, 90].map(v => {
        const y = maxH - (v / maxMins) * maxH;
        return (
          <g key={v}>
            <line x1={padL} x2={totalW - 12} y1={y} y2={y} stroke="white" strokeOpacity={0.04} />
            <text x={padL - 2} y={y + 3} fontSize={7} fill="#4b5563" textAnchor="end">{v}m</text>
          </g>
        );
      })}
      {chartData.map((d, i) => {
        const barH = Math.max((d.mins / maxMins) * maxH, d.mins > 0 ? 4 : 2);
        const x = padL + i * (barW + gap);
        const y = maxH - barH;
        const label = new Date(d.date + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short" });
        return (
          <g key={d.date}>
            <rect x={x} y={y} width={barW} height={Math.max(barH, 2)} rx={5}
              fill={d.mins > 0 ? d.color : "#ffffff08"} fillOpacity={d.mins > 0 ? 0.85 : 1} />
            {d.mins > 0 && (
              <text x={x + barW / 2} y={y - 3} fontSize={8} fill="#9ca3af" textAnchor="middle">
                {d.mins}m
              </text>
            )}
            <text x={x + barW / 2} y={maxH + 16} fontSize={8} fill="#6b7280" textAnchor="middle">{label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Demo data ─────────────────────────────────────────────────────────────────

function buildDemoTypes(): WorkoutType[] {
  return [
    { id: "1", name: "running", label: "Running", category: "cardio", icon: "🏃", display_order: 1 },
    { id: "2", name: "cycling", label: "Cycling", category: "cardio", icon: "🚴", display_order: 2 },
    { id: "3", name: "swimming", label: "Swimming", category: "cardio", icon: "🏊", display_order: 3 },
    { id: "4", name: "hiit", label: "HIIT", category: "cardio", icon: "🔥", display_order: 4 },
    { id: "5", name: "walking", label: "Walking", category: "cardio", icon: "🚶", display_order: 5 },
    { id: "6", name: "dancing", label: "Dancing", category: "cardio", icon: "💃", display_order: 6 },
    { id: "7", name: "strength_training", label: "Strength", category: "strength", icon: "🏋️", display_order: 7 },
    { id: "8", name: "pilates", label: "Pilates", category: "strength", icon: "🤸", display_order: 8 },
    { id: "9", name: "yoga", label: "Yoga", category: "flexibility", icon: "🧘", display_order: 9 },
    { id: "10", name: "stretching", label: "Stretching", category: "flexibility", icon: "🙆", display_order: 10 },
    { id: "11", name: "meditation", label: "Meditation", category: "mindfulness", icon: "🧠", display_order: 11 },
    { id: "12", name: "breathwork", label: "Breathwork", category: "mindfulness", icon: "🌬️", display_order: 12 },
    { id: "13", name: "sport", label: "Sport / Other", category: "sport", icon: "⚽", display_order: 13 },
  ];
}

function buildDemoTodayWorkouts(): WorkoutLogWithType[] {
  return [
    {
      id: "demo-1", log_date: localDateStr(new Date()), workout_type_id: "1",
      duration_minutes: 30, intensity: 3, calories_burned: 280, heart_rate_avg: 145,
      notes: null, created_at: new Date().toISOString(),
      workout_types: { name: "running", label: "Running", icon: "🏃", category: "cardio" },
    },
  ];
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function FitnessPage() {
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "true" ||
    (typeof window !== "undefined" && sessionStorage.getItem("demo") === "true");

  const [selectedDate, setSelectedDate] = useState(localDateStr(new Date()));
  const [workoutTypes, setWorkoutTypes] = useState<WorkoutType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [duration, setDuration] = useState(30);
  const [intensity, setIntensity] = useState(3);
  const [caloriesBurned, setCaloriesBurned] = useState("");
  const [heartRateAvg, setHeartRateAvg] = useState("");
  const [notes, setNotes] = useState("");
  const [showOptional, setShowOptional] = useState(false);
  const [todayWorkouts, setTodayWorkouts] = useState<WorkoutLogWithType[]>([]);
  const [weekHistory, setWeekHistory] = useState<WeekEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const isToday = selectedDate === localDateStr(new Date());

  const loadData = useCallback(async (dateStr: string) => {
    if (isDemo) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const weekAgo = localDateStr(addDays(new Date(dateStr + "T00:00:00"), -6));
    const [typesRes, todayRes, weekRes] = await Promise.all([
      supabase.from("workout_types").select("*").order("display_order"),
      supabase.from("workout_logs")
        .select("*, workout_types(name,label,icon,category)")
        .eq("user_id", user.id).eq("log_date", dateStr).order("created_at"),
      supabase.from("workout_logs")
        .select("log_date,duration_minutes,intensity,workout_types(category)")
        .eq("user_id", user.id).gte("log_date", weekAgo).lte("log_date", dateStr),
    ]);

    setWorkoutTypes((typesRes.data ?? []) as WorkoutType[]);
    setTodayWorkouts((todayRes.data ?? []) as unknown as WorkoutLogWithType[]);
    setWeekHistory((weekRes.data ?? []) as unknown as WeekEntry[]);
    setLoading(false);
  }, [isDemo]);

  useEffect(() => {
    if (isDemo) {
      setWorkoutTypes(buildDemoTypes());
      setTodayWorkouts(buildDemoTodayWorkouts());
      setLoading(false);
      return;
    }
    loadData(selectedDate);
  }, [isDemo, selectedDate, loadData]);

  const handleLog = async () => {
    if (!selectedTypeId) return;
    if (isDemo) { setSaved(true); setTimeout(() => setSaved(false), 2000); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { data: cycleData } = await supabase.from("cycles").select("id")
      .eq("user_id", user.id).lte("start_date", selectedDate)
      .order("start_date", { ascending: false }).limit(1).maybeSingle();

    const { data: newRow } = await supabase.from("workout_logs").insert({
      user_id: user.id,
      cycle_id: (cycleData as { id: string } | null)?.id ?? null,
      log_date: selectedDate,
      workout_type_id: selectedTypeId,
      duration_minutes: duration,
      intensity,
      calories_burned: caloriesBurned ? parseInt(caloriesBurned) : null,
      heart_rate_avg: heartRateAvg ? parseInt(heartRateAvg) : null,
      notes: notes.trim() || null,
    }).select("*, workout_types(name,label,icon,category)").single();

    if (newRow) setTodayWorkouts(prev => [...prev, newRow as unknown as WorkoutLogWithType]);

    // Update week history
    setWeekHistory(prev => [...prev, {
      log_date: selectedDate,
      duration_minutes: duration,
      intensity,
      workout_types: null,
    }]);

    // Reset form
    setSelectedTypeId(null);
    setDuration(30); setIntensity(3);
    setCaloriesBurned(""); setHeartRateAvg("");
    setNotes(""); setShowOptional(false);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleDelete = async (id: string) => {
    if (isDemo) { setTodayWorkouts(prev => prev.filter(w => w.id !== id)); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("workout_logs").delete().eq("id", id).eq("user_id", user.id);
    setTodayWorkouts(prev => prev.filter(w => w.id !== id));
  };

  // Weekly stats
  const thisWeekWorkouts = weekHistory;
  const totalSessions = thisWeekWorkouts.length;
  const totalMins = thisWeekWorkouts.reduce((s, w) => s + w.duration_minutes, 0);
  const avgIntensity = totalSessions
    ? (thisWeekWorkouts.reduce((s, w) => s + w.intensity, 0) / totalSessions).toFixed(1) : null;

  // 7-day bar chart data
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = localDateStr(addDays(new Date(selectedDate + "T00:00:00"), i - 6));
    const dayWorkouts = weekHistory.filter(w => w.log_date === date);
    const mins = dayWorkouts.reduce((s, w) => s + w.duration_minutes, 0);
    const dominantCategory = dayWorkouts[0]?.workout_types?.category ?? "cardio";
    return { date, mins, color: CATEGORY_COLORS[dominantCategory] ?? "#6366f1" };
  });

  // Filtered workout types
  const filteredTypes = categoryFilter === "all"
    ? workoutTypes
    : workoutTypes.filter(t => t.category === categoryFilter);

  const selectedType = workoutTypes.find(t => t.id === selectedTypeId);

  return (
    <div className="min-h-full bg-[#0f0f13] p-4 lg:p-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Dumbbell size={20} className="text-cyan-400" />
          <h1 className="text-xl font-bold text-white tracking-tight">Fitness</h1>
          {isDemo && (
            <span className="text-xs bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full">
              Demo
            </span>
          )}
        </div>
        <p className="text-gray-400 text-sm ml-9">Log workouts and sync movement with your cycle</p>
      </motion.div>

      {/* Date navigator */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
        className="flex items-center gap-3 mb-6">
        <button onClick={() => setSelectedDate(localDateStr(addDays(new Date(selectedDate + "T00:00:00"), -1)))}
          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all">
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1 text-center">
          <p className="text-white font-semibold text-sm">{formatDay(selectedDate)}</p>
          {isToday && <p className="text-cyan-400 text-xs mt-0.5">Today</p>}
        </div>
        <button
          onClick={() => { const n = addDays(new Date(selectedDate + "T00:00:00"), 1); if (n <= new Date()) setSelectedDate(localDateStr(n)); }}
          disabled={isToday}
          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronRight size={16} />
        </button>
        <button onClick={() => setSelectedDate(localDateStr(new Date()))}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white transition-all">
          Today
        </button>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4">

          {/* ── Left column ─────────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Today's sessions */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-5">
              <p className="text-gray-400 text-xs uppercase tracking-widest mb-3">Today&apos;s Sessions</p>
              <AnimatePresence mode="popLayout">
                {todayWorkouts.length === 0 ? (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center py-6 text-center gap-2">
                    <Dumbbell size={32} className="text-gray-700" />
                    <p className="text-gray-500 text-sm">No workouts logged yet today</p>
                    <p className="text-gray-600 text-xs">Add one below to get started</p>
                  </motion.div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {todayWorkouts.map((w, i) => {
                      const catColor = CATEGORY_COLORS[w.workout_types?.category ?? "cardio"];
                      const WIcon = WORKOUT_ICON_MAP[w.workout_types?.name ?? ""] ?? Activity;
                      return (
                        <motion.div key={w.id}
                          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20, height: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: `${catColor}20`, border: `1px solid ${catColor}40`, color: catColor }}>
                            <WIcon size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold truncate">
                              {w.workout_types?.label ?? "Workout"}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-gray-500 text-xs flex items-center gap-1">
                                <Timer size={10} /> {w.duration_minutes}m
                              </span>
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                                style={{ background: `${INTENSITY_COLORS[w.intensity - 1]}22`, color: INTENSITY_COLORS[w.intensity - 1] }}>
                                {INTENSITY_LABELS[w.intensity - 1]}
                              </span>
                              {w.calories_burned && (
                                <span className="text-gray-500 text-xs flex items-center gap-1">
                                  <Flame size={10} className="text-orange-400" /> {w.calories_burned} kcal
                                </span>
                              )}
                            </div>
                          </div>
                          <button onClick={() => handleDelete(w.id)}
                            className="text-gray-600 hover:text-rose-400 transition-colors p-1">
                            <X size={14} />
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Add workout form */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-5 space-y-5">
              <p className="text-gray-400 text-xs uppercase tracking-widest">Add Workout</p>

              {/* Category filter */}
              <div className="flex gap-1.5 flex-wrap">
                {CATEGORIES.map(cat => {
                  const active = categoryFilter === cat;
                  const CatIcon = CATEGORY_ICONS[cat];
                  return (
                    <button key={cat} onClick={() => { setCategoryFilter(cat); setSelectedTypeId(null); }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                        active ? "text-white" : "bg-white/[0.03] text-gray-500 hover:text-gray-300 hover:bg-white/[0.06]"
                      }`}
                      style={active ? { background: `${CATEGORY_COLORS[cat]}30`, color: CATEGORY_COLORS[cat], border: `1px solid ${CATEGORY_COLORS[cat]}50` } : undefined}>
                      {CatIcon && <CatIcon size={11} />}
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* Workout type grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {filteredTypes.map((type, i) => {
                  const active = selectedTypeId === type.id;
                  const catColor = CATEGORY_COLORS[type.category];
                  const TypeIcon = WORKOUT_ICON_MAP[type.name] ?? Activity;
                  return (
                    <motion.button key={type.id} onClick={() => setSelectedTypeId(active ? null : type.id)}
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200 ${
                        active ? "scale-105 shadow-lg" : "border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/10"
                      }`}
                      style={active ? { background: `${catColor}22`, borderColor: `${catColor}70` } : undefined}>
                      <TypeIcon size={22} style={{ color: active ? catColor : "#6b7280" }} />
                      <span className={`text-[10px] font-medium text-center leading-tight ${active ? "text-white" : "text-gray-400"}`}>
                        {type.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Duration + Intensity */}
              <AnimatePresence>
                {selectedTypeId && (
                  <motion.div key="form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-4">

                    {/* Selected type badge */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/5">
                      {selectedType && (() => { const SelIcon = WORKOUT_ICON_MAP[selectedType.name] ?? Activity; return <SelIcon size={20} style={{ color: CATEGORY_COLORS[selectedType.category] }} />; })()}
                      <span className="text-white text-sm font-semibold">{selectedType?.label}</span>
                      <span className="ml-auto text-xs capitalize px-2 py-0.5 rounded-full"
                        style={{ background: `${CATEGORY_COLORS[selectedType?.category ?? "cardio"]}25`, color: CATEGORY_COLORS[selectedType?.category ?? "cardio"] }}>
                        {selectedType?.category}
                      </span>
                    </div>

                    {/* Duration */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                        <Timer size={11} className="text-cyan-400" /> Duration (minutes)
                      </label>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setDuration(Math.max(5, duration - 5))}
                          className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all text-lg font-light">
                          −
                        </button>
                        <input type="number" value={duration} min={1} max={300}
                          onChange={e => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
                          className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-white text-center text-lg font-bold focus:outline-none focus:border-cyan-500/50 transition-colors" />
                        <button onClick={() => setDuration(Math.min(300, duration + 5))}
                          className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all text-lg font-light">
                          +
                        </button>
                      </div>
                    </div>

                    {/* Intensity */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                        <Activity size={11} className="text-orange-400" /> Intensity (RPE)
                      </label>
                      <div className="flex gap-2">
                        {INTENSITY_LABELS.map((label, i) => {
                          const score = i + 1;
                          const active = intensity === score;
                          return (
                            <motion.button key={score} onClick={() => setIntensity(score)}
                              whileTap={{ scale: 0.9 }}
                              className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-all duration-200 ${
                                active ? "border-white/30 scale-105" : "border-white/5 bg-white/[0.02] hover:bg-white/[0.06]"
                              }`}
                              style={active ? { background: `${INTENSITY_COLORS[i]}25`, borderColor: `${INTENSITY_COLORS[i]}70` } : undefined}>
                              <span className="text-[10px] font-bold" style={{ color: active ? INTENSITY_COLORS[i] : "#6b7280" }}>{score}</span>
                              <span className={`text-[9px] ${active ? "text-white" : "text-gray-600"}`}>{label}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Optional fields toggle */}
                    <button onClick={() => setShowOptional(!showOptional)}
                      className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors">
                      {showOptional ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      {showOptional ? "Hide optional fields" : "Add calories & heart rate"}
                    </button>

                    <AnimatePresence>
                      {showOptional && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5">
                                <Flame size={11} className="text-orange-400" /> Calories burned
                              </label>
                              <input type="number" value={caloriesBurned} placeholder="e.g. 280"
                                onChange={e => setCaloriesBurned(e.target.value)}
                                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors placeholder-gray-600" />
                            </div>
                            <div>
                              <label className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5">
                                <Heart size={11} className="text-rose-400" /> Avg heart rate
                              </label>
                              <input type="number" value={heartRateAvg} placeholder="e.g. 145 bpm"
                                onChange={e => setHeartRateAvg(e.target.value)}
                                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors placeholder-gray-600" />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Notes */}
                    <textarea value={notes} onChange={e => setNotes(e.target.value)}
                      placeholder="How did it feel? Any notes…"
                      rows={2}
                      className="w-full bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 resize-none focus:outline-none focus:border-cyan-500/50 transition-colors" />

                    {/* Log button */}
                    <motion.button onClick={handleLog} disabled={saving}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                        saved
                          ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                          : "bg-gradient-to-r from-cyan-600 to-teal-500 text-white hover:opacity-90 shadow-lg shadow-cyan-500/25"
                      }`}>
                      {saved ? <><Check size={14} />Logged!</>
                        : saving ? "Saving…"
                        : isDemo ? "Demo Mode — Sign in to Save"
                        : <><Plus size={14} />Log Workout</>}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              {!selectedTypeId && (
                <p className="text-gray-600 text-xs text-center py-2">Select a workout type above to continue</p>
              )}
            </motion.div>
          </div>

          {/* ── Right column ─────────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Weekly summary */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-5">
              <p className="text-gray-400 text-xs uppercase tracking-widest mb-4">This Week</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Sessions", value: totalSessions, Icon: Target, color: "text-cyan-400" },
                  { label: "Minutes", value: totalMins || "—", Icon: Timer, color: "text-emerald-400" },
                  { label: "Avg RPE", value: avgIntensity ?? "—", Icon: Zap, color: "text-orange-400" },
                ].map((s, i) => (
                  <motion.div key={s.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 + i * 0.05 }}
                    className="rounded-xl bg-white/[0.03] border border-white/5 p-3 flex flex-col items-center gap-1">
                    <s.Icon size={16} className={s.color} />
                    <span className="text-white font-bold text-lg leading-none">{s.value}</span>
                    <span className="text-gray-600 text-[10px]">{s.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* 7-day bar chart */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-5">
              <p className="text-gray-400 text-xs uppercase tracking-widest mb-4">7-Day Activity</p>
              {weekHistory.length > 0 || true ? (
                <>
                  <WeekBarChart chartData={chartData} />
                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
                    {Object.entries(CATEGORY_COLORS).filter(([k]) => k !== "all").map(([cat, color]) => (
                      <div key={cat} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                        <span className="text-gray-600 text-[10px] capitalize">{cat}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center py-8">
                  <TrendingUp size={32} className="text-gray-700 mb-2" />
                  <p className="text-gray-500 text-sm">Start logging to see trends</p>
                </div>
              )}
            </motion.div>

            {/* Cycle sync tip */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={13} className="text-cyan-400" />
                <p className="text-cyan-400 text-xs uppercase tracking-widest">Cycle Sync</p>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                Push hard in the follicular &amp; ovulatory phases — oestrogen boosts strength and endurance. Save restorative movement for the luteal phase.
              </p>
            </motion.div>

            {/* Recent workouts */}
            {weekHistory.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-5">
                <p className="text-gray-400 text-xs uppercase tracking-widest mb-3">Recent Activity</p>
                <div className="space-y-2">
                  {todayWorkouts.slice(0, 3).map(w => {
                    const catColor = CATEGORY_COLORS[w.workout_types?.category ?? "cardio"];
                    return (
                      <div key={w.id} className="flex items-center gap-2.5 py-1.5 border-b border-white/[0.04] last:border-0">
                        {(() => { const RIcon = WORKOUT_ICON_MAP[w.workout_types?.name ?? ""] ?? Activity; return <RIcon size={16} style={{ color: CATEGORY_COLORS[w.workout_types?.category ?? "cardio"] }} />; })()}
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-semibold truncate">{w.workout_types?.label}</p>
                          <p className="text-gray-600 text-[10px]">{w.duration_minutes}m</p>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: `${catColor}20`, color: catColor }}>
                          {w.intensity}/5
                        </span>
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
  );
}
