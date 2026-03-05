"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Phase, computePhase, cycleDay as calcCycleDay } from "@/lib/cycleUtils";
import { FionaSession, ChatMessage } from "@/lib/fionaUtils";
import { FionaChat } from "@/components/fiona/FionaChat";
import { FionaDayCard } from "@/components/fiona/FionaDayCard";
import { FionaChatHistory } from "@/components/fiona/FionaChatHistory";
import { FionaMobilePanel } from "@/components/fiona/FionaMobilePanel";
import { History, CalendarDays, Plus } from "lucide-react";

// ── Demo data ─────────────────────────────────────────────────────────────────

const DEMO_SESSIONS: FionaSession[] = [
  { id: "d1", title: "How to manage cramps naturally", created_at: new Date(Date.now() - 7200000).toISOString(), updated_at: new Date(Date.now() - 7200000).toISOString() },
  { id: "d2", title: "Energy tips for this week", created_at: new Date(Date.now() - 86400000).toISOString(), updated_at: new Date(Date.now() - 86400000).toISOString() },
  { id: "d3", title: "Nutrition in the luteal phase", created_at: new Date(Date.now() - 172800000).toISOString(), updated_at: new Date(Date.now() - 172800000).toISOString() },
];

// ── Streaming helper ──────────────────────────────────────────────────────────

async function streamFionaResponse(
  messages: ChatMessage[],
  sessionId: string | null,
  accessToken: string,
  userId: string,
  isDemo: boolean,
  onDelta: (delta: string) => void,
  onComplete: (fullContent: string, newSessionId: string) => void,
  onError: () => void
) {
  try {
    const res = await fetch("/api/fiona/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: messages.map(({ role, content }) => ({ role, content })),
        sessionId,
        accessToken,
        userId,
        isDemo,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "(no body)");
      console.error("[Fiona] API error", res.status, errBody);
      onError();
      return;
    }

    const returnedSessionId =
      res.headers.get("X-Session-Id") ?? sessionId ?? `temp-${Date.now()}`;

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      fullContent += chunk;
      onDelta(chunk);
    }

    onComplete(fullContent, returnedSessionId);
  } catch {
    onError();
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FionaPage() {
  const searchParams = useSearchParams();
  const isDemo =
    searchParams.get("demo") === "true" ||
    (typeof window !== "undefined" && sessionStorage.getItem("demo") === "true");

  // Auth state
  const [userId, setUserId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string>("");
  const [userName, setUserName] = useState("there");

  // Cycle state (for DayCard + welcome card)
  const [currentPhase, setCurrentPhase] = useState<Phase | null>(null);
  const [currentCycleDay, setCurrentCycleDay] = useState<number | null>(null);
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [startDate, setStartDate] = useState<string | null>(null);

  // Chat state
  const [sessions, setSessions] = useState<FionaSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [sessionsLoading, setSessionsLoading] = useState(true);

  // Mobile UI state
  const [isMobile, setIsMobile] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<"none" | "history" | "daycard">("none");

  // Swipe tracking
  const touchStartY = useRef<number | null>(null);
  const touchStartIntent = useRef<"history" | "daycard" | null>(null);

  // ── Mobile detection ──
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Auth + profile fetch ──
  useEffect(() => {
    if (isDemo) {
      setUserName("Demo");
      setCurrentPhase("follicular");
      setCurrentCycleDay(8);
      setSessions(DEMO_SESSIONS);
      setSessionsLoading(false);
      return;
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      setUserId(session.user.id);
      setAccessToken(session.access_token);

      const meta = session.user.user_metadata;
      const fullName = (meta?.full_name as string) ?? session.user.email ?? "";
      setUserName(fullName.split(" ")[0] || "there");

      // Fetch profile + latest cycle in parallel
      const [profileRes, cycleRes] = await Promise.all([
        supabase
          .from("user_profiles")
          .select("display_name, average_cycle_length, average_period_length")
          .eq("id", session.user.id)
          .maybeSingle(),
        supabase
          .from("cycles")
          .select("start_date, cycle_length")
          .eq("user_id", session.user.id)
          .order("start_date", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (profileRes.data) {
        const p = profileRes.data;
        if (p.display_name) setUserName(p.display_name.split(" ")[0]);
        setCycleLength(p.average_cycle_length ?? 28);
        setPeriodLength(p.average_period_length ?? 5);
      }

      if (cycleRes.data?.start_date) {
        const day = calcCycleDay(cycleRes.data.start_date);
        const len = profileRes.data?.average_cycle_length ?? 28;
        const pLen = profileRes.data?.average_period_length ?? 5;
        setCurrentCycleDay(day);
        setStartDate(cycleRes.data.start_date);
        setCurrentPhase(computePhase(day, pLen, len));
      }
    });
  }, [isDemo]);

  // ── Session management ──
  const loadSessions = useCallback(async () => {
    if (isDemo || !userId) return;
    setSessionsLoading(true);
    const { data } = await supabase
      .from("fiona_sessions")
      .select("id, title, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(20);
    setSessions((data ?? []) as FionaSession[]);
    setSessionsLoading(false);
  }, [userId, isDemo]);

  useEffect(() => {
    if (userId) loadSessions();
  }, [userId, loadSessions]);

  const loadSession = useCallback(
    async (id: string) => {
      if (isDemo) {
        setActiveSessionId(id);
        setMessages([]);
        return;
      }
      if (!userId) return;
      const { data } = await supabase
        .from("fiona_messages")
        .select("id, role, content, created_at")
        .eq("session_id", id)
        .order("created_at", { ascending: true });

      setMessages(
        (data ?? []).map((m: Record<string, unknown>) => ({
          id: m.id as string,
          role: m.role as "user" | "assistant",
          content: m.content as string,
          created_at: m.created_at as string,
        }))
      );
      setActiveSessionId(id);
    },
    [userId, isDemo]
  );

  const handleNewSession = () => {
    setActiveSessionId(null);
    setMessages([]);
    setMobilePanel("none");
  };

  // ── Send message ──
  const handleSend = useCallback(
    async (text: string) => {
      if (isStreaming) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
      };

      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setIsStreaming(true);
      setStreamingContent("");

      // Re-fetch token in case it was refreshed
      let token = accessToken;
      if (!isDemo && !token) {
        const { data } = await supabase.auth.getSession();
        token = data.session?.access_token ?? "";
        setAccessToken(token);
      }

      await streamFionaResponse(
        updatedMessages,
        activeSessionId,
        token,
        userId ?? "",
        isDemo,
        (delta) => setStreamingContent((prev) => prev + delta),
        (fullContent, newSessionId) => {
          const assistantMsg: ChatMessage = {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: fullContent,
          };
          setMessages((prev) => [...prev, assistantMsg]);
          setStreamingContent("");
          setIsStreaming(false);
          setActiveSessionId(newSessionId);
          if (!isDemo) loadSessions();
        },
        () => {
          setIsStreaming(false);
          setStreamingContent("");
          const errMsg: ChatMessage = {
            id: `err-${Date.now()}`,
            role: "assistant",
            content: "I'm having trouble connecting right now. Please try again in a moment.",
          };
          setMessages((prev) => [...prev, errMsg]);
        }
      );
    },
    [isStreaming, messages, activeSessionId, accessToken, userId, isDemo, loadSessions]
  );

  // ── Swipe gestures (mobile) ──
  const handleTouchStart = (e: React.TouchEvent) => {
    const y = e.touches[0].clientY;
    touchStartY.current = y;
    const wh = window.innerHeight;
    if (y < 60) touchStartIntent.current = "history";
    else if (y > wh - 80) touchStartIntent.current = "daycard";
    else touchStartIntent.current = null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null || touchStartIntent.current === null) return;
    const endY = e.changedTouches[0].clientY;
    const delta = endY - touchStartY.current;
    const intent = touchStartIntent.current;

    if (intent === "history" && delta > 60) setMobilePanel("history");
    if (intent === "daycard" && delta < -60) setMobilePanel("daycard");

    touchStartY.current = null;
    touchStartIntent.current = null;
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const rightPanel = (
    <>
      {/* Day Card — top 50% */}
      <div className="flex-1 min-h-0 border-b border-white/5 overflow-hidden">
        <FionaDayCard
          userId={userId}
          cycleDay={currentCycleDay}
          cycleLength={cycleLength}
          periodLength={periodLength}
          startDate={startDate}
          isDemo={isDemo}
        />
      </div>
      {/* Chat History — bottom 50% */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <FionaChatHistory
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={(id) => {
            loadSession(id);
            setMobilePanel("none");
          }}
          onNewSession={handleNewSession}
          isLoading={sessionsLoading}
        />
      </div>
    </>
  );

  return (
    <>
      {/* ── Desktop Layout ──────────────────────────────────────────────────── */}
      {!isMobile && (
        <div className="h-[calc(100vh-56px)] grid grid-cols-[1fr_360px] overflow-hidden">
          {/* Left: Chat */}
          <div className="flex flex-col border-r border-white/5 overflow-hidden">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-shrink-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="white">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-white font-bold text-base leading-tight">Ask Fiona</h1>
                  <p className="text-gray-500 text-[11px]">Your AI wellness coach</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isDemo && (
                  <span className="text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full">
                    Demo
                  </span>
                )}
                <button
                  onClick={handleNewSession}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/20 text-rose-400 transition-colors"
                >
                  <Plus size={12} />
                  New Chat
                </button>
              </div>
            </motion.div>

            {/* Chat body */}
            <FionaChat
              messages={messages}
              isStreaming={isStreaming}
              streamingContent={streamingContent}
              onSend={handleSend}
              userName={userName}
              currentPhase={currentPhase}
              disabled={isStreaming}
            />
          </div>

          {/* Right: Day Card + History */}
          <div className="flex flex-col overflow-hidden">
            {rightPanel}
          </div>
        </div>
      )}

      {/* ── Mobile Layout ──────────────────────────────────────────────────── */}
      {isMobile && (
        <div
          className="h-[calc(100vh-56px)] flex flex-col overflow-hidden bg-[#0f0f13]"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Mobile header */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              </div>
              <div>
                <h1 className="text-white font-bold text-sm">Ask Fiona</h1>
                {isDemo && <span className="text-[10px] text-purple-400">Demo mode</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobilePanel("history")}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                aria-label="Chat history"
              >
                <History size={15} />
              </button>
              <button
                onClick={() => setMobilePanel("daycard")}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                aria-label="Day card"
              >
                <CalendarDays size={15} />
              </button>
              <button
                onClick={handleNewSession}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/20 text-rose-400 transition-colors"
                aria-label="New chat"
              >
                <Plus size={15} />
              </button>
            </div>
          </motion.div>

          {/* Mobile swipe hints */}
          <div className="flex items-center justify-center gap-6 py-1.5 border-b border-white/[0.03] flex-shrink-0">
            <p className="text-gray-700 text-[10px]">↓ Swipe down for chats</p>
            <p className="text-gray-700 text-[10px]">↑ Swipe up for day card</p>
          </div>

          {/* Chat */}
          <FionaChat
            messages={messages}
            isStreaming={isStreaming}
            streamingContent={streamingContent}
            onSend={handleSend}
            userName={userName}
            currentPhase={currentPhase}
            disabled={isStreaming}
          />

          {/* Mobile overlay panels */}
          <FionaMobilePanel
            panelType="history"
            isOpen={mobilePanel === "history"}
            onClose={() => setMobilePanel("none")}
          >
            <FionaChatHistory
              sessions={sessions}
              activeSessionId={activeSessionId}
              onSelectSession={(id) => {
                loadSession(id);
                setMobilePanel("none");
              }}
              onNewSession={handleNewSession}
              isLoading={sessionsLoading}
            />
          </FionaMobilePanel>

          <FionaMobilePanel
            panelType="daycard"
            isOpen={mobilePanel === "daycard"}
            onClose={() => setMobilePanel("none")}
          >
            <FionaDayCard
              userId={userId}
              cycleDay={currentCycleDay}
              cycleLength={cycleLength}
              periodLength={periodLength}
              startDate={startDate}
              isDemo={isDemo}
            />
          </FionaMobilePanel>
        </div>
      )}
    </>
  );
}
