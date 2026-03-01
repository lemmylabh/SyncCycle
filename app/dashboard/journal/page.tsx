"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────────────────────────

interface JournalEntry {
  log_date: string;
  content: string;
  updated_at?: string;
}

interface CycleInfo {
  cycle_day: number;
  phase: "menstrual" | "follicular" | "ovulatory" | "luteal" | null;
}

// ── Constants ───────────────────────────────────────────────────────────────

const PHASE_CONFIG = {
  menstrual:  { label: "Menstrual Phase",  emoji: "🌊", color: "text-rose-400",   bg: "bg-rose-500/10",   border: "border-rose-500/20"   },
  follicular: { label: "Follicular Phase", emoji: "🌱", color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/20"  },
  ovulatory:  { label: "Ovulatory Phase",  emoji: "✨", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
  luteal:     { label: "Luteal Phase",     emoji: "🌙", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
};

const PROMPTS = [
  "What's weighing on your mind today?",
  "What are you grateful for right now?",
  "How did your body feel today?",
  "What gave you energy today, and what drained it?",
  "What's one thing you want to remember about today?",
  "How are your emotions showing up in your body?",
  "What would make tomorrow even better?",
  "Describe your energy in 3 words…",
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
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function formatShort(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short",
  });
}

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function excerpt(text: string, max = 72) {
  const clean = text.replace(/\n+/g, " ").trim();
  return clean.length > max ? clean.slice(0, max) + "…" : clean;
}

// ── Demo data ────────────────────────────────────────────────────────────────

function buildDemoEntries(): JournalEntry[] {
  const today = new Date();
  return [
    {
      log_date: localDateStr(today),
      content: "Woke up feeling more like myself today. Had a solid workout this morning — hit a new personal best on my deadlift! Energy has been climbing since yesterday, which tracks with where I am in my cycle.\n\nLunch with a friend was exactly what I needed. We talked for two hours and I felt genuinely happy afterwards. It's easy to forget how much connection matters when you're in your head.\n\nThis evening I'm going to do some light stretching and read. Want to protect this good energy and not burn it out before the week really begins.",
      updated_at: new Date(today.getTime() - 2 * 3600000).toISOString(),
    },
    {
      log_date: localDateStr(addDays(today, -1)),
      content: "Bit of a rough one today. Cramps were back in the morning and I had to push through a team meeting. Managed to stay focused but felt the brain fog creeping in around 3pm.\n\nTook a long walk after dinner, which helped more than I expected. Fresh air really does something. Need to remember that when I feel sluggish.",
      updated_at: addDays(today, -1).toISOString(),
    },
    {
      log_date: localDateStr(addDays(today, -2)),
      content: "Day 1. Honestly just grateful it's finally here. Knew it was coming because of the usual mood dip yesterday. Hot water bottle was my best friend today.\n\nCancelled plans and didn't feel guilty about it — that's growth. Sometimes rest IS the productive choice.",
      updated_at: addDays(today, -2).toISOString(),
    },
    {
      log_date: localDateStr(addDays(today, -4)),
      content: "High energy, high creativity. These follicular days are something else. Got through my whole task list before noon and still had mental bandwidth left over.\n\nStarted sketching out ideas for the side project again. Everything feels possible.",
      updated_at: addDays(today, -4).toISOString(),
    },
    {
      log_date: localDateStr(addDays(today, -7)),
      content: "Luteal brain is real. Kept second-guessing my decisions all day. Tried to practice the 'name it to tame it' thing — just kept telling myself 'this is luteal, it will pass.' Helped a bit.",
      updated_at: addDays(today, -7).toISOString(),
    },
  ];
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function JournalPage() {
  const searchParams = useSearchParams();
  const isDemo =
    searchParams.get("demo") === "true" ||
    (typeof window !== "undefined" && sessionStorage.getItem("demo") === "true");

  // Date
  const [selectedDate, setSelectedDate] = useState(localDateStr(new Date()));

  // Content
  const [content, setContent]       = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [cycleInfo, setCycleInfo]   = useState<CycleInfo | null>(null);

  // Entry list
  const [entries, setEntries]       = useState<JournalEntry[]>([]);

  // UI state
  const [saving, setSaving]         = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [loading, setLoading]       = useState(true);
  const [promptIdx]                 = useState(() => Math.floor(Math.random() * PROMPTS.length));

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef   = useRef<HTMLTextAreaElement>(null);
  const isToday       = selectedDate === localDateStr(new Date());

  // ── Load ────────────────────────────────────────────────────────────────

  const loadAll = useCallback(async (dateStr: string) => {
    if (isDemo) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [entryRes, entriesRes, cycleRes] = await Promise.all([
      supabase
        .from("daily_notes")
        .select("log_date,content,updated_at")
        .eq("user_id", user.id)
        .eq("log_date", dateStr)
        .maybeSingle(),
      supabase
        .from("daily_notes")
        .select("log_date,content,updated_at")
        .eq("user_id", user.id)
        .order("log_date", { ascending: false })
        .limit(30),
      supabase
        .rpc("get_current_cycle", { p_user_id: user.id })
        .maybeSingle(),
    ]);

    const c = entryRes.data?.content ?? "";
    setContent(c);
    setSavedContent(c);
    setEntries((entriesRes.data ?? []) as JournalEntry[]);

    if (cycleRes.data) {
      const row = cycleRes.data as { cycle_day: number; phase: string };
      setCycleInfo({
        cycle_day: row.cycle_day,
        phase: row.phase as CycleInfo["phase"],
      });
    }

    setLoading(false);
  }, [isDemo]);

  useEffect(() => {
    if (isDemo) {
      const demoEntries = buildDemoEntries();
      const todayEntry = demoEntries[0];
      setContent(todayEntry.content);
      setSavedContent(todayEntry.content);
      setEntries(demoEntries);
      setCycleInfo({ cycle_day: 1, phase: "menstrual" });
      setLoading(false);
      return;
    }
    loadAll(selectedDate);
  }, [isDemo, selectedDate, loadAll]);

  // ── Auto-save on change (1.5s debounce) ────────────────────────────────

  useEffect(() => {
    if (content === savedContent || isDemo) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    setSaveStatus("idle");
    autoSaveTimer.current = setTimeout(() => { void save(content); }, 1500);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  // ── Save function ────────────────────────────────────────────────────────

  const save = async (text: string) => {
    if (isDemo) {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
      return;
    }
    if (!text.trim()) return;
    setSaving(true);
    setSaveStatus("saving");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); setSaveStatus("error"); return; }

    const { error } = await supabase
      .from("daily_notes")
      .upsert(
        { user_id: user.id, log_date: selectedDate, content: text.trim() },
        { onConflict: "user_id,log_date" },
      );

    setSaving(false);
    if (error) {
      setSaveStatus("error");
    } else {
      setSavedContent(text);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
      // Refresh entry list
      const { data } = await supabase
        .from("daily_notes")
        .select("log_date,content,updated_at")
        .eq("user_id", user.id)
        .order("log_date", { ascending: false })
        .limit(30);
      if (data) setEntries(data as JournalEntry[]);
    }
  };

  // ── Select day from sidebar ────────────────────────────────────────────

  const selectDate = (dateStr: string) => {
    if (isDemo) {
      const entry = entries.find(e => e.log_date === dateStr);
      setContent(entry?.content ?? "");
      setSavedContent(entry?.content ?? "");
      setSelectedDate(dateStr);
      return;
    }
    setSelectedDate(dateStr);
  };

  const phase = cycleInfo?.phase ? PHASE_CONFIG[cycleInfo.phase] : null;
  const isDirty = content !== savedContent;
  const wc = wordCount(content);

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-full bg-[#0f0f13] flex flex-col lg:flex-row">
      {/* ── Sidebar: entry list ─────────────────────────────────────────── */}
      <aside className="w-full lg:w-64 xl:w-72 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-white/5 bg-[#0f0f13] lg:h-full lg:overflow-y-auto">
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-lg">✦</span>
            <h1 className="text-white font-bold text-sm tracking-tight">Daily Journal</h1>
            {isDemo && (
              <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-full ml-auto">
                Demo
              </span>
            )}
          </div>
          <p className="text-gray-500 text-xs mt-1 ml-6">
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </p>
        </div>

        {/* New entry button */}
        <div className="p-3">
          <button
            onClick={() => selectDate(localDateStr(new Date()))}
            className="w-full py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-600/80 to-orange-500/80 text-white hover:opacity-90 transition-opacity"
          >
            + Today&apos;s Entry
          </button>
        </div>

        {/* Entry list */}
        <div className="px-3 pb-4 space-y-1">
          {entries.length === 0 ? (
            <p className="text-gray-600 text-xs text-center py-8">No entries yet</p>
          ) : (
            entries.map(entry => {
              const active = entry.log_date === selectedDate;
              return (
                <button
                  key={entry.log_date}
                  onClick={() => selectDate(entry.log_date)}
                  className={`w-full text-left p-3 rounded-xl transition-all ${
                    active
                      ? "bg-amber-500/15 border border-amber-500/30"
                      : "hover:bg-white/[0.04] border border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-xs font-semibold ${active ? "text-amber-300" : "text-gray-300"}`}>
                      {formatShort(entry.log_date)}
                    </span>
                    <span className="text-[10px] text-gray-600">
                      {wordCount(entry.content)}w
                    </span>
                  </div>
                  <p className="text-gray-500 text-[11px] leading-relaxed line-clamp-2">
                    {excerpt(entry.content, 80)}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ── Main editor ─────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            {/* Editor header */}
            <div className="px-6 pt-6 pb-4 border-b border-white/5 flex-shrink-0">
              {/* Date nav */}
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => selectDate(localDateStr(addDays(new Date(selectedDate + "T00:00:00"), -1)))}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all text-sm"
                >
                  ‹
                </button>
                <div className="flex-1">
                  <h2 className="text-white font-bold text-base">{formatDay(selectedDate)}</h2>
                  {isToday && <p className="text-amber-400 text-xs">Today</p>}
                </div>
                <button
                  onClick={() => {
                    const next = addDays(new Date(selectedDate + "T00:00:00"), 1);
                    if (next <= new Date()) selectDate(localDateStr(next));
                  }}
                  disabled={isToday}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ›
                </button>
              </div>

              {/* Phase banner + meta row */}
              <div className="flex items-center gap-3 flex-wrap">
                {phase && cycleInfo && (
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${phase.bg} ${phase.border} ${phase.color}`}>
                    <span>{phase.emoji}</span>
                    <span>Day {cycleInfo.cycle_day} · {phase.label}</span>
                  </div>
                )}
                <div className="ml-auto flex items-center gap-3">
                  {/* Word count */}
                  <span className="text-gray-600 text-xs">{wc} {wc === 1 ? "word" : "words"}</span>

                  {/* Save status */}
                  {saveStatus === "saving" && (
                    <span className="text-amber-400 text-xs flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full border border-amber-400 border-t-transparent animate-spin" />
                      Saving…
                    </span>
                  )}
                  {saveStatus === "saved" && (
                    <span className="text-green-400 text-xs">✓ Saved</span>
                  )}
                  {saveStatus === "error" && (
                    <span className="text-red-400 text-xs">Save failed</span>
                  )}
                  {isDirty && saveStatus === "idle" && (
                    <span className="text-gray-600 text-xs">Unsaved</span>
                  )}

                  {/* Manual save */}
                  <button
                    onClick={() => save(content)}
                    disabled={saving || !isDirty || !content.trim() || isDemo}
                    className="px-3 py-1 rounded-lg text-xs font-medium bg-amber-600/80 hover:bg-amber-600 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {isDemo ? "Demo" : "Save"}
                  </button>
                </div>
              </div>
            </div>

            {/* Textarea */}
            <div className="flex-1 overflow-y-auto p-6">
              {content === "" && !loading && (
                <p className="text-gray-600 text-sm mb-3 italic">
                  ✦ {PROMPTS[promptIdx]}
                </p>
              )}
              <textarea
                ref={textareaRef}
                value={content}
                onChange={e => setContent(e.target.value)}
                onBlur={() => { if (isDirty && content.trim()) void save(content); }}
                placeholder={`Start writing… ${PROMPTS[promptIdx]}`}
                className="w-full min-h-[60vh] bg-transparent text-white text-base leading-relaxed placeholder-gray-700 resize-none focus:outline-none"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              />
            </div>

            {/* Footer bar */}
            <div className="px-6 py-3 border-t border-white/5 flex-shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-gray-600 text-xs">{wc} words</span>
                {content.trim() && (
                  <span className="text-gray-600 text-xs">
                    ~{Math.ceil(wc / 200)} min read
                  </span>
                )}
              </div>
              {isDemo && (
                <span className="text-gray-600 text-xs">Demo Mode — Sign in to save entries</span>
              )}
              {!isDemo && (
                <span className="text-gray-600 text-xs">Auto-saves as you type</span>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
