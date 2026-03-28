"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/lib/themeContext";
import { TrackerDropdown } from "./TrackerDropdown";

interface MobileTopBarProps {
  initials: string;
  isDemo: boolean;
  avatarUrl?: string | null;
}

export function MobileTopBar({ initials, isDemo, avatarUrl }: MobileTopBarProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    setProfileOpen(false);
    if (isDemo) {
      sessionStorage.removeItem("demo");
      router.push("/auth");
      return;
    }
    await supabase.auth.signOut();
    router.push("/auth");
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] flex-shrink-0 relative z-30 bg-[var(--page-bg)]">
      {/* Left: Logo image (mirrors profile avatar height) */}
      <img src="/logo-dark.png" alt="Syncycle" className="w-8 h-8 object-contain flex-shrink-0" />

      {/* Center: Trackers dropdown */}
      <TrackerDropdown />

      {/* Right: Profile avatar */}
      <div className="relative">
        <button
          onClick={() => setProfileOpen((v) => !v)}
          className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            isDemo ? "DM" : initials
          )}
        </button>

        <AnimatePresence>
          {profileOpen && (
            <>
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-40"
                onClick={() => setProfileOpen(false)}
              />
              <motion.div
                key="menu"
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.18, type: "spring", stiffness: 400, damping: 28 }}
                className="dropdown-panel absolute right-0 top-full mt-2 w-48 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-2xl z-50"
              >
                <button
                  onClick={() => { setProfileOpen(false); router.push("/dashboard/settings/profile"); }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Settings size={14} />
                  Settings
                </button>
                <div className="border-t border-white/5" />
                <button
                  onClick={() => { setTheme(theme === "aurora" ? "dark" : "aurora"); setProfileOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  {theme === "aurora" ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                    </svg>
                  )}
                  {theme === "aurora" ? "Dark Theme" : "Aurora Theme"}
                </button>
                <div className="border-t border-white/5" />
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/5 transition-colors"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
