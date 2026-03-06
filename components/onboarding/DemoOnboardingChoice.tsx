"use client";

interface Props {
  onPreview: () => void;
  onSkip: () => void;
}

export function DemoOnboardingChoice({ onPreview, onSkip }: Props) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-[#1e1e2a] rounded-2xl shadow-2xl shadow-black/60 p-6 flex flex-col gap-5">

        {/* Icon */}
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500/20 to-purple-600/20 border border-rose-500/20 flex items-center justify-center text-2xl">
          ✨
        </div>

        {/* Text */}
        <div>
          <h2 className="text-base font-semibold text-white">Want to preview onboarding?</h2>
          <p className="text-sm text-white/40 mt-1">
            See how new users set up their account — nothing will be saved.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onPreview}
            className="w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-rose-500 to-purple-600 text-white hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Preview Onboarding
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="w-full py-3 rounded-xl text-sm font-medium text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
