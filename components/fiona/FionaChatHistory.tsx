"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Trash2, Trash } from "lucide-react";
import { FionaSession } from "@/lib/fionaUtils";

interface FionaChatHistoryProps {
  sessions: FionaSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onClearAll: () => void;
  isLoading: boolean;
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 2) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function FionaChatHistory({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onClearAll,
  isLoading,
}: FionaChatHistoryProps) {
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const handleClearAll = () => {
    if (confirmClearAll) {
      onClearAll();
      setConfirmClearAll(false);
    } else {
      setConfirmClearAll(true);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0">
        <p className="text-gray-400 text-xs uppercase tracking-widest">Chats</p>
        {sessions.length > 0 && (
          <button
            onClick={handleClearAll}
            onBlur={() => setConfirmClearAll(false)}
            className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg transition-colors ${
              confirmClearAll
                ? "bg-red-500/15 text-red-400 border border-red-500/20"
                : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
            }`}
          >
            <Trash size={11} />
            {confirmClearAll ? "Confirm" : "Clear all"}
          </button>
        )}
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto premium-scroll">
        {isLoading ? (
          <div className="p-3 space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <MessageSquare size={28} className="text-gray-700 mb-3" />
            <p className="text-gray-500 text-sm">No conversations yet</p>
            <p className="text-gray-600 text-xs mt-1">Start chatting with Fiona</p>
          </div>
        ) : (
          <div className="p-2 space-y-0.5">
            <AnimatePresence initial={false}>
              {sessions.map((session, i) => {
                const isActive = session.id === activeSessionId;
                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8, height: 0, marginBottom: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.18 }}
                    className={`group relative flex items-center rounded-xl transition-all duration-150 ${
                      isActive
                        ? "bg-violet-500/10 border-l-2 border-violet-500/40"
                        : "hover:bg-white/5 border-l-2 border-transparent"
                    }`}
                  >
                    <button
                      onClick={() => onSelectSession(session.id)}
                      className="flex-1 min-w-0 text-left px-3 py-2.5"
                    >
                      <p
                        className={`text-xs font-medium truncate leading-snug ${
                          isActive ? "text-white" : "text-gray-300 group-hover:text-white"
                        }`}
                      >
                        {session.title}
                      </p>
                      <p className="text-[10px] text-gray-600 mt-0.5">
                        {relativeTime(session.updated_at)}
                      </p>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                      className="opacity-0 group-hover:opacity-100 flex-shrink-0 w-7 h-7 mr-1.5 flex items-center justify-center rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
                      aria-label="Delete chat"
                    >
                      <Trash2 size={12} />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
