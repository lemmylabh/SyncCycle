// Mock data — replace with Supabase data later
const PHASE_DATA = {
  menstrual:  { label: "Menstrual Phase",   tagline: "Rest & restore your body",          color: "from-rose-900/40 to-rose-800/20",  ring: "#f43f5e", day: 3,  daysLeft: 25 },
  follicular: { label: "Follicular Phase",  tagline: "Rising energy & creativity",         color: "from-rose-900/30 to-purple-900/30", ring: "#a855f7", day: 14, daysLeft: 14 },
  ovulatory:  { label: "Ovulatory Phase",   tagline: "Peak energy & confidence",           color: "from-pink-900/40 to-purple-900/30", ring: "#f472b6", day: 15, daysLeft: 13 },
  luteal:     { label: "Luteal Phase",      tagline: "Wind down & reflect",                color: "from-violet-900/40 to-purple-900/30",ring: "#8b5cf6", day: 22, daysLeft: 6  },
};

const CYCLE_LENGTH = 28;
const CURRENT_PHASE = "follicular" as keyof typeof PHASE_DATA;

const SIZE = 140;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CyclePhaseCard() {
  const phase = PHASE_DATA[CURRENT_PHASE];
  const progress = phase.day / CYCLE_LENGTH;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className={`rounded-2xl border border-white/5 p-6 bg-gradient-to-br ${phase.color} bg-[#1e1e2a] flex flex-col gap-5`}>
      <div>
        <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Current Phase</p>
        <h2 className="text-white text-xl font-semibold">{phase.label}</h2>
        <p className="text-gray-400 text-sm mt-0.5">{phase.tagline}</p>
      </div>

      {/* Ring */}
      <div className="flex justify-center">
        <div className="relative" style={{ width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
            {/* Track */}
            <circle
              cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
              fill="none" stroke="rgba(255,255,255,0.08)"
              strokeWidth={STROKE}
            />
            {/* Progress */}
            <circle
              cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
              fill="none" stroke={phase.ring}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
          </svg>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-white text-2xl font-bold">{phase.day}</span>
            <span className="text-gray-400 text-xs">of {CYCLE_LENGTH}</span>
          </div>
        </div>
      </div>

      {/* Pills */}
      <div className="flex gap-2 flex-wrap">
        <span className="px-3 py-1 rounded-full bg-white/5 text-gray-300 text-xs">
          {CYCLE_LENGTH}-day cycle
        </span>
        <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs">
          {phase.daysLeft} days to next period
        </span>
      </div>
    </div>
  );
}
