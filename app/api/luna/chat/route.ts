import { NextRequest, NextResponse } from "next/server";
import { buildUserContext, buildSystemPrompt, createServerSupabaseClient } from "@/lib/lunaUtils";

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
    .from("luna_sessions")
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

  await supabase.from("luna_messages").insert([
    { session_id: sessionId, user_id: userId, role: "user", content: userMessage },
    { session_id: sessionId, user_id: userId, role: "assistant", content: assistantContent },
  ]);

  await supabase
    .from("luna_sessions")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", sessionId);
}

// Demo streaming simulation
function demoStream(sessionId: string): Response {
  const demoText =
    "Hi! I'm Luna, your wellness coach. In demo mode I can show you how the chat interface works, but I can't access your personal data or provide real AI responses. Sign in to unlock personalized, cycle-aware coaching tailored to your unique patterns!";

  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  (async () => {
    await new Promise((r) => setTimeout(r, 400));
    const words = demoText.split(" ");
    for (const word of words) {
      await writer.write(encoder.encode(word + " "));
      await new Promise((r) => setTimeout(r, 35));
    }
    await writer.close();
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Session-Id": sessionId,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequestBody = await req.json();
    const { messages, sessionId: incomingSessionId, accessToken, userId, isDemo } = body;

    // Demo mode: return fake response
    if (isDemo) {
      return demoStream(incomingSessionId ?? `demo-${Date.now()}`);
    }

    if (!accessToken || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerSupabaseClient(accessToken);

    // Get the latest user message for session title
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

    // Pre-create session so we can return the ID in headers
    const sessionId = await ensureSession(supabase, userId, incomingSessionId, lastUserMessage);

    // Build context + system prompt in parallel with session creation
    const context = await buildUserContext(userId, supabase);
    const systemPrompt = buildSystemPrompt(context);

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      return NextResponse.json({ error: "OpenRouter API key not configured" }, { status: 500 });
    }

    const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openRouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://synccycle.app",
        "X-Title": "SyncCycle — Ask Luna",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3-haiku",
        stream: true,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!openRouterRes.ok) {
      const err = await openRouterRes.text();
      console.error("OpenRouter error:", err);
      return NextResponse.json({ error: "AI service error" }, { status: 502 });
    }

    // Stream response back to client, persist after completion
    const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      const reader = openRouterRes.body!.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
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
            } catch {
              // skip malformed SSE lines
            }
          }
        }
      } finally {
        await writer.close();
        // Persist both messages after stream completes
        if (assistantContent && lastUserMessage) {
          await persistMessages(supabase, userId, sessionId, lastUserMessage, assistantContent);
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
  } catch (err) {
    console.error("Luna chat error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
