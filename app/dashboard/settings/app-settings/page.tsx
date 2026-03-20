"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { computeAutoArrange } from "@/hooks/useDashboardCardOrder";
import {
  Droplets, Smile, Moon, UtensilsCrossed, Dumbbell, HeartPulse,
  Lock, Sparkles, type LucideIcon,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────

interface TrackerRow {
  value: string;
  label: string;
  Icon: LucideIcon;
  alwaysOn: boolean;
}

const TRACKERS: TrackerRow[] = [
  { value: "period",    label: "Period",     Icon: Droplets,        alwaysOn: true  },
  { value: "mood",      label: "Vibe Check", Icon: Smile,           alwaysOn: false },
  { value: "sleep",     label: "Sleep",      Icon: Moon,            alwaysOn: false },
  { value: "nutrition", label: "Nutrition",  Icon: UtensilsCrossed, alwaysOn: false },
  { value: "fitness",   label: "Fitness",    Icon: Dumbbell,        alwaysOn: false },
  { value: "symptoms",  label: "Symptoms",   Icon: HeartPulse,      alwaysOn: false },
];

const TIMEZONES: { value: string; label: string }[] = [
  { value: "UTC",                    label: "UTC" },
  { value: "America/New_York",       label: "New York (ET)" },
  { value: "America/Chicago",        label: "Chicago (CT)" },
  { value: "America/Denver",         label: "Denver (MT)" },
  { value: "America/Los_Angeles",    label: "Los Angeles (PT)" },
  { value: "America/Toronto",        label: "Toronto (ET)" },
  { value: "America/Vancouver",      label: "Vancouver (PT)" },
  { value: "America/Sao_Paulo",      label: "São Paulo (BRT)" },
  { value: "Europe/London",          label: "London (GMT/BST)" },
  { value: "Europe/Paris",           label: "Paris (CET)" },
  { value: "Europe/Berlin",          label: "Berlin (CET)" },
  { value: "Europe/Rome",            label: "Rome (CET)" },
  { value: "Europe/Madrid",          label: "Madrid (CET)" },
  { value: "Europe/Amsterdam",       label: "Amsterdam (CET)" },
  { value: "Europe/Stockholm",       label: "Stockholm (CET)" },
  { value: "Europe/Warsaw",          label: "Warsaw (CET)" },
  { value: "Europe/Istanbul",        label: "Istanbul (TRT)" },
  { value: "Africa/Cairo",           label: "Cairo (EET)" },
  { value: "Africa/Lagos",           label: "Lagos (WAT)" },
  { value: "Africa/Johannesburg",    label: "Johannesburg (SAST)" },
  { value: "Asia/Dubai",             label: "Dubai (GST)" },
  { value: "Asia/Kolkata",           label: "India (IST)" },
  { value: "Asia/Dhaka",             label: "Dhaka (BST)" },
  { value: "Asia/Bangkok",           label: "Bangkok (ICT)" },
  { value: "Asia/Singapore",         label: "Singapore (SGT)" },
  { value: "Asia/Shanghai",          label: "Shanghai (CST)" },
  { value: "Asia/Tokyo",             label: "Tokyo (JST)" },
  { value: "Asia/Seoul",             label: "Seoul (KST)" },
  { value: "Australia/Sydney",       label: "Sydney (AEDT)" },
  { value: "Pacific/Auckland",       label: "Auckland (NZST)" },
  { value: "Pacific/Honolulu",       label: "Honolulu (HST)" },
];

// ─── Toggle ─────────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onChange}
      className={`relative inline-flex w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${
        disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
      } ${checked && !disabled ? "bg-violet-500" : "bg-white/10"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function AppSettingsPage() {
  const [enabled, setEnabled] = useState<string[]>(TRACKERS.map(t => t.value));
  const [fionaAccess, setFionaAccess] = useState<string[]>(TRACKERS.map(t => t.value));
  const [origEnabled, setOrigEnabled] = useState<string[]>(TRACKERS.map(t => t.value));
  const [origFiona, setOrigFiona] = useState<string[]>(TRACKERS.map(t => t.value));
  const [timezone, setTimezone] = useState("UTC");
  const [origTz, setOrigTz] = useState("UTC");
  const [userId, setUserId] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setLoading(false); return; }

      // Demo account: settings are session-only
      if (session.user.email === "demo@syncycle.ai") {
        setIsDemo(true);
        const saved = sessionStorage.getItem("demo-tracker-settings");
        if (saved) {
          try {
            const p = JSON.parse(saved);
            if (p.enabled) { setEnabled(p.enabled); setOrigEnabled(p.enabled); }
            if (p.fionaAccess) { setFionaAccess(p.fionaAccess); setOrigFiona(p.fionaAccess); }
            if (p.timezone) { setTimezone(p.timezone); setOrigTz(p.timezone); }
          } catch { /* ignore */ }
        }
        setLoading(false);
        return;
      }

      // Real user: fetch from DB
      setUserId(session.user.id);
      const { data } = await supabase
        .from("user_profiles")
        .select("enabled_trackers, fiona_tracker_access, timezone")
        .eq("id", session.user.id)
        .single();

      if (data) {
        const et = data.enabled_trackers?.length ? data.enabled_trackers : TRACKERS.map(t => t.value);
        const fa = data.fiona_tracker_access?.length ? data.fiona_tracker_access : TRACKERS.map(t => t.value);
        const tz = data.timezone ?? "UTC";
        setEnabled(et); setOrigEnabled(et);
        setFionaAccess(fa); setOrigFiona(fa);
        setTimezone(tz); setOrigTz(tz);
      }
      setLoading(false);
    });
  }, []);

  const isDirty =
    JSON.stringify([...enabled].sort()) !== JSON.stringify([...origEnabled].sort()) ||
    JSON.stringify([...fionaAccess].sort()) !== JSON.stringify([...origFiona].sort()) ||
    timezone !== origTz;

  function toggleEnabled(value: string) {
    if (enabled.includes(value)) {
      setEnabled(prev => prev.filter(v => v !== value));
      setFionaAccess(prev => prev.filter(v => v !== value));
    } else {
      setEnabled(prev => [...prev, value]);
    }
  }

  function toggleFiona(value: string) {
    setFionaAccess(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  }

  async function handleSave() {
    if (!isDirty || saving) return;
    setSaving(true);

    const dashLayout = computeAutoArrange(enabled);

    if (isDemo) {
      // Session-only for demo — persist to sessionStorage
      sessionStorage.setItem("demo-tracker-settings", JSON.stringify({ enabled, fionaAccess, timezone }));
      sessionStorage.setItem("demo-dashboard-order", JSON.stringify({
        cardOrder: dashLayout.cardOrder,
        profileCardSize: dashLayout.profileCardSize,
        insightsCardSize: dashLayout.insightsCardSize,
      }));
    } else if (userId) {
      await supabase
        .from("user_profiles")
        .update({
          enabled_trackers: enabled,
          fiona_tracker_access: fionaAccess,
          timezone,
          dashboard_card_order: dashLayout.cardOrder,
          profile_card_size: dashLayout.profileCardSize,
          insights_card_size: dashLayout.insightsCardSize,
        })
        .eq("id", userId);
    }

    setSaving(false);
    setSaved(true);
    setOrigEnabled([...enabled]);
    setOrigFiona([...fionaAccess]);
    setOrigTz(timezone);
    setTimeout(() => setSaved(false), 2000);

    // Notify all useTrackerSettings consumers immediately (sidebar, dashboard)
    window.dispatchEvent(new CustomEvent("tracker-settings-changed", {
      detail: { enabled, fionaAccess },
    }));
    // Notify any mounted useDashboardCardOrder instances (real-time update)
    window.dispatchEvent(new CustomEvent("dashboard-order-changed", {
      detail: {
        cardOrder: dashLayout.cardOrder,
        profileCardSize: dashLayout.profileCardSize,
        insightsCardSize: dashLayout.insightsCardSize,
      },
    }));
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex gap-6 p-6 overflow-hidden">

      {/* ── LEFT: Trackers ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-4">
          <h2 className="text-white font-semibold text-sm">Trackers</h2>
          <p className="text-white/35 text-xs mt-0.5">
            Control which trackers are active and what Fiona can access.
          </p>
        </div>

        <div className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="grid grid-cols-[1fr_88px_88px] border-b border-white/[0.08] px-4 py-2.5">
            <span className="text-white/25 text-[10px] font-semibold uppercase tracking-wider">Tracker</span>
            <span className="text-white/25 text-[10px] font-semibold uppercase tracking-wider text-center">Enabled</span>
            <span className="text-white/25 text-[10px] font-semibold uppercase tracking-wider text-center">AI Access</span>
          </div>

          {TRACKERS.map((t, i) => {
            const isEnabled = enabled.includes(t.value);
            const hasFiona = fionaAccess.includes(t.value);
            const isLast = i === TRACKERS.length - 1;

            return (
              <div
                key={t.value}
                className={`grid grid-cols-[1fr_88px_88px] items-center px-4 py-3 transition-colors hover:bg-white/[0.02] ${
                  !isLast ? "border-b border-white/[0.05]" : ""
                }`}
              >
                {/* Tracker info — lock icon lives here for alwaysOn rows */}
                <div className="flex items-center gap-2.5">
                  <t.Icon size={14} className={isEnabled ? "text-white/55" : "text-white/20"} />
                  <span className={`text-sm transition-colors ${isEnabled ? "text-white/75" : "text-white/30"}`}>
                    {t.label}
                  </span>
                  {t.alwaysOn && (
                    <>
                      <span className="text-[10px] text-violet-400/70 font-medium bg-violet-500/10 px-1.5 py-0.5 rounded-full leading-none">
                        Core
                      </span>
                      <Lock size={10} className="text-white/20" />
                    </>
                  )}
                </div>

                {/* Enabled toggle — always exactly one Toggle-sized element, centered */}
                <div className="flex justify-center items-center">
                  {t.alwaysOn ? (
                    <div className="relative inline-flex w-9 h-5 rounded-full bg-white/10 cursor-not-allowed flex-shrink-0">
                      <span className="absolute top-0.5 left-0.5 translate-x-4 w-4 h-4 rounded-full bg-white/30 shadow" />
                    </div>
                  ) : (
                    <Toggle checked={isEnabled} onChange={() => toggleEnabled(t.value)} />
                  )}
                </div>

                {/* AI Access toggle — always exactly one Toggle-sized element, centered */}
                <div className="flex justify-center items-center">
                  {t.alwaysOn ? (
                    <div className="relative inline-flex w-9 h-5 rounded-full bg-white/10 cursor-not-allowed flex-shrink-0">
                      <span className="absolute top-0.5 left-0.5 translate-x-4 w-4 h-4 rounded-full bg-white/30 shadow" />
                    </div>
                  ) : (
                    <div className="relative group inline-flex items-center">
                      <Toggle
                        checked={hasFiona && isEnabled}
                        onChange={() => toggleFiona(t.value)}
                        disabled={!isEnabled}
                      />
                      {!isEnabled && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-[#1e1e2a] border border-white/10 rounded-lg text-[10px] text-white/60 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                          Enable tracker first
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* AI access info callout — fills remaining space, content centered */}
          <div className="flex-1 flex items-center border-t border-white/[0.05] bg-violet-500/[0.04] px-4 py-4">
            <div className="flex items-start gap-3">
              <Sparkles size={14} className="text-violet-400/60 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white/60 text-xs font-medium">Better Insights With AI</p>
                <p className="text-white/30 text-xs mt-0.5 leading-relaxed">
                  Your data, your rules. Enable AI access for smarter cycle insights. We only use what you allow.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end mt-3">
          <button
            onClick={handleSave}
            disabled={!isDirty || saving}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              isDirty && !saving
                ? "bg-violet-500 hover:bg-violet-400 text-white cursor-pointer"
                : "bg-white/5 text-white/25 cursor-not-allowed"
            }`}
          >
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* ── RIGHT: Appearance + Preferences ─────────────────────────── */}
      <div className="w-60 flex flex-col gap-6 flex-shrink-0">

        {/* Appearance — header uses same mb-4 as left col so cards align with tracker table */}
        <div>
          <div className="mb-4">
            <h2 className="text-white font-semibold text-sm">Appearance</h2>
            <p className="text-white/35 text-xs mt-0.5">Theme</p>
          </div>
          <div className="flex gap-3">

            {/* Glass — active */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-[88px] h-[60px] rounded-xl border-2 border-violet-500 bg-[#0d0d12] p-2 flex flex-col gap-1 cursor-pointer">
                <div className="flex gap-1 items-center">
                  <div className="w-3 h-3 rounded bg-white/10" />
                  <div className="flex-1 h-2 rounded bg-white/[0.06]" />
                </div>
                <div className="w-full h-1.5 rounded bg-white/[0.06]" />
                <div className="flex gap-1">
                  <div className="flex-1 h-4 rounded bg-white/[0.06]" />
                  <div className="flex-1 h-4 rounded bg-violet-500/20" />
                </div>
              </div>
              <span className="text-violet-400 text-[10px] font-medium">Glass ✓</span>
            </div>

            {/* Dark — coming soon */}
            <div className="flex flex-col items-center gap-1.5 opacity-40">
              <div className="relative w-[88px] h-[60px] rounded-xl border border-white/10 bg-[#080808] p-2 flex flex-col gap-1 cursor-not-allowed overflow-hidden">
                <div className="flex gap-1 items-center">
                  <div className="w-3 h-3 rounded bg-white/5" />
                  <div className="flex-1 h-2 rounded bg-white/[0.03]" />
                </div>
                <div className="w-full h-1.5 rounded bg-white/[0.03]" />
                <div className="flex gap-1">
                  <div className="flex-1 h-4 rounded bg-white/[0.03]" />
                  <div className="flex-1 h-4 rounded bg-white/[0.03]" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center rounded-xl">
                  <span className="text-[9px] text-white/50 bg-black/50 px-1.5 py-0.5 rounded-md">Soon</span>
                </div>
              </div>
              <span className="text-white/30 text-[10px]">Dark</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/[0.06]" />

        {/* Preferences */}
        <div>
          <h2 className="text-white font-semibold text-sm mb-4">Preferences</h2>
          <div className="space-y-4">

            {/* Timezone */}
            <div>
              <label className="text-white/40 text-xs mb-1.5 block">Timezone</label>
              <div className="relative">
                <select
                  value={timezone}
                  onChange={e => setTimezone(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-white/70 text-xs appearance-none cursor-pointer hover:border-white/20 focus:border-violet-500/50 focus:outline-none transition-colors pr-7"
                >
                  {TIMEZONES.map(({ value, label }) => (
                    <option key={value} value={value} className="bg-[#1e1e2a] text-white">
                      {label}
                    </option>
                  ))}
                </select>
                <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                  <path d="M5 7L1 3h8L5 7z" />
                </svg>
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="text-white/40 text-xs mb-1.5 block">Language</label>
              <div className="relative opacity-50">
                <select
                  disabled
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-white/40 text-xs appearance-none cursor-not-allowed pr-7"
                >
                  <option>English</option>
                </select>
                <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                  <path d="M5 7L1 3h8L5 7z" />
                </svg>
              </div>
              <p className="text-white/20 text-[10px] mt-1">More languages coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
