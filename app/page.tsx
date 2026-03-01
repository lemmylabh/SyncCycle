"use client";

import { AuthForm } from "@/components/AuthForm";
import { DemoLoginButton } from "@/components/DemoLoginButton";

const features = [
  {
    icon: "🌙",
    title: "Track your phases",
    desc: "Log your cycle and understand each hormonal phase in real time.",
  },
  {
    icon: "✨",
    title: "Predict symptoms",
    desc: "Know what's coming — mood shifts, energy dips, and more.",
  },
  {
    icon: "⚡",
    title: "Optimize your energy",
    desc: "Align workouts, nutrition, and rest with how your body actually works.",
  },
];

export default function Home() {
  return (
    <div className="h-screen overflow-hidden flex flex-col lg:grid lg:grid-cols-2 bg-gradient-to-br from-rose-500 via-pink-400 to-purple-600">

      {/* ── LEFT HERO PANEL (desktop only) ── */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-rose-500 via-pink-400 to-purple-600 text-white relative overflow-hidden">
        {/* Decorative background circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white opacity-10" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-white opacity-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-white opacity-5" />

        {/* Logo */}
        <div className="relative z-10">
          <span className="text-2xl font-bold tracking-tight">SyncCycle</span>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold leading-tight">
              Know your cycle.
              <br />
              Own your life.
            </h2>
            <p className="text-rose-100 text-lg leading-relaxed max-w-sm">
              Personalized insights that help you predict how you&apos;ll feel,
              perform at your peak, and live in rhythm with your body.
            </p>
          </div>

          {/* Feature list */}
          <ul className="space-y-4">
            {features.map((f) => (
              <li key={f.title} className="flex items-start gap-3">
                <span className="text-xl">{f.icon}</span>
                <div>
                  <p className="font-semibold text-sm">{f.title}</p>
                  <p className="text-rose-100 text-sm">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Trust badge */}
        <div className="relative z-10">
          <p className="text-rose-200 text-sm">
            Helping thousands of people live in sync with their bodies.
          </p>
        </div>
      </div>

      {/* ── MOBILE HERO BANNER (mobile only) ── */}
      <div className="lg:hidden flex flex-col items-center justify-center py-8 px-8 text-white text-center relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white opacity-10" />
        <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white opacity-10" />
        <span className="text-3xl font-bold tracking-tight relative z-10">SyncCycle</span>
        <p className="text-rose-100 text-sm mt-2 relative z-10">
          Know your cycle. Own your life.
        </p>
      </div>

      {/* ── FORM PANEL ── */}
      {/* Mobile: white rounded card floating over gradient */}
      {/* Desktop: full-height right panel */}
      <div className="
        bg-white rounded-t-3xl shadow-[0_-4px_24px_rgba(0,0,0,0.08)]
        flex-1 px-8 pt-6 pb-8 sm:px-10
        lg:rounded-none lg:shadow-none
        lg:flex lg:flex-col lg:justify-center lg:px-16
      ">
        {/* Demo button — top */}
        <DemoLoginButton />

        {/* or divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <AuthForm />

        {/* Terms note */}
        <p className="mt-5 text-center text-xs text-gray-400">
          By creating an account you agree to our{" "}
          <span className="underline cursor-pointer hover:text-gray-600">Terms of Service</span>{" "}
          and{" "}
          <span className="underline cursor-pointer hover:text-gray-600">Privacy Policy</span>.
        </p>
      </div>

    </div>
  );
}
