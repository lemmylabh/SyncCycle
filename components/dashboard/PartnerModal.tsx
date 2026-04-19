"use client";

import React, { useEffect, useState, useContext } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X, ShieldOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ViewedUserContext } from "@/lib/viewedUserContext";
import { ProfileCard } from "@/components/dashboard/ProfileCard";
import { CyclePhaseCard } from "@/components/dashboard/CyclePhaseCard";
import { Vibe } from "@/components/dashboard/Vibe";
import { SymptomHeatmap } from "@/components/dashboard/SymptomHeatmap";
import { FitnessCard } from "@/components/dashboard/FitnessCard";
import { SleepCard } from "@/components/dashboard/SleepCard";
import { InsightsFeed } from "@/components/insights/InsightsFeed";

const GAP = 16;
const MODAL_MARGIN = 24; // p-6 outer wrapper (each side)
const MODAL_HEADER = 64;
const CONTENT_PAD = 32; // p-4 content area (both sides)
const ALL_PARTNER_CARDS = ["period", "symptoms", "sleep", "fitness"];
const TRACKER_GATED = new Set(["symptoms", "fitness", "sleep", "mood"]);

function useModalCellSize() {
  const [cellSize, setCellSize] = useState(200);
  useEffect(() => {
    function update() {
      // Total horizontal chrome: modal margins + content padding + 4 gaps between 5 cols
      const byWidth = Math.floor(
        (window.innerWidth - MODAL_MARGIN * 2 - CONTENT_PAD - GAP * 4) / 5
      );
      // Total vertical chrome: modal margins + header + content padding + 1 gap between 2 rows
      const byHeight = Math.floor(
        (window.innerHeight - MODAL_MARGIN * 2 - MODAL_HEADER - CONTENT_PAD - GAP) / 2
      );
      setCellSize(Math.max(Math.min(byWidth, byHeight), 120));
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return cellSize;
}

function useViewedEnabledTrackers(): { enabled: Set<string>; loading: boolean } {
  const viewedUserId = useContext(ViewedUserContext);
  const [enabled, setEnabled] = useState<Set<string>>(new Set(["period", "symptoms", "fitness", "sleep", "mood"]));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!viewedUserId) { setLoading(false); return; }
    supabase
      .from("user_profiles")
      .select("enabled_trackers")
      .eq("id", viewedUserId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.enabled_trackers?.length) setEnabled(new Set(data.enabled_trackers));
        setLoading(false);
      });
  }, [viewedUserId]);

  return { enabled, loading };
}

function renderCard(key: string): React.ReactNode {
  switch (key) {
    case "period":   return <CyclePhaseCard />;
    case "mood":     return <Vibe />;
    case "symptoms": return <SymptomHeatmap />;
    case "fitness":  return <FitnessCard />;
    case "sleep":    return <SleepCard />;
    default:         return null;
  }
}

function PartnerContent() {
  const cellSize = useModalCellSize();
  const { enabled } = useViewedEnabledTrackers();

  const orderedCards = ALL_PARTNER_CARDS.filter(k => !TRACKER_GATED.has(k) || enabled.has(k));
  const leftPanelW = 3 * cellSize + 2 * GAP;
  const rightPanelW = 2 * cellSize + GAP;
  const gridH = 2 * cellSize + GAP;

  return (
    <>
      {/* Mobile stacked */}
      <div className="lg:hidden overflow-y-auto flex-1 min-h-0">
        <div className="p-4 grid grid-cols-1 gap-4" style={{ gridAutoRows: "280px" }}>
          <ProfileCard size="1x1" />
          <Vibe />
          {orderedCards.map(k => (
            <React.Fragment key={k}>{renderCard(k)}</React.Fragment>
          ))}
        </div>
        <div className="p-4">
          <InsightsFeed />
        </div>
      </div>

      {/* Desktop 5-col layout */}
      <div className="hidden lg:flex items-center justify-center p-4 flex-1 min-h-0 overflow-hidden">
        <div className="flex gap-4" style={{ height: gridH }}>
          <div
            className="grid gap-4 flex-shrink-0"
            style={{
              width: leftPanelW,
              height: gridH,
              gridTemplateColumns: `repeat(3, ${cellSize}px)`,
              gridTemplateRows: `repeat(2, ${cellSize}px)`,
              gridAutoFlow: "row dense",
            }}
          >
            <ProfileCard size="1x1" />
            <div className="h-full overflow-hidden"><Vibe /></div>
            {orderedCards.map(k => (
              <div key={k} className="h-full overflow-hidden">{renderCard(k)}</div>
            ))}
          </div>
          <div
            className="flex-shrink-0 overflow-y-auto rounded-2xl"
            style={{ width: rightPanelW, height: gridH }}
          >
            <InsightsFeed compact />
          </div>
        </div>
      </div>
    </>
  );
}

interface PartnerModalProps {
  onClose: () => void;
}

export function PartnerModal({ onClose }: PartnerModalProps) {
  const [linkedToId, setLinkedToId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userInitials, setUserInitials] = useState("P");
  const [partnerEnabled, setPartnerEnabled] = useState(true);
  const [ready, setReady] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setReady(true); return; }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("role, avatar_url, display_name, linked_to")
        .eq("id", session.user.id)
        .single();

      if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
      if (profile?.role === "partner" && profile.linked_to) {
        setLinkedToId(profile.linked_to as string);
      } else {
        // Primary user previewing — fetch their own partner_enabled flag
        setLinkedToId(session.user.id);
        const { data: ownProfile } = await supabase
          .from("user_profiles")
          .select("partner_enabled")
          .eq("id", session.user.id)
          .single();
        if (ownProfile?.partner_enabled === false) setPartnerEnabled(false);
      }

      const name = (profile?.display_name as string) || (session.user.user_metadata?.full_name as string) || session.user.email || "";
      const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
      setUserInitials(initials || "P");
      setReady(true);
    });
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  if (!mounted) return null;

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full h-full rounded-2xl bg-[var(--page-bg)] border border-violet-500/30 shadow-[0_0_0_1px_rgba(139,92,246,0.15),0_0_40px_rgba(139,92,246,0.18),0_0_80px_rgba(139,92,246,0.08),0_24px_80px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-6 flex-shrink-0 border-b border-white/[0.06]" style={{ height: MODAL_HEADER }}>
          <div className="flex items-center gap-3">
            <Image src="/logo-dark.png" alt="SyncCycle" width={28} height={28} className="rounded-lg" />
            <span className="text-white font-semibold text-sm hidden sm:block">SyncCycle</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 font-medium">
              Partner View
            </span>
          </div>

          <p className="hidden lg:block text-white/35 text-lg font-light italic">
            Her world, shared with you.
          </p>

          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-rose-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="avatar" width={28} height={28} className="object-cover w-full h-full" />
              ) : userInitials}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Close partner view"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Content */}
        {!ready ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
          </div>
        ) : !partnerEnabled ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <ShieldOff size={24} className="text-rose-400" />
            </div>
            <div className="space-y-2 max-w-sm">
              <p className="text-white font-semibold text-base">Partner Access is Disabled</p>
              <p className="text-white/40 text-sm leading-relaxed">
                Your partner cannot view your dashboard while this is off. Re-enable it in{" "}
                <a href="/dashboard/settings/account" className="text-violet-400 hover:text-violet-300 underline underline-offset-2" onClick={onClose}>
                  Settings → Account
                </a>.
              </p>
            </div>
          </div>
        ) : (
          <ViewedUserContext.Provider value={linkedToId}>
            <PartnerContent />
          </ViewedUserContext.Provider>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
