"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Mic, Sparkles } from "lucide-react";

interface MobileFABProps {
  onFionaOpen: () => void;
  onVoiceRecord: () => void;
}

export function MobileFAB({ onFionaOpen, onVoiceRecord }: MobileFABProps) {
  const [open, setOpen] = useState(false);

  const handleFiona = () => {
    setOpen(false);
    onFionaOpen();
  };

  const handleVoice = () => {
    setOpen(false);
    onVoiceRecord();
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="fab-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Bottom sheet */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="fab-sheet"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="fixed bottom-24 right-4 z-50 bg-[#1e1e2a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl w-56"
          >
            <button
              onClick={handleVoice}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
                <Mic size={14} className="text-rose-400" />
              </div>
              <span className="font-medium">Record Your Day</span>
            </button>
            <div className="border-t border-white/5" />
            <button
              onClick={handleFiona}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Sparkles size={14} className="text-purple-400" />
              </div>
              <span className="font-medium">Ask Fiona</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB button */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileTap={{ scale: 0.92 }}
        className="fixed bottom-6 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30 text-white"
        style={{ boxShadow: "0 4px 20px rgba(168, 85, 247, 0.35)" }}
      >
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="inline-flex"
        >
          {open ? <X size={22} /> : <Plus size={22} />}
        </motion.span>
      </motion.button>
    </>
  );
}
