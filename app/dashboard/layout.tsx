"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { computeSidebarW } from "@/hooks/useDashboardLayout";
import { Navbar } from "@/components/dashboard/Navbar";
import { MobileTopBar } from "@/components/mobile/MobileTopBar";
import { MobilePageIndicator } from "@/components/mobile/MobilePageIndicator";
import { MobileSwipeWrapper } from "@/components/mobile/MobileSwipeWrapper";
import { MobileFAB } from "@/components/mobile/MobileFAB";
import { FionaPopup } from "@/components/mobile/FionaPopup";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { AccountTypeModal } from "@/components/AccountTypeModal";
import { ThemeProvider } from "@/lib/themeContext";


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarW, setSidebarW] = useState(256);
  const [userInitials, setUserInitials] = useState("U");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [fionaOpen, setFionaOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAccountTypeModal, setShowAccountTypeModal] = useState(false);
  const [sessionAccessToken, setSessionAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const isMobileSwipeRoute =
    pathname === "/dashboard" || pathname === "/dashboard/insights";

  const isSettingsRoute = pathname.startsWith("/dashboard/settings");

  useEffect(() => {
    // Demo mode: bypass auth for development purposes
    const demoInUrl = window.location.search.includes("demo=true");
    const demoInStorage = sessionStorage.getItem("demo") === "true";
    if (demoInUrl || demoInStorage) {
      sessionStorage.setItem("demo", "true");
      setIsDemo(true);
      setUserInitials("DM");
      setReady(true);
      return;
    }

    // getSession() awaits full Supabase localStorage init — no INITIAL_SESSION race
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        setReady(true);
        router.replace("/auth");
        return;
      }

      const email = session.user.email ?? "";
      if (email === "demo@syncycle.ai") setIsDemo(true);
      const name = (session.user.user_metadata?.full_name as string) ?? email;
      const initials = name
        .split(" ")
        .map((w: string) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
      setUserInitials(initials || email[0]?.toUpperCase() || "U");
      setUserId(session.user.id);
      setSessionAccessToken(session.access_token);

      // Check for a pending partner invite token (legacy link-based flow)
      const pendingToken = sessionStorage.getItem("pendingInviteToken");
      if (pendingToken) {
        sessionStorage.removeItem("pendingInviteToken");
        await fetch("/api/partner/invite/accept", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ token: pendingToken }),
        });
        router.replace("/partner");
        return;
      }

      // try/finally guarantees setReady(true) even if the DB query fails
      try {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("onboarding_completed,avatar_url,role,is_admin")
          .eq("id", session.user.id)
          .single();

        // Redirect partner accounts to their own area
        if (profile?.role === "partner") {
          setRedirecting(true);
          router.replace("/partner");
          return;
        }

        if (!profile?.onboarding_completed) {
          setShowAccountTypeModal(true);
        }
        if (profile?.avatar_url) {
          setAvatarUrl(profile.avatar_url);
        }
        if (profile?.is_admin) {
          setIsAdmin(true);
        }
      } finally {
        setReady(true);
      }
    });

    // Only watch for explicit sign-out
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.replace("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function updateSidebar() {
      setSidebarW(computeSidebarW(window.innerWidth));
    }
    updateSidebar();
    window.addEventListener("resize", updateSidebar);
    return () => window.removeEventListener("resize", updateSidebar);
  }, []);

  if (!ready || redirecting) {
    return (
      <div className="min-h-screen bg-[var(--page-bg)] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <ThemeProvider>
      {/* ── Mobile Shell (< lg) ─────────────────────────────────── */}
      <div className="lg:hidden flex flex-col h-screen overflow-hidden bg-[var(--page-bg)] page-shell text-white">
        <MobileTopBar initials={userInitials} isDemo={isDemo} avatarUrl={avatarUrl} />

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
              className="absolute inset-0 bg-[var(--page-bg)] overflow-y-auto premium-scroll z-10"
            >
              {/* Floating close button — hidden on settings routes (settings has its own) */}
              {!isSettingsRoute && (
                <button
                  onClick={() => router.push("/dashboard")}
                  className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              )}
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

      {/* ── Desktop Shell (≥ lg) ───────────────────────────────── */}
      <div className="hidden lg:flex h-screen bg-[var(--page-bg)] page-shell text-white">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isDemo={isDemo} sidebarWidth={sidebarW} collapsed={sidebarW <= 64} />

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Navbar
            onMenuToggle={() => setSidebarOpen((prev) => !prev)}
            userInitials={userInitials}
            avatarUrl={avatarUrl}
            isDemo={isDemo}
            isAdmin={isAdmin}
          />
          <main className="flex-1 overflow-y-auto premium-scroll">
            {children}
          </main>
        </div>
      </div>

      {/* ── Account type selection — shown to all new users before onboarding ── */}
      {showAccountTypeModal && sessionAccessToken && (
        <AccountTypeModal
          accessToken={sessionAccessToken}
          onMainAccount={() => {
            setShowAccountTypeModal(false);
            setShowOnboarding(true);
          }}
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
    </ThemeProvider>
  );
}
