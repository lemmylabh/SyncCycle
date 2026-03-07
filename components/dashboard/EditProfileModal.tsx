"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { X, Camera } from "lucide-react";

export interface ProfileFields {
  display_name: string | null;
  date_of_birth: string | null;
  pronouns: string | null;
  about_me: string | null;
  interests: string[] | null;
  app_goal: string | null;
  average_cycle_length: number | null;
  average_period_length: number | null;
  avatar_url: string | null;
}

interface EditProfileModalProps {
  profile: ProfileFields;
  userId: string;
  onClose: () => void;
  onSave: (updated: Partial<ProfileFields>) => void;
}

const GOAL_OPTIONS = [
  { value: "track_health", label: "Track Health" },
  { value: "avoid_pregnancy", label: "Avoid Pregnancy" },
  { value: "conceive", label: "Conceive" },
  { value: "manage_symptoms", label: "Manage Symptoms" },
];

const inputClass =
  "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-rose-500/50 transition-colors";

export function EditProfileModal({ profile, userId, onClose, onSave }: EditProfileModalProps) {
  const [form, setForm] = useState({
    display_name: profile.display_name ?? "",
    date_of_birth: profile.date_of_birth ?? "",
    pronouns: profile.pronouns ?? "",
    about_me: profile.about_me ?? "",
    interests: (profile.interests ?? []).join(", "),
    app_goal: profile.app_goal ?? "track_health",
    average_cycle_length: profile.average_cycle_length ?? 28,
    average_period_length: profile.average_period_length ?? 5,
    avatar_url: profile.avatar_url ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/avatar.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      setForm(f => ({ ...f, avatar_url: publicUrl }));
    }
    setUploading(false);
  }

  async function handleSave() {
    setSaving(true);
    const updates: Partial<ProfileFields> = {
      display_name: form.display_name || null,
      date_of_birth: form.date_of_birth || null,
      pronouns: form.pronouns || null,
      about_me: form.about_me || null,
      interests: form.interests
        ? form.interests.split(",").map(s => s.trim()).filter(Boolean)
        : [],
      app_goal: form.app_goal,
      average_cycle_length: form.average_cycle_length,
      average_period_length: form.average_period_length,
      avatar_url: form.avatar_url || null,
    };
    await supabase.from("user_profiles").update(updates).eq("id", userId);
    onSave(updates);
    setSaving(false);
    onClose();
  }

  const initials = (form.display_name || "?").charAt(0).toUpperCase();

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#1e1e2a] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-white font-semibold text-lg">Edit Profile</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              {form.avatar_url ? (
                <img
                  src={form.avatar_url}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full object-cover ring-2 ring-white/10"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">{initials}</span>
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-rose-500 hover:bg-rose-600 flex items-center justify-center transition-colors disabled:opacity-50"
                aria-label="Change photo"
              >
                <Camera size={13} className="text-white" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            {uploading && <p className="text-gray-500 text-xs">Uploading…</p>}
          </div>

          {/* Personal */}
          <div className="space-y-3">
            <p className="text-gray-500 text-[10px] uppercase tracking-widest">Personal</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 text-xs mb-1.5">Display Name</label>
                <input
                  value={form.display_name}
                  onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
                  className={inputClass}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1.5">Pronouns</label>
                <input
                  value={form.pronouns}
                  onChange={e => setForm(f => ({ ...f, pronouns: e.target.value }))}
                  className={inputClass}
                  placeholder="she/her"
                />
              </div>
            </div>
            <div>
              <label className="block text-gray-400 text-xs mb-1.5">Date of Birth</label>
              <input
                type="date"
                value={form.date_of_birth}
                onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))}
                className={inputClass + " [color-scheme:dark]"}
              />
            </div>
          </div>

          {/* About */}
          <div className="space-y-3">
            <p className="text-gray-500 text-[10px] uppercase tracking-widest">About</p>
            <div>
              <label className="block text-gray-400 text-xs mb-1.5">
                About Me{" "}
                <span className="text-gray-600 normal-case font-normal">(max 200 chars)</span>
              </label>
              <textarea
                value={form.about_me}
                onChange={e => setForm(f => ({ ...f, about_me: e.target.value.slice(0, 200) }))}
                rows={3}
                className={inputClass + " resize-none"}
                placeholder="Morning runner, tea lover…"
              />
              <p className="text-gray-600 text-xs mt-1 text-right">{form.about_me.length}/200</p>
            </div>
            <div>
              <label className="block text-gray-400 text-xs mb-1.5">
                Interests{" "}
                <span className="text-gray-600 normal-case font-normal">(comma-separated)</span>
              </label>
              <input
                value={form.interests}
                onChange={e => setForm(f => ({ ...f, interests: e.target.value }))}
                className={inputClass}
                placeholder="Yoga, Hiking, Journaling"
              />
            </div>
          </div>

          {/* Cycle Settings */}
          <div className="space-y-3">
            <p className="text-gray-500 text-[10px] uppercase tracking-widest">Cycle Settings</p>
            <div>
              <label className="block text-gray-400 text-xs mb-1.5">App Goal</label>
              <select
                value={form.app_goal}
                onChange={e => setForm(f => ({ ...f, app_goal: e.target.value }))}
                className={inputClass}
              >
                {GOAL_OPTIONS.map(o => (
                  <option key={o.value} value={o.value} className="bg-[#1e1e2a]">
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 text-xs mb-1.5">Avg Cycle Length</label>
                <input
                  type="number"
                  min={21}
                  max={45}
                  value={form.average_cycle_length}
                  onChange={e => setForm(f => ({ ...f, average_cycle_length: Number(e.target.value) }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1.5">Avg Period Length</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={form.average_period_length}
                  onChange={e => setForm(f => ({ ...f, average_period_length: Number(e.target.value) }))}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-white/5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
