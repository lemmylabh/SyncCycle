const stats = [
  { label: "Cycle Day",          value: 14, unit: "",   color: "#f43f5e" },
  { label: "Days Until Period",  value: 11, unit: "",   color: "#a855f7" },
  { label: "Avg Cycle Length",   value: 28, unit: "d",  color: "#f472b6" },
];

export function TodaySnapshot() {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#1e1e2a] p-6 flex flex-col gap-2">
      <div className="mb-2">
        <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Today</p>
        <h2 className="text-white text-lg font-semibold">Snapshot</h2>
      </div>

      <div className="flex flex-col divide-y divide-white/5">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center justify-between py-3.5">
            <div className="flex items-center gap-2.5">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: s.color }}
              />
              <span className="text-gray-400 text-sm">{s.label}</span>
            </div>
            <span className="text-white text-2xl font-bold">
              {s.value}
              {s.unit && <span className="text-base font-normal text-gray-400 ml-0.5">{s.unit}</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
