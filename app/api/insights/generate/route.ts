import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/fionaUtils";
import {
  buildInsightContext,
  buildInsightPrompt,
  parseInsightResponse,
  localDateStr,
  DEMO_FEED,
  InsightCardData,
} from "@/lib/insightUtils";

export const runtime = "nodejs";

interface GenerateBody {
  accessToken: string;
  userId: string;
  targetCount?: number;
  isDemo?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateBody = await req.json();
    const { accessToken, userId, targetCount = 20, isDemo } = body;

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OpenRouter key not configured" }, { status: 500 });
    }

    // Demo mode — return static feed, no DB writes
    if (isDemo) {
      return NextResponse.json({ feed: DEMO_FEED });
    }

    if (!accessToken || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerSupabaseClient(accessToken);
    const today = localDateStr(new Date());

    // Check if today's feed already exists
    const { data: existingFeed } = await supabase
      .from("insight_feeds")
      .select("id, feed_date, phase, target_count, cards")
      .eq("user_id", userId)
      .eq("feed_date", today)
      .maybeSingle();

    const existingCards = (existingFeed?.cards as InsightCardData[] | null) ?? [];

    // If feed exists with enough cards, return it directly
    if (existingFeed && existingCards.length >= targetCount) {
      return NextResponse.json({
        feed: {
          id: existingFeed.id,
          feedDate: existingFeed.feed_date,
          phase: existingFeed.phase,
          targetCount: existingFeed.target_count,
          cards: existingCards.slice(0, targetCount),
        },
      });
    }

    // Need to generate new or additional cards
    const neededCount = targetCount - existingCards.length;
    const existingIds = existingCards.map(c => c.id);

    const ctx = await buildInsightContext(userId, supabase);
    const { system, user } = buildInsightPrompt(ctx, neededCount, existingIds);

    const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://synccycle.app",
        "X-Title": "SyncCycle - Insights",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        stream: false,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_tokens: 4000,
        temperature: 0.75,
      }),
    });

    if (!openRouterRes.ok) {
      const errText = await openRouterRes.text();
      console.error("[Insights Generate] OpenRouter error:", openRouterRes.status, errText);
      return NextResponse.json({ error: "AI service error", detail: errText }, { status: 502 });
    }

    const openRouterData = await openRouterRes.json();
    const rawContent: string = openRouterData.choices?.[0]?.message?.content ?? "{}";
    const newCards = parseInsightResponse(rawContent);
    const allCards = [...existingCards, ...newCards];

    // Upsert feed
    if (existingFeed) {
      await supabase
        .from("insight_feeds")
        .update({
          cards: allCards,
          target_count: targetCount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingFeed.id);

      return NextResponse.json({
        feed: {
          id: existingFeed.id,
          feedDate: today,
          phase: ctx.phase,
          targetCount,
          cards: allCards,
        },
      });
    }

    // Insert fresh feed
    const { data: inserted, error: insertError } = await supabase
      .from("insight_feeds")
      .insert({
        user_id: userId,
        feed_date: today,
        phase: ctx.phase,
        target_count: targetCount,
        cards: allCards,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      console.error("[Insights Generate] Insert error:", insertError);
      return NextResponse.json({ error: "Failed to save feed" }, { status: 500 });
    }

    return NextResponse.json({
      feed: {
        id: inserted.id,
        feedDate: today,
        phase: ctx.phase,
        targetCount,
        cards: allCards,
      },
    });
  } catch (err) {
    console.error("[Insights Generate]", err);
    return NextResponse.json(
      { error: "Internal server error", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
