import { NextRequest, NextResponse } from "next/server";
import { buildUserContext, buildSystemPrompt, createServerSupabaseClient } from "@/lib/fionaUtils";

export const runtime = "nodejs";

interface ChatRequestBody {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  sessionId: string | null;
  accessToken: string;
  userId: string;
  isDemo?: boolean;
}

async function ensureSession(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  userId: string,
  sessionId: string | null,
  firstUserMessage: string
): Promise<string> {
  if (sessionId) return sessionId;

  const title = firstUserMessage.slice(0, 60).trim() || "New Chat";
  const { data, error } = await supabase
    .from("fiona_sessions")
    .insert({ user_id: userId, title })
    .select("id")
    .single();

  if (error || !data) {
    // Return a temp ID so the stream can still proceed
    return `temp-${Date.now()}`;
  }
  return data.id;
}

async function persistMessages(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  userId: string,
  sessionId: string,
  userMessage: string,
  assistantContent: string
) {
  if (sessionId.startsWith("temp-")) return;

  await supabase.from("fiona_messages").insert([
    { session_id: sessionId, user_id: userId, role: "user", content: userMessage },
    { session_id: sessionId, user_id: userId, role: "assistant", content: assistantContent },
  ]);

  await supabase
    .from("fiona_sessions")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", sessionId);
}

const DEMO_SYSTEM_PROMPT = `You are Fiona, a warm and empathetic AI wellness coach built into SyncCycle — a menstrual cycle tracking app.

The user is exploring in demo mode, so you don't have access to their personal health data. Give helpful, encouraging general advice about cycle awareness, hormonal health, and lifestyle optimisation.

Rules:
- You are NOT a doctor — never diagnose or prescribe
- Keep responses warm, empowering, and concise (under 200 words)
- If asked personal questions, gently note that signing in unlocks personalised cycle-aware coaching`;

interface PersistOpts {
  supabase: ReturnType<typeof createServerSupabaseClient>;
  userId: string;
  lastUserMessage: string;
  sessionId: string;
}

async function streamOpenRouter(
  apiKey: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  systemPrompt: string,
  sessionId: string,
  persist: PersistOpts | null
): Promise<Response> {
  const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://synccycle.app",
      "X-Title": "SyncCycle - Ask Fiona",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      stream: true,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  if (!openRouterRes.ok) {
    const errText = await openRouterRes.text();
    console.error(`OpenRouter error ${openRouterRes.status}:`, errText);
    return NextResponse.json(
      { error: "AI service error", detail: errText, status: openRouterRes.status },
      { status: 502 }
    );
  }

  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  (async () => {
    let assistantContent = "";
    try {
      const reader = openRouterRes.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const delta: string = parsed.choices?.[0]?.delta?.content ?? "";
            if (delta) {
              assistantContent += delta;
              await writer.write(encoder.encode(delta));
            }
          } catch { /* skip malformed SSE */ }
        }
      }
    } finally {
      await writer.close();
      if (persist && assistantContent && persist.lastUserMessage) {
        await persistMessages(
          persist.supabase,
          persist.userId,
          persist.sessionId,
          persist.lastUserMessage,
          assistantContent
        );
      }
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "Transfer-Encoding": "chunked",
      "X-Session-Id": sessionId,
    },
  });
}

export async function POST(req: NextRequest) {
  console.log("[Fiona] POST called");
  try {
    const body: ChatRequestBody = await req.json();
    const { messages, sessionId: incomingSessionId, accessToken, userId, isDemo } = body;

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    console.log("[Fiona] key present:", !!openRouterKey, "isDemo:", isDemo);
    if (!openRouterKey) {
      return NextResponse.json({ error: "OpenRouter API key not configured" }, { status: 500 });
    }

    // Demo mode: real AI, no user context, no session persistence
    if (isDemo) {
      const demoSessionId = incomingSessionId ?? `demo-${Date.now()}`;
      return streamOpenRouter(openRouterKey, messages, DEMO_SYSTEM_PROMPT, demoSessionId, null);
    }

    if (!accessToken || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerSupabaseClient(accessToken);

    // Get the latest user message for session title
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

    // Pre-create session so we can return the ID in headers
    const sessionId = await ensureSession(supabase, userId, incomingSessionId, lastUserMessage);

    // Build context + system prompt
    const context = await buildUserContext(userId, supabase);
    const systemPrompt = buildSystemPrompt(context);

    return streamOpenRouter(openRouterKey, messages, systemPrompt, sessionId, {
      supabase,
      userId,
      lastUserMessage,
      sessionId,
    });
  } catch (err) {
    console.error("Fiona chat error:", err);
    return NextResponse.json({
      error: "Internal server error",
      detail: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}
