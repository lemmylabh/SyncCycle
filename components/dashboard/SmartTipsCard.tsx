"use client";

import { useState, useEffect } from "react";
import { Lightbulb } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Tip { id: string; title: string; description: string; }

export function SmartTipsCard({ collapsed }: { collapsed?: boolean }) {
  const [tips,    setTips]    = useState<Tip[]>([]);
  const [index,   setIndex]   = useState(0);
  const [visible, setVisible] = useState(true);
  const [paused,  setPaused]  = useState(false);

  // Load once on mount — shuffle for variety each session
  useEffect(() => {
    supabase.from("tips").select("id, title, description").eq("is_active", true)
      .then(({ data }) => {
        if (data?.length) setTips([...data].sort(() => Math.random() - 0.5));
      });
  }, []);

  // Auto-rotate every 5 s; pause on hover
  useEffect(() => {
    if (tips.length <= 1 || paused) return;
    const id = setInterval(() => {
      setVisible(false);                          // fade out
      setTimeout(() => {
        setIndex(i => (i + 1) % tips.length);
        setVisible(true);                         // fade in
      }, 1000);
    }, 5000);
    return () => clearInterval(id);
  }, [tips, paused]);

  if (!tips.length || collapsed) return null;

  const tip = tips[index];

  return (
    <div
      className="mx-3 mb-2"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="rounded-xl border border-violet-500/20 p-3 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg,rgba(139,92,246,0.05) 0%,rgba(236,72,153,0.02) 100%)",
          boxShadow: "inset 0 0 0 1px rgba(139,92,246,0.12)",
        }}
      >
        <div
          className="transition-opacity duration-1000"
          style={{ opacity: visible ? 1 : 0 }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <Lightbulb size={11} className="text-violet-400/60 flex-shrink-0" />
            <span className="text-white/65 text-[11px] font-medium truncate">{tip.title}</span>
          </div>
          <p className="text-white/35 text-[10px] leading-relaxed line-clamp-3">
            {tip.description}
          </p>
        </div>
      </div>
    </div>
  );
}
