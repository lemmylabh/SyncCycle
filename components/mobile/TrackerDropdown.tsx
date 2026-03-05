"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const TRACKER_GROUPS = [
  {
    label: "Cycle",
    items: [{ label: "Period", href: "/dashboard/period" }],
  },
  {
    label: "Health",
    items: [
      { label: "Symptoms", href: "/dashboard/symptoms" },
      { label: "Vibe Check", href: "/dashboard/vibe-check" },
    ],
  },
  {
    label: "Lifestyle",
    items: [
      { label: "Nutrition", href: "/dashboard/nutrition" },
      { label: "Fitness", href: "/dashboard/fitness" },
      { label: "Sleep", href: "/dashboard/sleep" },
    ],
  },
  {
    label: "Reflection",
    items: [{ label: "Journal", href: "/dashboard/journal" }],
  },
];

export function TrackerDropdown() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

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
        Trackers
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
              className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-52 bg-[#1e1e2a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50"
            >
              {TRACKER_GROUPS.map((group, gi) => (
                <div key={group.label}>
                  {gi > 0 && <div className="border-t border-white/5" />}
                  <p className="text-gray-600 text-[10px] uppercase tracking-widest px-4 pt-3 pb-1">
                    {group.label}
                  </p>
                  {group.items.map((item) => (
                    <button
                      key={item.href}
                      onClick={() => handleNavigate(item.href)}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      {item.label}
                    </button>
                  ))}
                  {gi === TRACKER_GROUPS.length - 1 && <div className="pb-2" />}
                </div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
