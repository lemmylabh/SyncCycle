import { Phase } from "@/lib/cycleUtils";

// ── Types ──────────────────────────────────────────────────────────────────────

export type InsightHashtag = "period" | "symptoms" | "vibe" | "nutrition" | "fitness" | "sleep";
export type InsightCardType = "insight" | "prediction" | "suggestion" | "pattern";

export interface InsightCardData {
  id: string;
  hashtags: InsightHashtag[];
  body: string;
  suggestion: string | null;
  correlationKey: string;
  isFallback: boolean;
  cardType: InsightCardType;
}

export interface InsightFeed {
  id: string;
  feedDate: string;
  phase: string;
  targetCount: number;
  cards: InsightCardData[];
}

// ── Config ─────────────────────────────────────────────────────────────────────

export const HASHTAG_CONFIG: Record<InsightHashtag, {
  label: string;
  bg: string;
  text: string;
  border: string;
}> = {
  period:    { label: "#period",    bg: "bg-rose-500/20",    text: "text-rose-400",    border: "border-rose-500/30" },
  symptoms:  { label: "#symptoms",  bg: "bg-orange-500/20",  text: "text-orange-400",  border: "border-orange-500/30" },
  vibe:      { label: "#vibe",      bg: "bg-violet-500/20",  text: "text-violet-400",  border: "border-violet-500/30" },
  nutrition: { label: "#nutrition", bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30" },
  fitness:   { label: "#fitness",   bg: "bg-sky-500/20",     text: "text-sky-400",     border: "border-sky-500/30" },
  sleep:     { label: "#sleep",     bg: "bg-indigo-500/20",  text: "text-indigo-400",  border: "border-indigo-500/30" },
};

export const CARD_TYPE_CONFIG: Record<InsightCardType, { label: string; color: string }> = {
  insight:    { label: "Insight",    color: "text-gray-400" },
  prediction: { label: "Prediction", color: "text-sky-400" },
  suggestion: { label: "Suggestion", color: "text-emerald-400" },
  pattern:    { label: "Pattern",    color: "text-violet-400" },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

export function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function nextPhase(phase: Phase): Phase {
  switch (phase) {
    case "menstrual":  return "follicular";
    case "follicular": return "ovulatory";
    case "ovulatory":  return "luteal";
    case "luteal":     return "menstrual";
  }
}

// ── InsightContext ─────────────────────────────────────────────────────────────

export interface InsightContext {
  displayName: string;
  phase: Phase;
  cycleDay: number;
  cycleLength: number;
  daysUntilNextPeriod: number;
  upcomingPhase: Phase;
  sleep: {
    logsCount: number;
    avgHours: number | null;
    avgQuality: number | null;
  };
  fitness: {
    logsCount: number;
    workoutTypes: string[];
    avgIntensity: number | null;
    avgDurationMin: number | null;
  };
  vibe: {
    logsCount: number;
    avgMood: number | null;
    avgEnergy: number | null;
    notableNotes: string[];
  };
  symptoms: {
    logsCount: number;
    items: Array<{ name: string; avgSeverity: number; count: number }>;
  };
  nutrition: {
    logsCount: number;
    avgCaloriesKcal: number | null;
    avgWaterMl: number | null;
  };
  period: {
    logsCount: number;
    avgFlow: number | null;
    todayFlow: number | null;
  };
  journal: Array<{ date: string; excerpt: string }>;
  prevPhase: {
    phase: Phase;
    sleep: { avgHours: number | null; avgQuality: number | null; logsCount: number };
    fitness: { logsCount: number; workoutTypes: string[]; avgIntensity: number | null };
    vibe: { avgMood: number | null; avgEnergy: number | null; logsCount: number };
    symptoms: Array<{ name: string; avgSeverity: number }>;
    nutrition: { avgCaloriesKcal: number | null; avgWaterMl: number | null; logsCount: number };
  } | null;
  suppressedKeys: string[];
}

// ── Demo feed ──────────────────────────────────────────────────────────────────

export const DEMO_FEED: InsightFeed = {
  id: "demo-feed",
  feedDate: localDateStr(new Date()),
  phase: "luteal",
  targetCount: 20,
  cards: [
    {
      id: "demo-1",
      hashtags: ["sleep", "fitness"],
      body: "Your average sleep of 6 hours last week may be contributing to lower workout motivation. Research shows sleep under 7 hours reduces glycogen synthesis and raises cortisol, making exercise feel harder.",
      suggestion: "Try aiming for 7–8 hours tonight and see if your energy for tomorrow's workout improves.",
      correlationKey: "fitness+sleep|sleep_avg_hours:6|workouts_logged:false",
      isFallback: false,
      cardType: "insight",
    },
    {
      id: "demo-2",
      hashtags: ["period", "symptoms"],
      body: "You are currently in your Luteal Phase. The hormonal shifts during this phase — particularly rising then dropping progesterone — are commonly linked to increased fatigue and bloating.",
      suggestion: null,
      correlationKey: "period+symptoms|phase:luteal|symptoms:fatigue,bloating",
      isFallback: false,
      cardType: "insight",
    },
    {
      id: "demo-3",
      hashtags: ["period", "fitness", "vibe"],
      body: "Last Luteal Phase you logged 3 yoga sessions and rated your mood 4/5 and energy 3.8/5. This cycle you've done 2 sessions so far — adding one more could help stabilise your mood as your period approaches.",
      suggestion: "A 30-minute yoga or stretching session today could replicate last cycle's calm energy.",
      correlationKey: "fitness+period+vibe|phase:luteal|workout_type:yoga|mood_avg:4",
      isFallback: false,
      cardType: "pattern",
    },
    {
      id: "demo-4",
      hashtags: ["period", "symptoms"],
      body: "Your Menstrual Phase is approaching in approximately 4 days. Based on your history, you tend to experience cramps on days 1–2. It may help to prepare with anti-inflammatory foods and rest plans.",
      suggestion: "Stock up on ginger tea, dark chocolate, and heating pads before your period arrives.",
      correlationKey: "period+symptoms|upcoming_phase:menstrual|days_until:4",
      isFallback: false,
      cardType: "prediction",
    },
    {
      id: "demo-5",
      hashtags: ["nutrition", "symptoms"],
      body: "You haven't logged meals this week. During the Luteal Phase, magnesium-rich foods like dark chocolate, spinach, and pumpkin seeds are known to reduce cramp severity and bloating.",
      suggestion: "Try adding a handful of pumpkin seeds to your meals this week.",
      correlationKey: "nutrition+symptoms|nutrition_logged:false|phase:luteal",
      isFallback: true,
      cardType: "suggestion",
    },
    {
      id: "demo-6",
      hashtags: ["sleep", "vibe"],
      body: "Your energy scores trend lower on days when you log under 7 hours of sleep. With 3 nights under 6.5 hours last week, this likely explains the lower motivation scores you recorded mid-week.",
      suggestion: null,
      correlationKey: "sleep+vibe|sleep_avg_hours:6|energy_avg:3",
      isFallback: false,
      cardType: "insight",
    },
    {
      id: "demo-7",
      hashtags: ["fitness", "vibe"],
      body: "On days you logged a workout, your mood score averaged 0.8 points higher than rest days. Movement is clearly a strong mood regulator for you — even short sessions seem to help.",
      suggestion: "Even a 20-minute walk counts. Your data suggests it'll lift your mood today.",
      correlationKey: "fitness+vibe|workouts_vs_rest_mood_diff:0.8",
      isFallback: false,
      cardType: "pattern",
    },
    {
      id: "demo-8",
      hashtags: ["period", "nutrition"],
      body: "In your previous Luteal Phase, you logged meals on 6 out of 7 days and reported fewer cravings. This cycle, with meals unlogged, cravings may feel more intense as your period approaches.",
      suggestion: "Logging your meals doesn't have to be perfect — even noting your main meal helps spot patterns.",
      correlationKey: "nutrition+period|phase:luteal|meal_logs_prev:6|meal_logs_curr:0",
      isFallback: false,
      cardType: "pattern",
    },
  ],
};
