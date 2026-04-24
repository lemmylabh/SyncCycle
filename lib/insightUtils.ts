import { Phase } from "@/lib/cycleUtils";

// ── Types ──────────────────────────────────────────────────────────────────────

export type InsightHashtag = "period" | "symptoms" | "vibe" | "nutrition" | "fitness" | "sleep";
export type InsightCardType = "insight" | "prediction" | "suggestion" | "pattern";

export interface InsightCardData {
  id: string;
  hashtags: InsightHashtag[];
  body: string;
  summary?: string;
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

export const CATEGORY_CONFIG: Record<InsightHashtag, { emoji: string; color: string; softBg: string; label: string }> = {
  sleep:     { emoji: "🌙", color: "#60a5fa", softBg: "rgba(96,165,250,0.12)",   label: "Sleep"     },
  fitness:   { emoji: "⚡", color: "#34d399", softBg: "rgba(52,211,153,0.12)",   label: "Fitness"   },
  vibe:      { emoji: "✨", color: "#c084fc", softBg: "rgba(192,132,252,0.12)",  label: "Vibe"      },
  nutrition: { emoji: "🍃", color: "#fb923c", softBg: "rgba(251,146,60,0.12)",   label: "Nutrition" },
  symptoms:  { emoji: "🩺", color: "#f87171", softBg: "rgba(248,113,113,0.12)",  label: "Symptoms"  },
  period:    { emoji: "🌸", color: "#fb7185", softBg: "rgba(251,113,133,0.12)",  label: "Period"    },
};

const CATEGORY_PRECEDENCE: InsightHashtag[] = ["sleep", "symptoms", "fitness", "nutrition", "vibe", "period"];

export function getInsightCategory(card: InsightCardData): InsightHashtag {
  for (const h of CATEGORY_PRECEDENCE) {
    if (card.hashtags.includes(h)) return h;
  }
  return card.hashtags[0] ?? "vibe";
}

// Ordered stat-extraction patterns — most specific first
const STAT_PATTERNS: { re: RegExp; fmt: (m: RegExpMatchArray) => string }[] = [
  { re: /(\d+\.?\d*)\s*hours?\s*(of\s+sleep)?/i,           fmt: m => `${m[1]}h avg`           },
  { re: /(\d+\.?\d*)\s*out\s+of\s+5/i,                     fmt: m => `${m[1]}/5`              },
  { re: /intensity\s+of\s+(\d+\.?\d*)/i,                   fmt: m => `${m[1]} avg intensity`  },
  { re: /(\d+\.?\d*)\s*points?\s+higher/i,                 fmt: m => `+${m[1]} pts`           },
  { re: /approximately\s+(\d+)\s+days?/i,                  fmt: m => `~${m[1]} days away`     },
  { re: /average(?:d|ing)?\s+(?:of\s+)?(\d+\.?\d*)/i,     fmt: m => `${m[1]} avg`            },
  { re: /(\d+\.?\d*)\s*\/\s*(\d+)/i,                      fmt: m => `${m[1]}/${m[2]}`        },
  { re: /(\d+)\s*%/i,                                      fmt: m => `${m[1]}%`               },
];

// Human-readable noun derived from category + body context
function contextNoun(cat: InsightHashtag, body: string): string {
  const b = body.toLowerCase();
  switch (cat) {
    case "sleep":     return b.includes("quality") ? "Sleep quality" : "Sleep";
    case "fitness":   return b.includes("yoga") || b.includes("stretch") ? "Movement" : "Fitness";
    case "vibe":      return b.includes("energy") && !b.includes("mood") ? "Energy" : "Mood";
    case "nutrition": return b.includes("craving") ? "Cravings" : "Nutrition";
    case "symptoms":  return b.includes("cramp") ? "Cramps" : b.includes("fatigue") ? "Fatigue" : "Symptoms";
    case "period":    return "Cycle";
  }
}

// Strip filler openers and extract a compact verdict phrase
function extractVerdict(body: string): string {
  let s = body.split(/[.!?]/)[0].trim();

  // Strip common filler sentence starters
  s = s.replace(
    /^(you (?:might|may|could|are|have|'ve|ve)\s+(?:be\s+)?|your (?:body\s+)?(?:is\s+|may\s+|might\s+)?|as you(?:r)?\s+|with your\s+|during (?:this\s+|the\s+)?|since you(?:'ve)?\s+|it(?:'s)?\s+(?:is\s+)?(?:common\s+)?(?:to\s+)?)/i,
    ""
  );

  // Cut at first comma, " and ", " which ", " that ", " — ", " so "
  s = s.split(/,|\s+and\s+|\s+which\s+|\s+that\s+|\s+—\s+|\s+so\s+/i)[0].trim();

  // Strip trailing weak verbs mid-phrase: " may be", " might be", " can be"
  s = s.replace(/\s+(?:may|might|can|could)\s+be.*$/i, "").trim();

  // Capitalize first letter
  s = s.charAt(0).toUpperCase() + s.slice(1);

  return s.length > 32 ? s.slice(0, 31) + "…" : s;
}

export function deriveOneLiner(card: InsightCardData): string {
  const cat = getInsightCategory(card);
  const cfg = CATEGORY_CONFIG[cat];
  const noun = contextNoun(cat, card.body);

  // Try each stat pattern first
  for (const { re, fmt } of STAT_PATTERNS) {
    const m = card.body.match(re);
    if (m) {
      const verdict = fmt(m);
      const full = `${cfg.emoji} ${noun}: ${verdict}`;
      return full.length <= 60 ? full : full.slice(0, 59) + "…";
    }
  }

  // No stat — extract compact phrase
  const verdict = extractVerdict(card.body);
  const full = `${cfg.emoji} ${noun}: ${verdict}`;
  return full.length <= 60 ? full : full.slice(0, 59) + "…";
}

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
      summary: "🌙 Sleep: 6h avg — dragging down workout energy",
      suggestion: "Try aiming for 7–8 hours tonight and see if your energy for tomorrow's workout improves.",
      correlationKey: "fitness+sleep|sleep_avg_hours:6|workouts_logged:false",
      isFallback: false,
      cardType: "insight",
    },
    {
      id: "demo-2",
      hashtags: ["period", "symptoms"],
      body: "You are currently in your Luteal Phase. The hormonal shifts during this phase — particularly rising then dropping progesterone — are commonly linked to increased fatigue and bloating.",
      summary: "🌸 Period: luteal phase — fatigue & bloating likely",
      suggestion: null,
      correlationKey: "period+symptoms|phase:luteal|symptoms:fatigue,bloating",
      isFallback: false,
      cardType: "insight",
    },
    {
      id: "demo-3",
      hashtags: ["fitness", "vibe"],
      body: "Last Luteal Phase you logged 3 yoga sessions and rated your mood 4/5 and energy 3.8/5. This cycle you've done 2 sessions so far — adding one more could help stabilise your mood as your period approaches.",
      summary: "⚡ Fitness: 2 yoga sessions — add one to stabilise mood",
      suggestion: "A 30-minute yoga or stretching session today could replicate last cycle's calm energy.",
      correlationKey: "fitness+period+vibe|phase:luteal|workout_type:yoga|mood_avg:4",
      isFallback: false,
      cardType: "pattern",
    },
    {
      id: "demo-4",
      hashtags: ["period", "symptoms"],
      body: "Your Menstrual Phase is approaching in approximately 4 days. Based on your history, you tend to experience cramps on days 1–2. It may help to prepare with anti-inflammatory foods and rest plans.",
      summary: "🌸 Period: arriving in ~4 days — prep for cramps",
      suggestion: "Stock up on ginger tea, dark chocolate, and heating pads before your period arrives.",
      correlationKey: "period+symptoms|upcoming_phase:menstrual|days_until:4",
      isFallback: false,
      cardType: "prediction",
    },
    {
      id: "demo-5",
      hashtags: ["nutrition", "symptoms"],
      body: "You haven't logged meals this week. During the Luteal Phase, magnesium-rich foods like dark chocolate, spinach, and pumpkin seeds are known to reduce cramp severity and bloating.",
      summary: "🍃 Nutrition: no meals logged — cravings may peak",
      suggestion: "Try adding a handful of pumpkin seeds to your meals this week.",
      correlationKey: "nutrition+symptoms|nutrition_logged:false|phase:luteal",
      isFallback: true,
      cardType: "suggestion",
    },
    {
      id: "demo-6",
      hashtags: ["sleep", "vibe"],
      body: "Your energy scores trend lower on days when you log under 7 hours of sleep. With 3 nights under 6.5 hours last week, this likely explains the lower motivation scores you recorded mid-week.",
      summary: "🌙 Sleep: 3 nights under 6.5h — mood taking a hit",
      suggestion: null,
      correlationKey: "sleep+vibe|sleep_avg_hours:6|energy_avg:3",
      isFallback: false,
      cardType: "insight",
    },
    {
      id: "demo-7",
      hashtags: ["fitness", "vibe"],
      body: "On days you logged a workout, your mood score averaged 0.8 points higher than rest days. Movement is clearly a strong mood regulator for you — even short sessions seem to help.",
      summary: "⚡ Fitness: workouts boost your mood by +0.8 pts",
      suggestion: "Even a 20-minute walk counts. Your data suggests it'll lift your mood today.",
      correlationKey: "fitness+vibe|workouts_vs_rest_mood_diff:0.8",
      isFallback: false,
      cardType: "pattern",
    },
    {
      id: "demo-8",
      hashtags: ["nutrition", "period"],
      body: "In your previous Luteal Phase, you logged meals on 6 out of 7 days and reported fewer cravings. This cycle, with meals unlogged, cravings may feel more intense as your period approaches.",
      summary: "🍃 Nutrition: unlogged meals — cravings intensifying",
      suggestion: "Logging your meals doesn't have to be perfect — even noting your main meal helps spot patterns.",
      correlationKey: "nutrition+period|phase:luteal|meal_logs_prev:6|meal_logs_curr:0",
      isFallback: false,
      cardType: "pattern",
    },
  ],
};
