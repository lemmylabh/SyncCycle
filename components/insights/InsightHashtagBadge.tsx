"use client";

import { HASHTAG_CONFIG, InsightHashtag } from "@/lib/insightUtils";

export function InsightHashtagBadge({ hashtag }: { hashtag: InsightHashtag }) {
  const cfg = HASHTAG_CONFIG[hashtag];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      {cfg.label}
    </span>
  );
}
