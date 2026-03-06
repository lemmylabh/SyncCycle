import { SupabaseClient } from "@supabase/supabase-js";
import { Phase, computePhase, PHASE_CONFIG } from "@/lib/cycleUtils";

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

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function avg(arr: number[]): number | null {
  if (arr.length === 0) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function phaseBoundaries(phase: Phase, periodLen: number, cycleLen: number): [number, number] {
  switch (phase) {
    case "menstrual":  return [1, periodLen];
    case "follicular": return [periodLen + 1, cycleLen - 15];
    case "ovulatory":  return [cycleLen - 14, cycleLen - 12];
    case "luteal":     return [cycleLen - 11, cycleLen];
  }
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

// ── buildInsightContext ────────────────────────────────────────────────────────

export async function buildInsightContext(
  userId: string,
  supabase: SupabaseClient
): Promise<InsightContext> {
  const today = localDateStr(new Date());
  const fourteenDaysAgo = localDateStr(addDays(new Date(), -14));
  const threeDaysAgo = localDateStr(addDays(new Date(), -3));

  const [
    profileRes, cyclesRes, moodRes, symptomRes, periodRes,
    sleepRes, workoutRes, nutritionRes, notesRes, flagsRes,
  ] = await Promise.all([
    supabase.from("user_profiles")
      .select("display_name, average_cycle_length, average_period_length")
      .eq("id", userId).maybeSingle(),
    supabase.from("cycles")
      .select("id, start_date, cycle_length")
      .eq("user_id", userId)
      .order("start_date", { ascending: false }).limit(2),
    supabase.from("mood_logs")
      .select("log_date, mood_score, energy_score, notes")
      .eq("user_id", userId)
      .gte("log_date", fourteenDaysAgo).lte("log_date", today)
      .order("log_date", { ascending: false }),
    supabase.from("symptom_logs")
      .select("log_date, severity, symptom_types(name)")
      .eq("user_id", userId)
      .gte("log_date", fourteenDaysAgo).lte("log_date", today),
    supabase.from("period_logs")
      .select("log_date, flow_level")
      .eq("user_id", userId)
      .gte("log_date", fourteenDaysAgo).lte("log_date", today)
      .order("log_date", { ascending: false }),
    supabase.from("sleep_logs")
      .select("log_date, duration_minutes, quality_score")
      .eq("user_id", userId)
      .gte("log_date", fourteenDaysAgo).lte("log_date", today),
    supabase.from("workout_logs")
      .select("log_date, duration_minutes, intensity, workout_types(label)")
      .eq("user_id", userId)
      .gte("log_date", fourteenDaysAgo).lte("log_date", today),
    supabase.from("nutrition_logs")
      .select("log_date, water_ml, calories_kcal")
      .eq("user_id", userId)
      .gte("log_date", fourteenDaysAgo).lte("log_date", today),
    supabase.from("daily_notes")
      .select("log_date, content")
      .eq("user_id", userId)
      .gte("log_date", threeDaysAgo).lte("log_date", today)
      .order("log_date", { ascending: false }).limit(3),
    supabase.from("insight_correlation_flags")
      .select("correlation_key")
      .eq("user_id", userId).eq("suppressed", true),
  ]);

  const p = profileRes.data;
  const displayName = p?.display_name ?? "there";
  const avgCycleLen = p?.average_cycle_length ?? 28;
  const avgPeriodLen = p?.average_period_length ?? 5;

  const cycles = cyclesRes.data ?? [];
  const currentCycle = cycles[0];
  const previousCycle = cycles[1];

  let phase: Phase = "follicular";
  let cycleDay = 1;
  let daysUntilNextPeriod = avgCycleLen;
  if (currentCycle?.start_date) {
    const start = new Date(currentCycle.start_date + "T00:00:00");
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    cycleDay = Math.max(1, Math.floor((now.getTime() - start.getTime()) / 86400000) + 1);
    phase = computePhase(cycleDay, avgPeriodLen, avgCycleLen);
    daysUntilNextPeriod = Math.max(0, avgCycleLen - cycleDay + 1);
  }

  // Sleep
  const sleepLogs = sleepRes.data ?? [];
  const sleepHoursArr = sleepLogs
    .filter((s: Record<string, unknown>) => s.duration_minutes != null)
    .map((s: Record<string, unknown>) => (s.duration_minutes as number) / 60);
  const sleepQualityArr = sleepLogs.map((s: Record<string, unknown>) => s.quality_score as number);

  // Fitness
  const workoutLogs = workoutRes.data ?? [];
  const workoutTypes = [...new Set(workoutLogs.map((w: Record<string, unknown>) =>
    (w.workout_types as Record<string, unknown> | null)?.label as string ?? "workout"
  ))];

  // Vibe
  const moodLogs = moodRes.data ?? [];
  const notableNotes = moodLogs
    .filter((m: Record<string, unknown>) => m.notes)
    .map((m: Record<string, unknown>) => (m.notes as string).slice(0, 100))
    .slice(0, 3);

  // Symptoms
  const symptomLogs = symptomRes.data ?? [];
  const symptomMap: Record<string, number[]> = {};
  symptomLogs.forEach((s: Record<string, unknown>) => {
    const name = (s.symptom_types as Record<string, unknown> | null)?.name as string ?? "unknown";
    if (!symptomMap[name]) symptomMap[name] = [];
    symptomMap[name].push(s.severity as number);
  });

  // Nutrition
  const nutritionLogs = nutritionRes.data ?? [];
  const caloriesArr = nutritionLogs
    .filter((n: Record<string, unknown>) => n.calories_kcal != null)
    .map((n: Record<string, unknown>) => n.calories_kcal as number);
  const waterArr = nutritionLogs
    .filter((n: Record<string, unknown>) => n.water_ml != null)
    .map((n: Record<string, unknown>) => n.water_ml as number);

  // Period
  const periodLogs = periodRes.data ?? [];
  const todayPeriod = periodLogs.find((pr: Record<string, unknown>) => pr.log_date === today);
  const todayFlow = todayPeriod ? (todayPeriod as Record<string, unknown>).flow_level as number : null;

  // Journal
  const journal = (notesRes.data ?? []).map((n: Record<string, unknown>) => ({
    date: n.log_date as string,
    excerpt: ((n.content as string) ?? "").slice(0, 150),
  }));

  // Suppressed keys
  const suppressedKeys = (flagsRes.data ?? []).map((f: Record<string, unknown>) => f.correlation_key as string);

  // Previous same phase
  let prevPhase: InsightContext["prevPhase"] = null;
  if (previousCycle?.start_date) {
    const [phaseStartDay, phaseEndDay] = phaseBoundaries(phase, avgPeriodLen, avgCycleLen);
    const prevStart = new Date(previousCycle.start_date + "T00:00:00");
    const prevPhaseStartDate = localDateStr(addDays(prevStart, phaseStartDay - 1));
    const prevPhaseEndDate = localDateStr(addDays(prevStart, phaseEndDay - 1));

    const [pMoodRes, pSleepRes, pWorkoutRes, pSymptomRes, pNutritionRes] = await Promise.all([
      supabase.from("mood_logs").select("mood_score, energy_score")
        .eq("user_id", userId).gte("log_date", prevPhaseStartDate).lte("log_date", prevPhaseEndDate),
      supabase.from("sleep_logs").select("duration_minutes, quality_score")
        .eq("user_id", userId).gte("log_date", prevPhaseStartDate).lte("log_date", prevPhaseEndDate),
      supabase.from("workout_logs").select("duration_minutes, intensity, workout_types(label)")
        .eq("user_id", userId).gte("log_date", prevPhaseStartDate).lte("log_date", prevPhaseEndDate),
      supabase.from("symptom_logs").select("severity, symptom_types(name)")
        .eq("user_id", userId).gte("log_date", prevPhaseStartDate).lte("log_date", prevPhaseEndDate),
      supabase.from("nutrition_logs").select("water_ml, calories_kcal")
        .eq("user_id", userId).gte("log_date", prevPhaseStartDate).lte("log_date", prevPhaseEndDate),
    ]);

    const pMoodLogs = pMoodRes.data ?? [];
    const pSleepLogs = pSleepRes.data ?? [];
    const pWorkoutLogs = pWorkoutRes.data ?? [];
    const pSymptomLogs = pSymptomRes.data ?? [];
    const pNutritionLogs = pNutritionRes.data ?? [];

    const pSymptomMap: Record<string, number[]> = {};
    pSymptomLogs.forEach((s: Record<string, unknown>) => {
      const name = (s.symptom_types as Record<string, unknown> | null)?.name as string ?? "unknown";
      if (!pSymptomMap[name]) pSymptomMap[name] = [];
      pSymptomMap[name].push(s.severity as number);
    });

    prevPhase = {
      phase,
      sleep: {
        avgHours: avg(pSleepLogs.filter((s: Record<string, unknown>) => s.duration_minutes != null).map((s: Record<string, unknown>) => (s.duration_minutes as number) / 60)),
        avgQuality: avg(pSleepLogs.map((s: Record<string, unknown>) => s.quality_score as number)),
        logsCount: pSleepLogs.length,
      },
      fitness: {
        logsCount: pWorkoutLogs.length,
        workoutTypes: [...new Set(pWorkoutLogs.map((w: Record<string, unknown>) =>
          (w.workout_types as Record<string, unknown> | null)?.label as string ?? "workout"
        ))],
        avgIntensity: avg(pWorkoutLogs.map((w: Record<string, unknown>) => w.intensity as number)),
      },
      vibe: {
        avgMood: avg(pMoodLogs.map((m: Record<string, unknown>) => m.mood_score as number)),
        avgEnergy: avg(pMoodLogs.map((m: Record<string, unknown>) => m.energy_score as number)),
        logsCount: pMoodLogs.length,
      },
      symptoms: Object.entries(pSymptomMap).map(([name, severities]) => ({
        name,
        avgSeverity: severities.reduce((a, b) => a + b, 0) / severities.length,
      })),
      nutrition: {
        avgCaloriesKcal: avg(pNutritionLogs.filter((n: Record<string, unknown>) => n.calories_kcal != null).map((n: Record<string, unknown>) => n.calories_kcal as number)),
        avgWaterMl: avg(pNutritionLogs.filter((n: Record<string, unknown>) => n.water_ml != null).map((n: Record<string, unknown>) => n.water_ml as number)),
        logsCount: pNutritionLogs.length,
      },
    };
  }

  return {
    displayName,
    phase,
    cycleDay,
    cycleLength: avgCycleLen,
    daysUntilNextPeriod,
    upcomingPhase: nextPhase(phase),
    sleep: {
      logsCount: sleepLogs.length,
      avgHours: avg(sleepHoursArr),
      avgQuality: avg(sleepQualityArr),
    },
    fitness: {
      logsCount: workoutLogs.length,
      workoutTypes,
      avgIntensity: avg(workoutLogs.map((w: Record<string, unknown>) => w.intensity as number)),
      avgDurationMin: avg(workoutLogs.map((w: Record<string, unknown>) => w.duration_minutes as number)),
    },
    vibe: {
      logsCount: moodLogs.length,
      avgMood: avg(moodLogs.map((m: Record<string, unknown>) => m.mood_score as number)),
      avgEnergy: avg(moodLogs.map((m: Record<string, unknown>) => m.energy_score as number)),
      notableNotes,
    },
    symptoms: {
      logsCount: symptomLogs.length,
      items: Object.entries(symptomMap).map(([name, severities]) => ({
        name,
        avgSeverity: severities.reduce((a, b) => a + b, 0) / severities.length,
        count: severities.length,
      })).sort((a, b) => b.avgSeverity - a.avgSeverity),
    },
    nutrition: {
      logsCount: nutritionLogs.length,
      avgCaloriesKcal: avg(caloriesArr),
      avgWaterMl: avg(waterArr),
    },
    period: {
      logsCount: periodLogs.length,
      avgFlow: avg(periodLogs.map((pr: Record<string, unknown>) => pr.flow_level as number)),
      todayFlow,
    },
    journal,
    prevPhase,
    suppressedKeys,
  };
}

// ── buildInsightPrompt ─────────────────────────────────────────────────────────

export function buildInsightPrompt(
  ctx: InsightContext,
  targetCount: number,
  existingIds: string[] = []
): { system: string; user: string } {
  const phaseLabel = PHASE_CONFIG[ctx.phase].label;
  const n = (v: number | null, suffix = "", decimals = 1) =>
    v != null ? `${v.toFixed(decimals)}${suffix}` : "not logged";

  const system = `You are SyncCycle's AI insight engine. Generate personalized menstrual cycle health insights.
Output ONLY valid JSON with no text outside the JSON object.
Be warm, empowering, and evidence-based. Never clinical. Max 3 sentences per card body.`;

  const suppressedSection = ctx.suppressedKeys.length > 0
    ? `SUPPRESSED PATTERNS — do NOT generate insights for these correlation keys:\n${ctx.suppressedKeys.join("\n")}`
    : "SUPPRESSED PATTERNS: none";

  const existingSection = existingIds.length > 0
    ? `EXISTING CARD IDs (do not repeat these topics):\n${existingIds.join(", ")}`
    : "";

  const prevSection = ctx.prevPhase
    ? `PREVIOUS ${phaseLabel.toUpperCase()} (last cycle):
- Sleep: ${n(ctx.prevPhase.sleep.avgHours, "h avg")} | quality ${n(ctx.prevPhase.sleep.avgQuality, "/5")} | ${ctx.prevPhase.sleep.logsCount} nights logged
- Fitness: ${ctx.prevPhase.fitness.logsCount} workouts${ctx.prevPhase.fitness.workoutTypes.length ? ` (${ctx.prevPhase.fitness.workoutTypes.join(", ")})` : ""} | avg intensity ${n(ctx.prevPhase.fitness.avgIntensity, "/5")}
- Vibe: mood ${n(ctx.prevPhase.vibe.avgMood, "/5")} | energy ${n(ctx.prevPhase.vibe.avgEnergy, "/5")} | ${ctx.prevPhase.vibe.logsCount} days logged
- Symptoms: ${ctx.prevPhase.symptoms.length > 0 ? ctx.prevPhase.symptoms.map(s => `${s.name} (${s.avgSeverity.toFixed(1)}/5)`).join(", ") : "none logged"}
- Nutrition: ${n(ctx.prevPhase.nutrition.avgCaloriesKcal, " kcal")} | ${n(ctx.prevPhase.nutrition.avgWaterMl, "ml water")} | ${ctx.prevPhase.nutrition.logsCount} days logged`
    : "PREVIOUS PHASE: No previous cycle data available — skip pattern cards, fill with suggestions instead.";

  const insightCount = Math.ceil(targetCount * 0.45);
  const patternCount = ctx.prevPhase ? Math.ceil(targetCount * 0.20) : 0;
  const predictionCount = Math.ceil(targetCount * 0.15);
  const suggestionCount = targetCount - insightCount - patternCount - predictionCount;

  const user = `Generate exactly ${targetCount} insight cards as JSON.

CURRENT USER CONTEXT:
- Name: ${ctx.displayName}
- Cycle Day: ${ctx.cycleDay} of ~${ctx.cycleLength}
- Current Phase: ${phaseLabel}
- Days until next period: ~${ctx.daysUntilNextPeriod}
- Upcoming phase: ${PHASE_CONFIG[ctx.upcomingPhase].label}

CURRENT DATA (last 14 days):
SLEEP: ${n(ctx.sleep.avgHours, "h avg/night")} | quality ${n(ctx.sleep.avgQuality, "/5")} | ${ctx.sleep.logsCount} nights logged
FITNESS: ${ctx.fitness.logsCount} workouts${ctx.fitness.workoutTypes.length ? ` (${ctx.fitness.workoutTypes.join(", ")})` : ""} | avg intensity ${n(ctx.fitness.avgIntensity, "/5")} | avg duration ${n(ctx.fitness.avgDurationMin, "min")}
VIBE: mood ${n(ctx.vibe.avgMood, "/5")} | energy ${n(ctx.vibe.avgEnergy, "/5")} | ${ctx.vibe.logsCount} days logged${ctx.vibe.notableNotes.length ? `\n  Notes: ${ctx.vibe.notableNotes.map(note => `"${note}"`).join(", ")}` : ""}
SYMPTOMS: ${ctx.symptoms.logsCount > 0 ? ctx.symptoms.items.map(s => `${s.name} (sev ${s.avgSeverity.toFixed(1)}/5, ${s.count}x)`).join(", ") : "none logged"}
NUTRITION: ${n(ctx.nutrition.avgCaloriesKcal, " kcal avg/day")} | ${n(ctx.nutrition.avgWaterMl, "ml water avg/day")} | ${ctx.nutrition.logsCount} days logged
PERIOD: ${ctx.period.logsCount > 0 ? `avg flow ${n(ctx.period.avgFlow, "/4")}` : "no period data"}${ctx.period.todayFlow != null ? ` | today: ${ctx.period.todayFlow}/4` : ""}
JOURNAL: ${ctx.journal.length > 0 ? ctx.journal.map(j => `"${j.excerpt}" (${j.date})`).join(" | ") : "no recent entries"}

${prevSection}

${suppressedSection}
${existingSection}

TARGET MIX (${targetCount} total):
- "insight": ~${insightCount} cards — data-based correlations between 1-3 trackers from current data
- "pattern": ~${patternCount} cards — compare current vs previous ${phaseLabel} data
- "prediction": ~${predictionCount} cards — forecast for upcoming ${PHASE_CONFIG[ctx.upcomingPhase].label}
- "suggestion": ~${suggestionCount} cards — actionable phase-appropriate tips (especially for trackers with no data)

CORRELATION KEY FORMAT: sorted hashtags joined by "+", then "|", then sorted binned key=value pairs
Use integer bins (e.g. sleep_avg_hours:6 not 6.2), booleans, or short categoricals.
Example: "fitness+sleep|sleep_avg_hours:6|workouts_logged:false"

HASHTAG OPTIONS: period, symptoms, vibe, nutrition, fitness, sleep
Use relevant hashtags even for prediction/suggestion cards (which trackers does this relate to?).

OUTPUT JSON:
{
  "cards": [
    {
      "id": "unique-short-id",
      "hashtags": ["sleep", "fitness"],
      "body": "2-3 sentence insight, warm and personal",
      "suggestion": "one actionable tip or null",
      "correlationKey": "fitness+sleep|sleep_avg_hours:6|workouts_logged:false",
      "isFallback": false,
      "cardType": "insight"
    }
  ]
}`;

  return { system, user };
}

// ── parseInsightResponse ───────────────────────────────────────────────────────

const VALID_HASHTAGS = new Set<InsightHashtag>(["period", "symptoms", "vibe", "nutrition", "fitness", "sleep"]);
const VALID_TYPES = new Set<InsightCardType>(["insight", "prediction", "suggestion", "pattern"]);

export function parseInsightResponse(raw: string): InsightCardData[] {
  try {
    const parsed = JSON.parse(raw);
    const cards = (parsed.cards ?? []) as Record<string, unknown>[];
    return cards
      .filter(c =>
        typeof c.id === "string" &&
        Array.isArray(c.hashtags) &&
        (c.hashtags as unknown[]).length >= 1 &&
        (c.hashtags as unknown[]).every(h => VALID_HASHTAGS.has(h as InsightHashtag)) &&
        typeof c.body === "string" && c.body.length > 10 &&
        typeof c.correlationKey === "string" &&
        VALID_TYPES.has(c.cardType as InsightCardType)
      )
      .map(c => ({
        id: c.id as string,
        hashtags: (c.hashtags as InsightHashtag[]).slice(0, 3),
        body: (c.body as string).trim(),
        suggestion: typeof c.suggestion === "string" && c.suggestion.trim().length > 0
          ? c.suggestion.trim()
          : null,
        correlationKey: c.correlationKey as string,
        isFallback: c.isFallback === true,
        cardType: c.cardType as InsightCardType,
      }));
  } catch {
    return [];
  }
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
