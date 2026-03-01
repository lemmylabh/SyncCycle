"use client";

import { motion, useReducedMotion } from "framer-motion";

interface AnimatedCardProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function AnimatedCard({ children, delay = 0, className }: AnimatedCardProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.25,
        ease: "easeOut",
        delay: shouldReduceMotion ? 0 : delay,
      }}
      whileHover={
        shouldReduceMotion
          ? undefined
          : { y: -3, transition: { type: "spring", stiffness: 300, damping: 30 } }
      }
    >
      {children}
    </motion.div>
  );
}
