"use client";

import { usePathname, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { supabase } from "@/lib/supabase";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isDemo?: boolean;
  collapsed?: boolean;
  sidebarWidth?: number;
}

interface SidebarContentProps {
  instanceId: string;
  pathname: string;
  suffix: string;
  onClose: () => void;
  handleSignOut: () => void;
  shouldReduceMotion: boolean | null;
  collapsed?: boolean;
}

const navSections = [
  {
    label: "MAIN",
    items: [
      { icon: "▣", label: "Dashboard", href: "/dashboard" },
      { icon: "◈", label: "Insights", href: "/dashboard/insights" },
      { icon: "✦", label: "Ask Fiona", href: "/dashboard/fiona" },
    ],
  },
  {
    label: "CYCLE",
    items: [
      { icon: "●", label: "Period", href: "/dashboard/period" },
      { icon: "♡", label: "Symptoms", href: "/dashboard/symptoms" },
      { icon: "✦", label: "Vibe Check", href: "/dashboard/vibe-check" },
      { icon: "✦", label: "Journal", href: "/dashboard/journal" },
    ],
  },
  {
    label: "LIFESTYLE",
    items: [
      { icon: "⊕", label: "Nutrition", href: "/dashboard/nutrition" },
      { icon: "◎", label: "Fitness", href: "/dashboard/fitness" },
      { icon: "☽", label: "Sleep", href: "/dashboard/sleep" },
    ],
  },
];

const bottomItems = [
  { icon: "⚙", label: "Settings", href: "/dashboard/settings" },
];

function SidebarContent({ instanceId, pathname, suffix, onClose, handleSignOut, shouldReduceMotion, collapsed }: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full bg-[#161620]">
      {/* Logo */}
      <div className={`flex items-center border-b border-white/5 ${collapsed ? "justify-center px-2 py-3" : "gap-2.5 px-6 py-3"}`}>
        <img src="https://i.postimg.cc/fW1nkM36/logo-dark.png" alt="Syncycle" className="w-7 h-7 object-contain flex-shrink-0" />
        {!collapsed && (
          <span className="text-white font-light tracking-[0.25em] text-base">Syncycle<span className="text-white/50"></span></span>
        )}
      </div>

      {/* Nav sections */}
      <nav className={`flex-1 py-2 space-y-2 ${collapsed ? "px-1" : "px-3"}`}>
        {navSections.map((section, si) => (
          <div key={si}>
            {!collapsed && section.label && (
              <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-widest px-3 mb-1">
                {section.label}
              </p>
            )}
            {collapsed && si > 0 && <div className="border-t border-white/5 my-1.5" />}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href} className="relative group">
                    {isActive && (
                      <>
                        <motion.div
                          layoutId={`${instanceId}-activeNav`}
                          className="absolute inset-0 rounded-lg bg-rose-500/20"
                          transition={{
                            type: "tween",
                            duration: shouldReduceMotion ? 0 : 0.2,
                            ease: "easeInOut",
                          }}
                        />
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-rose-500 rounded-full z-10" />
                      </>
                    )}
                    <a
                      href={item.href + suffix}
                      onClick={onClose}
                      className={
                        collapsed
                          ? `relative z-10 flex items-center justify-center px-2 py-1.5 rounded-lg transition-colors ${isActive ? "text-rose-400" : "text-gray-400 hover:bg-white/5 hover:text-white"}`
                          : isActive
                            ? "relative z-10 flex items-center gap-3 px-3 py-1.5 rounded-lg text-rose-400 font-medium text-sm"
                            : "flex items-center gap-3 px-3 py-1.5 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors text-sm"
                      }
                    >
                      <span className="text-base w-5 text-center flex-shrink-0">{item.icon}</span>
                      {!collapsed && item.label}
                    </a>
                    {/* Tooltip on hover when collapsed */}
                    {collapsed && (
                      <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#1e1e2a] border border-white/10 rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                        {item.label}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom items */}
      <div className={`pb-2 border-t border-white/5 pt-2 space-y-0.5 ${collapsed ? "px-1" : "px-3"}`}>
        {bottomItems.map((item) => (
          <div key={item.href} className="relative group">
            <a
              href={item.href + suffix}
              onClick={onClose}
              className={`flex items-center rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors text-sm ${collapsed ? "justify-center px-2 py-1.5" : "gap-3 px-3 py-1.5"}`}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              {!collapsed && item.label}
            </a>
            {collapsed && (
              <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#1e1e2a] border border-white/10 rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                {item.label}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Sidebar({ isOpen, onClose, isDemo, collapsed, sidebarWidth }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const suffix = isDemo ? "?demo=true" : "";
  const shouldReduceMotion = useReducedMotion();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-shrink-0 h-screen sticky top-0 z-20 transition-[width] duration-300"
        style={{ width: sidebarWidth ?? (collapsed ? 64 : 256) }}
      >
        <div className="w-full">
          <SidebarContent
            instanceId="desktop"
            pathname={pathname}
            suffix={suffix}
            onClose={onClose}
            handleSignOut={handleSignOut}
            shouldReduceMotion={shouldReduceMotion}
            collapsed={collapsed}
          />
        </div>
      </aside>

      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 lg:hidden transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent
          instanceId="mobile"
          pathname={pathname}
          suffix={suffix}
          onClose={onClose}
          handleSignOut={handleSignOut}
          shouldReduceMotion={shouldReduceMotion}
        />
      </aside>
    </>
  );
}
