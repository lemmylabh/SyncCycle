// Mock data — 5 symptoms × 7 days, severity 0-4 (0=none)
const symptoms = ["Cramps", "Mood", "Energy", "Bloating", "Headache"];

// Severity per symptom per day (Mon–Sun)
const data: number[][] = [
  [3, 2, 1, 0, 0, 0, 1], // Cramps
  [2, 3, 2, 1, 2, 3, 2], // Mood
  [1, 2, 3, 4, 3, 3, 2], // Energy
  [2, 2, 1, 0, 0, 1, 1], // Bloating
  [1, 0, 0, 0, 1, 2, 1], // Headache
];

function getDayLabels() {
  const today = new Date();
  // Get Monday of current week
  const monday = new Date(today);
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(today.getDate() + diff);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const isToday = d.toDateString() === today.toDateString();
    return {
      label: d.toLocaleDateString("en", { weekday: "short" }),
      date: d.getDate(),
      isToday,
    };
  });
}

const severityClasses = [
  "bg-white/5",           // 0 — none
  "bg-rose-900/60",       // 1 — low
  "bg-rose-700/70",       // 2 — medium
  "bg-rose-500",          // 3 — high
  "bg-rose-400",          // 4 — severe
];

const days = getDayLabels();

export function SymptomHeatmap() {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-6">
      <div className="mb-4">
        <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Weekly View</p>
        <h2 className="text-white text-lg font-semibold">Symptom Heatmap</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[360px]">
          <thead>
            <tr>
              {/* Empty label column */}
              <th className="w-24 pb-3" />
              {days.map((d) => (
                <th key={d.label} className="pb-3 text-center w-10">
                  <div className={`flex flex-col items-center gap-0.5 ${d.isToday ? "text-white" : "text-gray-500"}`}>
                    <span className="text-[10px] uppercase font-medium">{d.label}</span>
                    <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                      d.isToday ? "bg-rose-500 text-white" : ""
                    }`}>
                      {d.date}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {symptoms.map((symptom, si) => (
              <tr key={symptom}>
                <td className="py-1.5 pr-3 text-gray-400 text-xs whitespace-nowrap">{symptom}</td>
                {data[si].map((severity, di) => (
                  <td key={di} className="py-1.5 text-center">
                    <div
                      className={`w-7 h-7 rounded-md mx-auto ${severityClasses[severity]} transition-colors`}
                      title={`${symptom}: severity ${severity}/4`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-4">
        <span className="text-gray-500 text-xs">None</span>
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className={`w-5 h-5 rounded ${severityClasses[s]}`} />
        ))}
        <span className="text-gray-500 text-xs">Severe</span>
      </div>
    </div>
  );
}
