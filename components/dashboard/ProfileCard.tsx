"use client";

import { useState, useEffect, useCallback, useContext } from "react";
import { supabase } from "@/lib/supabase";
import { ViewedUserContext } from "@/lib/viewedUserContext";
import { EditProfileModal, type ProfileFields } from "./EditProfileModal";
import { cycleDay, computePhase, type Phase } from "@/lib/cycleUtils";

interface UserProfile extends ProfileFields {
  tracking_start_date: string | null;
}

const PHASE_EMOJI: Record<Phase, string> = {
  menstrual: "🩸",
  follicular: "🌱",
  ovulatory: "✨",
  luteal: "🌙",
};

const PHASE_LABEL: Record<Phase, string> = {
  menstrual: "Menstrual",
  follicular: "Follicular",
  ovulatory: "Ovulatory",
  luteal: "Luteal",
};

function computeAge(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function getInitials(name: string | null, email?: string): string {
  if (name) {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name[0].toUpperCase();
  }
  if (email) return email[0].toUpperCase();
  return "?";
}

export type ProfileCardSize = "1x2" | "1x1" | "2x1";

export function ProfileCard({ size = "1x2" }: { size?: ProfileCardSize }) {
  const viewedUserId = useContext(ViewedUserContext);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [phase, setPhase] = useState<Phase | null>(null);
  const [cycleDay_, setCycleDay] = useState<number | null>(null);

  const fetchProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const targetId = viewedUserId ?? user?.id;
    if (!targetId) { setLoading(false); return; }
    setUserId(targetId);
    setUserEmail(user?.email ?? null);

    const today = new Date().toISOString().split("T")[0];
    const [{ data: profileData }, { data: cycle }] = await Promise.all([
      supabase
        .from("user_profiles")
        .select("display_name,avatar_url,date_of_birth,pronouns,about_me,interests,app_goal,average_cycle_length,average_period_length,tracking_start_date")
        .eq("id", targetId)
        .maybeSingle(),
      supabase
        .from("cycles")
        .select("start_date,cycle_length")
        .eq("user_id", targetId)
        .lte("start_date", today)
        .order("start_date", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    setProfile(profileData ?? null);

    if (cycle) {
      const d = cycleDay(cycle.start_date);
      const cl = profileData?.average_cycle_length ?? cycle.cycle_length ?? 28;
      const pl = profileData?.average_period_length ?? 5;
      setCycleDay(d);
      setPhase(computePhase(d, pl, cl));
    }

    setLoading(false);
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const modalProfile: ProfileFields = {
    display_name: profile?.display_name ?? null,
    date_of_birth: profile?.date_of_birth ?? null,
    pronouns: profile?.pronouns ?? null,
    about_me: profile?.about_me ?? null,
    interests: profile?.interests ?? null,
    app_goal: profile?.app_goal ?? "track_health",
    average_cycle_length: profile?.average_cycle_length ?? 28,
    average_period_length: profile?.average_period_length ?? 5,
    avatar_url: profile?.avatar_url ?? null,
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] card-glass h-full flex flex-col items-center justify-center gap-3 p-5 animate-pulse">
        <div className="w-20 h-20 rounded-full bg-white/10" />
        <div className="h-4 w-28 bg-white/10 rounded" />
        <div className="h-3 w-16 bg-white/10 rounded-full" />
      </div>
    );
  }

  const name = profile?.display_name ?? userEmail?.split("@")[0] ?? "User";
  const age = computeAge(profile?.date_of_birth ?? null);
  const initials = getInitials(profile?.display_name ?? null, userEmail ?? undefined);

  const modal = showModal && userId && (
    <EditProfileModal
      profile={modalProfile}
      userId={userId}
      onClose={() => setShowModal(false)}
      onSave={updated => {
        setProfile(prev => ({ ...(prev ?? {} as UserProfile), ...updated }));
      }}
    />
  );

  return (
    <div className="h-full">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] card-glass h-full flex flex-col items-center justify-center gap-3 p-5 text-center">

        {/* Avatar */}
        <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white/10">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">{initials}</span>
            </div>
          )}
        </div>

        {/* Name · Age */}
        <div className="flex flex-col items-center gap-1">
          <p className="text-white text-[18px] font-semibold leading-tight">
            {name}{age !== null && <span className="text-white/50 font-normal"> · {age}</span>}
          </p>

          {/* Pronouns */}
          {profile?.pronouns && (
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-xs">
              {profile.pronouns}
            </span>
          )}
        </div>

        {/* Phase badge */}
        {phase && cycleDay_ !== null && (
          <span
            className="px-[10px] py-1 rounded-full text-[12px] font-medium"
            style={{ background: "rgba(139,92,246,0.18)", color: "#c084fc" }}
          >
            {PHASE_EMOJI[phase]} {PHASE_LABEL[phase]} · Day {cycleDay_}
          </span>
        )}

        {/* View profile link */}
        <button
          onClick={() => {
            // TODO: wire up to /profile page in follow-up PR
            console.log("View profile clicked");
            setShowModal(true);
          }}
          className="text-[14px] text-white/30 hover:text-white/60 transition-colors"
        >
          View profile ›
        </button>

      </div>
      {modal}
    </div>
  );
}
