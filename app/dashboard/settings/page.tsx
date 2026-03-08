"use client";

import { motion } from "framer-motion";
import { Settings, Wrench, Clock } from "lucide-react";
import { useDashboardLayout } from "@/hooks/useDashboardLayout";

export default function SettingsPage() {
  const cellSize = useDashboardLayout();
  const GAP = 16;
  const gridWidth = 4 * cellSize + 3 * GAP;

  return (
    <div className="flex justify-center px-4 py-5">
      <div className="w-full" style={{ maxWidth: gridWidth }}>

        {/* Header card */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--card-bg)] card-glass rounded-2xl border border-[var(--border)] px-5 py-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
              <Settings size={16} className="text-white/40" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white leading-none">Settings</h1>
              <p className="text-white/35 text-xs mt-0.5">Preferences & account</p>
            </div>
          </div>
        </motion.div>

        {/* Under construction card */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.5 }}
          className="bg-[var(--card-bg)] card-glass rounded-2xl border border-[var(--border)] p-12 flex flex-col items-center text-center">

          {/* Animated icon cluster */}
          <div className="relative w-20 h-20 mb-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border border-white/[0.06]" />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute inset-2 rounded-full border border-dashed border-white/[0.08]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                  <Wrench size={28} className="text-white/30" />
                </motion.div>
              </div>
            </div>
          </div>

          <h2 className="text-white font-semibold text-lg mb-2">Under Construction</h2>
          <p className="text-white/35 text-sm max-w-xs leading-relaxed mb-8">
            Settings are being built. You&apos;ll soon be able to manage your account, notifications, cycle preferences, and themes here.
          </p>

          {/* Coming soon chips */}
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              "Account & Profile",
              "Notifications",
              "Cycle Preferences",
              "Theme & Display",
              "Data & Privacy",
              "Integrations",
            ].map((item, i) => (
              <motion.div key={item}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.06 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
                <Clock size={10} className="text-white/20" />
                <span className="text-white/30 text-xs">{item}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
