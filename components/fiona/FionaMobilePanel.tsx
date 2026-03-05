"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface FionaMobilePanelProps {
  panelType: "history" | "daycard";
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function FionaMobilePanel({ panelType, isOpen, onClose, children }: FionaMobilePanelProps) {
  const isTop = panelType === "history";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            key="panel"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={isTop ? { top: 0, bottom: 0.25 } : { top: 0.25, bottom: 0 }}
            onDragEnd={(_, info) => {
              const threshold = 70;
              if (isTop && info.offset.y < -threshold) onClose();
              if (!isTop && info.offset.y > threshold) onClose();
            }}
            initial={{ y: isTop ? "-100%" : "100%" }}
            animate={{ y: 0 }}
            exit={{ y: isTop ? "-100%" : "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className={`fixed inset-x-0 z-50 bg-[#16161f] border-white/8 overflow-hidden shadow-2xl ${
              isTop
                ? "top-0 h-[72vh] rounded-b-3xl border-b"
                : "bottom-0 h-[72vh] rounded-t-3xl border-t"
            }`}
            style={{ touchAction: "pan-x" }}
          >
            {/* Drag handle */}
            <div
              className={`flex justify-center py-2 flex-shrink-0 ${
                isTop ? "order-last pb-3 pt-1" : "pt-3 pb-1"
              }`}
            >
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-4 z-10 w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>

            {/* Content */}
            <div className="flex-1 overflow-y-auto h-full">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
