"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, User, Lock, Palette, CreditCard, Plug, HelpCircle, type LucideIcon } from "lucide-react";

interface SettingsItem {
  label: string;
  href: string;
  Icon: LucideIcon;
}

const SETTINGS_ITEMS: SettingsItem[] = [
  { label: "Profile",       href: "/dashboard/settings/profile",      Icon: User },
  { label: "Account",       href: "/dashboard/settings/account",      Icon: Lock },
  { label: "App Settings",  href: "/dashboard/settings/app-settings", Icon: Palette },
  { label: "Subscription",  href: "/dashboard/settings/subscription", Icon: CreditCard },
  { label: "Connections",   href: "/dashboard/settings/connections",  Icon: Plug },
  { label: "Help & Support",href: "/dashboard/settings/help",         Icon: HelpCircle },
];

const LABEL_MAP: Record<string, string> = {
  "/dashboard/settings/profile":      "Profile",
  "/dashboard/settings/account":      "Account",
  "/dashboard/settings/app-settings": "App Settings",
  "/dashboard/settings/subscription": "Subscription",
  "/dashboard/settings/connections":  "Connections",
  "/dashboard/settings/help":         "Help & Support",
};

export function SettingsDropdown() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const currentLabel = LABEL_MAP[pathname] ?? "Settings";

  const handleNavigate = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold text-white hover:bg-white/5 transition-colors"
      >
        {currentLabel}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="inline-flex"
        >
          <ChevronDown size={14} className="text-gray-400" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              key="dropdown"
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.18, type: "spring", stiffness: 400, damping: 28 }}
              className="dropdown-panel absolute left-1/2 -translate-x-1/2 top-full mt-2 w-52 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-2xl z-50"
            >
              <div className="py-2">
                {SETTINGS_ITEMS.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <button
                      key={item.href}
                      onClick={() => handleNavigate(item.href)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        isActive
                          ? "text-violet-400 bg-violet-500/10"
                          : "text-gray-300 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <item.Icon size={14} className="flex-shrink-0" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
