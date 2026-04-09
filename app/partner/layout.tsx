"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ThemeProvider } from "@/lib/themeContext";
import { ViewedUserContext } from "@/lib/viewedUserContext";

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [userInitials, setUserInitials] = useState("P");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [linkedToId, setLinkedToId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("role, avatar_url, display_name, linked_to")
        .eq("id", session.user.id)
        .single();

      if (!profile || profile.role !== "partner") {
        router.replace("/dashboard");
        return;
      }

      if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
      if (profile.linked_to) setLinkedToId(profile.linked_to as string);

      const name = (profile.display_name as string) || (session.user.user_metadata?.full_name as string) || session.user.email || "";
      const initials = name
        .split(" ")
        .map((w: string) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
      setUserInitials(initials || "P");
      setReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") router.replace("/auth");
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/auth");
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-[var(--page-bg)] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <ViewedUserContext.Provider value={linkedToId}>
    <ThemeProvider>
      <div className="min-h-screen flex flex-col bg-[var(--page-bg)] page-shell text-white">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 h-[72px] flex-shrink-0 bg-[var(--page-bg)] border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <Image src="/logo-dark.png" alt="SyncCycle" width={32} height={32} className="rounded-lg" />
            <span className="text-white font-semibold text-base hidden sm:block">SyncCycle</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 font-medium">
              Partner View
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-rose-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="avatar" width={32} height={32} className="object-cover w-full h-full" />
              ) : (
                userInitials
              )}
            </div>
            {/* Sign out */}
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <main className="flex-1 min-h-0">
          {children}
        </main>
      </div>
    </ThemeProvider>
    </ViewedUserContext.Provider>
  );
}
