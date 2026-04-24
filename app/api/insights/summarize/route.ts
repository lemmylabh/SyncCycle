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

    // Derive primary category per card using precedence: sleep > symptoms > fitness > nutrition > vibe > period
    const PRECEDENCE: InsightHashtag[] = ["sleep", "symptoms", "fitness", "nutrition", "vibe", "period"];
    function primaryCat(hashtags: InsightHashtag[]): InsightHashtag {
      for (const h of PRECEDENCE) { if (hashtags.includes(h)) return h; }
      return hashtags[0] ?? "vibe";
    }

    const prompt = `Generate a one-liner summary for each insight card.

STRICT FORMAT: {emoji} {noun}: {stat or verdict}
STRICT LIMIT: 60 characters maximum including emoji. Count carefully.

RULES:
1. Use the PRIMARY category emoji (precedence: sleep > symptoms > fitness > nutrition > vibe > period)
2. Noun must be human-readable — NOT the hashtag name:
   - sleep → "Sleep" or "Sleep quality" (if quality mentioned)
   - vibe → "Mood" (never "Vibe") or "Energy" (if energy is the focus)
   - fitness → "Fitness" or "Movement"
   - nutrition → "Nutrition" or "Cravings" (if cravings mentioned)
   - symptoms → "Symptoms", "Cramps", or "Fatigue" (be specific)
   - period → "Cycle"
3. Stat first — if the body contains a number (hours, /5, avg, days), use it: "7.2h avg", "2.7/5", "~4 days"
4. No filler: no "you may", "during this phase", "might be", "could be"
5. Tense: present fact, not prediction ("lower energy" not "energy may be lower")

GOOD EXAMPLES (count chars — all ≤60):
- "🌙 Sleep: 7.2h avg — below your usual"        (38 chars)
- "🌙 Sleep quality: 2.7/5 — may affect mood"    (43 chars)
- "⚡ Fitness: lower intensity (2.7 avg)"         (37 chars)
- "🍃 Cravings: likely to peak this week"         (38 chars)
- "✨ Mood: lower energy typical for luteal"      (41 chars)
- "🩺 Cramps: expected in ~4 days"               (31 chars)
- "⚡ Fitness: +0.8 mood pts on workout days"     (42 chars)

BAD EXAMPLES (do not produce):
- "✨ Vibe: mood swings common in luteal phase" (uses "Vibe" not "Mood", too generic)
- "🌙 Sleep: insomnia likely affecting quality" (no stat, vague)

Cards:
${cards.map((c, i) => `${i + 1}. id="${c.id}" category=[${primaryCat(c.hashtags)}] body="${c.body}"`).join("\n")}

Return JSON only: { "summaries": [ { "id": "...", "summary": "..." }, ... ] }`;

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
