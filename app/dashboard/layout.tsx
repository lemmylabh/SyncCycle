"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Navbar } from "@/components/dashboard/Navbar";
import { MobileTopBar } from "@/components/mobile/MobileTopBar";
import { MobilePageIndicator } from "@/components/mobile/MobilePageIndicator";
import { MobileSwipeWrapper } from "@/components/mobile/MobileSwipeWrapper";
import { MobileFAB } from "@/components/mobile/MobileFAB";
import { FionaPopup } from "@/components/mobile/FionaPopup";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { DemoOnboardingChoice } from "@/components/onboarding/DemoOnboardingChoice";


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userInitials, setUserInitials] = useState("U");
  const [ready, setReady] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [fionaOpen, setFionaOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showDemoChoice, setShowDemoChoice] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const isMobileSwipeRoute =
    pathname === "/dashboard" || pathname === "/dashboard/insights";

  useEffect(() => {
    // Demo mode: bypass auth for development purposes
    const demoInUrl = window.location.search.includes("demo=true");
    const demoInStorage = sessionStorage.getItem("demo") === "true";
    if (demoInUrl || demoInStorage) {
      sessionStorage.setItem("demo", "true");
      setIsDemo(true);
      setUserInitials("DM");
      setShowDemoChoice(true);
      setReady(true);
      return;
    }

    // getSession() awaits full Supabase localStorage init — no INITIAL_SESSION race
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        setReady(true);
        router.replace("/");
        return;
      }

      const email = session.user.email ?? "";
      const name = (session.user.user_metadata?.full_name as string) ?? email;
      const initials = name
        .split(" ")
        .map((w: string) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
      setUserInitials(initials || email[0]?.toUpperCase() || "U");
      setUserId(session.user.id);

      // try/finally guarantees setReady(true) even if the DB query fails
      try {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("onboarding_completed")
          .eq("id", session.user.id)
          .single();

        if (!profile?.onboarding_completed) {
          setShowOnboarding(true);
        }
      } finally {
        setReady(true);
      }
    });

    // Only watch for explicit sign-out
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.replace("/");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* ── Mobile Shell (< lg) ─────────────────────────────────── */}
      <div className="lg:hidden flex flex-col h-screen overflow-hidden bg-[#0f0f13] text-white">
        <MobileTopBar initials={userInitials} isDemo={isDemo} />

        {isMobileSwipeRoute && (
          <MobilePageIndicator pathname={pathname} />
        )}

        {/* z-0 keeps main below FAB (z-50) and FionaPopup (z-[60]) */}
        <main className="flex-1 min-h-0 relative overflow-hidden z-0">
          {isMobileSwipeRoute ? (
            <div className="h-full overflow-y-auto">
              <MobileSwipeWrapper pathname={pathname}>
                {children}
              </MobileSwipeWrapper>
            </div>
          ) : (
            <motion.div
              key={pathname}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="absolute inset-0 bg-[#0f0f13] overflow-y-auto z-10"
            >
              {/* Floating close button */}
              <button
                onClick={() => router.push("/dashboard")}
                className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
              {children}
            </motion.div>
          )}
        </main>

        <MobileFAB
          onFionaOpen={() => setFionaOpen(true)}
          onVoiceRecord={() => {/* Voice journaling — see Voice.md */}}
        />

        <FionaPopup
          isOpen={fionaOpen}
          onClose={() => setFionaOpen(false)}
          isDemo={isDemo}
        />
      </div>

      {/* ── Desktop Shell (≥ lg) — unchanged ───────────────────── */}
      <div className="hidden lg:flex h-screen bg-[#0f0f13] text-white overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isDemo={isDemo} />

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Navbar
            onMenuToggle={() => setSidebarOpen((prev) => !prev)}
            userInitials={userInitials}
          />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>

      {/* ── Demo choice prompt ─────────────────────────────────────── */}
      {showDemoChoice && (
        <DemoOnboardingChoice
          onPreview={() => { setShowDemoChoice(false); setShowOnboarding(true); }}
          onSkip={() => setShowDemoChoice(false)}
        />
      )}

      {/* ── Onboarding modal — real users (saves to DB) or demo preview (fake save) ── */}
      {showOnboarding && (
        <OnboardingModal
          open={showOnboarding}
          userId={userId ?? "demo"}
          demoMode={isDemo}
          onComplete={() => setShowOnboarding(false)}
        />
      )}
    </>
  );
}
