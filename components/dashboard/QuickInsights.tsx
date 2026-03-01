// Phase-specific tips (hardcoded for MVP)
const insightsByPhase: Record<string, typeof follicularTips> = {};

const follicularTips = [
  { icon: "🏋️", tip: "Great time for intense workouts — energy is rising.",        badge: "Fitness",  badgeColor: "bg-purple-500/20 text-purple-400" },
  { icon: "🧠", tip: "Your focus and creativity are at their peak right now.",     badge: "Mental",   badgeColor: "bg-pink-500/20 text-pink-400"   },
  { icon: "🥗", tip: "Light, nutrient-dense meals support your rising estrogen.",  badge: "Nutrition",badgeColor: "bg-rose-500/20 text-rose-400"    },
  { icon: "💬", tip: "Social energy is high — great for collaboration.",            badge: "Wellness", badgeColor: "bg-violet-500/20 text-violet-400"},
];

insightsByPhase["menstrual"]  = [
  { icon: "😴", tip: "Rest is essential — honor your body's need to restore.",     badge: "Rest",     badgeColor: "bg-rose-500/20 text-rose-400"    },
  { icon: "🫖", tip: "Ginger and chamomile teas help ease cramps naturally.",      badge: "Nutrition",badgeColor: "bg-pink-500/20 text-pink-400"    },
  { icon: "🧘", tip: "Gentle yoga and stretching support pain relief.",            badge: "Fitness",  badgeColor: "bg-purple-500/20 text-purple-400"},
  { icon: "🌡️", tip: "Apply warmth to your lower abdomen for cramp relief.",      badge: "Wellness", badgeColor: "bg-violet-500/20 text-violet-400"},
];
insightsByPhase["follicular"] = follicularTips;
insightsByPhase["ovulatory"]  = [
  { icon: "⚡", tip: "Peak energy day — tackle your most important tasks.",        badge: "Energy",   badgeColor: "bg-rose-500/20 text-rose-400"    },
  { icon: "🏃", tip: "High-intensity cardio and strength training feel amazing.",  badge: "Fitness",  badgeColor: "bg-purple-500/20 text-purple-400"},
  { icon: "💡", tip: "Schedule important meetings and presentations today.",       badge: "Mental",   badgeColor: "bg-pink-500/20 text-pink-400"    },
  { icon: "🥩", tip: "Increase protein intake to support muscle recovery.",        badge: "Nutrition",badgeColor: "bg-violet-500/20 text-violet-400"},
];
insightsByPhase["luteal"]     = [
  { icon: "🫁", tip: "Energy begins to dip — switch to moderate exercise.",        badge: "Fitness",  badgeColor: "bg-purple-500/20 text-purple-400"},
  { icon: "🍫", tip: "Magnesium-rich foods reduce cravings and ease PMS.",         badge: "Nutrition",badgeColor: "bg-rose-500/20 text-rose-400"    },
  { icon: "📔", tip: "Journaling and reflection support emotional processing.",    badge: "Mental",   badgeColor: "bg-pink-500/20 text-pink-400"    },
  { icon: "😴", tip: "Prioritize 8+ hours of sleep to manage mood changes.",       badge: "Wellness", badgeColor: "bg-violet-500/20 text-violet-400"},
];

const CURRENT_PHASE = "follicular";
const tips = insightsByPhase[CURRENT_PHASE] ?? follicularTips;

export function QuickInsights() {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-6 flex flex-col">
      <div className="mb-4">
        <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Personalized</p>
        <h2 className="text-white text-lg font-semibold">Phase Insights</h2>
      </div>

      <div className="flex flex-col divide-y divide-white/5 flex-1">
        {tips.map((item, i) => (
          <div key={i} className="flex items-start gap-3 py-3">
            <span className="text-xl flex-shrink-0 mt-0.5">{item.icon}</span>
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
