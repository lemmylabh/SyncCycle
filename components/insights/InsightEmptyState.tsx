"use client";

import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";

interface InsightEmptyStateProps {
  onRetry: () => void;
  isRetrying?: boolean;
}

export function InsightEmptyState({ onRetry, isRetrying }: InsightEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center mb-4">
        <span className="text-2xl">✦</span>
      </div>
      <p className="text-white font-semibold mb-1">Couldn't generate insights</p>
      <p className="text-gray-400 text-sm mb-6 max-w-xs leading-relaxed">
        There was a problem fetching your personalised feed. Log more data to unlock richer insights.
      </p>
      <button
        onClick={onRetry}
        disabled={isRetrying}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/8 border border-white/10 text-white text-sm hover:bg-white/12 transition-colors disabled:opacity-50"
      >
        <RefreshCw size={14} className={isRetrying ? "animate-spin" : ""} />
        Try again
      </button>
    </motion.div>
  );
}
