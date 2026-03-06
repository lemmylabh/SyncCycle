"use client";

import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const COUNTS = [20, 30, 40, 50] as const;
type FeedCount = typeof COUNTS[number];

interface InsightFeedCountSelectorProps {
  value: FeedCount;
  onChange: (count: FeedCount) => void;
  disabled?: boolean;
}

export function InsightFeedCountSelector({ value, onChange, disabled }: InsightFeedCountSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(v => !v)}
        disabled={disabled}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/8 text-gray-400 text-xs hover:bg-white/10 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <span>{value} feeds</span>
        <ChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 bg-[#1e1e2a] border border-white/10 rounded-xl overflow-hidden shadow-xl z-20 min-w-[110px]">
          {COUNTS.map(count => (
            <button
              key={count}
              onClick={() => { onChange(count); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                count === value
                  ? "text-rose-400 bg-rose-500/10"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {count} feeds
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export type { FeedCount };
