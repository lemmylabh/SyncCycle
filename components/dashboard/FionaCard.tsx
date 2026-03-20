"use client";

import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight } from "lucide-react";

const QUICK_QUESTIONS = [
  "What should I eat today?",
  "Best workout for my phase?",
  "Why am I feeling this way?",
  "What's ahead this week?",
];

export function FionaCard() {
  const router = useRouter();

  function askFiona(question: string) {
    router.push(`/dashboard/fiona?q=${encodeURIComponent(question)}`);
  }

  return (
    <div className="h-full">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] card-glass h-full flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles size={13} className="text-violet-400/70" />
            <span className="text-white/70 text-xs font-medium tracking-wide">Ask Fiona</span>
          </div>
          <button
            onClick={() => router.push("/dashboard/fiona")}
            className="flex items-center gap-1 text-[10px] text-white/25 hover:text-violet-400/70 transition-colors"
          >
            Open <ArrowRight size={9} />
          </button>
        </div>

        {/* Question chips */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 flex flex-col gap-2">
          {QUICK_QUESTIONS.map((q, i) => (
            <button
              key={i}
              onClick={() => askFiona(q)}
              className="text-left text-[11px] text-white/45 hover:text-white/80 bg-white/[0.03] hover:bg-violet-500/[0.08] border border-white/[0.05] hover:border-violet-500/20 rounded-xl px-3 py-2.5 transition-all leading-snug"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
