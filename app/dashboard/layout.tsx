"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Navbar } from "@/components/dashboard/Navbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userInitials, setUserInitials] = useState("U");
  const [ready, setReady] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

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

    // onAuthStateChange fires AFTER Supabase processes OAuth hash tokens —
    // getSession() has a race condition and can return null before the hash is parsed.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
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
      setReady(true);
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0f0f13] text-white overflow-hidden">
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
  );
}
