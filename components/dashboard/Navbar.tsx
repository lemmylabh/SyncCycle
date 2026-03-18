"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { Settings, LogOut, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ThemeSelector } from "@/components/dashboard/ThemeSelector";
import { useDashboardLayout } from "@/hooks/useDashboardLayout";

const PAGE_NAMES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/insights": "Insights",
  "/dashboard/period": "Period",
  "/dashboard/symptoms": "Symptoms",
  "/dashboard/vibe-check": "Vibe Check",
  "/dashboard/journal": "Journal",
  "/dashboard/nutrition": "Nutrition",
  "/dashboard/fitness": "Fitness",
  "/dashboard/sleep": "Sleep",
  "/dashboard/settings": "Settings",
  "/dashboard/fiona": "Ask Fiona",
  "/dashboard/community": "Community",
  "/dashboard/marketplace": "Marketplace",
  "/dashboard/whats-next": "What's Next",
};

interface NavbarProps {
  onMenuToggle: () => void;
  userInitials: string;
  avatarUrl?: string | null;
  isDemo?: boolean;
}

export function Navbar({ onMenuToggle, userInitials, avatarUrl, isDemo }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const cellSize = useDashboardLayout();
  const gridWidth = 4 * cellSize + 3 * 16;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  return (
    <header className="flex items-center justify-center px-4 py-3 flex-shrink-0 bg-[var(--page-bg)]">
      <div
        className="w-full flex items-center justify-between px-5 h-12 rounded-2xl bg-[var(--card-bg)] card-glass border border-[var(--border-md)] shadow-[0_2px_24px_rgba(0,0,0,0.4)]"
        style={{ maxWidth: gridWidth }}
      >
      {/* Left: hamburger + page title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden text-gray-400 hover:text-white transition-colors p-1"
          aria-label="Toggle menu"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>
        <h1 className="text-white font-semibold text-base hidden sm:block">
          {pathname.startsWith("/dashboard/settings") ? "Settings" : PAGE_NAMES[pathname] ?? "Dashboard"}
        </h1>
      </div>

      {/* Center: nav links */}
      <nav className="flex items-center gap-1 hidden md:flex">
        {[
          { label: "Community",   href: "/dashboard/community" },
          { label: "Marketplace", href: "/dashboard/marketplace" },
          { label: "What's Next", href: "/dashboard/whats-next" },
        ].map(({ label, href }) => (
          <a
            key={href}
            href={href}
            className={`px-3.5 py-1.5 rounded-lg text-sm transition-colors ${
              pathname === href
                ? "text-violet-400 bg-violet-500/10"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {label}
          </a>
        ))}
      </nav>

      {/* Right: theme + bell + avatar */}
      <div className="flex items-center gap-3">
        {isDemo && (
          <a
            href="/signup"
            className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-violet-500/20 border border-violet-500/30 text-violet-300 hover:border-violet-400/60 hover:text-violet-200 transition-all duration-200"
          >
            <Zap size={11} />
            Sign Up Free
          </a>
        )}
        <ThemeSelector />
        {/* Notification bell */}
        <button className="relative text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {/* Badge dot */}
          <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
        </button>

        {/* Avatar dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-8 h-8 rounded-full ring-2 ring-white/10 hover:ring-violet-500/50 transition-all duration-200 overflow-hidden flex-shrink-0 flex items-center justify-center"
          >
            {avatarUrl ? (
              <Image src={avatarUrl} alt={userInitials} width={32} height={32} className="w-full h-full object-cover" />
            ) : (
              <span className="w-full h-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white text-xs font-semibold">
                {userInitials}
              </span>
            )}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-[#0a0a0a] border border-white/8 shadow-[0_8px_40px_rgba(0,0,0,0.7)] overflow-hidden z-50">
              {/* User identity header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-white/10 flex-shrink-0 flex items-center justify-center">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt={userInitials} width={32} height={32} className="w-full h-full object-cover" />
                  ) : (
                    <span className="w-full h-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white text-xs font-semibold">
                      {userInitials}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-white text-xs font-medium truncate">My Account</p>
                  <p className="text-gray-500 text-[11px] truncate">Signed in</p>
                </div>
              </div>

              {/* Actions */}
              <div className="py-1">
                <a
                  href="/dashboard/settings"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                  onClick={() => setDropdownOpen(false)}
                >
                  <Settings size={14} className="text-gray-500" />
                  Settings
                </a>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-rose-400 transition-colors"
                >
                  <LogOut size={14} className="text-gray-500" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </header>
  );
}
