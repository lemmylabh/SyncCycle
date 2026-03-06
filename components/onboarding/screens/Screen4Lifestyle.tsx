"use client";

import type { OnboardingData } from "../OnboardingModal";

const CONTRACEPTIVES = [
  { value: "none", label: "None" },
  { value: "pill", label: "Pill" },
  { value: "hormonal_iud", label: "Hormonal IUD" },
  { value: "copper_iud", label: "Copper IUD" },
  { value: "implant", label: "Implant" },
  { value: "patch", label: "Patch" },
  { value: "condom", label: "Condom" },
  { value: "other", label: "Other" },
];

const TRACKERS = [
  { value: "mood", label: "Mood (Vibe Check)", icon: "🎭" },
  { value: "fitness", label: "Fitness", icon: "🏃" },
  { value: "nutrition", label: "Nutrition", icon: "🥗" },
  { value: "sleep", label: "Sleep", icon: "🌙" },
  { value: "symptoms", label: "Symptoms", icon: "💊" },
];

const REMINDER_TYPES = [
  { value: "period_prediction", label: "Period predictions" },
  { value: "ovulation_window", label: "Ovulation window" },
  { value: "daily_tracking", label: "Daily tracking reminder" },
];

const ADVANCE_DAYS = [
  { value: 1, label: "1 day before" },
  { value: 3, label: "3 days before" },
  { value: 7, label: "7 days before" },
];

interface Props {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
}

function toggleItem<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export function Screen4Lifestyle({ data, onChange }: Props) {
  const hasReminders = data.notificationTypes.length > 0;

  return (
    <div className="flex flex-col gap-5">

      {/* Birth control */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
          Birth control <span className="text-white/30 normal-case">(optional)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {CONTRACEPTIVES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() =>
                onChange({ contraceptiveUse: data.contraceptiveUse === c.value ? undefined : c.value })
              }
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                data.contraceptiveUse === c.value
                  ? "bg-rose-500/20 border-rose-500/60 text-rose-200"
                  : "bg-white/5 border-white/10 text-white/50 hover:border-white/20 hover:text-white/70"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Trackers to enable */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
          Track with your cycle <span className="text-white/30 normal-case">(optional)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {TRACKERS.map((t) => {
            const selected = data.enabledTrackers.includes(t.value);
            return (
              <button
                key={t.value}
                type="button"
                onClick={() =>
                  onChange({ enabledTrackers: toggleItem(data.enabledTrackers, t.value) })
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                  selected
                    ? "bg-purple-500/20 border-purple-500/60 text-purple-200"
                    : "bg-white/5 border-white/10 text-white/50 hover:border-white/20 hover:text-white/70"
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Reminder types */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
          Reminders <span className="text-white/30 normal-case">(optional)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {REMINDER_TYPES.map((r) => {
            const selected = data.notificationTypes.includes(r.value);
            return (
              <button
                key={r.value}
                type="button"
                onClick={() =>
                  onChange({ notificationTypes: toggleItem(data.notificationTypes, r.value) })
                }
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                  selected
                    ? "bg-rose-500/20 border-rose-500/60 text-rose-200"
                    : "bg-white/5 border-white/10 text-white/50 hover:border-white/20 hover:text-white/70"
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Advance notice — only shown if reminders are selected */}
      {hasReminders && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
            Remind me <span className="text-white/30 normal-case">(optional)</span>
          </label>
          <div className="flex gap-2">
            {ADVANCE_DAYS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() =>
                  onChange({
                    notificationAdvanceDays:
                      data.notificationAdvanceDays === d.value ? undefined : d.value,
                  })
                }
                className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all duration-200 ${
                  data.notificationAdvanceDays === d.value
                    ? "bg-rose-500/20 border-rose-500/60 text-rose-200"
                    : "bg-white/5 border-white/10 text-white/50 hover:border-white/20 hover:text-white/70"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Finish nudge */}
      <p className="text-xs text-white/25 text-center pt-1">
        You can change all of this later in settings.
      </p>
    </div>
  );
}
