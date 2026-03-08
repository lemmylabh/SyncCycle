"use client";

import { localDateStr } from "@/lib/insightUtils";

interface InsightLoadPreviousProps {
  dates: string[];
  selectedDate: string;
  onSelect: (date: string) => void;
}

function formatDateChip(dateStr: string): string {
  const today = localDateStr(new Date());
  const yesterday = localDateStr(new Date(Date.now() - 86400000));
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function InsightLoadPrevious({ dates, selectedDate, onSelect }: InsightLoadPreviousProps) {
  if (dates.length <= 1) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
      {dates.map(date => (
        <button
          key={date}
          onClick={() => onSelect(date)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
            selectedDate === date
              ? "bg-white/10 text-white border-white/20"
              : "bg-white/5 text-gray-500 border-white/8 hover:bg-white/8 hover:text-gray-300"
          }`}
        >
          {formatDateChip(date)}
        </button>
      ))}
    </div>
  );
}
