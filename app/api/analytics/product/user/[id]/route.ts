import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const [mood, workout, nutrition, sleep, symptoms, journal, fionaSessions, fionaMessages, profileRes] =
      await Promise.all([
        admin.from("mood_logs").select("log_date").eq("user_id", id),
        admin.from("workout_logs").select("log_date").eq("user_id", id),
        admin.from("nutrition_logs").select("log_date").eq("user_id", id),
        admin.from("sleep_logs").select("log_date").eq("user_id", id),
        admin.from("symptom_logs").select("log_date").eq("user_id", id),
        admin.from("daily_notes").select("log_date").eq("user_id", id),
        admin.from("fiona_sessions").select("id").eq("user_id", id),
        admin.from("fiona_messages").select("session_id").eq("user_id", id),
        admin.from("user_profiles").select("onboarding_completed").eq("id", id).maybeSingle(),
      ]);

    const sessionIds = new Set((fionaSessions.data ?? []).map((s: { id: string }) => s.id));
    const sessionMsgMap: Record<string, number> = {};
    for (const m of (fionaMessages.data ?? []) as { session_id: string }[]) {
      if (sessionIds.has(m.session_id)) {
        sessionMsgMap[m.session_id] = (sessionMsgMap[m.session_id] ?? 0) + 1;
      }
    }
    const msgCounts = Object.values(sessionMsgMap);
    const avgMessagesPerSession =
      msgCounts.length > 0
        ? Math.round((msgCounts.reduce((a, b) => a + b, 0) / msgCounts.length) * 10) / 10
        : 0;

    const features = [
      { key: "mood", label: "Mood Check", entries: mood.data?.length ?? 0 },
      { key: "workout", label: "Workout", entries: workout.data?.length ?? 0 },
      { key: "nutrition", label: "Nutrition", entries: nutrition.data?.length ?? 0 },
      { key: "sleep", label: "Sleep", entries: sleep.data?.length ?? 0 },
      { key: "symptoms", label: "Symptoms", entries: symptoms.data?.length ?? 0 },
      { key: "journal", label: "Journal", entries: journal.data?.length ?? 0 },
      { key: "fiona", label: "Ask Fiona", entries: fionaSessions.data?.length ?? 0, avgMessagesPerSession },
    ];

    const totalEntries = features.filter(f => f.key !== "fiona").reduce((a, f) => a + f.entries, 0);

    const allDays = new Set<string>();
    const addDays = (rows: { log_date: string }[]) => rows.forEach((r) => allDays.add(r.log_date));
    addDays(mood.data ?? []);
    addDays(workout.data ?? []);
    addDays(nutrition.data ?? []);
    addDays(sleep.data ?? []);
    addDays(symptoms.data ?? []);
    addDays(journal.data ?? []);

    const onboardingCompleted = (profileRes.data as { onboarding_completed: boolean } | null)?.onboarding_completed ?? false;

    return NextResponse.json({ features, totalEntries, daysActive: allDays.size, onboardingCompleted });
  } catch (err) {
    console.error("Per-user analytics error:", err);
    return NextResponse.json({ error: "Failed to fetch user analytics" }, { status: 500 });
  }
}
