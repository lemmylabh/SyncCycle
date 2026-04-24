import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/fionaUtils";
import { InsightCardData, InsightHashtag, localDateStr } from "@/lib/insightUtils";

export const runtime = "nodejs";

interface SummarizeBody {
  accessToken: string;
  userId: string;
  cards: Pick<InsightCardData, "id" | "hashtags" | "body">[];
}

const EMOJI: Record<InsightHashtag, string> = {
  sleep: "🌙", fitness: "⚡", vibe: "✨", nutrition: "🍃", symptoms: "🩺", period: "🌸",
};

export async function POST(req: NextRequest) {
  try {
    const body: SummarizeBody = await req.json();
    const { accessToken, userId, cards } = body;

    if (!accessToken || !userId || !cards?.length) {
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "OpenRouter key not configured" }, { status: 500 });

    const prompt = `Generate a one-liner summary for each insight card. Follow this exact pattern: {emoji} {headline noun}: {1 key stat or short verdict}. Max 60 characters total.

Use the primary hashtag's emoji: 🌙 sleep, ⚡ fitness, ✨ vibe, 🍃 nutrition, 🩺 symptoms, 🌸 period.

Examples:
- "🌙 Sleep: 7.2h avg — below your usual"
- "⚡ Fitness: lower intensity (2.7 avg)"
- "🍃 Nutrition: cravings likely this week"
- "✨ Vibe: mood dipping in luteal phase"
- "🩺 Symptoms: cramps expected in 2 days"

Cards to summarize:
${cards.map((c, i) => `${i + 1}. [${c.hashtags[0]}] ${c.body}`).join("\n")}

Return JSON: { "summaries": [ { "id": "...", "summary": "..." }, ... ] }`;

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://synccycle.app",
        "X-Title": "SyncCycle - Insight Summaries",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        stream: false,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }],
        max_tokens: 800,
        temperature: 0.4,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "AI service error" }, { status: 502 });
    }

    const aiData = await res.json();
    const raw = aiData.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);
    const summaries: { id: string; summary: string }[] = parsed.summaries ?? [];

    // Patch summaries into DB feed for today so they persist
    try {
      const supabase = createServerSupabaseClient(accessToken);
      const today = localDateStr(new Date());
      const { data: feedData } = await supabase
        .from("insight_feeds")
        .select("id, cards")
        .eq("user_id", userId)
        .eq("feed_date", today)
        .maybeSingle();

      if (feedData) {
        const updatedCards = (feedData.cards as InsightCardData[]).map(card => {
          const match = summaries.find(s => s.id === card.id);
          return match ? { ...card, summary: match.summary } : card;
        });
        await supabase
          .from("insight_feeds")
          .update({ cards: updatedCards, updated_at: new Date().toISOString() })
          .eq("id", feedData.id);
      }
    } catch {
      // Non-critical — summaries still returned to client
    }

    return NextResponse.json({ summaries });
  } catch (err) {
    console.error("[Insights Summarize]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
