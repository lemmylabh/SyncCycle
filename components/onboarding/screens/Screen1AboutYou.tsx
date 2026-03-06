"use client";

import { AvatarUpload } from "../AvatarUpload";
import type { OnboardingData } from "../OnboardingModal";

const GOALS = [
  { value: "track_health", label: "Track my cycle", icon: "📅" },
  { value: "conceive", label: "Trying to conceive", icon: "🌱" },
  { value: "avoid_pregnancy", label: "Avoid pregnancy", icon: "🛡️" },
  { value: "perimenopause_tracking", label: "Perimenopause tracking", icon: "🌿" },
  { value: "manage_symptoms", label: "General health awareness", icon: "💙" },
];

const PRONOUNS = [
  { value: "she_her", label: "She / Her" },
  { value: "they_them", label: "They / Them" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

interface Props {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
}

export function Screen1AboutYou({ data, onChange }: Props) {
  return (
    <div className="flex flex-col gap-5">
      {/* Avatar */}
      <div className="flex justify-center">
        <AvatarUpload
          preview={data.avatarPreview}
          onFileSelected={(file, previewUrl) =>
            onChange({ avatarFile: file, avatarPreview: previewUrl })
          }
          onRemove={() => onChange({ avatarFile: undefined, avatarPreview: null })}
        />
      </div>

      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
          Name <span className="text-white/30 normal-case">(optional)</span>
        </label>
        <input
          type="text"
          placeholder="What should we call you?"
          value={data.displayName}
          onChange={(e) => onChange({ displayName: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-rose-500/50 focus:bg-white/8 transition-all"
          maxLength={50}
        />
      </div>

      {/* Date of Birth */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
          Date of Birth <span className="text-rose-400">*</span>
        </label>
        <input
          type="date"
          value={data.dateOfBirth}
          onChange={(e) => onChange({ dateOfBirth: e.target.value })}
          max={new Date().toISOString().split("T")[0]}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-rose-500/50 transition-all [color-scheme:dark]"
        />
      </div>

      {/* Pronouns */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
          Pronouns <span className="text-white/30 normal-case">(optional)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {PRONOUNS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() =>
                onChange({ pronouns: data.pronouns === p.value ? undefined : p.value })
              }
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                data.pronouns === p.value
                  ? "bg-rose-500/20 border-rose-500/60 text-rose-300"
                  : "bg-white/5 border-white/10 text-white/50 hover:border-white/20 hover:text-white/70"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Goal */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
          My main goal <span className="text-rose-400">*</span>
        </label>
        <div className="grid grid-cols-1 gap-2">
          {GOALS.map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => onChange({ appGoal: g.value })}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm font-medium transition-all duration-200 ${
                data.appGoal === g.value
                  ? "bg-rose-500/15 border-rose-500/50 text-white"
                  : "bg-white/5 border-white/10 text-white/60 hover:bg-white/8 hover:border-white/20 hover:text-white/80"
              }`}
            >
              <span className="text-base">{g.icon}</span>
              <span>{g.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
