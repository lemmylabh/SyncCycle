"use client";
import { useEffect, useState } from "react";

const GAP = 16;
const PAD = 32;

// Discrete 3-state sidebar widths
const SIDEBAR_W_FULL = 256;       // ≥ 1440px — original desktop width
const SIDEBAR_W_MEDIUM = 192;     // 1200–1439px — labels visible, narrower
const SIDEBAR_W_COLLAPSED = 64;   // < 1200px — icons only

export function computeSidebarW(vw: number): number {
  if (vw >= 1440) return SIDEBAR_W_FULL;
  if (vw >= 1200) return SIDEBAR_W_MEDIUM;
  return SIDEBAR_W_COLLAPSED;
}

export function useDashboardLayout() {
  const [cellSize, setCellSize] = useState(300);

  useEffect(() => {
    function update() {
      const vw = window.innerWidth;
      const sidebarW = computeSidebarW(vw);
      const w = vw - sidebarW;
      const h = window.innerHeight - 72;
      const size = Math.floor(
        Math.min((w - PAD - 3 * GAP) / 4, (h - PAD - GAP) / 2)
      );
      setCellSize(Math.max(size, 160));
    }

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return cellSize;
}
