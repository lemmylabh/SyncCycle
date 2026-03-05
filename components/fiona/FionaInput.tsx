"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, ChevronDown } from "lucide-react";
import { Phase } from "@/lib/cycleUtils";

interface FionaInputProps {
  onSend: (text: string) => void;
  isStreaming: boolean;
  currentPhase: Phase | null;
  disabled?: boolean;
}

const TRACKER_CONTEXTS = [
  { label: "Period", prefix: "[About my period] " },
  { label: "Mood", prefix: "[About my mood] " },
  { label: "Sleep", prefix: "[About my sleep] " },
  { label: "Fitness", prefix: "[About my workouts] " },
  { label: "Nutrition", prefix: "[About my nutrition] " },
  { label: "Symptoms", prefix: "[About my symptoms] " },
];

export function FionaInput({ onSend, isStreaming, currentPhase, disabled }: FionaInputProps) {
  const [text, setText] = useState("");
  const [contextIdx, setContextIdx] = useState<number | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`;
  }, [text]);

  // Close menu on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowContextMenu(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming || disabled) return;
    const prefix = contextIdx !== null ? TRACKER_CONTEXTS[contextIdx].prefix : "";
    onSend(prefix + trimmed);
    setText("");
    setContextIdx(null);
    textareaRef.current?.focus();
  };

  const canSend = text.trim().length > 0 && !isStreaming && !disabled;

  return (
    <div className="px-4 pb-4 pt-2 flex-shrink-0">
      <div className="rounded-2xl border border-white/8 bg-[#1a1a24] focus-within:border-white/15 transition-colors shadow-sm">
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Fiona anything about your cycle…"
          disabled={isStreaming || disabled}
          rows={1}
          className="w-full bg-transparent text-white text-sm placeholder-gray-600 px-4 pt-4 pb-2 resize-none focus:outline-none leading-relaxed disabled:opacity-50 min-h-[44px]"
          style={{ maxHeight: "140px" }}
        />

        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 pb-3 gap-2">
          {/* Context pill */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowContextMenu((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/8 border border-white/5 text-gray-400 hover:text-gray-300 text-xs transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="opacity-70">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>{contextIdx !== null ? TRACKER_CONTEXTS[contextIdx].label : "Context"}</span>
              <ChevronDown size={10} />
            </button>

            {showContextMenu && (
              <div className="absolute bottom-full mb-2 left-0 bg-[#1e1e2a] border border-white/10 rounded-xl overflow-hidden shadow-xl z-10 min-w-[140px]">
                <button
                  onClick={() => { setContextIdx(null); setShowContextMenu(false); }}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors ${contextIdx === null ? "text-rose-400 bg-rose-500/10" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
                >
                  No context
                </button>
                {TRACKER_CONTEXTS.map((ctx, i) => (
                  <button
                    key={ctx.label}
                    onClick={() => { setContextIdx(i); setShowContextMenu(false); }}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors ${contextIdx === i ? "text-rose-400 bg-rose-500/10" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
                  >
                    {ctx.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Send button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 flex-shrink-0 ${
              canSend
                ? "bg-gradient-to-br from-rose-600 to-purple-600 text-white hover:opacity-90 active:scale-95 shadow-lg shadow-purple-500/20"
                : "bg-white/5 text-gray-600 cursor-not-allowed"
            }`}
          >
            {isStreaming ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
          </button>
        </div>
      </div>

      <p className="text-center text-gray-700 text-[10px] mt-2">
        Fiona is a wellness guide, not a medical professional.
      </p>
    </div>
  );
}
