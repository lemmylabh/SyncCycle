import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/fionaUtils";
import { localDateStr } from "@/lib/insightUtils";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const date = searchParams.get("date") ?? localDateStr(new Date());
  const listDates = searchParams.get("listDates") === "true";
  const accessToken = req.headers.get("authorization")?.replace("Bearer ", "");

  if (!accessToken || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient(accessToken);

  // Return list of past feed dates (last 30 days)
  if (listDates) {
    const thirtyDaysAgo = localDateStr(new Date(Date.now() - 30 * 86400000));
    const { data: datesData } = await supabase
      .from("insight_feeds")
      .select("feed_date")
      .eq("user_id", userId)
      .gte("feed_date", thirtyDaysAgo)
      .order("feed_date", { ascending: false });

    return NextResponse.json({
      dates: (datesData ?? []).map((r: Record<string, unknown>) => r.feed_date as string),
    });
  }

  // Fetch feed for given date
  const { data: feedData } = await supabase
    .from("insight_feeds")
    .select("id, feed_date, phase, target_count, cards")
    .eq("user_id", userId)
    .eq("feed_date", date)
    .maybeSingle();

  if (!feedData) {
    return NextResponse.json({ feed: null, feedback: {} });
  }

  // Fetch feedback for this feed
  const { data: feedbackData } = await supabase
    .from("insight_feedback")
    .select("card_index, reaction")
    .eq("user_id", userId)
    .eq("feed_id", feedData.id);

  const feedback: Record<number, "helpful" | "not_helpful"> = {};
  (feedbackData ?? []).forEach((f: Record<string, unknown>) => {
    feedback[f.card_index as number] = f.reaction as "helpful" | "not_helpful";
  });

  return NextResponse.json({
    feed: {
      id: feedData.id,
      feedDate: feedData.feed_date,
      phase: feedData.phase,
      targetCount: feedData.target_count,
      cards: feedData.cards,
    },
    feedback,
  });
}
