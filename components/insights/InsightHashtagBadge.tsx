"use client";

import { HASHTAG_CONFIG, InsightHashtag } from "@/lib/insightUtils";

export function InsightHashtagBadge({ hashtag }: { hashtag: InsightHashtag }) {
  const cfg = HASHTAG_CONFIG[hashtag];
  return (
    <span
      className={`inline-flex items-center text-xs font-medium ${cfg.text}`}
    >
      {cfg.label}
    </span>
  );
}
