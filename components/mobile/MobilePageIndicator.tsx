"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface MobilePageIndicatorProps {
  pathname: string;
}

const TABS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Insights", href: "/dashboard/insights" },
];

export function MobilePageIndicator({ pathname }: MobilePageIndicatorProps) {
  const router = useRouter();
  const activeIdx = pathname === "/dashboard/insights" ? 1 : 0;

  return (
    <div className="flex border-b border-white/5 bg-[#0f0f13] flex-shrink-0">
      {TABS.map((tab, i) => (
        <button
          key={tab.href}
          onClick={() => router.push(tab.href)}
          className="flex-1 relative py-2.5 text-sm font-medium transition-colors"
          style={{ color: activeIdx === i ? "white" : "#6b7280" }}
        >
          {tab.label}
          {activeIdx === i && (
            <motion.div
              layoutId="mobile-tab-indicator"
              className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-gradient-to-r from-rose-500 to-purple-500"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
