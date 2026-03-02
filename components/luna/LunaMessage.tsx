"use client";

import { motion } from "framer-motion";

interface LunaMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

// Minimal inline markdown renderer — handles bold, italic, bullets, newlines
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  return lines.map((line, lineIdx) => {
    const isLast = lineIdx === lines.length - 1;

    // Bullet list item
    if (line.startsWith("- ") || line.startsWith("• ")) {
      const content = line.slice(2);
      return (
        <div key={lineIdx} className="flex items-start gap-2 my-0.5">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-400/60 flex-shrink-0" />
          <span>{parseInline(content)}</span>
        </div>
      );
    }

    const inlineContent = parseInline(line);
    if (line === "") {
      return <div key={lineIdx} className="h-2" />;
    }
    return (
      <span key={lineIdx}>
        {inlineContent}
        {!isLast && <br />}
      </span>
    );
  });
}

function parseInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Combined pass: bold (**text**) and italic (*text*)
  const combined = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  while ((match = combined.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[1] !== undefined) {
      parts.push(<strong key={match.index} className="font-semibold text-white">{match[1]}</strong>);
    } else if (match[2] !== undefined) {
      parts.push(<em key={match.index} className="italic text-gray-300">{match[2]}</em>);
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : <>{parts}</>;
}

export function LunaMessage({ role, content, isStreaming }: LunaMessageProps) {
  if (role === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex justify-end px-4 py-1"
      >
        <div className="max-w-[75%] bg-gradient-to-br from-rose-600/80 to-purple-600/80 text-white text-sm leading-relaxed px-4 py-3 rounded-2xl rounded-tr-sm border border-white/10 shadow-lg">
          {content}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-start gap-3 px-4 py-1"
    >
      {/* Luna avatar */}
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg shadow-purple-500/20">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white">
          <path
            d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
            fill="currentColor"
            opacity="0.9"
          />
        </svg>
      </div>

      {/* Bubble */}
      <div className="max-w-[85%] bg-[#1e1e2a] border border-white/5 text-gray-200 text-sm leading-relaxed px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
        {renderMarkdown(content)}
        {isStreaming && (
          <span className="inline-block w-1 h-4 bg-rose-400/70 rounded-sm animate-pulse ml-0.5 align-middle" />
        )}
      </div>
    </motion.div>
  );
}
