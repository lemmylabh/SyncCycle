"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import Image from "next/image";

interface FionaMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  userName?: string;
  avatarUrl?: string | null;
  citations?: string[];
}

function domainOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch { return url; }
}

// Minimal inline markdown renderer — handles bold, italic, bullets, newlines
function renderMarkdown(text: string, citations: string[]): React.ReactNode[] {
  const lines = text.split("\n");
  return lines.map((line, lineIdx) => {
    const isLast = lineIdx === lines.length - 1;

    // Bullet list item
    if (line.startsWith("- ") || line.startsWith("• ")) {
      const content = line.slice(2);
      return (
        <div key={lineIdx} className="flex items-start gap-2 my-0.5">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-violet-400/60 flex-shrink-0" />
          <span>{parseInline(content, citations)}</span>
        </div>
      );
    }

    const inlineContent = parseInline(line, citations);
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

function parseInline(text: string, citations: string[]): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Combined pass: bold (**text**), italic (*text*), citation refs ([n])
  const combined = /\*\*(.+?)\*\*|\*(.+?)\*|\[(\d+)\]/g;
  while ((match = combined.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[1] !== undefined) {
      parts.push(<strong key={match.index} className="font-semibold text-white">{match[1]}</strong>);
    } else if (match[2] !== undefined) {
      parts.push(<em key={match.index} className="italic text-gray-300">{match[2]}</em>);
    } else if (match[3] !== undefined) {
      const idx = parseInt(match[3], 10) - 1;
      const url = citations[idx];
      parts.push(
        url ? (
          <a
            key={match.index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] text-violet-400 hover:text-violet-300 font-medium ml-0.5 align-super transition-colors"
          >
            [{match[3]}]
          </a>
        ) : (
          <sup key={match.index} className="text-[9px] text-violet-400 font-medium ml-0.5">[{match[3]}]</sup>
        )
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : <>{parts}</>;
}

export function FionaMessage({ role, content, isStreaming, userName = "", avatarUrl, citations }: FionaMessageProps) {
  const initials = userName.slice(0, 2).toUpperCase() || "U";

  if (role === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex items-end justify-end gap-2 px-4 py-1"
      >
        <div className="max-w-[75%] bg-gradient-to-br from-violet-600/80 to-purple-700/80 text-white text-xs leading-relaxed px-4 py-3 rounded-2xl rounded-tr-sm border border-white/10 shadow-lg">
          {content}
        </div>
        <div className="w-7 h-7 rounded-full flex-shrink-0 overflow-hidden ring-2 ring-white/10">
          {avatarUrl ? (
            <Image src={avatarUrl} alt={userName} width={28} height={28} className="object-cover w-full h-full" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white text-[9px] font-semibold">
              {initials}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  const cites = citations ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-start gap-3 px-4 py-1"
    >
      {/* Fiona avatar */}
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg shadow-violet-500/20">
        <Sparkles size={14} className="text-white" />
      </div>

      {/* Bubble */}
      <div className="max-w-[85%] bg-[var(--card-bg)] border border-[var(--border)] text-gray-300 text-xs leading-relaxed px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
        {renderMarkdown(content, cites)}
        {isStreaming && (
          <span className="inline-block w-1 h-3.5 bg-violet-400/70 rounded-sm animate-pulse ml-0.5 align-middle" />
        )}
        {cites.length > 0 && (
          <div className="mt-3 pt-2 border-t border-white/5">
            <p className="text-[10px] text-gray-600 font-medium uppercase tracking-wide mb-1.5">Sources</p>
            <div className="flex flex-wrap gap-1.5">
              {cites.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-[10px] text-violet-400 hover:text-violet-300 hover:bg-violet-500/20 hover:border-violet-500/40 transition-all duration-150"
                >
                  <span className="font-medium">[{i + 1}]</span>
                  <span>{domainOf(url)}</span>
                  <span className="text-violet-500/60">↗</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
