"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  InsightCardData,
  HASHTAG_CONFIG,
  CATEGORY_CONFIG,
  deriveOneLiner,
  localDateStr,
} from "@/lib/insightUtils";
import { TrendingUp, ArrowRight, RefreshCw, Sparkles, ChevronRight } from "lucide-react";

// ── Accordion row ──────────────────────────────────────────────────────────────

function InsightRow({
  card,
  open,
  onToggle,
}: {
  card: InsightCardData;
  open: boolean;
  onToggle: () => void;
}) {
  const primary = card.hashtags[0] ?? "vibe";
  const cat = CATEGORY_CONFIG[primary];
  const summary = card.summary ?? deriveOneLiner(card);
  const bodyRef = useRef<HTMLDivElement>(null);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: open ? cat.softBg : undefined }}>
      {/* Collapsed row */}
      <button
        onClick={onToggle}
        className="w-full h-12 flex items-center gap-3 px-3 rounded-2xl hover:bg-white/[0.03] transition-colors cursor-pointer"
      >
        {/* Category color bar */}
        <span
          className="w-[3px] h-6 rounded-full flex-shrink-0"
          style={{ background: cat.color }}
        />
        {/* Emoji */}
        <span className="text-[18px] leading-none flex-shrink-0 w-5 text-center">
          {cat.emoji}
        </span>
        {/* Summary */}
        <span className="text-[12px] text-white/70 truncate flex-1 text-left">
          {summary}
        </span>
        {/* Chevron */}
        <ChevronRight
          size={14}
          className="flex-shrink-0 text-white/30 transition-transform duration-200"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        />
      </button>

      {/* Expanded area */}
      <div
        ref={bodyRef}
        className="overflow-hidden transition-all duration-200 ease-in-out"
        style={{ maxHeight: open ? (bodyRef.current?.scrollHeight ?? 400) : 0 }}
      >
        <div className="px-4 pt-1 pb-3">
          {/* Hashtag pills */}
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            {card.hashtags.slice(0, 3).map(h => {
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
          </div>
          {/* Body */}
          <p className="text-white/55 text-[11px] leading-relaxed">{card.body}</p>
          {/* Ask Fiona link */}
          <div className="flex justify-end mt-2">
            <Link
              href="/dashboard/fiona"
              className="text-[10px] text-violet-400/60 hover:text-violet-400 transition-colors"
              onClick={e => e.stopPropagation()}
            >
              Ask Fiona ›
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="flex flex-col gap-[4px] animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-12 rounded-2xl bg-white/[0.03] flex items-center gap-3 px-3">
          <div className="w-[3px] h-6 rounded-full bg-white/10 flex-shrink-0" />
          <div className="w-5 h-5 rounded-full bg-white/10 flex-shrink-0" />
          <div className="h-3 flex-1 bg-white/10 rounded" />
          <div className="w-3 h-3 rounded bg-white/10 flex-shrink-0" />
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
  const [openIndex, setOpenIndex] = useState<number | null>(null);

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
        <div className={`flex-1 min-h-0 ${maxCards > 2 ? "overflow-y-auto" : "overflow-hidden"} px-3 pb-3 flex flex-col gap-[4px]`}>
          {loading ? (
            <Skeleton />
          ) : cards.length > 0 ? (
            cards.slice(0, maxCards).map((card, i) => (
              <InsightRow
                key={card.id}
                card={card}
                open={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))
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
