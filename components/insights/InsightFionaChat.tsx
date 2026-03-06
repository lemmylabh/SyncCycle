"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Send, Loader2 } from "lucide-react";
import { FionaMessage } from "@/components/fiona/FionaMessage";
import { InsightCardData } from "@/lib/insightUtils";

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface InsightFionaChatProps {
  card: InsightCardData;
  userId: string | null;
  accessToken: string;
  isDemo: boolean;
  sessionId: string | null;
  onSessionCreated: (id: string) => void;
}

export function InsightFionaChat({
  card,
  userId,
  accessToken,
  isDemo,
  sessionId,
  onSessionCreated,
}: InsightFionaChatProps) {
  const [displayMessages, setDisplayMessages] = useState<ChatMsg[]>([]);
  // API conversation history (includes the hidden auto-prompt)
  const [apiHistory, setApiHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasAutoOpened = useRef(false);
  const currentSessionId = useRef(sessionId);

  useEffect(() => {
    currentSessionId.current = sessionId;
  }, [sessionId]);

  // Auto-open: fire the explanation prompt without showing user bubble
  useEffect(() => {
    if (hasAutoOpened.current) return;
    hasAutoOpened.current = true;
    const autoPrompt = `Explain this health insight to me in more detail: "${card.body}"${card.suggestion ? ` The suggestion was: "${card.suggestion}"` : ""}. Be conversational and helpful, under 200 words.`;
    fireAutoMessage(autoPrompt);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayMessages]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [inputText]);

  async function fireAutoMessage(prompt: string) {
    setIsStreaming(true);
    const assistantId = `a-auto-${Date.now()}`;
    setDisplayMessages([{ id: assistantId, role: "assistant", content: "" }]);
    const newApiHistory = [{ role: "user" as const, content: prompt }];

    await streamMessage(newApiHistory, assistantId, (content) => {
      setApiHistory([...newApiHistory, { role: "assistant", content }]);
    });
  }

  async function sendUserMessage() {
    const trimmed = inputText.trim();
    if (!trimmed || isStreaming) return;
    setInputText("");

    const userMsg: ChatMsg = { id: `u-${Date.now()}`, role: "user", content: trimmed };
    const assistantId = `a-${Date.now()}`;
    setDisplayMessages(prev => [
      ...prev,
      userMsg,
      { id: assistantId, role: "assistant", content: "" },
    ]);

    const newApiHistory = [...apiHistory, { role: "user" as const, content: trimmed }];

    await streamMessage(newApiHistory, assistantId, (content) => {
      setApiHistory([...newApiHistory, { role: "assistant", content }]);
    });
  }

  async function streamMessage(
    messages: Array<{ role: "user" | "assistant"; content: string }>,
    assistantId: string,
    onComplete: (content: string) => void
  ) {
    setIsStreaming(true);
    try {
      const res = await fetch("/api/fiona/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages,
          sessionId: currentSessionId.current,
          accessToken,
          userId,
          isDemo,
        }),
      });

      const newSessionId = res.headers.get("X-Session-Id");
      if (newSessionId && newSessionId !== currentSessionId.current) {
        currentSessionId.current = newSessionId;
        onSessionCreated(newSessionId);
      }

      if (!res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let content = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        content += decoder.decode(value, { stream: true });
        setDisplayMessages(prev =>
          prev.map(m => m.id === assistantId ? { ...m, content } : m)
        );
      }
      onComplete(content);
    } catch (err) {
      console.error("[InsightFionaChat]", err);
      setDisplayMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, content: "Sorry, I couldn't load that. Please try again." }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendUserMessage();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="border-t border-white/8 overflow-hidden"
    >
      {/* Messages */}
      <div
        ref={scrollRef}
        className="max-h-64 overflow-y-auto py-2 space-y-1 overscroll-contain"
      >
        {displayMessages.map((m, i) => (
          <FionaMessage
            key={m.id}
            role={m.role}
            content={m.content}
            isStreaming={isStreaming && i === displayMessages.length - 1 && m.role === "assistant"}
          />
        ))}
      </div>

      {/* Mini input */}
      <div className="px-3 pb-3 pt-1">
        <div className="flex items-end gap-2 rounded-xl border border-white/8 bg-[#16161f] focus-within:border-white/15 transition-colors px-3 py-2">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a follow-up…"
            disabled={isStreaming}
            rows={1}
            className="flex-1 bg-transparent text-white text-sm placeholder-gray-600 resize-none focus:outline-none leading-relaxed disabled:opacity-40 min-h-[24px]"
            style={{ maxHeight: "120px" }}
          />
          <button
            type="button"
            onClick={sendUserMessage}
            disabled={!inputText.trim() || isStreaming}
            className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
              inputText.trim() && !isStreaming
                ? "bg-gradient-to-br from-rose-600 to-purple-600 text-white hover:opacity-90 active:scale-95"
                : "bg-white/5 text-gray-600 cursor-not-allowed"
            }`}
          >
            {isStreaming
              ? <Loader2 size={13} className="animate-spin" />
              : <Send size={13} />
            }
          </button>
        </div>
      </div>
    </motion.div>
  );
}
