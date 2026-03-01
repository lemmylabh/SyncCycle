"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  type LucideIcon,
  Activity, AlertCircle, BatteryLow, Brain, Check,
  Cloud, CloudRain, Cookie, Droplet, Flame, Frown,
  Heart, Moon, Shuffle, Sparkles, Waves, Wind, Zap,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

type Category = "physical" | "emotional" | "energy";
type Severity = 1 | 2 | 3 | 4 | 5;

interface SymptomType {
  id: string;
  name: string;
  label: string;
  category: Category;
  icon: string;
  display_order: number;
}

interface SymptomLog {
  id: string;
  symptom_type_id: string;
  severity: Severity;
  notes: string | null;
}

interface TrendEntry {
  log_date: string;
  symptom_type_id: string;
  severity: Severity;
}

// ── Icon map ────────────────────────────────────────────────────────────────

const SYMPTOM_ICON_MAP: Record<string, LucideIcon> = {
  cramps:            Waves,
  bloating:          Wind,
  headache:          Brain,
  breast_tenderness: Heart,
  backache:          Activity,
  nausea:            Frown,
  acne:              Sparkles,
  spotting:          Droplet,
  mood_swings:       Shuffle,
  anxiety:           AlertCircle,
  irritability:      Flame,
  brain_fog:         Cloud,
  low_mood:          CloudRain,
  cravings:          Cookie,
  fatigue:           BatteryLow,
  high_energy:       Zap,
  insomnia:          Moon,
};

function SymptomIcon({ name, size = 20 }: { name: string; size?: number }) {
  const Icon = SYMPTOM_ICON_MAP[name] ?? Activity;
  return <Icon size={size} />;
}

// ── Demo data ──────────────────────────────────────────────────────────────

const DEMO_SYMPTOM_TYPES: SymptomType[] = [
  { id: "s1",  name: "cramps",            label: "Cramps",            category: "physical",  icon: "🌊", display_order: 1  },
  { id: "s2",  name: "bloating",          label: "Bloating",          category: "physical",  icon: "💨", display_order: 2  },
  { id: "s3",  name: "headache",          label: "Headache",          category: "physical",  icon: "🤕", display_order: 3  },
  { id: "s4",  name: "breast_tenderness", label: "Breast Tenderness", category: "physical",  icon: "💗", display_order: 4  },
  { id: "s5",  name: "backache",          label: "Back Ache",         category: "physical",  icon: "🔙", display_order: 5  },
  { id: "s6",  name: "nausea",            label: "Nausea",            category: "physical",  icon: "🤢", display_order: 6  },
  { id: "s7",  name: "acne",              label: "Acne",              category: "physical",  icon: "✦",  display_order: 7  },
  { id: "s8",  name: "spotting",          label: "Spotting",          category: "physical",  icon: "🩸", display_order: 8  },
  { id: "s9",  name: "mood_swings",       label: "Mood Swings",       category: "emotional", icon: "🎭", display_order: 9  },
  { id: "s10", name: "anxiety",           label: "Anxiety",           category: "emotional", icon: "😰", display_order: 10 },
  { id: "s11", name: "irritability",      label: "Irritability",      category: "emotional", icon: "😤", display_order: 11 },
  { id: "s12", name: "brain_fog",         label: "Brain Fog",         category: "emotional", icon: "🌫️", display_order: 12 },
  { id: "s13", name: "low_mood",          label: "Low Mood",          category: "emotional", icon: "😔", display_order: 13 },
  { id: "s14", name: "cravings",          label: "Cravings",          category: "emotional", icon: "🍫", display_order: 14 },
  { id: "s15", name: "fatigue",           label: "Fatigue",           category: "energy",    icon: "😴", display_order: 15 },
  { id: "s16", name: "high_energy",       label: "High Energy",       category: "energy",    icon: "⚡", display_order: 16 },
  { id: "s17", name: "insomnia",          label: "Insomnia",          category: "energy",    icon: "🌙", display_order: 17 },
];

function buildDemoSymptoms(todayStr: string): Map<string, SymptomLog> {
  const logs = new Map<string, SymptomLog>();
  const todayLogs = [
    { id: "s1", sev: 3 }, { id: "s2", sev: 2 }, { id: "s15", sev: 4 }, { id: "s9", sev: 2 },
  ];
  todayLogs.forEach(({ id, sev }) => {
    logs.set(id, { id: `demo-log-${id}`, symptom_type_id: id, severity: sev as Severity, notes: null });
  });
  return logs;
}

function buildDemoTrend(todayStr: string): TrendEntry[] {
  const trend: TrendEntry[] = [];
  const base = new Date(todayStr);
  const data: { sid: string; sevs: number[] }[] = [
    { sid: "s1",  sevs: [4, 3, 3, 2, 2, 0, 0] },
    { sid: "s2",  sevs: [3, 2, 2, 2, 1, 0, 0] },
    { sid: "s15", sevs: [3, 4, 3, 4, 3, 2, 1] },
    { sid: "s9",  sevs: [2, 2, 3, 2, 1, 0, 0] },
  ];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    const ds = toDateStr(d);
    data.forEach(({ sid, sevs }) => {
      const sev = sevs[6 - i];
      if (sev > 0) trend.push({ log_date: ds, symptom_type_id: sid, severity: sev as Severity });
    });
  }
  return trend;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function localToday() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }

function ChevLeft() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>;
}
function ChevRight() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>;
}

const CATEGORY_CONFIG: Record<Category, { label: string; color: string; accent: string; bg: string }> = {
  physical:  { label: "Physical",  color: "text-rose-400",   accent: "border-rose-500",   bg: "bg-rose-500/20"   },
  emotional: { label: "Emotional", color: "text-purple-400", accent: "border-purple-500", bg: "bg-purple-500/20" },
  energy:    { label: "Energy",    color: "text-amber-400",  accent: "border-amber-500",  bg: "bg-amber-500/20"  },
};

const SEV_COLORS = ["", "bg-rose-900/60", "bg-rose-700/60", "bg-rose-500/70", "bg-rose-500", "bg-rose-400"];
const SEV_LABELS = ["", "Mild", "Low", "Moderate", "High", "Severe"];

// ── Main Page ──────────────────────────────────────────────────────────────

export default function SymptomsPage() {
  const now = localToday();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "true" || (typeof window !== "undefined" && sessionStorage.getItem("demo") === "true");

  const [selectedDate, setSelectedDate] = useState(now);
  const [activeCategory, setActiveCategory] = useState<Category>("physical");

  const [userId, setUserId]         = useState<string | null>(null);
  const [symptomTypes, setSymptomTypes] = useState<SymptomType[]>([]);
  const [todayLogs, setTodayLogs]   = useState<Map<string, SymptomLog>>(new Map());
  const [trend, setTrend]           = useState<TrendEntry[]>([]);
  const [cycleId, setCycleId]       = useState<string | null>(null);
  const [loading, setLoading]       = useState(true);

  // Active selection state (pending before save)
  const [selected, setSelected]     = useState<Map<string, Severity>>(new Map());
  const [notes, setNotes]           = useState("");
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);

  // ── Init ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isDemo) {
      const ds = toDateStr(selectedDate);
      setSymptomTypes(DEMO_SYMPTOM_TYPES);
      const demoLogs = buildDemoSymptoms(ds);
      setTodayLogs(demoLogs);
      setTrend(buildDemoTrend(ds));
      const initSel = new Map<string, Severity>();
      demoLogs.forEach((log, sid) => initSel.set(sid, log.severity));
      setSelected(initSel);
      setLoading(false);
      return;
    }
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      loadAll(user.id, selectedDate);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo]);

  useEffect(() => {
    if (!isDemo && userId) loadAll(userId, selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, userId]);

  async function loadAll(uid: string, date: Date) {
    setLoading(true);
    const ds = toDateStr(date);

    // Get 7 days for trend
    const weekAgo = new Date(date);
    weekAgo.setDate(date.getDate() - 6);

    const [typesRes, logsRes, trendRes, cycleRes] = await Promise.all([
      supabase.from("symptom_types").select("*").order("display_order"),
      supabase.from("symptom_logs").select("*").eq("user_id", uid).eq("log_date", ds),
      supabase.from("symptom_logs").select("log_date,symptom_type_id,severity").eq("user_id", uid).gte("log_date", toDateStr(weekAgo)).lte("log_date", ds),
      supabase.from("cycles").select("id").eq("user_id", uid).is("end_date", null).order("start_date", { ascending: false }).limit(1).maybeSingle(),
    ]);

    if (typesRes.data) setSymptomTypes(typesRes.data as SymptomType[]);
    if (logsRes.data) {
      const m = new Map<string, SymptomLog>();
      (logsRes.data as SymptomLog[]).forEach(l => m.set(l.symptom_type_id, l));
      setTodayLogs(m);
      const s = new Map<string, Severity>();
      (logsRes.data as SymptomLog[]).forEach(l => s.set(l.symptom_type_id, l.severity));
      setSelected(s);
    } else {
      setTodayLogs(new Map()); setSelected(new Map());
    }
    if (trendRes.data) setTrend(trendRes.data as TrendEntry[]);
    if (cycleRes.data) setCycleId(cycleRes.data.id);
    setNotes("");
    setSaved(false);
    setLoading(false);
  }

  // ── Toggle symptom ────────────────────────────────────────────────────

  function toggleSymptom(sid: string) {
    setSelected(prev => {
      const next = new Map(prev);
      if (next.has(sid)) next.delete(sid);
      else next.set(sid, 3);
      return next;
    });
    setSaved(false);
  }

  function setSeverity(sid: string, sev: Severity) {
    setSelected(prev => new Map(prev).set(sid, sev));
    setSaved(false);
  }

  // ── Save ───────────────────────────────────────────────────────────────

  async function handleSave() {
    if (isDemo || !userId) return;
    setSaving(true);
    const ds = toDateStr(selectedDate);
    try {
      const toInsert = Array.from(selected.entries()).map(([sid, sev]) => ({
        user_id: userId,
        cycle_id: cycleId,
        log_date: ds,
        symptom_type_id: sid,
        severity: sev,
        notes: notes.trim() || null,
      }));

      // Delete existing logs for this day then reinsert
      await supabase.from("symptom_logs").delete().eq("user_id", userId).eq("log_date", ds);
      if (toInsert.length > 0) {
        const { error } = await supabase.from("symptom_logs").insert(toInsert);
        if (error) throw error;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  // ── Derived ────────────────────────────────────────────────────────────

  const filtered = symptomTypes.filter(s => s.category === activeCategory);
  const todayStr = toDateStr(now);
  const selectedStr = toDateStr(selectedDate);
  const isFuture = selectedDate > now;

  // Build 7-day dates for trend
  const trendDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(selectedDate);
    d.setDate(selectedDate.getDate() - 6 + i);
    return toDateStr(d);
  });

  // Symptoms with any trend data
  const trendSymptoms = symptomTypes.filter(st =>
    trend.some(t => t.symptom_type_id === st.id)
  ).slice(0, 6);

  function getTrendSev(sid: string, ds: string): number {
    return trend.find(t => t.symptom_type_id === sid && t.log_date === ds)?.severity ?? 0;
  }

  function prevDay() { setSelectedDate(d => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; }); }
  function nextDay() { setSelectedDate(d => { const n = new Date(d); n.setDate(n.getDate() + 1); return n <= now ? n : d; }); }

  if (loading) {
    return <div className="p-6 flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" /></div>;
  }

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Tracker 2 of 4</p>
          <h1 className="text-white text-2xl font-bold tracking-tight">Symptoms</h1>
        </div>
        <span className="rounded-full bg-purple-500/15 border border-purple-500/25 px-4 py-1.5 text-purple-400 text-sm font-medium">
          {selected.size} logged today
        </span>
      </div>

      {/* Date nav */}
      <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-[#1e1e2a] px-5 py-3">
        <button onClick={prevDay} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
          <ChevLeft />
        </button>
        <div className="text-center">
          <p className="text-white font-semibold">
            {selectedDate.toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          {selectedStr === todayStr && <p className="text-purple-400 text-xs mt-0.5">Today</p>}
        </div>
        <button onClick={nextDay} disabled={selectedDate >= now} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors disabled:opacity-25 disabled:cursor-not-allowed">
          <ChevRight />
        </button>
      </div>

      {/* Main 2-col */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Left: Symptom grid */}
        <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-[#1e1e2a] p-6 flex flex-col gap-4">

          {/* Category tabs */}
          <div className="flex gap-2">
            {(["physical", "emotional", "energy"] as Category[]).map(cat => {
              const cfg = CATEGORY_CONFIG[cat];
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-150 border ${
                    active
                      ? `${cfg.bg} ${cfg.accent} ${cfg.color}`
                      : "border-white/5 text-gray-500 hover:text-gray-300 hover:bg-white/5"
                  }`}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>

          {/* Symptom cards grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {filtered.map(st => {
              const isSelected = selected.has(st.id);
              const sev = selected.get(st.id);
              const cfg = CATEGORY_CONFIG[st.category];

              return (
                <div key={st.id} className="flex flex-col gap-1.5">
                  <button
                    onClick={() => toggleSymptom(st.id)}
                    className={[
                      "flex flex-col items-center gap-2 py-3 px-2 rounded-xl transition-all duration-150 border w-full",
                      isSelected
                        ? `${cfg.bg} ${cfg.accent} border-opacity-60`
                        : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.07]",
                    ].join(" ")}
                  >
                    <SymptomIcon name={st.name} size={24} />
                    <span className={`text-xs font-medium text-center leading-tight ${isSelected ? cfg.color : "text-gray-400"}`}>
                      {st.label}
                    </span>
                  </button>

                  {/* Severity dots — only show when selected */}
                  {isSelected && sev !== undefined && (
                    <div className="flex justify-center gap-1 pb-1">
                      {([1, 2, 3, 4, 5] as Severity[]).map(s => (
                        <button
                          key={s}
                          onClick={() => setSeverity(st.id, s)}
                          className={`w-4 h-4 rounded-full border transition-all duration-100 ${
                            s <= sev
                              ? "bg-rose-500 border-rose-500"
                              : "bg-transparent border-white/20 hover:border-rose-400"
                          }`}
                          title={SEV_LABELS[s]}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-gray-600 text-xs text-center">
            Tap to add · Rate severity with the dots below
          </p>
        </div>

        {/* Right: Today's log + notes + save */}
        <div className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-6 flex flex-col gap-4">
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Today's Log</p>
            <h2 className="text-white text-lg font-semibold">
              {selected.size > 0 ? `${selected.size} symptom${selected.size !== 1 ? "s" : ""}` : "Nothing logged yet"}
            </h2>
          </div>

          {selected.size === 0 ? (
            <div className="flex-1 flex items-center justify-center py-8 text-center">
              <div>
                <Heart size={28} className="text-gray-700 mx-auto mb-2" />
                <p className="text-gray-600 text-sm">Select symptoms from the grid to start logging</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 flex-1">
              {Array.from(selected.entries()).map(([sid, sev]) => {
                const st = symptomTypes.find(s => s.id === sid);
                if (!st) return null;
                return (
                  <div key={sid} className="flex items-center justify-between py-2 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <SymptomIcon name={st.name} size={16} />
                      <span className="text-gray-300 text-sm">{st.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {([1, 2, 3, 4, 5] as Severity[]).map(s => (
                        <button
                          key={s}
                          onClick={() => setSeverity(sid, s)}
                          className={`w-3 h-3 rounded-full transition-colors ${
                            s <= sev ? "bg-rose-500" : "bg-white/10 hover:bg-rose-500/40"
                          }`}
                        />
                      ))}
                      <button
                        onClick={() => toggleSymptom(sid)}
                        className="ml-1 text-gray-600 hover:text-rose-400 transition-colors text-xs"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div>
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">Notes</p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any additional notes…"
              rows={3}
              className="w-full bg-white/[0.04] border border-white/5 rounded-xl px-3 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-purple-500/40 resize-none transition-colors"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={isDemo || saving || selected.size === 0}
            className={[
              "w-full rounded-xl py-3 text-sm font-semibold transition-all duration-200",
              saved
                ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                : "bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90",
              isDemo || saving || selected.size === 0 ? "opacity-40 cursor-not-allowed" : "",
            ].join(" ")}
          >
            {saved ? <><Check size={14} className="inline mr-1" />Saved</> : saving ? "Saving…" : isDemo ? "Demo — Sign in to Save" : "Save Symptoms"}
          </button>
        </div>
      </div>

      {/* 7-day trend */}
      {trendSymptoms.length > 0 && (
        <div className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-6">
          <div className="mb-4">
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">7-Day Pattern</p>
            <h2 className="text-white text-lg font-semibold">Symptom Trend</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left text-gray-600 text-xs font-medium pb-3 w-36">Symptom</th>
                  {trendDates.map(ds => {
                    const d = new Date(ds + "T00:00:00");
                    const isToday = ds === todayStr;
                    return (
                      <th key={ds} className="pb-3 text-center">
                        <div className={`text-[10px] font-medium ${isToday ? "text-white" : "text-gray-600"}`}>
                          {d.toLocaleDateString("en", { weekday: "short" })}
                        </div>
                        <div className={`text-[10px] ${isToday ? "text-rose-400" : "text-gray-700"}`}>
                          {d.getDate()}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {trendSymptoms.map(st => (
                  <tr key={st.id}>
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-2">
                        <SymptomIcon name={st.name} size={14} />
                        <span className="text-gray-400 text-xs">{st.label}</span>
                      </div>
                    </td>
                    {trendDates.map(ds => {
                      const sev = getTrendSev(st.id, ds);
                      const isToday = ds === todayStr;
                      return (
                        <td key={ds} className="py-2 text-center">
                          <div
                            className={`w-7 h-7 rounded-lg mx-auto transition-colors ${
                              sev > 0 ? SEV_COLORS[sev] : "bg-white/[0.04]"
                            } ${isToday ? "ring-1 ring-white/20" : ""}`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/5">
              <span className="text-gray-600 text-xs">Intensity:</span>
              {[1,2,3,4,5].map(s => (
                <div key={s} className="flex items-center gap-1">
                  <div className={`w-3 h-3 rounded-sm ${SEV_COLORS[s]}`} />
                  <span className="text-gray-600 text-[10px]">{SEV_LABELS[s]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
