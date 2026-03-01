"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import {
  type LucideIcon,
  Apple, Utensils, Droplets, Flame, Check, Plus, X,
  ChevronLeft, ChevronRight, Target, Leaf, TrendingUp, Info,
  Sunrise, Sun, Moon, Pill,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface NutritionLog {
  water_ml: number | null;
  calories_kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  notes: string | null;
}

interface MealEntry {
  id: string;
  log_date: string;
  meal_type: string;
  description: string;
  calories_kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  created_at: string;
}

interface Totals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// ── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_GOALS = { calories: 2000, protein: 150, carbs: 250, fat: 65 };

const MEAL_TYPES: { key: string; label: string; Icon: LucideIcon }[] = [
  { key: "breakfast", label: "Breakfast", Icon: Sunrise },
  { key: "lunch",     label: "Lunch",     Icon: Sun     },
  { key: "dinner",    label: "Dinner",    Icon: Moon    },
  { key: "snack",     label: "Snack",     Icon: Apple   },
  { key: "supplement",label: "Supplement",Icon: Pill    },
];

const MACRO_CONFIGS = [
  { key: "calories" as const, label: "Calories", unit: "kcal", stroke: "#f59e0b", track: "#f59e0b" },
  { key: "protein" as const, label: "Protein", unit: "g", stroke: "#f43f5e", track: "#f43f5e" },
  { key: "carbs" as const, label: "Carbs", unit: "g", stroke: "#8b5cf6", track: "#8b5cf6" },
  { key: "fat" as const, label: "Fat", unit: "g", stroke: "#0ea5e9", track: "#0ea5e9" },
];

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

function computeTotals(entries: MealEntry[]): Totals {
  return entries.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories_kcal ?? 0),
      protein: acc.protein + parseFloat(String(m.protein_g ?? 0)),
      carbs: acc.carbs + parseFloat(String(m.carbs_g ?? 0)),
      fat: acc.fat + parseFloat(String(m.fat_g ?? 0)),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

// ── MacroRing ─────────────────────────────────────────────────────────────────

function MacroRing({
  value, goal, label, unit, strokeColor, size = 110, stroke = 11,
}: {
  value: number; goal: number; label: string; unit: string;
  strokeColor: string; size?: number; stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / goal, 1.05);
  const filled = pct * circ;
  const cx = size / 2;
  const over = value > goal;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={cx} cy={cx} r={r} fill="none" stroke={strokeColor} strokeWidth={stroke} opacity={0.12} />
          <circle cx={cx} cy={cx} r={r} fill="none" stroke={over ? "#ef4444" : strokeColor}
            strokeWidth={stroke} strokeDasharray={`${Math.min(filled, circ)} ${circ}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.9s cubic-bezier(.4,0,.2,1), stroke 0.4s ease" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span className={`font-bold text-base leading-none ${over ? "text-red-400" : "text-white"}`}>
            {value > 0 ? Math.round(value) : 0}
          </span>
          <span className="text-gray-500 text-[10px]">{unit}</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold" style={{ color: strokeColor }}>{label}</p>
        <p className="text-gray-600 text-[10px]">/ {goal}{unit}</p>
      </div>
    </div>
  );
}

// ── MealGroup ─────────────────────────────────────────────────────────────────

function MealGroup({
  mealType, label, Icon, entries, onAdd, onDelete, isDemo,
}: {
  mealType: string; label: string; Icon: LucideIcon;
  entries: MealEntry[]; isDemo: boolean;
  onAdd: (entry: Omit<MealEntry, "id" | "log_date" | "created_at">) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    description: "", calories_kcal: "", protein_g: "", carbs_g: "", fat_g: "",
  });

  const handleAdd = async () => {
    if (!form.description.trim()) return;
    setSaving(true);
    await onAdd({
      meal_type: mealType,
      description: form.description.trim(),
      calories_kcal: form.calories_kcal ? parseInt(form.calories_kcal) : null,
      protein_g: form.protein_g ? parseFloat(form.protein_g) : null,
      carbs_g: form.carbs_g ? parseFloat(form.carbs_g) : null,
      fat_g: form.fat_g ? parseFloat(form.fat_g) : null,
    });
    setForm({ description: "", calories_kcal: "", protein_g: "", carbs_g: "", fat_g: "" });
    setSaving(false);
    setIsAdding(false);
  };

  const mealCalories = entries.reduce((s, e) => s + (e.calories_kcal ?? 0), 0);

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.015] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Icon size={18} className="text-amber-400 flex-shrink-0" />
        <span className="text-sm font-semibold text-white flex-1">{label}</span>
        {mealCalories > 0 && (
          <span className="text-xs text-amber-400 font-medium">{mealCalories} kcal</span>
        )}
        <span className="text-gray-600 text-xs">{entries.length} item{entries.length !== 1 ? "s" : ""}</span>
        <button onClick={() => setIsAdding(!isAdding)}
          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all ml-1">
          {isAdding ? <X size={13} /> : <Plus size={13} />}
        </button>
      </div>

      {/* Entries */}
      <AnimatePresence mode="popLayout">
        {entries.map((entry, i) => (
          <motion.div key={entry.id}
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} transition={{ delay: i * 0.03 }}
            className="flex items-center gap-3 px-4 py-2.5 border-t border-white/[0.04]">
            <span className="text-white text-sm flex-1">{entry.description}</span>
            <div className="flex items-center gap-2 flex-shrink-0">
              {entry.calories_kcal != null && (
                <span className="text-[10px] font-semibold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                  {entry.calories_kcal}kcal
                </span>
              )}
              {entry.protein_g != null && (
                <span className="text-[10px] font-semibold text-rose-400 bg-rose-400/10 px-1.5 py-0.5 rounded">
                  {entry.protein_g}P
                </span>
              )}
              {entry.carbs_g != null && (
                <span className="text-[10px] font-semibold text-violet-400 bg-violet-400/10 px-1.5 py-0.5 rounded">
                  {entry.carbs_g}C
                </span>
              )}
            </div>
            <button onClick={() => onDelete(entry.id)}
              className="text-gray-600 hover:text-rose-400 transition-colors ml-1">
              <X size={12} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Add form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="px-4 py-3 border-t border-white/[0.06] space-y-2.5 bg-white/[0.02]">
              <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="What did you eat?"
                onKeyDown={e => e.key === "Enter" && handleAdd()}
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/40 transition-colors" />
              <div className="grid grid-cols-4 gap-2">
                {[
                  { key: "calories_kcal", placeholder: "kcal", color: "focus:border-amber-500/40" },
                  { key: "protein_g", placeholder: "Protein g", color: "focus:border-rose-500/40" },
                  { key: "carbs_g", placeholder: "Carbs g", color: "focus:border-violet-500/40" },
                  { key: "fat_g", placeholder: "Fat g", color: "focus:border-sky-500/40" },
                ].map(({ key, placeholder, color }) => (
                  <input key={key} type="number" value={form[key as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className={`w-full bg-white/[0.05] border border-white/8 rounded-lg px-2 py-1.5 text-white text-xs placeholder-gray-700 focus:outline-none ${color} transition-colors`} />
                ))}
              </div>
              <button onClick={handleAdd} disabled={saving || !form.description.trim()}
                className={`w-full py-2 rounded-xl text-xs font-semibold transition-all ${
                  isDemo ? "text-gray-500" :
                  form.description.trim()
                    ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30"
                    : "bg-white/5 text-gray-600 cursor-not-allowed"
                }`}>
                {saving ? "Adding…" : isDemo ? "Demo Mode" : "Add Item"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Demo data ─────────────────────────────────────────────────────────────────

function buildDemoMeals(): MealEntry[] {
  const today = localDateStr(new Date());
  return [
    { id: "d1", log_date: today, meal_type: "breakfast", description: "Oats with banana & almond butter", calories_kcal: 420, protein_g: 14, carbs_g: 65, fat_g: 12, created_at: "" },
    { id: "d2", log_date: today, meal_type: "breakfast", description: "Greek yoghurt + berries", calories_kcal: 180, protein_g: 18, carbs_g: 22, fat_g: 2, created_at: "" },
    { id: "d3", log_date: today, meal_type: "lunch", description: "Chicken salad wrap", calories_kcal: 520, protein_g: 38, carbs_g: 45, fat_g: 15, created_at: "" },
    { id: "d4", log_date: today, meal_type: "snack", description: "Apple + peanut butter", calories_kcal: 210, protein_g: 7, carbs_g: 28, fat_g: 9, created_at: "" },
    { id: "d5", log_date: today, meal_type: "dinner", description: "Salmon fillet with sweet potato & broccoli", calories_kcal: 580, protein_g: 42, carbs_g: 55, fat_g: 18, created_at: "" },
  ];
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function NutritionPage() {
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "true" ||
    (typeof window !== "undefined" && sessionStorage.getItem("demo") === "true");

  const [selectedDate, setSelectedDate] = useState(localDateStr(new Date()));
  const [mealEntries, setMealEntries] = useState<MealEntry[]>([]);
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [fiber, setFiber] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const isToday = selectedDate === localDateStr(new Date());
  const totals = computeTotals(mealEntries);

  const loadDay = useCallback(async (dateStr: string) => {
    if (isDemo) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [logRes, mealsRes] = await Promise.all([
      supabase.from("nutrition_logs").select("*").eq("user_id", user.id).eq("log_date", dateStr).maybeSingle(),
      supabase.from("meal_entries").select("*").eq("user_id", user.id).eq("log_date", dateStr).order("created_at"),
    ]);

    const log = logRes.data as NutritionLog | null;
    if (log) {
      setWaterGlasses(Math.round((log.water_ml ?? 0) / 250));
      setFiber(log.fiber_g != null ? String(log.fiber_g) : "");
      setNotes(log.notes ?? "");
    } else {
      setWaterGlasses(0); setFiber(""); setNotes("");
    }
    setMealEntries((mealsRes.data ?? []) as MealEntry[]);
    setLoading(false);
  }, [isDemo]);

  useEffect(() => {
    if (isDemo) {
      setMealEntries(buildDemoMeals());
      setWaterGlasses(5);
      setFiber("24");
      setLoading(false);
      return;
    }
    loadDay(selectedDate);
  }, [isDemo, selectedDate, loadDay]);

  const handleAddMeal = async (entry: Omit<MealEntry, "id" | "log_date" | "created_at">) => {
    if (isDemo) {
      setMealEntries(prev => [...prev, { ...entry, id: `demo-${Date.now()}`, log_date: selectedDate, created_at: "" }]);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("meal_entries").insert({
      user_id: user.id, log_date: selectedDate, ...entry,
    }).select().single();
    if (data) setMealEntries(prev => [...prev, data as MealEntry]);
  };

  const handleDeleteMeal = async (id: string) => {
    if (isDemo) { setMealEntries(prev => prev.filter(m => m.id !== id)); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("meal_entries").delete().eq("id", id).eq("user_id", user.id);
    setMealEntries(prev => prev.filter(m => m.id !== id));
  };

  const handleSave = async () => {
    if (isDemo) { setSaved(true); setTimeout(() => setSaved(false), 2000); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { data: cycleData } = await supabase.from("cycles").select("id")
      .eq("user_id", user.id).lte("start_date", selectedDate)
      .order("start_date", { ascending: false }).limit(1).maybeSingle();

    await supabase.from("nutrition_logs").upsert({
      user_id: user.id,
      cycle_id: (cycleData as { id: string } | null)?.id ?? null,
      log_date: selectedDate,
      water_ml: waterGlasses * 250,
      calories_kcal: Math.round(totals.calories) || null,
      protein_g: totals.protein > 0 ? parseFloat(totals.protein.toFixed(1)) : null,
      carbs_g: totals.carbs > 0 ? parseFloat(totals.carbs.toFixed(1)) : null,
      fat_g: totals.fat > 0 ? parseFloat(totals.fat.toFixed(1)) : null,
      fiber_g: fiber ? parseFloat(fiber) : null,
      notes: notes.trim() || null,
    }, { onConflict: "user_id,log_date" });

    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // Calorie progress %
  const caloriesPct = Math.min(totals.calories / DEFAULT_GOALS.calories * 100, 100);

  return (
    <div className="min-h-full bg-[#0f0f13] p-4 lg:p-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Apple size={20} className="text-amber-400" />
          <h1 className="text-xl font-bold text-white tracking-tight">Nutrition</h1>
          {isDemo && (
            <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
              Demo
            </span>
          )}
        </div>
        <p className="text-gray-400 text-sm ml-9">Log meals and track macros aligned with your cycle</p>
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
          {isToday && <p className="text-amber-400 text-xs mt-0.5">Today</p>}
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
          <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">

          {/* Macro rings + calorie bar */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-6">
            <div className="flex items-center justify-between mb-5">
              <p className="text-gray-400 text-xs uppercase tracking-widest">Daily Macros</p>
              <span className="text-xs text-amber-400 font-semibold">
                {Math.round(totals.calories)} / {DEFAULT_GOALS.calories} kcal
              </span>
            </div>

            {/* Calorie progress bar */}
            <div className="mb-6">
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${caloriesPct}%` }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                  style={{ background: caloriesPct >= 100 ? "#ef4444" : "linear-gradient(to right, #f59e0b, #f97316)" }} />
              </div>
              <p className="text-gray-600 text-[10px] mt-1.5 text-right">{Math.round(caloriesPct)}% of daily goal</p>
            </div>

            {/* Donut rings */}
            <div className="flex justify-around items-center flex-wrap gap-4">
              {MACRO_CONFIGS.map((m, i) => (
                <motion.div key={m.key} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 + i * 0.07 }}>
                  <MacroRing
                    value={m.key === "calories" ? totals.calories : totals[m.key as keyof Omit<Totals, never>]}
                    goal={DEFAULT_GOALS[m.key as keyof typeof DEFAULT_GOALS]}
                    label={m.label} unit={m.unit} strokeColor={m.stroke} />
                </motion.div>
              ))}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4">

            {/* ── Left: Meals ─────────────────────────────────────────────── */}
            <div className="space-y-4">

              {/* Water tracker */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Droplets size={16} className="text-sky-400" />
                    <p className="text-white text-sm font-semibold">Water Intake</p>
                  </div>
                  <span className="text-sky-400 text-sm font-bold">
                    {waterGlasses * 250}ml / 2000ml
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {Array.from({ length: 8 }, (_, i) => {
                    const filled = i < waterGlasses;
                    return (
                      <motion.button key={i}
                        onClick={() => setWaterGlasses(waterGlasses === i + 1 ? i : i + 1)}
                        whileTap={{ scale: 0.9 }}
                        title={`${(i + 1) * 250}ml`}
                        className={`flex-1 min-w-[32px] h-12 rounded-xl border-2 transition-all duration-300 flex flex-col-reverse overflow-hidden ${
                          filled ? "border-sky-500 shadow-sm shadow-sky-500/30" : "border-white/10 hover:border-white/20"
                        }`}>
                        <motion.div
                          animate={{ height: filled ? "100%" : "0%" }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          className="w-full bg-gradient-to-t from-sky-600 to-sky-400 opacity-70" />
                      </motion.button>
                    );
                  })}
                </div>
                <p className="text-gray-600 text-xs mt-2 text-center">Tap glasses to track · each = 250ml</p>
              </motion.div>

              {/* Meal groups */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Utensils size={15} className="text-amber-400" />
                  <p className="text-gray-400 text-xs uppercase tracking-widest">Meals</p>
                </div>
                <div className="space-y-2">
                  {MEAL_TYPES.map((mt, i) => {
                    const mtEntries = mealEntries.filter(m => m.meal_type === mt.key);
                    return (
                      <motion.div key={mt.key} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.28 + i * 0.05 }}>
                        <MealGroup
                          mealType={mt.key} label={mt.label} Icon={mt.Icon}
                          entries={mtEntries} isDemo={isDemo}
                          onAdd={handleAddMeal} onDelete={handleDeleteMeal} />
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </div>

            {/* ── Right: Summary + save ──────────────────────────────────── */}
            <div className="space-y-4">

              {/* Macro breakdown */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22 }}
                className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-5">
                <p className="text-gray-400 text-xs uppercase tracking-widest mb-4">Macro Split</p>
                <div className="space-y-3">
                  {MACRO_CONFIGS.slice(1).map(m => {
                    const val = totals[m.key as keyof Omit<Totals, never>];
                    const goal = DEFAULT_GOALS[m.key as keyof typeof DEFAULT_GOALS];
                    const pct = Math.min(val / goal * 100, 100);
                    return (
                      <div key={m.key}>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-medium" style={{ color: m.stroke }}>{m.label}</span>
                          <span className="text-gray-500 text-xs">{Math.round(val)}/{goal}g</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div className="h-full rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            style={{ background: m.stroke }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Fiber + notes */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-5 space-y-4">
                <div>
                  <label className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                    <Leaf size={11} className="text-emerald-400" /> Fiber intake (g)
                  </label>
                  <input type="number" value={fiber} placeholder="e.g. 25"
                    onChange={e => setFiber(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors placeholder-gray-600" />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                    <Target size={11} className="text-gray-400" /> Notes
                  </label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="How did eating feel today? Cravings, energy levels…"
                    rows={3}
                    className="w-full bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 resize-none focus:outline-none focus:border-amber-500/50 transition-colors" />
                </div>
              </motion.div>

              {/* Stats summary */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="grid grid-cols-2 gap-3">
                {[
                  { label: "Meals logged", value: mealEntries.length, Icon: Utensils, color: "text-amber-400" },
                  { label: "Water", value: `${waterGlasses * 250}ml`, Icon: Droplets, color: "text-sky-400" },
                  { label: "Total kcal", value: Math.round(totals.calories) || "—", Icon: Flame, color: "text-orange-400" },
                  { label: "Protein", value: `${Math.round(totals.protein)}g`, Icon: TrendingUp, color: "text-rose-400" },
                ].map((s, i) => (
                  <motion.div key={s.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.37 + i * 0.05 }}
                    className="rounded-xl border border-white/5 bg-[#1e1e2a] p-3.5">
                    <s.Icon size={13} className={`${s.color} mb-1.5`} />
                    <p className="text-white font-bold text-base leading-none">{s.value}</p>
                    <p className="text-gray-500 text-[11px] mt-0.5">{s.label}</p>
                  </motion.div>
                ))}
              </motion.div>

              {/* Cycle insight */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Info size={13} className="text-amber-400" />
                  <p className="text-amber-400 text-xs uppercase tracking-widest">Nutrition & Cycle</p>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Iron-rich foods during menstruation and complex carbs in the luteal phase help manage energy dips and cravings.
                </p>
              </motion.div>

              {/* Save button */}
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
                onClick={handleSave} disabled={saving}
                className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  saved
                    ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                    : "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-amber-500/25"
                }`}>
                {saved ? <><Check size={14} className="inline mr-2" />Saved!</>
                  : saving ? "Saving…"
                  : isDemo ? "Demo Mode — Sign in to Save"
                  : "Save Day"}
              </motion.button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
