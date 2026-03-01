"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { cycleDay, computePhase, type Phase } from "@/lib/cycleUtils";
import { Dumbbell, Brain, Leaf, MessageCircle, Moon, Flame, Heart, Apple, BookOpen, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Tip {
  Icon: LucideIcon;
  tip: string;
  badge: string;
  badgeColor: string;
}

const insightsByPhase: Record<Phase, Tip[]> = {
  menstrual: [
    { Icon: Moon,        tip: "Rest is essential — honor your body's need to restore.",     badge: "Rest",      badgeColor: "bg-rose-500/20 text-rose-400"    },
    { Icon: Apple,       tip: "Ginger and chamomile teas help ease cramps naturally.",      badge: "Nutrition", badgeColor: "bg-pink-500/20 text-pink-400"    },
    { Icon: Leaf,        tip: "Gentle yoga and stretching support pain relief.",            badge: "Fitness",   badgeColor: "bg-purple-500/20 text-purple-400"},
    { Icon: Heart,       tip: "Apply warmth to your lower abdomen for cramp relief.",       badge: "Wellness",  badgeColor: "bg-violet-500/20 text-violet-400"},
  ],
  follicular: [
    { Icon: Dumbbell,    tip: "Great time for intense workouts — energy is rising.",        badge: "Fitness",   badgeColor: "bg-purple-500/20 text-purple-400"},
    { Icon: Brain,       tip: "Your focus and creativity are at their peak right now.",     badge: "Mental",    badgeColor: "bg-pink-500/20 text-pink-400"   },
    { Icon: Apple,       tip: "Light, nutrient-dense meals support your rising estrogen.",  badge: "Nutrition", badgeColor: "bg-rose-500/20 text-rose-400"    },
    { Icon: MessageCircle, tip: "Social energy is high — great for collaboration.",         badge: "Wellness",  badgeColor: "bg-violet-500/20 text-violet-400"},
  ],
  ovulatory: [
    { Icon: Zap,         tip: "Peak energy day — tackle your most important tasks.",        badge: "Energy",    badgeColor: "bg-rose-500/20 text-rose-400"    },
    { Icon: Flame,       tip: "High-intensity cardio and strength training feel amazing.",  badge: "Fitness",   badgeColor: "bg-purple-500/20 text-purple-400"},
    { Icon: Brain,       tip: "Schedule important meetings and presentations today.",       badge: "Mental",    badgeColor: "bg-pink-500/20 text-pink-400"    },
    { Icon: Apple,       tip: "Increase protein intake to support muscle recovery.",        badge: "Nutrition", badgeColor: "bg-violet-500/20 text-violet-400"},
  ],
  luteal: [
    { Icon: Leaf,        tip: "Energy begins to dip — switch to moderate exercise.",        badge: "Fitness",   badgeColor: "bg-purple-500/20 text-purple-400"},
    { Icon: Apple,       tip: "Magnesium-rich foods reduce cravings and ease PMS.",         badge: "Nutrition", badgeColor: "bg-rose-500/20 text-rose-400"    },
    { Icon: BookOpen,    tip: "Journaling and reflection support emotional processing.",    badge: "Mental",    badgeColor: "bg-pink-500/20 text-pink-400"    },
    { Icon: Moon,        tip: "Prioritize 8+ hours of sleep to manage mood changes.",       badge: "Wellness",  badgeColor: "bg-violet-500/20 text-violet-400"},
  ],
};

export function QuickInsights() {
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>("follicular");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const today = new Date().toISOString().split("T")[0];
      const [{ data: cycle }, { data: profile }] = await Promise.all([
        supabase.from("cycles").select("start_date,cycle_length")
          .eq("user_id", user.id).lte("start_date", today)
          .order("start_date", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("user_profiles")
          .select("average_cycle_length,average_period_length")
          .eq("id", user.id).maybeSingle(),
      ]);

      if (cycle) {
        const day = cycleDay(cycle.start_date);
        const cl = profile?.average_cycle_length ?? cycle.cycle_length ?? 28;
        const pl = profile?.average_period_length ?? 5;
        setPhase(computePhase(day, pl, cl));
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-6 animate-pulse space-y-4">
        <div className="space-y-2">
          <div className="h-2.5 w-24 bg-white/10 rounded" />
          <div className="h-5 w-36 bg-white/10 rounded" />
        </div>
        {[0,1,2,3].map(i => (
          <div key={i} className="flex gap-3 py-3 border-b border-white/5">
            <div className="w-5 h-5 bg-white/10 rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-full bg-white/10 rounded" />
              <div className="h-4 w-16 bg-white/10 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const tips = insightsByPhase[phase];

  return (
    <div className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-6 flex flex-col">
      <div className="mb-4">
        <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Personalized</p>
        <h2 className="text-white text-lg font-semibold">Phase Insights</h2>
      </div>

      <div className="flex flex-col divide-y divide-white/5 flex-1">
        {tips.map((item, i) => (
          <div key={i} className="flex items-start gap-3 py-3">
            <item.Icon size={18} className="flex-shrink-0 mt-0.5 text-gray-400" />
            <div className="flex-1 min-w-0">
              <p className="text-gray-300 text-sm leading-snug">{item.tip}</p>
              <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${item.badgeColor}`}>
                {item.badge}
              </span>
            </div>
          </div>
        ))}
      </div>

      <button className="mt-4 text-rose-400 text-sm hover:text-rose-300 transition-colors text-left">
        See all tips →
      </button>
    </div>
  );
}
