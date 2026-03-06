"use client";

import type { OnboardingData } from "../OnboardingModal";

const REGULARITY_OPTIONS = [
  { value: "regular", label: "Regular", desc: "Like clockwork" },
  { value: "somewhat_irregular", label: "Somewhat irregular", desc: "Varies a few days" },
  { value: "very_unpredictable", label: "Very unpredictable", desc: "Hard to track" },
  { value: "not_sure", label: "Not sure yet", desc: "I'm still figuring it out" },
];

interface Props {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
}

export function Screen2YourCycle({ data, onChange }: Props) {
  return (
    <div className="flex flex-col gap-5">

      {/* Last Period Start */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
          Last period started <span className="text-rose-400">*</span>
        </label>
        <input
          type="date"
          value={data.lastPeriodDate}
          onChange={(e) => onChange({ lastPeriodDate: e.target.value })}
          max={new Date().toISOString().split("T")[0]}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-rose-500/50 transition-all [color-scheme:dark]"
        />
      </div>

      {/* Period Duration Slider */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
            Period duration <span className="text-rose-400">*</span>
          </label>
          <span className="text-sm font-semibold text-rose-400">
            {data.periodLength} {data.periodLength === 1 ? "day" : "days"}
          </span>
        </div>
        <input
          type="range"
          min={2}
          max={10}
          step={1}
          value={data.periodLength}
          onChange={(e) => onChange({ periodLength: Number(e.target.value) })}
          className="w-full h-2 rounded-full appearance-none cursor-pointer
            bg-white/10
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-rose-500
            [&::-webkit-slider-thumb]:shadow-lg
            [&::-webkit-slider-thumb]:shadow-rose-500/40
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:w-5
            [&::-moz-range-thumb]:h-5
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-rose-500
            [&::-moz-range-thumb]:border-none"
          style={{
            background: `linear-gradient(to right, #f43f5e ${((data.periodLength - 2) / 8) * 100}%, rgba(255,255,255,0.1) ${((data.periodLength - 2) / 8) * 100}%)`,
          }}
        />
        <div className="flex justify-between text-[10px] text-white/25">
          <span>2 days</span>
          <span>10 days</span>
        </div>
      </div>

      {/* Cycle Length Slider */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
            Typical cycle length <span className="text-rose-400">*</span>
          </label>
          <span className="text-sm font-semibold text-purple-400">
            {data.cycleLength} days
          </span>
        </div>
        <input
          type="range"
          min={21}
          max={40}
          step={1}
          value={data.cycleLength}
          onChange={(e) => onChange({ cycleLength: Number(e.target.value) })}
          className="w-full h-2 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-purple-500
            [&::-webkit-slider-thumb]:shadow-lg
            [&::-webkit-slider-thumb]:shadow-purple-500/40
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:w-5
            [&::-moz-range-thumb]:h-5
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-purple-500
            [&::-moz-range-thumb]:border-none"
          style={{
            background: `linear-gradient(to right, #a855f7 ${((data.cycleLength - 21) / 19) * 100}%, rgba(255,255,255,0.1) ${((data.cycleLength - 21) / 19) * 100}%)`,
          }}
        />
        <div className="flex justify-between text-[10px] text-white/25">
          <span>21 days</span>
          <span>40 days</span>
        </div>
      </div>

      {/* Regularity */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
          Are your cycles usually… <span className="text-white/30 normal-case">(optional)</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {REGULARITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() =>
                onChange({
                  cycleRegularity: data.cycleRegularity === opt.value ? undefined : opt.value,
                })
              }
              className={`flex flex-col gap-0.5 px-3 py-2.5 rounded-xl border text-left transition-all duration-200 ${
                data.cycleRegularity === opt.value
                  ? "bg-purple-500/15 border-purple-500/50 text-white"
                  : "bg-white/5 border-white/10 text-white/60 hover:bg-white/8 hover:border-white/20"
              }`}
            >
              <span className="text-xs font-semibold">{opt.label}</span>
              <span className="text-[10px] text-white/35">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
