"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { InsightCardData, CARD_TYPE_CONFIG } from "@/lib/insightUtils";
import { InsightHashtagBadge } from "./InsightHashtagBadge";
import { InsightFionaChat } from "./InsightFionaChat";

interface InsightCardProps {
  card: InsightCardData;
  cardIndex: number;
  reaction: "helpful" | "not_helpful" | null;
  isExpanded: boolean;
  onAskFiona: () => void;
  onFeedback: (reaction: "helpful" | "not_helpful") => void;
  userId: string | null;
  accessToken: string;
  isDemo: boolean;
}

export function InsightCard({
  card,
  cardIndex,
  reaction,
  isExpanded,
  onAskFiona,
  onFeedback,
  userId,
  accessToken,
  isDemo,
}: InsightCardProps) {
  const typeConfig = CARD_TYPE_CONFIG[card.cardType];
  const [fionaSessionId, setFionaSessionId] = useState<string | null>(null);

  return (
    <div>
      {/* Card */}
      <motion.div
        layout
        className="bg-[#1e1e2a] rounded-2xl border border-white/5 overflow-hidden"
        transition={{ duration: 0.25, ease: "easeInOut" }}
      >
        {/* Header: hashtags + Ask Fiona */}
        <div className="flex items-start justify-between gap-3 px-4 pt-4">
          <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
            {card.hashtags.map(h => (
              <InsightHashtagBadge key={h} hashtag={h} />
            ))}
          </div>
          <button
            onClick={onAskFiona}
            className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap ${
              isExpanded
                ? "bg-rose-500/15 text-rose-300 border-rose-500/25"
                : "bg-white/5 text-gray-400 border-white/8 hover:bg-white/10 hover:text-white"
            }`}
          >
            {isExpanded ? "Close ✕" : "Ask Fiona ›"}
          </button>
        </div>

        {/* Body */}
        <div className="px-4 pt-3 pb-4">
          <p className="text-gray-200 text-sm leading-relaxed">{card.body}</p>
          {card.suggestion && (
            <p className="text-gray-400 text-sm mt-2 leading-relaxed border-l-2 border-white/10 pl-3">
              {card.suggestion}
            </p>
          )}
        </div>

        {/* Fiona inline chat */}
        <AnimatePresence>
          {isExpanded && (
            <InsightFionaChat
              key={`fiona-${card.id}`}
              card={card}
              userId={userId}
              accessToken={accessToken}
              isDemo={isDemo}
              sessionId={fionaSessionId}
              onSessionCreated={setFionaSessionId}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Below card: type label + feedback */}
      <div className="flex items-center justify-between mt-2 px-1">
        <span className={`text-xs font-medium ${typeConfig.color}`}>
          {typeConfig.label}
        </span>
        <div className="flex items-center gap-4">
          <button
            onClick={() => onFeedback("helpful")}
            className={`text-xs transition-colors py-0.5 ${
              reaction === "helpful"
                ? "text-emerald-400 font-medium"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            Helpful
          </button>
          <button
            onClick={() => onFeedback("not_helpful")}
            className={`text-xs transition-colors py-0.5 ${
              reaction === "not_helpful"
                ? "text-rose-400 font-medium"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            Not Helpful
          </button>
        </div>
      </div>
    </div>
  );
}
