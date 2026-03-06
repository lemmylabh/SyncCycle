"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { InsightFeed, InsightCardData, localDateStr } from "@/lib/insightUtils";
import { PHASE_CONFIG } from "@/lib/cycleUtils";
import { InsightCard } from "./InsightCard";
import { InsightFeedSkeleton } from "./InsightFeedSkeleton";
import { InsightEmptyState } from "./InsightEmptyState";
import { InsightLoadPrevious } from "./InsightLoadPrevious";
import { InsightFeedCountSelector, FeedCount } from "./InsightFeedCountSelector";

export function InsightsFeed() {
  const [feed, setFeed] = useState<InsightFeed | null>(null);
  const [feedback, setFeedback] = useState<Record<number, "helpful" | "not_helpful">>({});
  const [expandedCardIndex, setExpandedCardIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTopingUp, setIsTopingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => localDateStr(new Date()));
  const [pastDates, setPastDates] = useState<string[]>([]);
  const [feedCount, setFeedCount] = useState<FeedCount>(20);
  const [userId, setUserId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState("");
  const [isDemo] = useState(
    () => typeof window !== "undefined" && sessionStorage.getItem("demo") === "true"
  );

  const today = localDateStr(new Date());

  // ── Auth + initial load ───────────────────────────────────────────────────────

  useEffect(() => {
    if (isDemo) {
      loadDemoFeed();
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      setUserId(session.user.id);
      setAccessToken(session.access_token);
      loadFeed(session.user.id, session.access_token, today, true);
      loadPastDates(session.user.id, session.access_token);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Demo mode ─────────────────────────────────────────────────────────────────

  async function loadDemoFeed() {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/insights/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: "", userId: "", isDemo: true }),
      });
      const data = await res.json();
      if (data.feed) {
        setFeed(data.feed);
        setPastDates([today]);
      }
    } catch {
      setError("Could not load demo feed.");
    } finally {
      setIsGenerating(false);
    }
  }

  // ── Load feed for a given date ────────────────────────────────────────────────

  async function loadFeed(uid: string, token: string, date: string, autoGenerate: boolean) {
    setIsLoading(true);
    setError(null);
    setExpandedCardIndex(null);

    try {
      const res = await fetch(
        `/api/insights/feed?userId=${uid}&date=${date}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();

      if (data.feed) {
        setFeed(data.feed);
        setFeedback(data.feedback ?? {});
        return;
      }

      // No feed for today — auto-generate
      if (autoGenerate && date === today) {
        await generateFeed(uid, token, feedCount);
      } else {
        setFeed(null);
      }
    } catch {
      setError("Failed to load feed.");
    } finally {
      setIsLoading(false);
    }
  }

  // ── Generate / top-up feed ────────────────────────────────────────────────────

  async function generateFeed(uid: string, token: string, targetCount: number) {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/insights/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: token, userId: uid, targetCount }),
      });
      const data = await res.json();
      if (data.feed) {
        setFeed(data.feed);
        // Add today to pastDates if not present
        setPastDates(prev => prev.includes(today) ? prev : [today, ...prev]);
      } else {
        setError(data.error ?? "Failed to generate insights.");
      }
    } catch {
      setError("Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function topUpFeed(uid: string, token: string, targetCount: number) {
    setIsTopingUp(true);
    try {
      const res = await fetch("/api/insights/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: token, userId: uid, targetCount }),
      });
      const data = await res.json();
      if (data.feed) setFeed(data.feed);
    } catch {
      // silently fail on top-up
    } finally {
      setIsTopingUp(false);
    }
  }

  // ── Feed count change ─────────────────────────────────────────────────────────

  function handleFeedCountChange(count: FeedCount) {
    setFeedCount(count);
    if (isDemo || !userId || !accessToken) return;
    if (selectedDate !== today) return; // can't top-up past feeds

    const currentCount = feed?.cards.length ?? 0;
    if (currentCount < count) {
      topUpFeed(userId, accessToken, count);
    }
  }

  // ── Past date selection ───────────────────────────────────────────────────────

  async function handleDateSelect(date: string) {
    if (date === selectedDate) return;
    setSelectedDate(date);
    setFeed(null);
    setFeedback({});
    setExpandedCardIndex(null);

    if (isDemo) return;
    if (userId && accessToken) {
      setIsLoading(true);
      await loadFeed(userId, accessToken, date, false);
    }
  }

  // ── Load past dates ───────────────────────────────────────────────────────────

  async function loadPastDates(uid: string, token: string) {
    try {
      const res = await fetch(
        `/api/insights/feed?userId=${uid}&listDates=true`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.dates) setPastDates(data.dates);
    } catch {
      // non-critical
    }
  }

  // ── Feedback ──────────────────────────────────────────────────────────────────

  const handleFeedback = useCallback(async (
    cardIndex: number,
    reaction: "helpful" | "not_helpful"
  ) => {
    if (!feed) return;

    // Toggle off if same reaction
    if (feedback[cardIndex] === reaction) {
      setFeedback(prev => {
        const next = { ...prev };
        delete next[cardIndex];
        return next;
      });
      return;
    }

    // Optimistic update
    const prev = feedback[cardIndex] ?? null;
    setFeedback(f => ({ ...f, [cardIndex]: reaction }));

    if (isDemo) return;
    if (!userId || !accessToken) return;

    try {
      await fetch("/api/insights/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken,
          userId,
          feedId: feed.id,
          cardIndex,
          reaction,
          correlationKey: feed.cards[cardIndex]?.correlationKey ?? "",
        }),
      });
    } catch {
      // Revert on failure
      setFeedback(f => {
        const next = { ...f };
        if (prev) next[cardIndex] = prev;
        else delete next[cardIndex];
        return next;
      });
    }
  }, [feed, feedback, isDemo, userId, accessToken]);

  // ── Ask Fiona toggle ──────────────────────────────────────────────────────────

  function handleAskFiona(index: number) {
    setExpandedCardIndex(prev => prev === index ? null : index);
  }

  // ── Retry ─────────────────────────────────────────────────────────────────────

  function handleRetry() {
    if (isDemo) {
      loadDemoFeed();
    } else if (userId && accessToken) {
      generateFeed(userId, accessToken, feedCount);
    }
  }

  // ── Visible cards (respect feedCount) ─────────────────────────────────────────

  const visibleCards: InsightCardData[] = feed?.cards.slice(0, feedCount) ?? [];

  // ── Phase label ───────────────────────────────────────────────────────────────

  const phaseLabel = feed?.phase
    ? PHASE_CONFIG[feed.phase as keyof typeof PHASE_CONFIG]?.label ?? feed.phase
    : null;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-full p-4 pb-28 space-y-4 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <motion.h1
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-white font-bold text-xl"
          >
            Your Insights
          </motion.h1>
          {phaseLabel && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-gray-500 text-xs mt-0.5"
            >
              {phaseLabel}
            </motion.p>
          )}
        </div>
        <InsightFeedCountSelector
          value={feedCount}
          onChange={handleFeedCountChange}
          disabled={isGenerating || (selectedDate !== today)}
        />
      </div>

      {/* Date chips */}
      <InsightLoadPrevious
        dates={pastDates}
        selectedDate={selectedDate}
        onSelect={handleDateSelect}
      />

      {/* Feed content */}
      {(isLoading || isGenerating) ? (
        <InsightFeedSkeleton message={isGenerating ? "Generating your daily insights…" : "Loading your feed…"} />
      ) : error ? (
        <InsightEmptyState onRetry={handleRetry} />
      ) : visibleCards.length === 0 ? (
        <InsightEmptyState onRetry={handleRetry} />
      ) : (
        <div className="space-y-5">
          {visibleCards.map((card, index) => (
            <motion.div
              key={`${card.id}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.5) }}
            >
              <InsightCard
                card={card}
                cardIndex={index}
                reaction={feedback[index] ?? null}
                isExpanded={expandedCardIndex === index}
                onAskFiona={() => handleAskFiona(index)}
                onFeedback={reaction => handleFeedback(index, reaction)}
                userId={userId}
                accessToken={accessToken}
                isDemo={isDemo}
              />
            </motion.div>
          ))}

          {/* Top-up loading indicator */}
          {isTopingUp && (
            <div className="flex items-center gap-3 py-4 px-1">
              <div className="w-4 h-4 rounded-full border-2 border-rose-500/50 border-t-rose-400 animate-spin flex-shrink-0" />
              <p className="text-gray-400 text-sm">Loading more insights…</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
