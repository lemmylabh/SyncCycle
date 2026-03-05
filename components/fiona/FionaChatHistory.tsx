"use client";

import { motion } from "framer-motion";
import { MessageSquarePlus, MessageSquare } from "lucide-react";
import { FionaSession } from "@/lib/fionaUtils";

interface FionaChatHistoryProps {
  sessions: FionaSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
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
  isLoading,
}: FionaChatHistoryProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0">
        <p className="text-gray-400 text-xs uppercase tracking-widest">Chats</p>
        <button
          onClick={onNewSession}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/20 text-rose-400 text-xs font-medium transition-colors"
        >
          <MessageSquarePlus size={12} />
          New
        </button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto">
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
            {sessions.map((session, i) => {
              const isActive = session.id === activeSessionId;
              return (
                <motion.button
                  key={session.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => onSelectSession(session.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-150 group ${
                    isActive
                      ? "bg-rose-500/10 border-l-2 border-rose-500/50 pl-2.5"
                      : "hover:bg-white/5 border-l-2 border-transparent"
                  }`}
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
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
