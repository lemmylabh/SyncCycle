"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { FionaChat } from "@/components/fiona/FionaChat";
import { ChatMessage } from "@/lib/fionaUtils";
import { Phase, computePhase } from "@/lib/cycleUtils";

interface FionaPopupProps {
  isOpen: boolean;
  onClose: () => void;
  isDemo: boolean;
}

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

export function FionaPopup({ isOpen, onClose, isDemo }: FionaPopupProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState("");
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("there");
  const [currentPhase, setCurrentPhase] = useState<Phase | null>(null);

  // Load auth + cycle data on mount
  useEffect(() => {
    if (!isOpen) return;

    if (isDemo) {
      setUserName("Demo");
      setCurrentPhase("follicular");
      return;
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      setAccessToken(session.access_token);
      setUserId(session.user.id);

      const meta = session.user.user_metadata;
      const fullName = (meta?.full_name as string) ?? session.user.email ?? "";
      setUserName(fullName.split(" ")[0] || "there");

      // Fetch latest cycle to determine phase
      const [profileRes, cycleRes] = await Promise.all([
        supabase
          .from("user_profiles")
          .select("average_cycle_length, average_period_length")
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

      if (cycleRes.data?.start_date) {
        const start = new Date(cycleRes.data.start_date + "T00:00:00");
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const day = Math.max(1, Math.floor((now.getTime() - start.getTime()) / 86400000) + 1);
        const pLen = profileRes.data?.average_period_length ?? 5;
        const cLen = profileRes.data?.average_cycle_length ?? 28;
        setCurrentPhase(computePhase(day, pLen, cLen));
      }
    });
  }, [isOpen, isDemo]);

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

      let token = accessToken;
      if (!isDemo && !token) {
        const { data } = await supabase.auth.getSession();
        token = data.session?.access_token ?? "";
        setAccessToken(token);
      }

      await streamFionaResponse(
        updatedMessages,
        sessionId,
        token,
        userId,
        isDemo,
        (delta) => setStreamingContent((prev) => prev + delta),
        (fullContent, newSessionId) => {
          setMessages((prev) => [
            ...prev,
            { id: `assistant-${Date.now()}`, role: "assistant", content: fullContent },
          ]);
          setStreamingContent("");
          setIsStreaming(false);
          setSessionId(newSessionId);
        },
        () => {
          setIsStreaming(false);
          setStreamingContent("");
          setMessages((prev) => [
            ...prev,
            {
              id: `err-${Date.now()}`,
              role: "assistant",
              content: "I'm having trouble connecting right now. Please try again in a moment.",
            },
          ]);
        }
      );
    },
    [isStreaming, messages, sessionId, accessToken, userId, isDemo]
  );

  const handleClose = () => {
    onClose();
    // Reset after animation completes
    setTimeout(() => {
      setMessages([]);
      setStreamingContent("");
      setIsStreaming(false);
      setSessionId(null);
    }, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="fiona-popup"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className="fixed inset-0 z-[60] flex flex-col bg-[#0f0f13]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              </div>
              <div>
                <h2 className="text-white font-bold text-sm leading-tight">Ask Fiona</h2>
                <p className="text-gray-500 text-[10px]">Your AI wellness coach</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          {/* Chat body — fills remaining space */}
          <div className="flex-1 min-h-0 flex flex-col">
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
