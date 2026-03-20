"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

export const DEFAULT_ORDER = ["period", "mood", "symptoms", "nutrition", "fitness", "sleep"];

export type ProfileCardSize = "1x2" | "1x1" | "2x1";
export type InsightsCardSize = "1x1" | "1x2" | "2x1" | "2x2";

// ── Shared grid math (used by hook + settings page) ───────────────────────────

export function profileCells(size: ProfileCardSize): number {
  return size === "1x1" ? 1 : 2;
}

export function insightsCells(size: InsightsCardSize): number {
  return { "1x1": 1, "1x2": 2, "2x1": 2, "2x2": 4 }[size];
}

/** Max cardOrder array length given current profile/insights sizes. */
export function maxCardSlots(
  pSize: ProfileCardSize,
  iSize: InsightsCardSize,
  insightsInGrid: boolean,
): number {
  return insightsInGrid
    ? 8 - profileCells(pSize) - insightsCells(iSize) + 1
    : 8 - profileCells(pSize);
}

/** Trim or pad cardOrder to exactly `max` slots. Removes empties first, then trailing filled. */
export function adjustCardOrder(order: string[], max: number): string[] {
  const adjusted = [...order];
  while (adjusted.length > max) {
    const ei = adjusted.lastIndexOf("");
    if (ei !== -1) adjusted.splice(ei, 1);
    else adjusted.pop();
  }
  while (adjusted.length < max) adjusted.push("");
  return adjusted;
}

// ─────────────────────────────────────────────────────────────────────────────

interface BatchUpdate {
  cardOrder?: string[];
  profileCardSize?: ProfileCardSize;
  insightsCardSize?: InsightsCardSize;
}

export interface DashboardCardOrder {
  cardOrder: string[];
  profileCardSize: ProfileCardSize;
  insightsCardSize: InsightsCardSize;
  setCardOrder: (order: string[]) => void;
  setProfileCardSize: (size: ProfileCardSize) => void;
  setInsightsCardSize: (size: InsightsCardSize) => void;
  batchUpdate: (updates: BatchUpdate) => void;
  loading: boolean;
}

export function useDashboardCardOrder(): DashboardCardOrder {
  const [cardOrder, setCardOrderState] = useState<string[]>(DEFAULT_ORDER);
  const [profileCardSize, setProfileCardSizeState] = useState<ProfileCardSize>("1x2");
  const [insightsCardSize, setInsightsCardSizeState] = useState<InsightsCardSize>("1x1");
  const [loading, setLoading] = useState(true);
  const isDispatching = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setLoading(false); return; }

      if (session.user.email === "demo@syncycle.ai") {
        const saved = sessionStorage.getItem("demo-dashboard-order");
        if (saved) {
          try {
            const p = JSON.parse(saved);
            const pSize: ProfileCardSize  = p.profileCardSize  ?? "1x2";
            const iSize: InsightsCardSize = p.insightsCardSize ?? "1x1";
            const rawOrder: string[]      = p.cardOrder        ?? [];
            const max = maxCardSlots(pSize, iSize, rawOrder.includes("insights"));
            setCardOrderState(adjustCardOrder(rawOrder, max));
            setProfileCardSizeState(pSize);
            setInsightsCardSizeState(iSize);
          } catch { /* ignore */ }
        }
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("user_profiles")
        .select("dashboard_card_order, profile_card_size, insights_card_size")
        .eq("id", session.user.id)
        .single();

      if (data) {
        const pSize: ProfileCardSize  = (data.profile_card_size  as ProfileCardSize)  ?? "1x2";
        const iSize: InsightsCardSize = (data.insights_card_size as InsightsCardSize) ?? "1x1";
        const rawOrder: string[]      = data.dashboard_card_order ?? [];
        const max = maxCardSlots(pSize, iSize, rawOrder.includes("insights"));
        setCardOrderState(adjustCardOrder(rawOrder, max));
        setProfileCardSizeState(pSize);
        setInsightsCardSizeState(iSize);
      }
      setLoading(false);
    });
  }, []);

  // Listen for updates from OTHER hook instances only
  useEffect(() => {
    function onChanged(e: Event) {
      if (isDispatching.current) return;
      const { cardOrder: co, profileCardSize: pcs, insightsCardSize: ics } =
        (e as CustomEvent<{ cardOrder: string[]; profileCardSize: ProfileCardSize; insightsCardSize: InsightsCardSize }>).detail;
      if (co)  setCardOrderState(co);
      if (pcs) setProfileCardSizeState(pcs);
      if (ics) setInsightsCardSizeState(ics);
    }
    window.addEventListener("dashboard-order-changed", onChanged);
    return () => window.removeEventListener("dashboard-order-changed", onChanged);
  }, []);

  async function persist(order: string[], pSize: ProfileCardSize, iSize: InsightsCardSize) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    if (session.user.email === "demo@syncycle.ai") {
      sessionStorage.setItem("demo-dashboard-order", JSON.stringify({ cardOrder: order, profileCardSize: pSize, insightsCardSize: iSize }));
      return;
    }

    await supabase
      .from("user_profiles")
      .update({ dashboard_card_order: order, profile_card_size: pSize, insights_card_size: iSize })
      .eq("id", session.user.id);
  }

  function dispatch(order: string[], pSize: ProfileCardSize, iSize: InsightsCardSize) {
    isDispatching.current = true;
    window.dispatchEvent(new CustomEvent("dashboard-order-changed", {
      detail: { cardOrder: order, profileCardSize: pSize, insightsCardSize: iSize },
    }));
    isDispatching.current = false;
  }

  function batchUpdate(updates: BatchUpdate) {
    const newOrder = updates.cardOrder ?? cardOrder;
    const newPSize = updates.profileCardSize ?? profileCardSize;
    const newISize = updates.insightsCardSize ?? insightsCardSize;
    if (updates.cardOrder      !== undefined) setCardOrderState(newOrder);
    if (updates.profileCardSize !== undefined) setProfileCardSizeState(newPSize);
    if (updates.insightsCardSize !== undefined) setInsightsCardSizeState(newISize);
    persist(newOrder, newPSize, newISize);
    dispatch(newOrder, newPSize, newISize);
  }

  function setCardOrder(order: string[]) { batchUpdate({ cardOrder: order }); }
  function setProfileCardSize(size: ProfileCardSize) { batchUpdate({ profileCardSize: size }); }
  function setInsightsCardSize(size: InsightsCardSize) { batchUpdate({ insightsCardSize: size }); }

  return { cardOrder, profileCardSize, insightsCardSize, setCardOrder, setProfileCardSize, setInsightsCardSize, batchUpdate, loading };
}
