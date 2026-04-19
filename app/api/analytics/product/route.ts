import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function cutoffDate() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

async function fetchFeature(table: string, dateCol: string, cutoff: string) {
  const { data, error } = await admin
    .from(table)
    .select("user_id, " + dateCol)
    .gte(dateCol, cutoff);
  if (error) throw error;
  return data as { user_id: string; [key: string]: string }[];
}

export async function GET() {
  try {
    const cutoff = cutoffDate();

    const [
      totalUsersRes,
      partnerCountRes,
      onboardingRes,
      moodRows,
      workoutRows,
      nutritionRows,
      sleepRows,
      symptomRows,
      journalRows,
      fionaRows,
      fionaMessages,
      profilesRes,
      authUsers,
    ] = await Promise.all([
      admin.from("user_profiles").select("id", { count: "exact", head: true }),
      admin.from("user_profiles").select("id", { count: "exact", head: true }).eq("role", "partner"),
      admin.from("user_profiles").select("id", { count: "exact", head: true }).eq("onboarding_completed", true),
      fetchFeature("mood_logs", "log_date", cutoff),
      fetchFeature("workout_logs", "log_date", cutoff),
      fetchFeature("nutrition_logs", "log_date", cutoff),
      fetchFeature("sleep_logs", "log_date", cutoff),
      fetchFeature("symptom_logs", "log_date", cutoff),
      fetchFeature("daily_notes", "log_date", cutoff),
      fetchFeature("fiona_sessions", "created_at", cutoff),
      admin.from("fiona_messages").select("session_id").gte("created_at", cutoff + "T00:00:00Z"),
      admin.from("user_profiles").select("id, display_name, role"),
      admin.auth.admin.listUsers({ perPage: 1000 }),
    ]);

    const totalUsers = totalUsersRes.count ?? 0;
    const partnerAccounts = partnerCountRes.count ?? 0;
    const onboardingCompleted = onboardingRes.count ?? 0;

    // Fiona: avg messages per session
    const sessionMsgCounts: Record<string, number> = {};
    for (const msg of (fionaMessages.data ?? []) as { session_id: string }[]) {
      sessionMsgCounts[msg.session_id] = (sessionMsgCounts[msg.session_id] ?? 0) + 1;
    }
    const msgCounts = Object.values(sessionMsgCounts);
    const avgMessagesPerSession =
      msgCounts.length > 0
        ? Math.round((msgCounts.reduce((a, b) => a + b, 0) / msgCounts.length) * 10) / 10
        : 0;

    // Helper: derive stats from rows
    function stats(rows: { user_id: string; [k: string]: string }[], dateKey: string) {
      const entries = rows.length;
      const userSet = new Set(rows.map((r) => r.user_id));
      const daily: Record<string, number> = {};
      const dailyUsers: Record<string, Set<string>> = {};
      for (const r of rows) {
        const day = r[dateKey].slice(0, 10);
        daily[day] = (daily[day] ?? 0) + 1;
        if (!dailyUsers[day]) dailyUsers[day] = new Set();
        dailyUsers[day].add(r.user_id);
      }
      return { entries, users: userSet.size, userSet, daily, dailyUsers };
    }

    const mood = stats(moodRows, "log_date");
    const workout = stats(workoutRows, "log_date");
    const nutrition = stats(nutritionRows, "log_date");
    const sleep = stats(sleepRows, "log_date");
    const symptoms = stats(symptomRows, "log_date");
    const journal = stats(journalRows, "log_date");
    const fiona = stats(fionaRows, "created_at");

    // Active users: union of all user sets
    const allActiveUsers = new Set([
      ...mood.userSet, ...workout.userSet, ...nutrition.userSet,
      ...sleep.userSet, ...symptoms.userSet, ...journal.userSet, ...fiona.userSet,
    ]);
    const activeUsers = allActiveUsers.size;
    const totalEntries = mood.entries + workout.entries + nutrition.entries +
      sleep.entries + symptoms.entries + journal.entries;

    const featureDefs = [
      { key: "mood", label: "Mood Check", ...mood },
      { key: "workout", label: "Workout", ...workout },
      { key: "nutrition", label: "Nutrition", ...nutrition },
      { key: "sleep", label: "Sleep", ...sleep },
      { key: "symptoms", label: "Symptoms", ...symptoms },
      { key: "journal", label: "Journal", ...journal },
      { key: "fiona", label: "Ask Fiona", ...fiona, avgMessagesPerSession },
    ];

    const features = featureDefs.map((f) => ({
      key: f.key,
      label: f.label,
      entries: f.entries,
      users: f.users,
      ...("avgMessagesPerSession" in f ? { avgMessagesPerSession: f.avgMessagesPerSession } : {}),
      adoptionPct: totalUsers > 0 ? Math.round((f.users / totalUsers) * 1000) / 10 : 0,
      avgPerUser: f.users > 0 ? Math.round((f.entries / f.users) * 10) / 10 : 0,
    }));

    // 30-day trend
    const dailyMaps = [mood.daily, workout.daily, nutrition.daily, sleep.daily, symptoms.daily, journal.daily];
    const dailyUserMaps = [mood.dailyUsers, workout.dailyUsers, nutrition.dailyUsers, sleep.dailyUsers, symptoms.dailyUsers, journal.dailyUsers];
    const trend = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en", { month: "short", day: "numeric" });
      const union = new Set<string>();
      for (const map of dailyUserMaps) {
        for (const uid of (map[key] ?? new Set())) union.add(uid);
      }
      return { date: label, entries: dailyMaps.reduce((sum, map) => sum + (map[key] ?? 0), 0), loggers: union.size, fiona: fiona.daily[key] ?? 0 };
    });

    // Per-user log totals (last 30 days) for ranking
    const userLogCounts: Record<string, number> = {};
    for (const r of [...moodRows, ...workoutRows, ...nutritionRows, ...sleepRows, ...symptomRows, ...journalRows, ...fionaRows]) {
      userLogCounts[r.user_id] = (userLogCounts[r.user_id] ?? 0) + 1;
    }

    // Users list
    const profileMap: Record<string, { display_name: string | null; role: string }> = {};
    for (const p of (profilesRes.data ?? []) as { id: string; display_name: string | null; role: string }[]) {
      profileMap[p.id] = { display_name: p.display_name, role: p.role };
    }

    const users = (authUsers.data?.users ?? [])
      .map((u) => {
        const profile = profileMap[u.id];
        return {
          id: u.id,
          displayName: profile?.display_name || u.email?.split("@")[0] || "Unknown",
          role: (profile?.role === "partner" ? "partner" : "primary") as "primary" | "partner",
          accountCreated: u.created_at,
          lastSignIn: u.last_sign_in_at ?? null,
          totalLogs: userLogCounts[u.id] ?? 0,
        };
      })
      .sort((a, b) => b.totalLogs - a.totalLogs);

    return NextResponse.json({
      totalUsers,
      partnerAccounts,
      onboardingCompleted,
      totalEntries,
      activeUsers,
      avgEntriesPerUser: activeUsers > 0 ? Math.round((totalEntries / activeUsers) * 10) / 10 : 0,
      features,
      trend,
      users,
    });
  } catch (err) {
    console.error("Product analytics error:", err);
    return NextResponse.json({ error: "Failed to fetch product analytics" }, { status: 500 });
  }
}
