"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Pencil } from "lucide-react";
import { EditProfileModal, type ProfileFields } from "./EditProfileModal";

interface UserProfile extends ProfileFields {
  tracking_start_date: string | null;
}

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

export function ProfileCard() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);
    setUserEmail(user.email ?? null);

    const { data } = await supabase
      .from("user_profiles")
      .select("display_name,avatar_url,date_of_birth,pronouns,about_me,interests,app_goal,average_cycle_length,average_period_length,tracking_start_date")
      .eq("id", user.id)
      .maybeSingle();

    setProfile(data ?? null);
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
      <div className="row-span-2 rounded-2xl border border-white/5 bg-[#1e1e2a] overflow-hidden flex flex-col h-full animate-pulse">
        <div className="h-52 bg-white/5 flex-shrink-0" />
        <div className="p-5 flex flex-col gap-4 flex-1">
          <div className="h-4 w-32 bg-white/10 rounded" />
          <div className="h-3 w-full bg-white/10 rounded" />
          <div className="h-3 w-3/4 bg-white/10 rounded" />
          <div className="flex gap-1.5 mt-1">
            <div className="h-5 w-12 bg-white/10 rounded-full" />
            <div className="h-5 w-16 bg-white/10 rounded-full" />
            <div className="h-5 w-10 bg-white/10 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  const name = profile?.display_name ?? userEmail?.split("@")[0] ?? "User";
  const age = computeAge(profile?.date_of_birth ?? null);
  const initials = getInitials(profile?.display_name ?? null, userEmail ?? undefined);
  const isEmpty = !profile?.about_me && !profile?.interests?.length;

  return (
    <div className="row-span-2 h-full">
      <div className="rounded-2xl border border-white/5 bg-[#1e1e2a] overflow-hidden flex flex-col h-full relative">
        {/* Edit button */}
        <button
          onClick={() => setShowModal(true)}
          className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm hover:bg-white/20 flex items-center justify-center transition-colors"
          aria-label="Edit profile"
        >
          <Pencil size={12} className="text-white/80" />
        </button>

        {/* Image / initials section */}
        <div className="relative h-52 flex-shrink-0">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-rose-900/60 to-purple-900/60 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
                <span className="text-white text-2xl font-bold">{initials}</span>
              </div>
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1e1e2a] via-[#1e1e2a]/20 to-transparent pointer-events-none" />
          {/* Name + pronouns overlay */}
          <div className="absolute bottom-0 left-0 p-4">
            <div className="flex items-baseline gap-2">
              <h2 className="text-white text-lg font-bold leading-tight">{name}</h2>
              {age !== null && (
                <span className="text-gray-300 text-sm">· {age}</span>
              )}
            </div>
            {profile?.pronouns && (
              <span className="mt-1.5 inline-block px-2 py-0.5 rounded-full bg-white/15 text-white/80 text-xs">
                {profile.pronouns}
              </span>
            )}
          </div>
        </div>

        {/* Content section */}
        <div className="flex-1 p-5 flex flex-col gap-3 overflow-hidden min-h-0">
          {profile?.about_me && (
            <div>
              <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1.5">About</p>
              <p className="text-gray-300 text-xs leading-relaxed">{profile.about_me}</p>
            </div>
          )}

          {profile?.interests && profile.interests.length > 0 && (
            <div>
              <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2">Interests</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.interests.map((interest, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/5 text-gray-300 text-xs"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {isEmpty && (
            <button
              onClick={() => setShowModal(true)}
              className="w-full py-2.5 rounded-xl border border-dashed border-white/10 hover:border-white/20 text-gray-500 hover:text-gray-400 text-xs transition-colors"
            >
              + Complete your profile
            </button>
          )}

        </div>
      </div>

      {showModal && userId && (
        <EditProfileModal
          profile={modalProfile}
          userId={userId}
          onClose={() => setShowModal(false)}
          onSave={updated => {
            setProfile(prev => ({ ...(prev ?? {} as UserProfile), ...updated }));
          }}
        />
      )}
    </div>
  );
}
