// Phase distribution for the current cycle (mock data)
const phases = [
  { label: "Menstrual",   days: 5,  color: "#f43f5e", pct: 18 },
  { label: "Follicular",  days: 8,  color: "#a855f7", pct: 29 },
  { label: "Ovulatory",   days: 3,  color: "#f472b6", pct: 11 },
  { label: "Luteal",      days: 12, color: "#8b5cf6", pct: 43 },
];

const SIZE = 140;
const STROKE = 22;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 3; // degrees gap between segments

function pctToOffset(pct: number) {
  return CIRCUMFERENCE * (1 - pct / 100);
}

function buildSegments() {
  let cumulativePct = 0;
  return phases.map((phase) => {
    const dashLen = (CIRCUMFERENCE * phase.pct) / 100 - GAP;
    const dashGap = CIRCUMFERENCE - dashLen;
    const rotation = -90 + (cumulativePct / 100) * 360;
    cumulativePct += phase.pct;
    return { ...phase, dashLen, dashGap, rotation };
  });
}

const segments = buildSegments();

export function PhaseDonut() {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-6 flex flex-col gap-5">
      <div>
        <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Phase Overview</p>
        <h2 className="text-white text-lg font-semibold">This Cycle</h2>
      </div>

      {/* Donut */}
      <div className="flex justify-center">
        <div className="relative" style={{ width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            {/* Track */}
            <circle
              cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
              fill="none" stroke="rgba(255,255,255,0.05)"
              strokeWidth={STROKE}
            />
            {segments.map((seg) => (
              <circle
                key={seg.label}
                cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
                fill="none"
                stroke={seg.color}
                strokeWidth={STROKE}
                strokeLinecap="butt"
                strokeDasharray={`${seg.dashLen} ${seg.dashGap}`}
                transform={`rotate(${seg.rotation} ${SIZE / 2} ${SIZE / 2})`}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-white text-lg font-bold">Cycle</span>
            <span className="text-gray-400 text-xs">#3</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2">
        {phases.map((p) => (
          <div key={p.label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
            <span className="text-gray-400 text-xs">{p.label}</span>
            <span className="text-white text-xs font-medium ml-auto">{p.days}d</span>
          </div>
        ))}
      </div>
    </div>
  );
}
