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
    <div className="h-screen overflow-hidden flex flex-col lg:grid lg:grid-cols-2 bg-black">

      {/* ── LEFT HERO PANEL (desktop only) ── */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-black text-white relative overflow-hidden">
        {/* Video background */}
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500 via-pink-400 to-purple-600" />
        <video
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover z-[1]"
        >
          <source src="https://emitrr-ai-test.s3.us-east-2.amazonaws.com/mms/f73ce880-8806-4510-9898-a2aa7dee7979-7c443c83-1332-473f-8b13-0255116eb27b.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/40 z-[2]" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <img src="https://i.postimg.cc/fW1nkM36/logo-dark.png" alt="Syncycle" className="w-10 h-10 object-contain" />
          <span className="text-white font-light tracking-[0.25em] text-lg">Syncycle<span className="text-white/50">®</span></span>
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
      <div className="lg:hidden relative h-48 flex items-center justify-center overflow-hidden bg-black">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500 via-pink-400 to-purple-600" />
        <video
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover z-[1]"
        >
          <source src="https://emitrr-ai-test.s3.us-east-2.amazonaws.com/mms/f73ce880-8806-4510-9898-a2aa7dee7979-7c443c83-1332-473f-8b13-0255116eb27b.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/40 z-[2]" />
        <img src="https://i.postimg.cc/fW1nkM36/logo-dark.png" alt="Syncycle" className="w-16 h-16 object-contain relative z-10" />
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
