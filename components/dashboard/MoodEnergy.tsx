"use client";

// Mock data
const moodScore = 4;    // out of 5
const energyScore = 3;  // out of 5
const loggedToday = true;
const loggedAt = "8:47 AM";

const SIZE = 80;
const STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function Ring({ score, color, label }: { score: number; color: string; label: string }) {
  const pct = score / 5;
  const dashOffset = CIRCUMFERENCE * (1 - pct);

  const emojis = ["", "😞", "😕", "😐", "😊", "😄"];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
          <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={STROKE} />
          <circle
            cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
            fill="none" stroke={color} strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl">{emojis[score]}</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-white text-sm font-semibold">{score}/5</p>
        <p className="text-gray-400 text-xs">{label}</p>
      </div>
    </div>
  );
}

export function MoodEnergy() {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-6 flex flex-col gap-5">
      <div>
        <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Today</p>
        <h2 className="text-white text-lg font-semibold">Wellbeing</h2>
      </div>

      <div className="flex justify-around items-center py-2">
        <Ring score={moodScore} color="#f43f5e" label="Mood" />
        <div className="w-px h-16 bg-white/5" />
        <Ring score={energyScore} color="#a855f7" label="Energy" />
      </div>

      {loggedToday ? (
        <p className="text-gray-500 text-xs text-center">
          Logged today at {loggedAt}
        </p>
      ) : (
        <button className="w-full rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
          Log Today
        </button>
      )}
    </div>
  );
}
