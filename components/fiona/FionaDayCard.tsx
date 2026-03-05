"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Phase, computePhase, PHASE_CONFIG } from "@/lib/cycleUtils";

interface FionaDayCardProps {
  userId: string | null;
  cycleDay: number | null;
  cycleLength: number;
  periodLength: number;
  startDate: string | null;
  isDemo?: boolean;
}

type TabKey = "yesterday" | "today" | "tomorrow";

interface DaySummary {
  phase: Phase;
  mood?: { score: number; energy: number } | null;
  sleep?: { durationMinutes: number | null; quality: number } | null;
  symptoms?: string[];
  logged?: { mood: boolean; sleep: boolean };
}

const PHASE_RECS: Record<Phase, string[]> = {
  menstrual: [
    "Rest and prioritize warmth today",
    "Iron-rich foods like spinach & lentils help",
    "Gentle yoga or a slow walk is perfect",
  ],
  follicular: [
    "Great day to start something new",
    "Your body loves high-intensity training now",
    "Social plans and creative work thrive",
  ],
  ovulatory: [
    "Your peak energy window — go for it",
    "Best time for important conversations",
    "Try something you've been putting off",
  ],
  luteal: [
    "Wind down and reduce commitments",
    "Complex carbs & magnesium support your mood",
    "Yoga, swimming, or light strength work",
  ],
};

const TOMORROW_PREVIEW: Record<Phase, string[]> = {
  menstrual: ["Estrogen starts rising soon", "Rest remains your superpower", "Warmth and nourishment help"],
  follicular: ["Energy continues building", "Creativity is peaking", "Social connection feels energising"],
  ovulatory: ["Confidence at its highest", "Voice and communication shine", "High-intensity training works best"],
  luteal: ["Progesterone takes the lead", "Inward energy calls for reflection", "Reduce intensity and honour rest"],
};

function localDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function phaseForOffset(cycleDay: number, offset: number, periodLen: number, cycleLen: number): Phase {
  const targetDay = cycleDay + offset;
  const wrapped = ((targetDay - 1 + cycleLen * 10) % cycleLen) + 1;
  return computePhase(wrapped, periodLen, cycleLen);
}

function formatDuration(minutes: number | null): string | null {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const PHASE_ICONS: Record<Phase, string> = {
  menstrual: "🌑",
  follicular: "🌒",
  ovulatory: "🌕",
  luteal: "🌖",
};

export function FionaDayCard({
  userId,
  cycleDay,
  cycleLength,
  periodLength,
  startDate,
  isDemo,
}: FionaDayCardProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("today");
  const [data, setData] = useState<Record<TabKey, DaySummary | null>>({
    yesterday: null,
    today: null,
    tomorrow: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo || !cycleDay) {
      // Demo / no cycle data
      const demoPhase: Phase = "follicular";
      setData({
        yesterday: {
          phase: computePhase(Math.max(1, cycleDay ? cycleDay - 1 : 7), periodLength, cycleLength),
          mood: { score: 4, energy: 3 },
          sleep: { durationMinutes: 450, quality: 4 },
          symptoms: ["fatigue", "bloating"],
        },
        today: {
          phase: demoPhase,
          logged: { mood: false, sleep: true },
        },
        tomorrow: {
          phase: computePhase(cycleDay ? cycleDay + 1 : 9, periodLength, cycleLength),
        },
      });
      setLoading(false);
      return;
    }

    if (!userId) { setLoading(false); return; }

    (async () => {
      setLoading(true);
      const todayStr = localDateStr(new Date());
      const yesterdayStr = localDateStr(addDays(new Date(), -1));

      const yesterdayPhase = phaseForOffset(cycleDay, -1, periodLength, cycleLength);
      const todayPhase = phaseForOffset(cycleDay, 0, periodLength, cycleLength);
      const tomorrowPhase = phaseForOffset(cycleDay, 1, periodLength, cycleLength);

      const [moodYest, sleepYest, symptomsYest, moodToday, sleepToday] = await Promise.all([
        supabase
          .from("mood_logs")
          .select("mood_score, energy_score")
          .eq("user_id", userId)
          .eq("log_date", yesterdayStr)
          .maybeSingle(),
        supabase
          .from("sleep_logs")
          .select("duration_minutes, quality_score")
          .eq("user_id", userId)
          .eq("log_date", yesterdayStr)
          .maybeSingle(),
        supabase
          .from("symptom_logs")
          .select("symptom_types(name)")
          .eq("user_id", userId)
          .eq("log_date", yesterdayStr)
          .limit(4),
        supabase
          .from("mood_logs")
          .select("id")
          .eq("user_id", userId)
          .eq("log_date", todayStr)
          .maybeSingle(),
        supabase
          .from("sleep_logs")
          .select("id")
          .eq("user_id", userId)
          .eq("log_date", todayStr)
          .maybeSingle(),
      ]);

      const symptomNames = (symptomsYest.data ?? []).map(
        (s: Record<string, unknown>) =>
          ((s.symptom_types as Record<string, unknown>)?.name as string) ?? "unknown"
      );

      setData({
        yesterday: {
          phase: yesterdayPhase,
          mood: moodYest.data
            ? { score: moodYest.data.mood_score, energy: moodYest.data.energy_score }
            : null,
          sleep: sleepYest.data
            ? { durationMinutes: sleepYest.data.duration_minutes, quality: sleepYest.data.quality_score }
            : null,
          symptoms: symptomNames,
        },
        today: {
          phase: todayPhase,
          logged: { mood: !!moodToday.data, sleep: !!sleepToday.data },
        },
        tomorrow: {
          phase: tomorrowPhase,
        },
      });
      setLoading(false);
    })();
  }, [userId, cycleDay, cycleLength, periodLength, isDemo]);

  const tabs: TabKey[] = ["yesterday", "today", "tomorrow"];

  const current = data[activeTab];
  const phase = current?.phase ?? "follicular";
  const phaseInfo = PHASE_CONFIG[phase];

  return (
    <div className="flex flex-col h-full">
      {/* Tab header */}
      <div className="flex gap-1 p-3 border-b border-white/5 flex-shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all duration-150 ${
              activeTab === tab
                ? "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 rounded-lg bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: activeTab === "tomorrow" ? 8 : activeTab === "yesterday" ? -8 : 0 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="p-4 space-y-3"
            >
              {/* Phase header */}
              <div
                className={`rounded-xl p-3 bg-gradient-to-br ${phaseInfo.gradient}`}
                style={{ borderLeft: `3px solid ${phaseInfo.ring}` }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold text-sm">{PHASE_ICONS[phase]} {phaseInfo.label}</p>
                    <p className="text-gray-300 text-xs mt-0.5">{phaseInfo.tagline}</p>
                  </div>
                  {activeTab === "today" && cycleDay && (
                    <div className="text-right">
                      <p className="text-white font-bold text-lg leading-none">Day {cycleDay}</p>
                      <p className="text-gray-400 text-[10px]">of {cycleLength}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Yesterday content */}
              {activeTab === "yesterday" && (
                <>
                  {current?.mood ? (
                    <div className="rounded-xl bg-white/4 border border-white/5 p-3 space-y-2">
                      <p className="text-gray-400 text-[10px] uppercase tracking-widest">Mood & Energy</p>
                      <div className="flex gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-lg">{"😊😐😟😁😔"[Math.max(0, current.mood.score - 1)]}</span>
                          <span className="text-white text-sm font-medium">{current.mood.score}/5</span>
                          <span className="text-gray-500 text-xs">mood</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-lg">⚡</span>
                          <span className="text-white text-sm font-medium">{current.mood.energy}/5</span>
                          <span className="text-gray-500 text-xs">energy</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600 text-xs text-center py-2">No mood logged yesterday</p>
                  )}

                  {current?.sleep ? (
                    <div className="rounded-xl bg-white/4 border border-white/5 p-3">
                      <p className="text-gray-400 text-[10px] uppercase tracking-widest mb-2">Sleep</p>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🌙</span>
                        <span className="text-white text-sm font-medium">
                          {formatDuration(current.sleep.durationMinutes) ?? "—"}
                        </span>
                        <span className="text-gray-400 text-xs">· quality {current.sleep.quality}/5</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600 text-xs text-center py-1">No sleep logged yesterday</p>
                  )}

                  {current?.symptoms && current.symptoms.length > 0 && (
                    <div className="rounded-xl bg-white/4 border border-white/5 p-3">
                      <p className="text-gray-400 text-[10px] uppercase tracking-widest mb-2">Symptoms</p>
                      <div className="flex flex-wrap gap-1.5">
                        {current.symptoms.map((s) => (
                          <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 capitalize">
                            {s.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Today content */}
              {activeTab === "today" && (
                <>
                  <div className="space-y-2">
                    {PHASE_RECS[phase].map((rec, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: phaseInfo.ring }} />
                        {rec}
                      </div>
                    ))}
                  </div>

                  {current?.logged && (
                    <div className="rounded-xl bg-white/4 border border-white/5 p-3">
                      <p className="text-gray-400 text-[10px] uppercase tracking-widest mb-2">Today&apos;s Logs</p>
                      <div className="flex gap-3">
                        <div className={`flex items-center gap-1.5 text-xs ${current.logged.mood ? "text-emerald-400" : "text-gray-600"}`}>
                          <span>{current.logged.mood ? "✓" : "○"}</span> Mood
                        </div>
                        <div className={`flex items-center gap-1.5 text-xs ${current.logged.sleep ? "text-emerald-400" : "text-gray-600"}`}>
                          <span>{current.logged.sleep ? "✓" : "○"}</span> Sleep
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Tomorrow content */}
              {activeTab === "tomorrow" && (
                <>
                  {current?.phase !== data.today?.phase && (
                    <div className="rounded-xl border p-3 text-xs" style={{ borderColor: phaseInfo.ring + "40", background: phaseInfo.ring + "10" }}>
                      <p style={{ color: phaseInfo.ring }} className="font-semibold mb-0.5">Phase transition incoming</p>
                      <p className="text-gray-400">Your cycle shifts to {phaseInfo.label} tomorrow.</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    {TOMORROW_PREVIEW[phase].map((tip, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 opacity-60" style={{ background: phaseInfo.ring }} />
                        {tip}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
