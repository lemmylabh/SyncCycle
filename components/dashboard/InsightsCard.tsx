"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  InsightCardData,
  HASHTAG_CONFIG,
  CARD_TYPE_CONFIG,
  localDateStr,
} from "@/lib/insightUtils";
import { TrendingUp, ArrowRight, RefreshCw, Sparkles } from "lucide-react";

// ── Mini card ─────────────────────────────────────────────────────────────────

function MiniInsightCard({ card }: { card: InsightCardData }) {
  const typeConfig = CARD_TYPE_CONFIG[card.cardType];
  return (
    <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3 flex-shrink-0">
      <div className="flex items-center gap-1.5 mb-1.5">
        {card.hashtags.slice(0, 2).map(h => {
          const cfg = HASHTAG_CONFIG[h];
          return (
            <span
              key={h}
              className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}
            >
              {cfg.label}
            </span>
          );
        })}
        <span className={`ml-auto text-[9px] font-medium ${typeConfig.color}`}>
          {typeConfig.label}
        </span>
      </div>
      <p className="text-white/55 text-[11px] leading-relaxed line-clamp-2">{card.body}</p>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="flex flex-col gap-2 animate-pulse">
      {[1, 2].map(i => (
        <div key={i} className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3">
          <div className="flex gap-1.5 mb-2">
            <div className="h-4 w-14 bg-white/10 rounded-full" />
            <div className="h-4 w-10 bg-white/10 rounded-full" />
          </div>
          <div className="h-3 w-full bg-white/10 rounded mb-1" />
          <div className="h-3 w-3/4 bg-white/10 rounded" />
        </div>
      ))}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function InsightsCard({ maxCards = 2 }: { maxCards?: number }) {
  const [cards, setCards] = useState<InsightCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [noFeed, setNoFeed] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setNoFeed(false);
    try {
      const isDemo =
        typeof window !== "undefined" && sessionStorage.getItem("demo") === "true";

      if (isDemo) {
        const res = await fetch("/api/insights/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken: "", userId: "", isDemo: true }),
        });
        const data = await res.json();
        setCards((data.feed?.cards ?? []).slice(0, maxCards));
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const date = localDateStr(new Date());
      const res = await fetch(
        `/api/insights/feed?userId=${session.user.id}&date=${date}`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );

      if (res.ok) {
        const data = await res.json();
        const feedCards: InsightCardData[] = data.feed?.cards ?? [];
        if (feedCards.length > 0) {
          setCards(feedCards.slice(0, maxCards));
        } else {
          setNoFeed(true);
        }
      } else {
        setNoFeed(true);
      }
    } catch {
      setNoFeed(true);
    } finally {
      setLoading(false);
    }
  }

  async function generate() {
    setGenerating(true);
    setNoFeed(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch("/api/insights/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: session.access_token,
          userId: session.user.id,
        }),
      });
      const data = await res.json();
      setCards((data.feed?.cards ?? []).slice(0, maxCards));
    } catch {
      setNoFeed(true);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="h-full">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] card-glass h-full flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <TrendingUp size={13} className="text-violet-400/70" />
            <span className="text-white/70 text-xs font-medium tracking-wide">Insights</span>
          </div>
          <Link
            href="/dashboard/insights"
            className="flex items-center gap-1 text-[10px] text-white/25 hover:text-violet-400/70 transition-colors"
          >
            See all <ArrowRight size={9} />
          </Link>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 flex flex-col gap-2">
          {loading ? (
            <Skeleton />
          ) : cards.length > 0 ? (
            cards.map((card, i) => <MiniInsightCard key={i} card={card} />)
          ) : noFeed ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
              <Sparkles size={20} className="text-violet-400/30" />
              <p className="text-white/30 text-[11px] leading-relaxed">
                No insights yet for today
              </p>
              <button
                onClick={generate}
                disabled={generating}
                className="flex items-center gap-1.5 text-[11px] text-violet-400/70 hover:text-violet-400 border border-violet-500/20 hover:border-violet-500/40 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
              >
                <RefreshCw size={11} className={generating ? "animate-spin" : ""} />
                {generating ? "Generating…" : "Generate"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
