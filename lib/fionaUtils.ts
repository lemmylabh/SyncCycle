import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Phase, computePhase, PHASE_CONFIG } from "@/lib/cycleUtils";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FionaUserContext {
  profile: {
    displayName: string;
    averageCycleLength: number;
    averagePeriodLength: number;
    appGoal: string | null;
    timezone: string;
    pronouns: string | null;
    cycleRegularity: string | null;
    typicalFlow: string | null;
    baselineSymptoms: string[];
    diagnosedConditions: string[];
    contraceptiveUse: string | null;
  };
  cycle: {
    currentDay: number;
    phase: Phase;
    cycleLength: number;
    startDate: string;
    daysUntilNext: number;
  } | null;
  recentMood: Array<{
    date: string;
    moodScore: number;
    energyScore: number;
    libidoScore: number | null;
    notes: string | null;
  }>;
  recentSymptoms: Array<{ date: string; symptomName: string; severity: number }>;
  recentPeriod: Array<{ date: string; flowLevel: number; notes: string | null }>;
  recentSleep: Array<{
    date: string;
    durationMinutes: number | null;
    qualityScore: number;
  }>;
  recentWorkouts: Array<{
    date: string;
    type: string;
    durationMinutes: number;
    intensity: number;
  }>;
  recentNutrition: Array<{ date: string; waterMl: number | null; caloriesKcal: number | null }>;
  recentNotes: Array<{ date: string; excerpt: string }>;
}

export interface FionaSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

// ── Phase coaching constants ──────────────────────────────────────────────────

const PHASE_COACHING: Record<Phase, string> = {
  menstrual:
    "User is in the menstrual phase. Estrogen and progesterone are low. Encourage rest, warmth, iron-rich foods, and gentle movement like yoga or walking. Validate any fatigue, cramps, or discomfort. This is a time for introspection and release.",
  follicular:
    "User is in the follicular phase. Rising estrogen brings energy, creativity, and motivation. Great time for new projects, social connection, higher-intensity workouts, and trying new things. Encourage them to ride this wave.",
  ovulatory:
    "User is in the ovulatory phase. Estrogen peaks and LH surges. Energy is at its highest. Best time for important conversations, public speaking, high-intensity training, and collaboration. Confidence tends to be elevated.",
  luteal:
    "User is in the luteal phase. Progesterone rises, then both hormones drop. User may feel more inward, fatigued, or emotionally sensitive. Support self-care, lighter activity, complex carbs, magnesium-rich foods, and managing expectations around energy dips.",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

// ── buildUserContext ──────────────────────────────────────────────────────────

export async function buildUserContext(
  userId: string,
  supabase: SupabaseClient
): Promise<FionaUserContext> {
  const today = localDateStr(new Date());
  const sevenDaysAgo = localDateStr(addDays(new Date(), -7));
  const threeDaysAgo = localDateStr(addDays(new Date(), -3));

  const [
    profileRes,
    cycleRes,
    moodRes,
    symptomRes,
    periodRes,
    sleepRes,
    workoutRes,
    nutritionRes,
    notesRes,
  ] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("display_name, average_cycle_length, average_period_length, app_goal, timezone, pronouns, cycle_regularity, typical_flow, baseline_symptoms, diagnosed_conditions, contraceptive_use")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("cycles")
      .select("id, start_date, cycle_length")
      .eq("user_id", userId)
      .order("start_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("mood_logs")
      .select("log_date, mood_score, energy_score, libido_score, notes")
      .eq("user_id", userId)
      .gte("log_date", sevenDaysAgo)
      .lte("log_date", today)
      .order("log_date", { ascending: false }),
    supabase
      .from("symptom_logs")
      .select("log_date, severity, symptom_types(name)")
      .eq("user_id", userId)
      .gte("log_date", sevenDaysAgo)
      .lte("log_date", today)
      .order("log_date", { ascending: false }),
    supabase
      .from("period_logs")
      .select("log_date, flow_level, notes")
      .eq("user_id", userId)
      .gte("log_date", sevenDaysAgo)
      .lte("log_date", today)
      .order("log_date", { ascending: false }),
    supabase
      .from("sleep_logs")
      .select("log_date, duration_minutes, quality_score")
      .eq("user_id", userId)
      .gte("log_date", sevenDaysAgo)
      .lte("log_date", today)
      .order("log_date", { ascending: false }),
    supabase
      .from("workout_logs")
      .select("log_date, duration_minutes, intensity, workout_types(label)")
      .eq("user_id", userId)
      .gte("log_date", sevenDaysAgo)
      .lte("log_date", today)
      .order("log_date", { ascending: false }),
    supabase
      .from("nutrition_logs")
      .select("log_date, water_ml, calories_kcal")
      .eq("user_id", userId)
      .gte("log_date", sevenDaysAgo)
      .lte("log_date", today)
      .order("log_date", { ascending: false }),
    supabase
      .from("daily_notes")
      .select("log_date, content")
      .eq("user_id", userId)
      .gte("log_date", threeDaysAgo)
      .lte("log_date", today)
      .order("log_date", { ascending: false })
      .limit(3),
  ]);

  // Profile
  const p = profileRes.data;
  const profile: FionaUserContext["profile"] = {
    displayName: p?.display_name ?? "there",
    averageCycleLength: p?.average_cycle_length ?? 28,
    averagePeriodLength: p?.average_period_length ?? 5,
    appGoal: p?.app_goal ?? null,
    timezone: p?.timezone ?? "UTC",
    pronouns: p?.pronouns ?? null,
    cycleRegularity: p?.cycle_regularity ?? null,
    typicalFlow: p?.typical_flow ?? null,
    baselineSymptoms: p?.baseline_symptoms ?? [],
    diagnosedConditions: p?.diagnosed_conditions ?? [],
    contraceptiveUse: p?.contraceptive_use ?? null,
  };

  // Cycle
  let cycle: FionaUserContext["cycle"] = null;
  const c = cycleRes.data;
  if (c?.start_date) {
    const start = new Date(c.start_date + "T00:00:00");
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const currentDay = Math.max(1, Math.floor((now.getTime() - start.getTime()) / 86400000) + 1);
    const cycleLen = profile.averageCycleLength;
    const phase = computePhase(currentDay, profile.averagePeriodLength, cycleLen);
    const daysUntilNext = Math.max(0, cycleLen - currentDay + 1);
    cycle = { currentDay, phase, cycleLength: cycleLen, startDate: c.start_date, daysUntilNext };
  }

  // Mood
  const recentMood = (moodRes.data ?? []).map((m: Record<string, unknown>) => ({
    date: m.log_date as string,
    moodScore: m.mood_score as number,
    energyScore: m.energy_score as number,
    libidoScore: m.libido_score as number | null,
    notes: m.notes as string | null,
  }));

  // Symptoms
  const recentSymptoms = (symptomRes.data ?? []).map((s: Record<string, unknown>) => ({
    date: s.log_date as string,
    symptomName: (s.symptom_types as Record<string, unknown> | null)?.name as string ?? "unknown",
    severity: s.severity as number,
  }));

  // Period
  const recentPeriod = (periodRes.data ?? []).map((pr: Record<string, unknown>) => ({
    date: pr.log_date as string,
    flowLevel: pr.flow_level as number,
    notes: pr.notes as string | null,
  }));

  // Sleep
  const recentSleep = (sleepRes.data ?? []).map((sl: Record<string, unknown>) => ({
    date: sl.log_date as string,
    durationMinutes: sl.duration_minutes as number | null,
    qualityScore: sl.quality_score as number,
  }));

  // Workouts
  const recentWorkouts = (workoutRes.data ?? []).map((w: Record<string, unknown>) => ({
    date: w.log_date as string,
    type: (w.workout_types as Record<string, unknown> | null)?.label as string ?? "workout",
    durationMinutes: w.duration_minutes as number,
    intensity: w.intensity as number,
  }));

  // Nutrition
  const recentNutrition = (nutritionRes.data ?? []).map((n: Record<string, unknown>) => ({
    date: n.log_date as string,
    waterMl: n.water_ml as number | null,
    caloriesKcal: n.calories_kcal as number | null,
  }));

  // Notes
  const recentNotes = (notesRes.data ?? []).map((n: Record<string, unknown>) => ({
    date: n.log_date as string,
    excerpt: ((n.content as string) ?? "").slice(0, 200),
  }));

  return {
    profile,
    cycle,
    recentMood,
    recentSymptoms,
    recentPeriod,
    recentSleep,
    recentWorkouts,
    recentNutrition,
    recentNotes,
  };
}

// ── buildSystemPrompt ─────────────────────────────────────────────────────────

export function buildSystemPrompt(ctx: FionaUserContext): string {
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  const phase = ctx.cycle?.phase ?? null;
  const phaseLabel = phase ? PHASE_CONFIG[phase].label : "unknown";
  const phaseTagline = phase ? PHASE_CONFIG[phase].tagline : "";
  const phaseCoaching = phase ? PHASE_COACHING[phase] : "No cycle data logged yet — gently encourage logging a cycle start date.";

  const moodSection =
    ctx.recentMood.length > 0
      ? ctx.recentMood
          .map(
            (m) =>
              `- ${m.date}: Mood ${m.moodScore}/5, Energy ${m.energyScore}/5${
                m.libidoScore != null ? `, Libido ${m.libidoScore}/5` : ""
              }${m.notes ? ` — "${m.notes}"` : ""}`
          )
          .join("\n")
      : "No mood data logged in the last 7 days.";

  const symptomSection =
    ctx.recentSymptoms.length > 0
      ? ctx.recentSymptoms.map((s) => `- ${s.date}: ${s.symptomName} (severity ${s.severity}/5)`).join("\n")
      : "No symptoms logged in the last 7 days.";

  const periodSection =
    ctx.recentPeriod.length > 0
      ? ctx.recentPeriod
          .map((p) => `- ${p.date}: Flow level ${p.flowLevel}/4${p.notes ? ` — "${p.notes}"` : ""}`)
          .join("\n")
      : "No period data in the last 7 days.";

  const sleepSection =
    ctx.recentSleep.length > 0
      ? ctx.recentSleep
          .map((s) => {
            const hrs = s.durationMinutes ? `${(s.durationMinutes / 60).toFixed(1)}h` : "duration unknown";
            return `- ${s.date}: ${hrs}, quality ${s.qualityScore}/5`;
          })
          .join("\n")
      : "No sleep data logged in the last 7 days.";

  const workoutSection =
    ctx.recentWorkouts.length > 0
      ? ctx.recentWorkouts
          .map((w) => `- ${w.date}: ${w.type}, ${w.durationMinutes} min, intensity ${w.intensity}/5`)
          .join("\n")
      : "No workouts logged in the last 7 days.";

  const nutritionSection =
    ctx.recentNutrition.length > 0
      ? ctx.recentNutrition
          .map((n) => {
            const parts: string[] = [];
            if (n.waterMl) parts.push(`${n.waterMl}ml water`);
            if (n.caloriesKcal) parts.push(`${n.caloriesKcal} kcal`);
            return `- ${n.date}: ${parts.join(", ") || "tracked"}`;
          })
          .join("\n")
      : "No nutrition data logged in the last 7 days.";

  const notesSection =
    ctx.recentNotes.length > 0
      ? ctx.recentNotes.map((n) => `- ${n.date}: "${n.excerpt}"`).join("\n")
      : "No recent journal entries.";

  return `You are Fiona, a warm and empathetic AI wellness coach built into SyncCycle — a menstrual cycle tracking app.

## Your Identity & Rules
- You are NOT a doctor, therapist, nurse, or any kind of medical professional
- NEVER diagnose symptoms, prescribe treatments, or give medical advice
- Always direct serious health concerns to a qualified healthcare provider
- You are a supportive wellness companion who helps users understand and work with their cycle
- Tone: warm, empowering, curious, non-judgmental, science-informed but accessible
- Keep responses conversational and under 300 words unless specifically asked to elaborate
- Use empowering language — phases are natural rhythms and strengths, not obstacles
- Do NOT list back the user's data robotically; weave insights naturally into conversation
- Address the user by first name (${ctx.profile.displayName}) occasionally but not every message

## Current User Context
**Name:** ${ctx.profile.displayName}
**Time of day:** ${timeOfDay}
**App goal:** ${ctx.profile.appGoal ?? "general cycle awareness"}
**Average cycle:** ${ctx.profile.averageCycleLength} days | **Average period:** ${ctx.profile.averagePeriodLength} days
**Pronouns:** ${ctx.profile.pronouns ?? "not specified"}
**Cycle regularity:** ${ctx.profile.cycleRegularity ?? "unknown"}
**Typical flow:** ${ctx.profile.typicalFlow ?? "unknown"}
**Contraceptive use:** ${ctx.profile.contraceptiveUse ?? "none"}
**Diagnosed conditions:** ${ctx.profile.diagnosedConditions.length > 0 ? ctx.profile.diagnosedConditions.join(", ") : "none reported"}
**Baseline symptoms (user typically experiences):** ${ctx.profile.baselineSymptoms.length > 0 ? ctx.profile.baselineSymptoms.join(", ") : "none reported"}

## Cycle Status
${
  ctx.cycle
    ? `- **Cycle Day:** ${ctx.cycle.currentDay} of ${ctx.cycle.cycleLength}
- **Current Phase:** ${phaseLabel}
- **Phase vibe:** ${phaseTagline}
- **Days until next period:** ~${ctx.cycle.daysUntilNext}`
    : "No cycle data logged yet. Gently encourage the user to log their last period start date to unlock personalized insights."
}

## Phase Context (${phaseLabel})
${phaseCoaching}

## Recent Health Data (last 7 days)
### Mood & Energy
${moodSection}

### Symptoms
${symptomSection}

### Period / Flow
${periodSection}

### Sleep
${sleepSection}

### Workouts
${workoutSection}

### Nutrition & Hydration
${nutritionSection}

### Journal Notes
${notesSection}

## Response Style
- Start fresh responses naturally without always re-greeting
- When relevant, connect what they share to their current phase
- Offer 1-2 concrete, actionable suggestions when appropriate
- Ask a thoughtful follow-up question if it would add value
- Use bullet points sparingly — prefer flowing, conversational prose`;
}

// ── Server-side Supabase client factory (for API route) ───────────────────────

export function createServerSupabaseClient(accessToken: string): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
      auth: { persistSession: false },
    }
  );
}
