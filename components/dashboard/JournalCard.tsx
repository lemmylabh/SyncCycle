"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { BookOpen, ExternalLink } from "lucide-react";

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function JournalCard() {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<string | null>(null);
  const [weekCount, setWeekCount] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const today = new Date();
      const todayIso = today.toISOString().split("T")[0];
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 6);
      const weekAgoIso = weekAgo.toISOString().split("T")[0];

      const [{ data: todayEntry }, { data: weekEntries }] = await Promise.all([
        supabase.from("daily_notes").select("content")
          .eq("user_id", user.id).eq("log_date", todayIso).maybeSingle(),
        supabase.from("daily_notes").select("log_date")
          .eq("user_id", user.id).gte("log_date", weekAgoIso).lte("log_date", todayIso),
      ]);

      if (todayEntry?.content) setContent(todayEntry.content);
      setWeekCount(weekEntries?.length ?? 0);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-5 animate-pulse space-y-3">
        <div className="h-2.5 w-14 bg-white/10 rounded" />
        <div className="h-6 w-20 bg-white/10 rounded" />
        <div className="h-3 w-full bg-white/10 rounded" />
      </div>
    );
  }

  const hasEntry = content !== null;
  const wordCount = hasEntry ? countWords(content!) : 0;
  const preview = hasEntry ? content!.slice(0, 90).trimEnd() + (content!.length > 90 ? "…" : "") : "";

  return (
    <div className="rounded-2xl border border-pink-500/20 bg-pink-500/5 p-5 flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen size={14} className="text-pink-400" />
          <p className="text-pink-400 text-xs uppercase tracking-widest">Journal</p>
        </div>
        <a href="/dashboard/journal" className="text-gray-600 hover:text-gray-400 transition-colors">
          <ExternalLink size={13} />
        </a>
      </div>

      {hasEntry ? (
        <>
          <div>
            <p className="text-white text-2xl font-bold">{wordCount} <span className="text-base font-normal text-gray-400">words</span></p>
            <p className="text-pink-400 text-xs mt-0.5">today's entry</p>
          </div>

          <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{preview}</p>

          {weekCount > 1 && (
            <p className="text-gray-600 text-[10px]">{weekCount} entries this week</p>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-2 flex-1 justify-center">
          <p className="text-gray-500 text-sm">No entry today</p>
          {weekCount > 0 && (
            <p className="text-gray-600 text-xs">{weekCount} entries this week</p>
          )}
          <a href="/dashboard/journal" className="text-pink-400 text-xs hover:text-pink-300 transition-colors">
            Write Now →
          </a>
        </div>
      )}
    </div>
  );
}
