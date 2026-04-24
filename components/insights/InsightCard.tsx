"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { InsightCardData, CARD_TYPE_CONFIG, CATEGORY_CONFIG, getInsightCategory } from "@/lib/insightUtils";
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
  compact?: boolean;
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
  compact = false,
}: InsightCardProps) {
  const typeConfig = CARD_TYPE_CONFIG[card.cardType];
  const category = getInsightCategory(card);
  const cat = CATEGORY_CONFIG[category];
  const [fionaSessionId, setFionaSessionId] = useState<string | null>(null);

  return (
    <div>
      {/* Card */}
      <motion.div
        layout
        className="bg-[var(--card-bg)] card-glass rounded-2xl border border-[var(--border)] overflow-hidden hover:scale-[1.01] transition-transform duration-200 flex"
        transition={{ duration: 0.25, ease: "easeInOut" }}
      >
        {/* Left color bar */}
        <div className="w-[3px] flex-shrink-0 self-stretch rounded-l-2xl" style={{ background: cat.color }} />

        {/* Card content */}
        <div className="flex-1 min-w-0">
        {/* Header: category icon + label + Ask Fiona */}
        <div className={`flex items-center justify-between gap-3 ${compact ? "px-3 pt-3" : "px-4 pt-4"}`}>
          <div className="flex items-center gap-1.5">
            <span className="text-base leading-none">{cat.emoji}</span>
            <span
              className="text-[13px] font-semibold tracking-[0.5px] uppercase"
              style={{ color: cat.color }}
            >
              {cat.label}
            </span>
          </div>
          {!compact && (
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
          )}
        </div>

        {/* Body */}
        <div className={compact ? "px-3 pt-2 pb-3" : "px-4 pt-3 pb-4"}>
          <p className={`text-gray-200 leading-relaxed ${compact ? "text-xs" : "text-sm"}`}>{card.body}</p>
          {card.suggestion && (
            <div
              className={`mt-3 rounded-[10px] flex gap-2 ${compact ? "text-xs px-3 py-2" : "text-sm px-4 py-3"}`}
              style={{
                background: `${cat.color}1a`,
                borderLeft: `2px solid ${cat.color}`,
              }}
            >
              <span className="text-base leading-snug flex-shrink-0">💡</span>
              <p className="text-gray-200 leading-relaxed">{card.suggestion}</p>
            </div>
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
        </div>
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
