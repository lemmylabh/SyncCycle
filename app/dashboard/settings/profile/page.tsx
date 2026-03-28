"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Camera } from "lucide-react";

const GOAL_OPTIONS = [
  { value: "track_health",     label: "Track Health" },
  { value: "avoid_pregnancy",  label: "Avoid Pregnancy" },
  { value: "conceive",         label: "Conceive" },
  { value: "manage_symptoms",  label: "Manage Symptoms" },
];

const inputCls =
  "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-white/80 text-sm focus:outline-none focus:border-violet-500/50 transition-colors placeholder:text-white/20";

export default function ProfileSettingsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    display_name:          "",
    pronouns:              "",
    date_of_birth:         "",
    about_me:              "",
    interests:             "",
    app_goal:              "track_health",
    average_cycle_length:  28,
    average_period_length: 5,
    avatar_url:            "",
  });
  const [orig, setOrig] = useState({ ...form });

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setLoading(false); return; }
      setUserId(session.user.id);

      const { data } = await supabase
        .from("user_profiles")
        .select("display_name,pronouns,date_of_birth,about_me,interests,app_goal,average_cycle_length,average_period_length,avatar_url")
        .eq("id", session.user.id)
        .single();

      if (data) {
        const parsed = {
          display_name:          data.display_name          ?? "",
          pronouns:              data.pronouns              ?? "",
          date_of_birth:         data.date_of_birth         ?? "",
          about_me:              data.about_me              ?? "",
          interests:             (data.interests ?? []).join(", "),
          app_goal:              data.app_goal              ?? "track_health",
          average_cycle_length:  data.average_cycle_length  ?? 28,
          average_period_length: data.average_period_length ?? 5,
          avatar_url:            data.avatar_url            ?? "",
        };
        setForm(parsed);
        setOrig(parsed);
      }
      setLoading(false);
    });
  }, []);

  const isDirty = JSON.stringify(form) !== JSON.stringify(orig);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setUploading(true);
    const ext  = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/avatar.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      setForm(f => ({ ...f, avatar_url: publicUrl }));
    }
    setUploading(false);
  }

  async function handleSave() {
    if (!isDirty || saving || !userId) return;
    setSaving(true);
    await supabase.from("user_profiles").update({
      display_name:          form.display_name          || null,
      pronouns:              form.pronouns              || null,
      date_of_birth:         form.date_of_birth         || null,
      about_me:              form.about_me              || null,
      interests:             form.interests
        ? form.interests.split(",").map(s => s.trim()).filter(Boolean)
        : [],
      app_goal:              form.app_goal,
      average_cycle_length:  form.average_cycle_length,
      average_period_length: form.average_period_length,
      avatar_url:            form.avatar_url            || null,
    }).eq("id", userId);
    setOrig({ ...form });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const initials = (form.display_name || "?").charAt(0).toUpperCase();

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 lg:p-6 space-y-5 lg:space-y-6 max-w-2xl">

        {/* Header */}
        <div>
          <h2 className="text-white font-semibold text-sm">Profile</h2>
          <p className="text-white/35 text-xs mt-0.5">Manage your display name, avatar, and personal details.</p>
        </div>

        {/* Avatar */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
          <p className="text-white/25 text-[10px] font-semibold uppercase tracking-wider mb-4">Photo</p>
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              {form.avatar_url ? (
                <img
                  src={form.avatar_url}
                  alt="Avatar"
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-white/10"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white text-xl font-bold">{initials}</span>
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-violet-500 hover:bg-violet-400 flex items-center justify-center transition-colors disabled:opacity-50"
                aria-label="Change photo"
              >
                <Camera size={11} className="text-white" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <div>
              <p className="text-white/60 text-sm font-medium">{form.display_name || "No name set"}</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-violet-400 text-xs hover:text-violet-300 transition-colors mt-0.5 disabled:opacity-50"
              >
                {uploading ? "Uploading…" : "Change photo"}
              </button>
            </div>
          </div>
        </div>

        {/* Personal */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 space-y-4">
          <p className="text-white/25 text-[10px] font-semibold uppercase tracking-wider">Personal</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-white/40 text-xs mb-1.5 block">Display Name</label>
              <input
                value={form.display_name}
                onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
                className={inputCls}
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="text-white/40 text-xs mb-1.5 block">Pronouns</label>
              <input
                value={form.pronouns}
                onChange={e => setForm(f => ({ ...f, pronouns: e.target.value }))}
                className={inputCls}
                placeholder="she/her"
              />
            </div>
          </div>
          <div>
            <label className="text-white/40 text-xs mb-1.5 block">Date of Birth</label>
            <input
              type="date"
              value={form.date_of_birth}
              onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))}
              className={inputCls + " [color-scheme:dark]"}
            />
          </div>
        </div>

        {/* About */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 space-y-4">
          <p className="text-white/25 text-[10px] font-semibold uppercase tracking-wider">About</p>
          <div>
            <label className="text-white/40 text-xs mb-1.5 block">
              About Me{" "}
              <span className="text-white/20 normal-case font-normal">(max 200 chars)</span>
            </label>
            <textarea
              value={form.about_me}
              onChange={e => setForm(f => ({ ...f, about_me: e.target.value.slice(0, 200) }))}
              rows={3}
              className={inputCls + " resize-none"}
              placeholder="Morning runner, tea lover…"
            />
            <p className="text-white/20 text-[10px] mt-1 text-right">{form.about_me.length}/200</p>
          </div>
          <div>
            <label className="text-white/40 text-xs mb-1.5 block">
              Interests{" "}
              <span className="text-white/20 normal-case font-normal">(comma-separated)</span>
            </label>
            <input
              value={form.interests}
              onChange={e => setForm(f => ({ ...f, interests: e.target.value }))}
              className={inputCls}
              placeholder="Yoga, Hiking, Journaling"
            />
          </div>
        </div>

        {/* Cycle */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 space-y-4">
          <p className="text-white/25 text-[10px] font-semibold uppercase tracking-wider">Cycle</p>
          <div>
            <label className="text-white/40 text-xs mb-1.5 block">App Goal</label>
            <div className="relative">
              <select
                value={form.app_goal}
                onChange={e => setForm(f => ({ ...f, app_goal: e.target.value }))}
                className={inputCls + " appearance-none pr-7 cursor-pointer"}
              >
                {GOAL_OPTIONS.map(o => (
                  <option key={o.value} value={o.value} className="bg-[#1e1e2a]">{o.label}</option>
                ))}
              </select>
              <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                <path d="M5 7L1 3h8L5 7z" />
              </svg>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-white/40 text-xs mb-1.5 block">
                Avg Cycle Length <span className="text-white/20">(days)</span>
              </label>
              <input
                type="number"
                min={21}
                max={45}
                value={form.average_cycle_length}
                onChange={e => setForm(f => ({ ...f, average_cycle_length: Number(e.target.value) }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-white/40 text-xs mb-1.5 block">
                Avg Period Length <span className="text-white/20">(days)</span>
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={form.average_period_length}
                onChange={e => setForm(f => ({ ...f, average_period_length: Number(e.target.value) }))}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end pb-6">
          <button
            onClick={handleSave}
            disabled={!isDirty || saving}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              isDirty && !saving
                ? "bg-violet-500 hover:bg-violet-400 text-white cursor-pointer"
                : "bg-white/5 text-white/25 cursor-not-allowed"
            }`}
          >
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save Changes"}
          </button>
        </div>

      </div>
    </div>
  );
}
