// Phase colors by day offset from cycle start (mock: cycle started 14 days ago)
const CYCLE_START_OFFSET = 14; // today = cycle day 14

function getPhaseForDay(cycleDay: number): string {
  if (cycleDay < 1) return "future";
  if (cycleDay <= 5) return "menstrual";
  if (cycleDay <= 13) return "follicular";
  if (cycleDay <= 16) return "ovulatory";
  if (cycleDay <= 28) return "luteal";
  return "future";
}

const phaseColors: Record<string, string> = {
  menstrual:  "bg-rose-500",
  follicular: "bg-purple-500",
  ovulatory:  "bg-pink-400",
  luteal:     "bg-violet-500",
  future:     "bg-white/10",
};

const phaseTextColors: Record<string, string> = {
  menstrual:  "text-rose-300",
  follicular: "text-purple-300",
  ovulatory:  "text-pink-300",
  luteal:     "text-violet-300",
  future:     "text-gray-600",
};

// Days with symptoms logged (mock: day indices 0-6)
const symptomsLogged = new Set([0, 1, 2, 4]);

function getWeekDays() {
  const today = new Date();
  const monday = new Date(today);
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(today.getDate() + diff);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const offset = Math.round((d.getTime() - today.getTime()) / 86400000);
    const cycleDay = CYCLE_START_OFFSET + offset;
    const phase = getPhaseForDay(cycleDay);
    const isToday = offset === 0;
    return {
      weekday: d.toLocaleDateString("en", { weekday: "short" }),
      date: d.getDate(),
      cycleDay,
      phase,
      isToday,
      idx: i,
    };
  });
}

const weekDays = getWeekDays();

const phaseLegend = [
  { label: "Menstrual",  color: "bg-rose-500" },
  { label: "Follicular", color: "bg-purple-500" },
  { label: "Ovulatory",  color: "bg-pink-400" },
  { label: "Luteal",     color: "bg-violet-500" },
];

export function CycleCalendar() {
  const now = new Date();
  const monthYear = now.toLocaleDateString("en", { month: "long", year: "numeric" });

  return (
    <div className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Weekly View</p>
          <h2 className="text-white text-lg font-semibold">Cycle Calendar</h2>
        </div>
        <span className="text-gray-500 text-sm">{monthYear}</span>
      </div>

      {/* Day columns */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((d) => (
          <div key={d.idx} className="flex flex-col items-center gap-1.5">
            <span className={`text-[10px] uppercase font-medium ${d.isToday ? "text-white" : "text-gray-500"}`}>
              {d.weekday}
            </span>

            {/* Phase circle */}
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold
                ${phaseColors[d.phase]}
                ${d.isToday ? "ring-2 ring-white ring-offset-2 ring-offset-[#1e1e2a]" : ""}
                ${d.phase === "future" ? phaseTextColors[d.phase] : "text-white"}
              `}
            >
              {d.date}
            </div>

            {/* Symptom dot */}
            {symptomsLogged.has(d.idx) ? (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            ) : (
              <span className="w-1.5 h-1.5" />
            )}
          </div>
        ))}
      </div>

      {/* Phase legend */}
      <div className="flex flex-wrap gap-3 mt-5">
        {phaseLegend.map((p) => (
          <div key={p.label} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${p.color}`} />
            <span className="text-gray-400 text-xs">{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
