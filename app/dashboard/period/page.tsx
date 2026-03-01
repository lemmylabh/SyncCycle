"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Waves, Check } from "lucide-react";

// ── Demo data ──────────────────────────────────────────────────────────────

function buildDemoData() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const fmt = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // Cycle started 3 days ago
  const cycleStart = new Date(now);
  cycleStart.setDate(now.getDate() - 3);

  const demoLogs = new Map<string, PeriodLogRow>();
  const flowLevels: FlowLevel[] = [2, 3, 3, 2]; // days -3, -2, -1, today
  const colors: PeriodColor[] = ["bright_red", "bright_red", "dark_red", "bright_red"];
  for (let i = 0; i <= 3; i++) {
    const d = new Date(cycleStart);
    d.setDate(cycleStart.getDate() + i);
    const ds = fmt(d);
    demoLogs.set(ds, {
      id: `demo-${i}`,
      cycle_id: "demo-cycle-1",
      log_date: ds,
      flow_level: flowLevels[i],
      color: colors[i],
      clots: i === 1,
      notes: i === 0 ? "Started today, mild cramps." : null,
    });
  }

  const demoCycles: CycleRow[] = [
    { id: "demo-cycle-1", cycle_number: 6, start_date: fmt(cycleStart), end_date: null, cycle_length: null, period_logs: [{id:"a"},{id:"b"},{id:"c"},{id:"d"}] },
    { id: "demo-cycle-2", cycle_number: 5, start_date: fmt(new Date(now.getFullYear(), now.getMonth() - 1, 3)), end_date: fmt(new Date(now.getFullYear(), now.getMonth() - 1, 30)), cycle_length: 27, period_logs: [{id:"e"},{id:"f"},{id:"g"},{id:"h"},{id:"i"}] },
    { id: "demo-cycle-3", cycle_number: 4, start_date: fmt(new Date(now.getFullYear(), now.getMonth() - 2, 6)), end_date: fmt(new Date(now.getFullYear(), now.getMonth() - 2, 4 + 28)), cycle_length: 28, period_logs: [{id:"j"},{id:"k"},{id:"l"},{id:"m"}] },
    { id: "demo-cycle-4", cycle_number: 3, start_date: fmt(new Date(now.getFullYear(), now.getMonth() - 3, 8)), end_date: fmt(new Date(now.getFullYear(), now.getMonth() - 3, 8 + 29)), cycle_length: 29, period_logs: [{id:"n"},{id:"o"},{id:"p"},{id:"q"},{id:"r"},{id:"s"}] },
  ];

  return { demoLogs, demoCycles, demoCycle: demoCycles[0] };
}

// ── Types ──────────────────────────────────────────────────────────────────

type FlowLevel = 0 | 1 | 2 | 3 | 4;
type PeriodColor = "bright_red" | "dark_red" | "pink" | "brown" | "black";

interface PeriodLogRow {
  id: string;
  cycle_id: string;
  log_date: string;
  flow_level: FlowLevel;
  color: PeriodColor | null;
  clots: boolean;
  notes: string | null;
}

interface CycleRow {
  id: string;
  cycle_number: number;
  start_date: string;
  end_date: string | null;
  cycle_length: number | null;
  period_logs?: { id: string }[];
}

// ── Config ─────────────────────────────────────────────────────────────────

const FLOW_CONFIG = [
  { value: 0 as FlowLevel, label: "Spotting",   short: "S",  desc: "Just a trace — barely there" },
  { value: 1 as FlowLevel, label: "Light",      short: "L",  desc: "Light flow, 1–2 pads a day" },
  { value: 2 as FlowLevel, label: "Medium",     short: "M",  desc: "Moderate — changing every 4 hrs" },
  { value: 3 as FlowLevel, label: "Heavy",      short: "H",  desc: "Heavy — changing every 2 hrs" },
  { value: 4 as FlowLevel, label: "Very Heavy", short: "VH", desc: "Very heavy, soaking through quickly" },
] as const;

const COLOR_CONFIG = [
  { value: "bright_red" as PeriodColor, label: "Bright Red", bg: "#ef4444", ring: "#f87171" },
  { value: "dark_red"   as PeriodColor, label: "Dark Red",   bg: "#7f1d1d", ring: "#b91c1c" },
  { value: "pink"       as PeriodColor, label: "Pink",       bg: "#fbcfe8", ring: "#f9a8d4" },
  { value: "brown"      as PeriodColor, label: "Brown",      bg: "#78350f", ring: "#92400e" },
  { value: "black"      as PeriodColor, label: "Black",      bg: "#1f2937", ring: "#374151" },
] as const;

// Rose background intensity by flow level — full class strings for Tailwind JIT
const FLOW_BG: Record<FlowLevel, string> = {
  0: "bg-rose-500/20",
  1: "bg-rose-500/35",
  2: "bg-rose-500/50",
  3: "bg-rose-500/65",
  4: "bg-rose-500/80",
};

const FLOW_TEXT: Record<FlowLevel, string> = {
  0: "text-rose-400/70",
  1: "text-rose-300",
  2: "text-rose-200",
  3: "text-white",
  4: "text-white",
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ── Helpers ────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  // Use local date, not UTC
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function localToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// ── Droplet SVG ────────────────────────────────────────────────────────────

function Droplet({ level, filled, active }: { level: FlowLevel; filled: boolean; active: boolean }) {
  const s = [15, 18, 21, 24, 27][level];
  const fill   = active ? "#f43f5e" : filled ? "rgba(244,63,94,0.45)" : "rgba(255,255,255,0.04)";
  const stroke = active ? "#f43f5e" : filled ? "rgba(244,63,94,0.7)"  : "rgba(255,255,255,0.12)";
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" className="transition-all duration-200 drop-shadow-sm">
      <path
        d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
        fill={fill}
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Chevron icons ──────────────────────────────────────────────────────────

function ChevLeft({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevRight({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function PeriodTrackerPage() {
  const now = localToday();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "true" || (typeof window !== "undefined" && sessionStorage.getItem("demo") === "true");

  // ── Navigation state
  const [selectedDate, setSelectedDate] = useState<Date>(now);
  const [viewMonth, setViewMonth]       = useState<Date>(new Date(now.getFullYear(), now.getMonth(), 1));

  // ── Auth / data state
  const [userId, setUserId]             = useState<string | null>(null);
  const [currentCycle, setCurrentCycle] = useState<CycleRow | null>(null);
  const [periodDays, setPeriodDays]     = useState<Map<string, PeriodLogRow>>(new Map());
  const [history, setHistory]           = useState<CycleRow[]>([]);
  const [loading, setLoading]           = useState(true);

  // ── Form state
  const [flowLevel, setFlowLevel] = useState<FlowLevel | null>(null);
  const [color, setColor]         = useState<PeriodColor | null>(null);
  const [clots, setClots]         = useState(false);
  const [notes, setNotes]         = useState("");
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);

  // ── Init ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isDemo) {
      const { demoLogs, demoCycles, demoCycle } = buildDemoData();
      setPeriodDays(demoLogs);
      setHistory(demoCycles);
      setCurrentCycle(demoCycle);
      setLoading(false);
      return;
    }
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        loadAll(user.id, viewMonth);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo]);

  useEffect(() => {
    if (!isDemo && userId) loadMonth(userId, viewMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMonth, userId, isDemo]);

  // ── Data loaders ───────────────────────────────────────────────────────

  async function loadAll(uid: string, month: Date) {
    setLoading(true);
    await Promise.all([loadMonth(uid, month), loadCycle(uid), loadHistory(uid)]);
    setLoading(false);
  }

  async function loadMonth(uid: string, month: Date) {
    const start = toDateStr(month);
    const end   = toDateStr(new Date(month.getFullYear(), month.getMonth() + 1, 0));
    const { data } = await supabase
      .from("period_logs")
      .select("*")
      .eq("user_id", uid)
      .gte("log_date", start)
      .lte("log_date", end);
    if (data) {
      setPeriodDays(new Map((data as PeriodLogRow[]).map(l => [l.log_date, l])));
    }
  }

  async function loadCycle(uid: string) {
    const { data } = await supabase
      .from("cycles")
      .select("*")
      .eq("user_id", uid)
      .is("end_date", null)
      .order("start_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) setCurrentCycle(data as CycleRow);
  }

  async function loadHistory(uid: string) {
    const { data } = await supabase
      .from("cycles")
      .select("*, period_logs(id)")
      .eq("user_id", uid)
      .order("start_date", { ascending: false })
      .limit(8);
    if (data) setHistory(data as CycleRow[]);
  }

  // ── Populate form when selected date changes ───────────────────────────

  useEffect(() => {
    const log = periodDays.get(toDateStr(selectedDate));
    if (log) {
      setFlowLevel(log.flow_level);
      setColor(log.color);
      setClots(log.clots);
      setNotes(log.notes ?? "");
    } else {
      setFlowLevel(null);
      setColor(null);
      setClots(false);
      setNotes("");
    }
    setSaved(false);
  }, [selectedDate, periodDays]);

  // ── Save ───────────────────────────────────────────────────────────────

  async function handleSave() {
    if (isDemo || !userId || flowLevel === null) return;
    setSaving(true);
    try {
      // Reuse the cycle_id from an existing log on this date, or the active cycle, or create a new one
      let cycleId = periodDays.get(toDateStr(selectedDate))?.cycle_id ?? currentCycle?.id;

      if (!cycleId) {
        const { data: max } = await supabase
          .from("cycles")
          .select("cycle_number")
          .eq("user_id", userId)
          .order("cycle_number", { ascending: false })
          .limit(1)
          .maybeSingle();

        const { data: newCycle, error: cErr } = await supabase
          .from("cycles")
          .insert({
            user_id:      userId,
            cycle_number: (max?.cycle_number ?? 0) + 1,
            start_date:   toDateStr(selectedDate),
          })
          .select()
          .single();

        if (cErr) throw cErr;
        cycleId = newCycle.id;
        setCurrentCycle(newCycle as CycleRow);
      }

      const { error } = await supabase.from("period_logs").upsert(
        {
          user_id:    userId,
          cycle_id:   cycleId,
          log_date:   toDateStr(selectedDate),
          flow_level: flowLevel,
          color,
          clots,
          notes: notes.trim() || null,
        },
        { onConflict: "user_id,log_date" }
      );
      if (error) throw error;

      // Update local cache so the calendar refreshes instantly
      setPeriodDays(prev => {
        const next = new Map(prev);
        next.set(toDateStr(selectedDate), {
          id: prev.get(toDateStr(selectedDate))?.id ?? "",
          cycle_id:   cycleId!,
          log_date:   toDateStr(selectedDate),
          flow_level: flowLevel,
          color,
          clots,
          notes: notes.trim() || null,
        });
        return next;
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error("Save failed:", e);
    } finally {
      setSaving(false);
    }
  }

  // ── Calendar ───────────────────────────────────────────────────────────

  const calendarDays: (Date | null)[] = (() => {
    const y = viewMonth.getFullYear();
    const m = viewMonth.getMonth();
    const first  = new Date(y, m, 1);
    const last   = new Date(y, m + 1, 0);
    let offset   = first.getDay() - 1;
    if (offset < 0) offset = 6;
    const cells: (Date | null)[] = Array(offset).fill(null);
    for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(y, m, d));
    return cells;
  })();

  const todayStr    = toDateStr(now);
  const selectedStr = toDateStr(selectedDate);

  // ── Derived stats ──────────────────────────────────────────────────────

  const cycleDay = currentCycle
    ? Math.floor((now.getTime() - new Date(currentCycle.start_date).getTime()) / 86400000) + 1
    : null;

  const avgCycleLength = history.length > 1
    ? Math.round(history.filter(c => c.cycle_length).map(c => c.cycle_length!).reduce((a, b) => a + b, 0) / history.filter(c => c.cycle_length).length)
    : null;

  const avgPeriodLength = history.length > 0
    ? Math.round(history.filter(c => (c.period_logs?.length ?? 0) > 0).map(c => c.period_logs!.length).reduce((a, b) => a + b, 0) / Math.max(history.filter(c => (c.period_logs?.length ?? 0) > 0).length, 1))
    : null;

  // ── Date navigation ────────────────────────────────────────────────────

  function prevDay() {
    setSelectedDate(d => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; });
  }
  function nextDay() {
    setSelectedDate(d => {
      const n = new Date(d);
      n.setDate(n.getDate() + 1);
      return n <= now ? n : d;
    });
  }

  // ── Loading skeleton ───────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">

      {/* ─── Page header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Tracker 1 of 4</p>
          <h1 className="text-white text-2xl font-bold tracking-tight">Period Tracker</h1>
        </div>
        {cycleDay !== null && (
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-rose-500/15 border border-rose-500/25 px-4 py-1.5 text-rose-400 text-sm font-medium">
              Cycle Day {cycleDay}
            </span>
          </div>
        )}
      </div>

      {/* ─── Month calendar ─── */}
      <div className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-6">

        {/* Month navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setViewMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
          >
            <ChevLeft />
          </button>
          <div className="text-center">
            <h2 className="text-white font-semibold">
              {viewMonth.toLocaleDateString("en", { month: "long", year: "numeric" })}
            </h2>
            <p className="text-gray-600 text-xs mt-0.5">
              {periodDays.size} day{periodDays.size !== 1 ? "s" : ""} logged this month
            </p>
          </div>
          <button
            onClick={() => setViewMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
            disabled={viewMonth >= new Date(now.getFullYear(), now.getMonth(), 1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevRight />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-2">
          {WEEKDAYS.map(w => (
            <p key={w} className="text-center text-gray-600 text-[11px] font-semibold uppercase tracking-wider py-1">
              {w}
            </p>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {calendarDays.map((d, i) => {
            if (!d) return <div key={`e${i}`} />;
            const ds    = toDateStr(d);
            const log   = periodDays.get(ds);
            const isP   = !!log;
            const isSel = ds === selectedStr;
            const isTod = ds === todayStr;
            const isFut = d > now;
            const fl    = log?.flow_level;

            return (
              <button
                key={i}
                onClick={() => !isFut && setSelectedDate(new Date(d))}
                disabled={isFut}
                className={[
                  "relative flex items-center justify-center h-10 rounded-xl text-sm font-medium",
                  "transition-all duration-150",
                  isFut   ? "text-gray-700 cursor-not-allowed" : "cursor-pointer",
                  isSel   ? "ring-2 ring-white/50 ring-offset-1 ring-offset-[#1e1e2a]" : "",
                  isP && fl !== undefined ? FLOW_BG[fl] : "",
                  isP && fl !== undefined ? FLOW_TEXT[fl] : "",
                  !isP && isSel ? "bg-white/10 text-white" : "",
                  !isP && !isSel && !isFut ? "hover:bg-white/5 text-gray-400" : "",
                  isTod && !isP && !isSel ? "text-white font-bold" : "",
                ].join(" ")}
              >
                {/* Today dot */}
                {isTod && (
                  <span className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500" />
                )}
                {d.getDate()}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-5 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {([0,1,2,3,4] as FlowLevel[]).map(l => (
                <span key={l} className={`w-3 h-3 rounded-sm ${FLOW_BG[l]}`} />
              ))}
            </div>
            <span className="text-gray-500 text-xs">Light → Very Heavy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span className="text-gray-500 text-xs">Today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm border border-white/40" />
            <span className="text-gray-500 text-xs">Selected</span>
          </div>
        </div>
      </div>

      {/* ─── 3-column section ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Left: Cycle stats ── */}
        <div className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-6 flex flex-col gap-5">
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Current Cycle</p>
            <h2 className="text-white text-lg font-semibold">
              {currentCycle ? `Cycle #${currentCycle.cycle_number}` : "No Active Cycle"}
            </h2>
          </div>

          {/* Cycle day ring */}
          <div className="flex justify-center">
            {(() => {
              const total = avgCycleLength ?? 28;
              const pct   = cycleDay ? Math.min(cycleDay / total, 1) : 0;
              const R     = 50;
              const C     = 2 * Math.PI * R;
              return (
                <div className="relative w-32 h-32">
                  <svg viewBox="0 0 120 120" className="-rotate-90 w-32 h-32">
                    <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                    <circle
                      cx="60" cy="60" r={R}
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={C}
                      strokeDashoffset={C * (1 - pct)}
                      style={{ transition: "stroke-dashoffset 0.8s ease" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {cycleDay !== null ? (
                      <>
                        <span className="text-3xl font-bold text-white leading-none">{cycleDay}</span>
                        <span className="text-gray-500 text-xs mt-1">of {total} days</span>
                      </>
                    ) : (
                      <span className="text-gray-600 text-sm text-center px-4">Start logging to track</span>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Stat rows */}
          <div className="divide-y divide-white/5 text-sm">
            {currentCycle && (
              <div className="flex justify-between items-center py-2.5">
                <span className="text-gray-400">Cycle started</span>
                <span className="text-white font-medium">
                  {new Date(currentCycle.start_date).toLocaleDateString("en", { month: "short", day: "numeric" })}
                </span>
              </div>
            )}
            {avgCycleLength && (
              <div className="flex justify-between items-center py-2.5">
                <span className="text-gray-400">Avg cycle length</span>
                <span className="text-white font-medium">{avgCycleLength} days</span>
              </div>
            )}
            {avgPeriodLength && (
              <div className="flex justify-between items-center py-2.5">
                <span className="text-gray-400">Avg period length</span>
                <span className="text-white font-medium">{avgPeriodLength} days</span>
              </div>
            )}
            <div className="flex justify-between items-center py-2.5">
              <span className="text-gray-400">Days logged</span>
              <span className="text-white font-medium">{periodDays.size} this month</span>
            </div>
          </div>

          {/* Quick-jump to today */}
          {toDateStr(selectedDate) !== todayStr && (
            <button
              onClick={() => setSelectedDate(now)}
              className="w-full rounded-xl border border-white/5 py-2 text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Jump to today
            </button>
          )}
        </div>

        {/* ── Center: Log form ── */}
        <div className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-6 flex flex-col gap-5">

          {/* Date nav header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Logging</p>
              <p className="text-white font-semibold">
                {selectedDate.toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric" })}
              </p>
              {toDateStr(selectedDate) === todayStr && (
                <span className="text-rose-400 text-xs">Today</span>
              )}
            </div>
            <div className="flex gap-1">
              <button
                onClick={prevDay}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
              >
                <ChevLeft size={14} />
              </button>
              <button
                onClick={nextDay}
                disabled={selectedDate >= now}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
              >
                <ChevRight size={14} />
              </button>
            </div>
          </div>

          {/* Flow level */}
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-3">Flow Level</p>
            <div className="flex gap-1.5">
              {FLOW_CONFIG.map(f => {
                const active  = flowLevel === f.value;
                const filled  = flowLevel !== null && f.value <= flowLevel;
                return (
                  <button
                    key={f.value}
                    onClick={() => setFlowLevel(active ? null : f.value)}
                    className={[
                      "flex flex-col items-center justify-end gap-2 pt-3 pb-2 px-1.5 rounded-xl flex-1",
                      "transition-all duration-150 border",
                      active
                        ? "bg-rose-500/15 border-rose-500/40"
                        : "hover:bg-white/5 border-transparent",
                    ].join(" ")}
                    title={f.label}
                  >
                    <Droplet level={f.value} filled={filled} active={active} />
                    <span className={`text-[10px] font-bold leading-none ${active ? "text-rose-400" : "text-gray-600"}`}>
                      {f.short}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-gray-500 text-xs text-center mt-2.5 h-4 transition-all">
              {flowLevel !== null ? FLOW_CONFIG[flowLevel].desc : "Tap a droplet to log your flow"}
            </p>
          </div>

          {/* Color picker */}
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-3">Color</p>
            <div className="flex items-center gap-3">
              {COLOR_CONFIG.map(c => {
                const active = color === c.value;
                return (
                  <button
                    key={c.value}
                    onClick={() => setColor(active ? null : c.value)}
                    title={c.label}
                    style={{
                      backgroundColor: c.bg,
                      boxShadow: active ? `0 0 0 3px #1e1e2a, 0 0 0 5px ${c.ring}` : "none",
                    }}
                    className={`w-8 h-8 rounded-full transition-all duration-150 hover:scale-110 border border-white/10 ${active ? "scale-110" : ""}`}
                  />
                );
              })}
              <span className="text-gray-500 text-xs ml-1 min-w-[60px]">
                {color ? COLOR_CONFIG.find(c => c.value === color)?.label : ""}
              </span>
            </div>
          </div>

          {/* Clots toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-medium">Clots</p>
              <p className="text-gray-600 text-xs mt-0.5">Blood clots present</p>
            </div>
            <button
              onClick={() => setClots(c => !c)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${clots ? "bg-rose-500" : "bg-white/10"}`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-200 ${clots ? "left-5" : "left-0.5"}`}
              />
            </button>
          </div>

          {/* Notes */}
          <div className="flex-1">
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">Notes</p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="How are you feeling today?"
              rows={3}
              className="w-full bg-white/[0.04] border border-white/5 rounded-xl px-3 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-rose-500/40 focus:bg-white/[0.06] resize-none transition-colors"
            />
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={isDemo || saving || flowLevel === null}
            className={[
              "w-full rounded-xl py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.99]",
              saved
                ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                : "bg-gradient-to-r from-rose-500 to-purple-600 text-white hover:opacity-90",
              isDemo || saving || flowLevel === null ? "opacity-40 cursor-not-allowed" : "",
            ].join(" ")}
          >
            {saved ? <><Check size={14} className="inline mr-1" />Saved</> : saving ? "Saving…" : isDemo ? "Demo Mode — Sign in to Save" : "Save Log"}
          </button>

          {!isDemo && flowLevel === null && (
            <p className="text-gray-600 text-xs text-center -mt-3">Select a flow level to enable saving</p>
          )}
        </div>

        {/* ── Right: History ── */}
        <div className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-6 flex flex-col gap-4">
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">History</p>
            <h2 className="text-white text-lg font-semibold">Past Cycles</h2>
          </div>

          {history.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center py-10 px-4">
              <div>
                <Waves size={36} className="text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No history yet.</p>
                <p className="text-gray-600 text-xs mt-1">Log your first cycle to see patterns here.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {history.map(cycle => {
                const start       = new Date(cycle.start_date);
                const periodLen   = cycle.period_logs?.length ?? 0;
                const cycleLen    = cycle.cycle_length;
                const isOngoing   = !cycle.end_date;

                return (
                  <div key={cycle.id} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3.5 hover:bg-white/[0.05] transition-colors">
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-semibold">Cycle #{cycle.cycle_number}</span>
                        {isOngoing && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-medium">Ongoing</span>
                        )}
                      </div>
                      <span className="text-gray-600 text-xs">
                        {start.toLocaleDateString("en", { month: "short", day: "numeric" })}
                      </span>
                    </div>

                    {/* Period length bar (7 day max) */}
                    <div className="flex items-center gap-1.5 mb-1.5">
                      {Array.from({ length: 7 }, (_, i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${i < periodLen ? "bg-rose-500/70" : "bg-white/5"}`}
                        />
                      ))}
                      <span className="text-gray-500 text-[10px] flex-shrink-0 w-6 text-right">
                        {periodLen > 0 ? `${periodLen}d` : "—"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-[10px]">Period length</span>
                      {cycleLen !== null && (
                        <span className="text-gray-600 text-[10px]">Cycle: {cycleLen} days</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
