"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Phase, computePhase, cycleDay as calcCycleDay } from "@/lib/cycleUtils";
import { MobileDashboard } from "./MobileDashboard";

export function MobileDashboardWrapper() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<Phase | null>(null);
  const [cycleDay, setCycleDay] = useState<number | null>(null);
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);

  useEffect(() => {
    const demo =
      sessionStorage.getItem("demo") === "true" ||
      window.location.search.includes("demo=true");

    if (demo) {
      setIsDemo(true);
      setCurrentPhase("follicular");
      setCycleDay(8);
      return;
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      setUserId(session.user.id);

      const [profileRes, cycleRes] = await Promise.all([
        supabase
          .from("user_profiles")
          .select("average_cycle_length, average_period_length")
          .eq("id", session.user.id)
          .maybeSingle(),
        supabase
          .from("cycles")
          .select("start_date, cycle_length")
          .eq("user_id", session.user.id)
          .order("start_date", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const cLen = profileRes.data?.average_cycle_length ?? 28;
      const pLen = profileRes.data?.average_period_length ?? 5;
      setCycleLength(cLen);
      setPeriodLength(pLen);

      if (cycleRes.data?.start_date) {
        const day = calcCycleDay(cycleRes.data.start_date);
        setCycleDay(day);
        setCurrentPhase(computePhase(day, pLen, cLen));
      }
    });
  }, []);

  return (
    <MobileDashboard
      userId={userId}
      isDemo={isDemo}
      currentPhase={currentPhase}
      cycleDay={cycleDay}
      cycleLength={cycleLength}
      periodLength={periodLength}
    />
  );
}
