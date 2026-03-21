"use client";

import { useRef, useState, useEffect } from "react";
import { useTheme } from "@/lib/themeContext";

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
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
        onClick={() => setOpen((v) => !v)}
        className="relative text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
        aria-label="Select theme"
        title="Select theme"
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
        </svg>
        <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-purple-400 rounded-full" />
      </button>

      {open && (
        <div className="dropdown-panel absolute right-0 top-11 w-48 bg-[#0d0d0d] border border-white/10 rounded-xl shadow-2xl py-1.5 z-50">
          <p className="px-4 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-white/30">
            Theme
          </p>

          {/* Dark */}
          <button
            onClick={() => { setTheme("dark"); setOpen(false); }}
            className="w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-white/5"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-[#1e1e2a] border border-white/20 flex-shrink-0" />
              <span className="text-white font-medium">Dark</span>
            </div>
            {theme === "dark" && (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="text-violet-400 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            )}
          </button>

          {/* Aurora */}
          <button
            onClick={() => { setTheme("aurora"); setOpen(false); }}
            className="w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-white/5"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-[#1a1040] border border-[#a07be8] flex-shrink-0" />
              <span className="text-white font-medium">Aurora</span>
            </div>
            {theme === "aurora" && (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="text-violet-400 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            )}
          </button>

          {/* Light — disabled */}
          <button
            disabled
            className="w-full flex items-center justify-between px-4 py-2.5 text-sm cursor-not-allowed opacity-40"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-white/80 border border-white/30 flex-shrink-0" />
              <span className="text-white/50">Light</span>
            </div>
            <span className="text-[10px] text-white/25 font-medium">Soon</span>
          </button>
        </div>
      )}
    </div>
  );
}
