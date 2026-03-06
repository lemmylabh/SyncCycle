"use client";

interface OnboardingProgressProps {
  currentScreen: number;
  totalScreens: number;
}

const SCREEN_LABELS = ["About You", "Your Cycle", "Body Signals", "Lifestyle"];

export function OnboardingProgress({ currentScreen, totalScreens }: OnboardingProgressProps) {
  return (
    <div className="w-full">
      {/* Step dots + labels */}
      <div className="flex items-center justify-between mb-3">
        {SCREEN_LABELS.map((label, i) => {
          const step = i + 1;
          const isCompleted = step < currentScreen;
          const isActive = step === currentScreen;
          return (
            <div key={step} className="flex flex-col items-center gap-1 flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                  isCompleted
                    ? "bg-rose-500 text-white"
                    : isActive
                    ? "bg-gradient-to-br from-rose-500 to-purple-600 text-white shadow-lg shadow-rose-500/30"
                    : "bg-white/10 text-white/30"
                }`}
              >
                {isCompleted ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  step
                )}
              </div>
              <span
                className={`text-[10px] font-medium transition-colors duration-300 ${
                  isActive ? "text-white" : "text-white/30"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-rose-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${((currentScreen - 1) / (totalScreens - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
}
