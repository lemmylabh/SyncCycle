"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { OnboardingProgress } from "./OnboardingProgress";
import { Screen1AboutYou } from "./screens/Screen1AboutYou";
import { Screen2YourCycle } from "./screens/Screen2YourCycle";
import { Screen3BodySignals } from "./screens/Screen3BodySignals";
import { Screen4Lifestyle } from "./screens/Screen4Lifestyle";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OnboardingData {
  // Screen 1
  avatarFile: File | undefined;
  avatarPreview: string | null;
  displayName: string;
  dateOfBirth: string;
  pronouns: string | undefined;
  appGoal: string | undefined;

  // Screen 2
  lastPeriodDate: string;
  periodLength: number;
  cycleLength: number;
  cycleRegularity: string | undefined;

  // Screen 3
  baselineSymptoms: string[];
  typicalFlow: string | undefined;
  diagnosedConditions: string[];

  // Screen 4
  contraceptiveUse: string | undefined;
  enabledTrackers: string[];
  notificationTypes: string[];
  notificationAdvanceDays: number | undefined;
}

const INITIAL_DATA: OnboardingData = {
  avatarFile: undefined,
  avatarPreview: null,
  displayName: "",
  dateOfBirth: "",
  pronouns: undefined,
  appGoal: undefined,

  lastPeriodDate: "",
  periodLength: 5,
  cycleLength: 28,
  cycleRegularity: undefined,

  baselineSymptoms: [],
  typicalFlow: undefined,
  diagnosedConditions: [],

  contraceptiveUse: undefined,
  enabledTrackers: [],
  notificationTypes: [],
  notificationAdvanceDays: undefined,
};

const TOTAL_SCREENS = 4;

// Screen 1 is valid when DOB + goal are filled
function screen1Valid(data: OnboardingData) {
  return data.dateOfBirth.length > 0 && !!data.appGoal;
}

// Screen 2 is valid when last period date is filled (sliders already have defaults)
function screen2Valid(data: OnboardingData) {
  return data.lastPeriodDate.length > 0;
}

// ---------------------------------------------------------------------------
// Slide variants
// ---------------------------------------------------------------------------

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  open: boolean;
  userId: string;
  demoMode?: boolean;
  onComplete: () => void;
}

export function OnboardingModal({ open, userId, demoMode = false, onComplete }: Props) {
  const [screen, setScreen] = useState(1);
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function patch(partial: Partial<OnboardingData>) {
    setData((prev) => ({ ...prev, ...partial }));
  }

  function goNext() {
    setDirection(1);
    setScreen((s) => Math.min(s + 1, TOTAL_SCREENS));
  }

  function goBack() {
    setDirection(-1);
    setScreen((s) => Math.max(s - 1, 1));
  }

  function skip() {
    goNext();
  }

  // Required-field validation per screen
  const canProceed =
    screen === 1 ? screen1Valid(data) :
    screen === 2 ? screen2Valid(data) :
    true; // screens 3 & 4 are fully optional

  // Screens 3 & 4 are skippable
  const isSkippable = screen === 3 || screen === 4;

  async function handleSubmit() {
    setSaving(true);
    setError(null);

    // Demo mode: fake save with a short delay, no DB writes
    if (demoMode) {
      await new Promise((r) => setTimeout(r, 1000));
      onComplete();
      return;
    }

    try {
      let avatarUrl: string | undefined;

      // 1. Upload avatar if provided
      if (data.avatarFile) {
        const ext = data.avatarFile.name.split(".").pop() ?? "jpg";
        const path = `${userId}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, data.avatarFile, { upsert: true });

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
          avatarUrl = urlData.publicUrl;
        }
      }

      // 2. Upsert user_profiles
      const profilePayload: Record<string, unknown> = {
        id: userId,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      };

      if (avatarUrl) profilePayload.avatar_url = avatarUrl;
      if (data.displayName.trim()) profilePayload.display_name = data.displayName.trim();
      if (data.dateOfBirth) profilePayload.date_of_birth = data.dateOfBirth;
      if (data.pronouns) profilePayload.pronouns = data.pronouns;
      if (data.appGoal) profilePayload.app_goal = data.appGoal;
      if (data.cycleRegularity) profilePayload.cycle_regularity = data.cycleRegularity;
      if (data.typicalFlow) profilePayload.typical_flow = data.typicalFlow;
      if (data.contraceptiveUse) profilePayload.contraceptive_use = data.contraceptiveUse;
      if (data.notificationAdvanceDays) profilePayload.notification_advance_days = data.notificationAdvanceDays;

      profilePayload.average_period_length = data.periodLength;
      profilePayload.average_cycle_length = data.cycleLength;
      profilePayload.baseline_symptoms = data.baselineSymptoms;
      profilePayload.diagnosed_conditions = data.diagnosedConditions;
      profilePayload.enabled_trackers = data.enabledTrackers;
      profilePayload.notification_types = data.notificationTypes;

      const { error: profileError } = await supabase
        .from("user_profiles")
        .upsert(profilePayload);

      if (profileError) throw profileError;

      // 3. Insert first cycle row if last period date provided
      if (data.lastPeriodDate) {
        await supabase.from("cycles").upsert(
          {
            user_id: userId,
            cycle_number: 1,
            start_date: data.lastPeriodDate,
          },
          { onConflict: "user_id,cycle_number" }
        );
      }

      onComplete();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  const isLastScreen = screen === TOTAL_SCREENS;

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      {/* Modal card */}
      <div className="relative w-full max-w-lg bg-[#1e1e2a] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex-shrink-0">
          <div className="mb-1">
            <h2 className="text-base font-semibold text-white">
              {screen === 1 && "Welcome to CycleSync"}
              {screen === 2 && "Your Cycle"}
              {screen === 3 && "Body Signals"}
              {screen === 4 && "Lifestyle & Health"}
            </h2>
            <p className="text-xs text-white/40 mt-0.5">
              {screen === 1 && "Let's set up your profile"}
              {screen === 2 && "Helps us predict your cycle accurately"}
              {screen === 3 && "Personalizes your symptom tracking"}
              {screen === 4 && "Fine-tune your experience"}
            </p>
          </div>
          <div className="mt-4">
            <OnboardingProgress currentScreen={screen} totalScreens={TOTAL_SCREENS} />
          </div>
        </div>

        {/* Scrollable screen content */}
        <div className="flex-1 overflow-y-auto px-6 pb-2 min-h-0">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={screen}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
              {screen === 1 && <Screen1AboutYou data={data} onChange={patch} />}
              {screen === 2 && <Screen2YourCycle data={data} onChange={patch} />}
              {screen === 3 && <Screen3BodySignals data={data} onChange={patch} />}
              {screen === 4 && <Screen4Lifestyle data={data} onChange={patch} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Error */}
        {error && (
          <p className="px-6 py-2 text-xs text-rose-400 flex-shrink-0">{error}</p>
        )}

        {/* Footer nav */}
        <div className="px-6 py-4 flex items-center justify-between gap-3 border-t border-white/5 flex-shrink-0">
          {/* Back */}
          <button
            type="button"
            onClick={goBack}
            disabled={screen === 1}
            className={`flex items-center gap-1 text-sm font-medium transition-all ${
              screen === 1
                ? "invisible pointer-events-none"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            <ChevronLeft size={16} />
            Back
          </button>

          <div className="flex items-center gap-2 ml-auto">
            {/* Skip (screens 3 & 4 only) */}
            {isSkippable && !isLastScreen && (
              <button
                type="button"
                onClick={skip}
                className="text-sm text-white/30 hover:text-white/60 transition-colors px-2"
              >
                Skip
              </button>
            )}

            {/* Next / Finish */}
            {isLastScreen ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-rose-500 to-purple-600 text-white hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? "Saving…" : "Finish"}
              </button>
            ) : (
              <button
                type="button"
                onClick={goNext}
                disabled={!canProceed}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-rose-500 to-purple-600 text-white hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M5.5 3L9.5 7L5.5 11" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
