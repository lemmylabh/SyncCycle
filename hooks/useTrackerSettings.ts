"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const ALL_TRACKERS = ["period", "mood", "fitness", "nutrition", "sleep", "symptoms"];

export interface TrackerSettings {
  enabledTrackers: string[];
  fionaAccess: string[];
  loading: boolean;
}

export function useTrackerSettings(): TrackerSettings {
  const [enabledTrackers, setEnabledTrackers] = useState<string[]>(ALL_TRACKERS);
  const [fionaAccess, setFionaAccess] = useState<string[]>(ALL_TRACKERS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setLoading(false); return; }

      if (session.user.email === "demo@syncycle.ai") {
        const saved = sessionStorage.getItem("demo-tracker-settings");
        if (saved) {
          try {
            const p = JSON.parse(saved);
            if (p.enabled) setEnabledTrackers(p.enabled);
            if (p.fionaAccess) setFionaAccess(p.fionaAccess);
          } catch { /* ignore malformed */ }
        }
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("user_profiles")
        .select("enabled_trackers, fiona_tracker_access")
        .eq("id", session.user.id)
        .single();

      if (data) {
        if (data.enabled_trackers?.length) setEnabledTrackers(data.enabled_trackers);
        if (data.fiona_tracker_access?.length) setFionaAccess(data.fiona_tracker_access);
      }
      setLoading(false);
    });
  }, []);

  // Listen for immediate updates when settings are saved (no refresh needed)
  useEffect(() => {
    function onChanged(e: Event) {
      const { enabled, fionaAccess: fa } = (e as CustomEvent<{ enabled: string[]; fionaAccess: string[] }>).detail;
      setEnabledTrackers(enabled);
      setFionaAccess(fa);
    }
    window.addEventListener("tracker-settings-changed", onChanged);
    return () => window.removeEventListener("tracker-settings-changed", onChanged);
  }, []);

  return { enabledTrackers, fionaAccess, loading };
}
