"use client";

import { useRef, useState, useEffect } from "react";
import { useTheme } from "@/lib/themeContext";
import { Snowflake, X } from "lucide-react";

export function ThemeSelector() {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [showPlanned, setShowPlanned] = useState(false);
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
    <>
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
          <div className="absolute right-0 top-11 w-48 bg-[#0d0d0d] border border-white/10 rounded-xl shadow-2xl py-1.5 z-50">
            <p className="px-4 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-white/30">
              Theme
            </p>

            {/* Dark (active) */}
            <button
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-white/5"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-[#1e1e2a] border border-white/20 flex-shrink-0" />
                <span className="text-white font-medium">Dark</span>
              </div>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="text-violet-400 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </button>

            {/* Light (planned) */}
            <button
              onClick={() => { setShowPlanned(true); setOpen(false); }}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-white/5"
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

      {/* Planned popup */}
      {showPlanned && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPlanned(false)} />
          <div className="relative bg-[#0d0d0d] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
            <button
              onClick={() => setShowPlanned(false)}
              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X size={14} />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-sky-400/10 border border-sky-400/20 flex items-center justify-center mx-auto mb-4">
              <Snowflake size={22} className="text-sky-400" />
            </div>
            <h3 className="text-white font-semibold text-base mb-1.5">Light Theme</h3>
            <p className="text-white/40 text-sm leading-relaxed">
              Planned for <span className="text-sky-400 font-medium">Next Sprint</span>.<br />
              Stay tuned for a bright, fresh look.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
