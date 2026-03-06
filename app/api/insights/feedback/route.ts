import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/fionaUtils";

export const runtime = "nodejs";

interface FeedbackBody {
  accessToken: string;
  userId: string;
  feedId: string;
  cardIndex: number;
  reaction: "helpful" | "not_helpful";
  correlationKey: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: FeedbackBody = await req.json();
    const { accessToken, userId, feedId, cardIndex, reaction, correlationKey } = body;

    if (!accessToken || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerSupabaseClient(accessToken);

    // Get the user's existing reaction for this card (to detect changes)
    const { data: existing } = await supabase
      .from("insight_feedback")
      .select("reaction")
      .eq("user_id", userId)
      .eq("feed_id", feedId)
      .eq("card_index", cardIndex)
      .maybeSingle();

    const prevReaction = (existing?.reaction as "helpful" | "not_helpful" | null) ?? null;

    // Upsert feedback record
    await supabase.from("insight_feedback").upsert(
      {
        user_id: userId,
        feed_id: feedId,
        card_index: cardIndex,
        reaction,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,feed_id,card_index" }
    );

    // Manage correlation flags — only update if reaction changed direction
    if (reaction === "not_helpful" && prevReaction !== "not_helpful") {
      // Increment flag count
      const { data: existingFlag } = await supabase
        .from("insight_correlation_flags")
        .select("id, flag_count")
        .eq("user_id", userId)
        .eq("correlation_key", correlationKey)
        .maybeSingle();

      if (existingFlag) {
        const newCount = existingFlag.flag_count + 1;
        await supabase
          .from("insight_correlation_flags")
          .update({
            flag_count: newCount,
            suppressed: newCount >= 5,
            last_flagged: new Date().toISOString(),
          })
          .eq("id", existingFlag.id);
      } else {
        await supabase.from("insight_correlation_flags").insert({
          user_id: userId,
          correlation_key: correlationKey,
          flag_count: 1,
          suppressed: false,
        });
      }
    } else if (reaction === "helpful" && prevReaction === "not_helpful") {
      // Decrement flag count (user changed mind)
      const { data: existingFlag } = await supabase
        .from("insight_correlation_flags")
        .select("id, flag_count")
        .eq("user_id", userId)
        .eq("correlation_key", correlationKey)
        .maybeSingle();

      if (existingFlag && existingFlag.flag_count > 0) {
        const newCount = existingFlag.flag_count - 1;
        await supabase
          .from("insight_correlation_flags")
          .update({ flag_count: newCount, suppressed: newCount >= 5 })
          .eq("id", existingFlag.id);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Insights Feedback]", err);
    return NextResponse.json(
      { error: "Internal server error", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
