"use client";

import type { OnboardingData } from "../OnboardingModal";

const SYMPTOMS = [
  { value: "cramps", label: "Cramps", icon: "🌊" },
  { value: "bloating", label: "Bloating", icon: "💨" },
  { value: "headache", label: "Headaches", icon: "🤕" },
  { value: "acne", label: "Acne", icon: "✦" },
  { value: "breast_tenderness", label: "Breast tenderness", icon: "💗" },
  { value: "backache", label: "Back pain", icon: "🔙" },
  { value: "fatigue", label: "Fatigue", icon: "😴" },
  { value: "mood_swings", label: "Mood swings", icon: "🎭" },
  { value: "cravings", label: "Food cravings", icon: "🍫" },
  { value: "none", label: "None", icon: "✓" },
];

const FLOW_OPTIONS = [
  { value: "light", label: "Light", desc: "Needs minimal protection" },
  { value: "moderate", label: "Moderate", desc: "Average flow" },
  { value: "heavy", label: "Heavy", desc: "Changes protection often" },
  { value: "varies", label: "Varies", desc: "Changes cycle to cycle" },
];

const CONDITIONS = [
  { value: "pcos", label: "PCOS" },
  { value: "endometriosis", label: "Endometriosis" },
  { value: "fibroids", label: "Fibroids" },
  { value: "thyroid_issues", label: "Thyroid issues" },
  { value: "pmdd", label: "PMDD" },
  { value: "none", label: "None" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

interface Props {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
}

function toggleArray(arr: string[], value: string, exclusive: string[] = []): string[] {
  // If toggling an exclusive value (like "none"), clear everything else
  if (exclusive.includes(value)) {
    return arr.includes(value) ? [] : [value];
  }
  // Otherwise toggle value, removing any exclusive values
  const withoutExclusive = arr.filter((v) => !exclusive.includes(v));
  return withoutExclusive.includes(value)
    ? withoutExclusive.filter((v) => v !== value)
    : [...withoutExclusive, value];
}

export function Screen3BodySignals({ data, onChange }: Props) {
  return (
    <div className="flex flex-col gap-5">

      {/* Typical symptoms */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
          Symptoms you usually experience <span className="text-white/30 normal-case">(optional)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {SYMPTOMS.map((s) => {
            const selected = data.baselineSymptoms.includes(s.value);
            return (
              <button
                key={s.value}
                type="button"
                onClick={() =>
                  onChange({
                    baselineSymptoms: toggleArray(data.baselineSymptoms, s.value, ["none"]),
                  })
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                  selected
                    ? "bg-rose-500/20 border-rose-500/60 text-rose-200"
                    : "bg-white/5 border-white/10 text-white/50 hover:border-white/20 hover:text-white/70"
                }`}
              >
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Typical flow */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
          Typical flow <span className="text-white/30 normal-case">(optional)</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {FLOW_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() =>
                onChange({
                  typicalFlow: data.typicalFlow === opt.value ? undefined : opt.value,
                })
              }
              className={`flex flex-col gap-0.5 px-3 py-2.5 rounded-xl border text-left transition-all duration-200 ${
                data.typicalFlow === opt.value
                  ? "bg-rose-500/15 border-rose-500/50 text-white"
                  : "bg-white/5 border-white/10 text-white/60 hover:bg-white/8 hover:border-white/20"
              }`}
            >
              <span className="text-xs font-semibold">{opt.label}</span>
              <span className="text-[10px] text-white/35">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Diagnosed conditions */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
          Diagnosed conditions <span className="text-white/30 normal-case">(optional)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map((c) => {
            const selected = data.diagnosedConditions.includes(c.value);
            const isExclusive = c.value === "none" || c.value === "prefer_not_to_say";
            return (
              <button
                key={c.value}
                type="button"
                onClick={() =>
                  onChange({
                    diagnosedConditions: toggleArray(
                      data.diagnosedConditions,
                      c.value,
                      ["none", "prefer_not_to_say"]
                    ),
                  })
                }
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                  selected
                    ? isExclusive
                      ? "bg-white/15 border-white/40 text-white/80"
                      : "bg-purple-500/20 border-purple-500/60 text-purple-200"
                    : "bg-white/5 border-white/10 text-white/50 hover:border-white/20 hover:text-white/70"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
