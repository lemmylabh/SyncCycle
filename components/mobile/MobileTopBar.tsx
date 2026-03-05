"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { TrackerDropdown } from "./TrackerDropdown";

interface MobileTopBarProps {
  initials: string;
  isDemo: boolean;
}

export function MobileTopBar({ initials, isDemo }: MobileTopBarProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    setProfileOpen(false);
    if (isDemo) {
      sessionStorage.removeItem("demo");
      router.push("/");
      return;
    }
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0 relative z-30 bg-[#0f0f13]">
      {/* Left: Logo image (mirrors profile avatar height) */}
      <img src="https://i.postimg.cc/fW1nkM36/logo-dark.png" alt="Syncycle" className="w-8 h-8 object-contain flex-shrink-0" />

      {/* Center: Trackers dropdown */}
      <TrackerDropdown />

      {/* Right: Profile avatar */}
      <div className="relative">
        <button
          onClick={() => setProfileOpen((v) => !v)}
          className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md"
        >
          {isDemo ? "DM" : initials}
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
                className="absolute right-0 top-full mt-2 w-44 bg-[#1e1e2a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50"
              >
                <button
                  onClick={() => { setProfileOpen(false); router.push("/dashboard/profile"); }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Settings size={14} />
                  Settings
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
