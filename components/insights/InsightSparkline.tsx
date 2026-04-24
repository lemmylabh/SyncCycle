"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { localDateStr } from "@/lib/insightUtils";

export interface DateEntry {
  date: string;
  count: number;
}

interface InsightSparklineProps {
  entries: DateEntry[];
  selectedDate: string;
  onSelect: (date: string) => void;
}

const DAYS_DESKTOP = 30;
const DAYS_MOBILE = 14;
const BAR_MAX_H = 72;
const BAR_MIN_H = 6;

function addDays(base: Date, n: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

function buildWindow(windowEnd: Date, days: number): Date[] {
  return Array.from({ length: days }, (_, i) => addDays(windowEnd, i - (days - 1)));
}

function formatLabel(d: Date, isToday: boolean): string {
  if (isToday) return "Today";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatFull(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function InsightSparkline({ entries, selectedDate, onSelect }: InsightSparklineProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = localDateStr(today);

  const [windowEnd, setWindowEnd] = useState(today);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const days = isMobile ? DAYS_MOBILE : DAYS_DESKTOP;
  const window_ = buildWindow(windowEnd, days);
  const windowEndStr = localDateStr(windowEnd);
  const isAtToday = windowEndStr === todayStr;

  // Build count lookup
  const countByDate: Record<string, number> = {};
  for (const e of entries) countByDate[e.date] = e.count;

  // Build bar data
  const bars = window_.map(d => {
    const ds = localDateStr(d);
    return { date: ds, count: countByDate[ds] ?? 0 };
  });

  const maxCount = Math.max(1, ...bars.map(b => b.count));

  function barHeight(count: number): number {
    if (count === 0) return BAR_MIN_H;
    return Math.round(14 + (count / maxCount) * 58);
  }

  function barColor(date: string, hovered: boolean): string {
    if (date === selectedDate) return "#8b5cf6";
    if (hovered) return "#8b5cf6";
    if ((countByDate[date] ?? 0) > 0) return "rgba(139,92,246,0.3)";
    return "#2a2042";
  }

  // Axis label indices: 0, every ~5 days, last
  const labelIndices = new Set<number>([0, 5, 10, 15, 20, days - 1].filter(i => i < days));

  function shiftWindow(dir: -1 | 1) {
    setWindowEnd(prev => {
      const next = addDays(prev, dir * days);
      return dir === 1 && next > today ? today : next;
    });
    setHoveredIndex(null);
  }

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowRight" && index < bars.length - 1) {
      e.preventDefault();
      const nextBtn = containerRef.current?.querySelectorAll<HTMLButtonElement>("[data-bar]")[index + 1];
      nextBtn?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      const prevBtn = containerRef.current?.querySelectorAll<HTMLButtonElement>("[data-bar]")[index - 1];
      prevBtn?.focus();
    } else if (e.key === "Enter") {
      onSelect(bars[index].date);
    }
  }, [bars, onSelect]);

  const selectedBar = bars.find(b => b.date === selectedDate);
  const selectedCount = selectedBar?.count ?? 0;
  const selectedLabel = selectedDate === todayStr ? "Today" : formatFull(selectedDate);

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] card-glass px-4 py-3">

      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-medium tracking-[1px] uppercase text-white/25">
          Insight Activity · Last {days} Days
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => shiftWindow(-1)}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
            aria-label="Previous period"
          >
            ‹
          </button>
          <button
            onClick={() => shiftWindow(1)}
            disabled={isAtToday}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
            aria-label="Next period"
          >
            ›
          </button>
        </div>
      </div>

      {/* Bars */}
      <div ref={containerRef} className="relative">
        <div className="flex items-end gap-[4px] h-[72px]">
          {bars.map((bar, i) => {
            const isSelected = bar.date === selectedDate;
            const isHovered = hoveredIndex === i;
            const h = barHeight(bar.count);
            return (
              <div key={bar.date} className="relative flex-1 flex flex-col justify-end" style={{ minWidth: 8 }}>
                {/* Tooltip */}
                {isHovered && (
                  <div
                    className="absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 z-10 whitespace-nowrap bg-[#1a1030] border border-white/10 text-white/80 text-[10px] px-2 py-1 rounded-lg pointer-events-none"
                  >
                    {formatFull(bar.date)} · {bar.count} insight{bar.count !== 1 ? "s" : ""}
                  </div>
                )}
                <button
                  data-bar
                  onClick={() => onSelect(bar.date)}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onFocus={() => setHoveredIndex(i)}
                  onBlur={() => setHoveredIndex(null)}
                  onKeyDown={e => handleKeyDown(e, i)}
                  aria-label={`${formatFull(bar.date)}: ${bar.count} insights`}
                  aria-pressed={isSelected}
                  className="w-full rounded-sm transition-all duration-150 focus:outline-none"
                  style={{
                    height: h,
                    background: barColor(bar.date, isHovered),
                    boxShadow: isSelected ? `0 0 0 2px var(--card-bg), 0 0 0 3px #8b5cf6` : undefined,
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Axis labels */}
        <div className="flex items-end mt-1.5" style={{ gap: 4 }}>
          {bars.map((bar, i) => (
            <div key={bar.date} className="flex-1 text-center" style={{ minWidth: 8 }}>
              {labelIndices.has(i) && (
                <span className="text-[9px] text-white/20 whitespace-nowrap">
                  {formatLabel(window_[i], bar.date === todayStr)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.04]">
        <span className="text-[11px] text-white/30">
          {selectedLabel} ·{" "}
          <span style={{ color: "#8b5cf6" }}>
            {formatFull(selectedDate)}
          </span>
        </span>
        <span className="text-[11px] text-white/30 flex items-center gap-1">
          <span style={{ color: "#8b5cf6" }}>●</span>
          {selectedCount} insight{selectedCount !== 1 ? "s" : ""} on this day
        </span>
      </div>
    </div>
  );
}
