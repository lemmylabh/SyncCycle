"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FionaMessage } from "./FionaMessage";
import { FionaInput } from "./FionaInput";
import { ChatMessage } from "@/lib/fionaUtils";
import { Phase, PHASE_CONFIG } from "@/lib/cycleUtils";

interface FionaChatProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;
  onSend: (text: string) => void;
  userName: string;
  currentPhase: Phase | null;
  disabled?: boolean;
}

const SUGGESTION_CHIPS = [
  "How am I feeling based on my data?",
  "Workout tips for today",
  "What should I eat right now?",
  "How has my sleep been?",
];

function WelcomeCard({
  userName,
  currentPhase,
  onChipClick,
}: {
  userName: string;
  currentPhase: Phase | null;
  onChipClick: (text: string) => void;
}) {
  const hour = typeof window !== "undefined" ? new Date().getHours() : 9;
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const moon = hour < 12 ? "🌅" : hour < 17 ? "☀️" : "🌙";

  const phaseInfo = currentPhase ? PHASE_CONFIG[currentPhase] : null;
  const ringColor = phaseInfo?.ring ?? "#a855f7";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-4 mt-6 mb-4"
    >
      {/* Greeting card with phase ring glow */}
      <div
        className="rounded-2xl p-px"
        style={{
          background: `linear-gradient(135deg, ${ringColor}40, ${ringColor}15, transparent)`,
          boxShadow: `0 0 40px ${ringColor}15`,
        }}
      >
        <div className="rounded-[15px] bg-[#1a1a24] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: `${ringColor}20` }}
            >
              {moon}
            </div>
            <div>
              <h2 className="text-white font-semibold text-base leading-tight">
                {greeting}, {userName}!
              </h2>
              {phaseInfo && (
                <p className="text-sm mt-0.5" style={{ color: ringColor }}>
                  {phaseInfo.label} — {phaseInfo.tagline}
                </p>
              )}
              {!phaseInfo && (
                <p className="text-gray-400 text-sm mt-0.5">
                  How are you feeling today?
                </p>
              )}
            </div>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">
            I&apos;m Fiona, your cycle-aware wellness coach. I have access to your health data and I&apos;m here to help you understand your patterns and feel your best.
          </p>
        </div>
      </div>

      {/* Suggestion chips */}
      <div className="flex flex-wrap gap-2 mt-3">
        {SUGGESTION_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => onChipClick(chip)}
            className="text-xs px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-gray-300 hover:text-white transition-all duration-150 active:scale-95"
          >
            {chip}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

export function FionaChat({
  messages,
  isStreaming,
  streamingContent,
  onSend,
  userName,
  currentPhase,
  disabled,
}: FionaChatProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages or streaming content
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Messages area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent py-2"
      >
        <AnimatePresence initial={false}>
          {messages.length === 0 && !isStreaming ? (
            <WelcomeCard
              userName={userName}
              currentPhase={currentPhase}
              onChipClick={onSend}
            />
          ) : (
            <>
              {messages.map((msg) => (
                <FionaMessage key={msg.id} role={msg.role} content={msg.content} />
              ))}
              {isStreaming && streamingContent && (
                <FionaMessage
                  key="streaming"
                  role="assistant"
                  content={streamingContent}
                  isStreaming
                />
              )}
              {isStreaming && !streamingContent && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 px-4 py-2"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  </div>
                  <div className="flex gap-1 items-center h-8">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-rose-400/60"
                        style={{
                          animation: `bounce 1.2s infinite`,
                          animationDelay: `${i * 0.2}s`,
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>
        <div ref={bottomRef} className="h-2" />
      </div>

      {/* Input */}
      <FionaInput
        onSend={onSend}
        isStreaming={isStreaming}
        currentPhase={currentPhase}
        disabled={disabled}
      />

      <style jsx>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
