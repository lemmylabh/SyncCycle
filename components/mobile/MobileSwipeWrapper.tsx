"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";

interface MobileSwipeWrapperProps {
  pathname: string;
  children: React.ReactNode;
}

export function MobileSwipeWrapper({ pathname, children }: MobileSwipeWrapperProps) {
  const router = useRouter();
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const isOnDashboard = pathname === "/dashboard";
  const isOnInsights = pathname === "/dashboard/insights";

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY.current);

    // Ignore mostly-vertical swipes
    if (deltaY > Math.abs(deltaX) * 0.8) {
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }

    const threshold = 60;
    if (deltaX < -threshold && isOnDashboard) {
      router.push("/dashboard/insights");
    } else if (deltaX > threshold && isOnInsights) {
      router.push("/dashboard");
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <div
      className="h-full"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
}
