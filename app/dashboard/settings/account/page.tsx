"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, LogOut, Trash2, AlertTriangle, Users, ShieldOff } from "lucide-react";

const inputCls =
  "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-white/80 text-sm focus:outline-none focus:border-violet-500/50 transition-colors placeholder:text-white/20";

export default function AccountSettingsPage() {
  const [email, setEmail]         = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [loading, setLoading]     = useState(true);

  // Change password
  const [newPassword, setNewPassword]       = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew]               = useState(false);
  const [showConfirm, setShowConfirm]       = useState(false);
  const [pwSaving, setPwSaving]             = useState(false);
  const [pwError, setPwError]               = useState("");
  const [pwSaved, setPwSaved]               = useState(false);

  // Partner access toggle
  const [partnerEnabled, setPartnerEnabled]     = useState(true);
  const [partnerToggling, setPartnerToggling]   = useState(false);
  const [userId, setUserId]                     = useState<string | null>(null);

  // Invite partner
  const [inviteEmail, setInviteEmail]         = useState("");
  const [inviteSending, setInviteSending]     = useState(false);
  const [newPasscode, setNewPasscode]         = useState<string | null>(null);
  const [newPasscodeEmail, setNewPasscodeEmail] = useState("");
  const [inviteError, setInviteError]         = useState("");
  const [pendingPartners, setPendingPartners]     = useState<{ email: string; created_at: string }[]>([]);
  const [connectedPartners, setConnectedPartners] = useState<{ email: string; used_at: string }[]>([]);
  const [copiedPasscode, setCopiedPasscode]       = useState(false);

  // Danger zone
  const [deleteInput, setDeleteInput]             = useState("");
  const [deleting, setDeleting]                   = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        setEmail(session.user.email ?? "");
        setCreatedAt(
          new Date(session.user.created_at).toLocaleDateString("en-US", {
            year: "numeric", month: "long", day: "numeric",
          })
        );
        setUserId(session.user.id);
        const [{ data: profileData }, { data: pendingData }, { data: connectedData }] = await Promise.all([
          supabase.from("user_profiles").select("partner_enabled").eq("id", session.user.id).single(),
          supabase.from("partner_invites").select("email, created_at")
            .eq("inviter_id", session.user.id).is("used_at", null)
            .order("created_at", { ascending: false }),
          supabase.from("partner_invites").select("email, used_at")
            .eq("inviter_id", session.user.id).not("used_at", "is", null)
            .order("used_at", { ascending: false }),
        ]);
        if (profileData) setPartnerEnabled(profileData.partner_enabled ?? true);
        if (pendingData) setPendingPartners(pendingData);
        if (connectedData) setConnectedPartners(connectedData);
      }
      setLoading(false);
    });
  }, []);

  async function handleChangePassword() {
    setPwError("");
    if (newPassword.length < 8) {
      setPwError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Passwords don't match.");
      return;
    }
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPwError(error.message);
    } else {
      setNewPassword("");
      setConfirmPassword("");
      setPwSaved(true);
      setTimeout(() => setPwSaved(false), 3000);
    }
    setPwSaving(false);
  }

  async function handleTogglePartner() {
    if (!userId || partnerToggling) return;
    setPartnerToggling(true);
    const next = !partnerEnabled;
    await supabase.from("user_profiles").update({ partner_enabled: next }).eq("id", userId);
    setPartnerEnabled(next);
    setPartnerToggling(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  async function handleSendInvite() {
    setInviteError("");
    if (!inviteEmail.trim()) return;
    setInviteSending(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setInviteSending(false); return; }
    try {
      const res = await fetch("/api/partner/invite/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        const addedEmail = inviteEmail.trim().toLowerCase();
        setPendingPartners(prev => [{ email: addedEmail, created_at: new Date().toISOString() }, ...prev]);
        setNewPasscode(data.passcode);
        setNewPasscodeEmail(addedEmail);
        setInviteEmail("");
      } else {
        setInviteError(data.error || "Failed to add partner.");
      }
    } catch {
      setInviteError("Something went wrong. Please try again.");
    }
    setInviteSending(false);
  }

  async function handleRemovePartner(email: string) {
    if (!userId) return;
    await supabase.from("partner_invites")
      .update({ used_at: new Date().toISOString() })
      .eq("inviter_id", userId)
      .eq("email", email)
      .is("used_at", null);
    setPendingPartners(prev => prev.filter(p => p.email !== email));
  }

  async function handleDeleteAccount() {
    if (deleteInput !== "DELETE") return;
    setDeleting(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setDeleting(false); return; }
    await fetch("/api/account/delete", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    await supabase.auth.signOut();
    window.location.href = "/";
  }

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
          <h2 className="text-white font-semibold text-sm">Account</h2>
          <p className="text-white/35 text-xs mt-0.5">Email, password, and account management.</p>
        </div>

        {/* Account Info */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 space-y-4">
          <p className="text-white/25 text-[10px] font-semibold uppercase tracking-wider">Account Info</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-white/40 text-xs mb-1.5 block">Email Address</label>
              <div className="w-full bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2 text-white/40 text-sm truncate">
                {email}
              </div>
              <p className="text-white/20 text-[10px] mt-1">Email changes not supported yet</p>
            </div>
            <div>
              <label className="text-white/40 text-xs mb-1.5 block">Member Since</label>
              <div className="w-full bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2 text-white/40 text-sm">
                {createdAt}
              </div>
            </div>
          </div>
        </div>

        {/* Partner Access Toggle */}
        <div className={`border rounded-xl p-5 transition-colors duration-300 ${
          partnerEnabled
            ? "bg-white/[0.03] border-white/[0.08]"
            : "bg-rose-500/[0.04] border-rose-500/20"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 p-1.5 rounded-lg transition-colors ${partnerEnabled ? "bg-violet-500/10" : "bg-rose-500/10"}`}>
                {partnerEnabled
                  ? <Users size={13} className="text-violet-400" />
                  : <ShieldOff size={13} className="text-rose-400" />
                }
              </div>
              <div>
                <p className="text-white/70 text-sm font-medium">Partner Access</p>
                <p className="text-white/35 text-xs mt-0.5 leading-relaxed">
                  {partnerEnabled
                    ? "Your partner account can view your dashboard and insights."
                    : "Disabled — your partner will see a blank screen with a notice."
                  }
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleTogglePartner}
              disabled={partnerToggling}
              className={`relative inline-flex w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ml-4 ${
                partnerToggling ? "opacity-50 cursor-wait" : "cursor-pointer"
              } ${partnerEnabled ? "bg-violet-500" : "bg-white/10"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                partnerEnabled ? "translate-x-4" : "translate-x-0"
              }`} />
            </button>
          </div>
        </div>

        {/* Invite a Partner */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Users size={13} className="text-violet-400/80" />
            <p className="text-white/25 text-[10px] font-semibold uppercase tracking-wider">Invite a Partner</p>
          </div>
          <p className="text-white/40 text-xs leading-relaxed">
            Add your partner&apos;s email. When they sign up or log in with that address, they&apos;ll skip onboarding and go straight to your partner view.
          </p>

          {newPasscode ? (
            <div className="space-y-3">
              <div className="bg-violet-500/[0.06] border border-violet-500/20 rounded-xl p-4 space-y-3">
                <p className="text-white/50 text-xs">
                  Share this code with <span className="text-white/70">{newPasscodeEmail}</span> — they&apos;ll enter it when joining as a partner.
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-black/30 border border-white/[0.08] rounded-lg px-4 py-2.5 text-center">
                    <span className="text-white font-mono text-xl tracking-[0.3em] font-semibold select-all">
                      {newPasscode}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(newPasscode).then(() => {
                        setCopiedPasscode(true);
                        setTimeout(() => setCopiedPasscode(false), 2000);
                      });
                    }}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs hover:bg-violet-500/30 transition-colors"
                  >
                    {copiedPasscode ? "Copied ✓" : "Copy"}
                  </button>
                </div>
                <p className="text-white/25 text-[10px]">This code is shown once. Store it somewhere safe.</p>
              </div>
              <button
                onClick={() => { setNewPasscode(null); setNewPasscodeEmail(""); }}
                className="text-white/30 text-xs hover:text-white/50 transition-colors"
              >
                Add another partner
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSendInvite()}
                  className={inputCls + " flex-1"}
                  placeholder="partner@email.com"
                />
                <button
                  onClick={handleSendInvite}
                  disabled={!inviteEmail.trim() || inviteSending}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    inviteEmail.trim() && !inviteSending
                      ? "bg-violet-500 hover:bg-violet-400 text-white cursor-pointer"
                      : "bg-white/5 text-white/25 cursor-not-allowed"
                  }`}
                >
                  {inviteSending ? "Adding…" : "Add Partner"}
                </button>
              </div>
              {inviteError && <p className="text-rose-400 text-xs">{inviteError}</p>}
            </div>
          )}

          {/* Connected partners */}
          {connectedPartners.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <p className="text-white/25 text-[10px] font-semibold uppercase tracking-wider">Connected</p>
              {connectedPartners.map(p => (
                <div key={p.email} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-emerald-500/[0.05] border border-emerald-500/20">
                  <div className="min-w-0 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-white/70 text-xs truncate">{p.email}</p>
                      <p className="text-white/25 text-[10px] mt-0.5">
                        Joined {new Date(p.used_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <span className="flex-shrink-0 text-emerald-400 text-[10px] font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Pending partners list */}
          {pendingPartners.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <p className="text-white/25 text-[10px] font-semibold uppercase tracking-wider">Pending</p>
              {pendingPartners.map(p => (
                <div key={p.email} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <div className="min-w-0 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-white/60 text-xs truncate">{p.email}</p>
                      <p className="text-white/25 text-[10px] mt-0.5">
                        Added {new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemovePartner(p.email)}
                    className="flex-shrink-0 text-white/20 hover:text-rose-400 transition-colors p-1"
                    title="Remove"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                      <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Change Password */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 space-y-4">
          <p className="text-white/25 text-[10px] font-semibold uppercase tracking-wider">Change Password</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-white/40 text-xs mb-1.5 block">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className={inputCls + " pr-9"}
                  placeholder="Min. 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-white/40 text-xs mb-1.5 block">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className={inputCls + " pr-9"}
                  placeholder="Repeat new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>
          {pwError && <p className="text-rose-400 text-xs">{pwError}</p>}
          <div className="flex items-center justify-between">
            {pwSaved
              ? <p className="text-emerald-400 text-xs">Password updated successfully.</p>
              : <div />
            }
            <button
              onClick={handleChangePassword}
              disabled={!newPassword || !confirmPassword || pwSaving}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                newPassword && confirmPassword && !pwSaving
                  ? "bg-violet-500 hover:bg-violet-400 text-white cursor-pointer"
                  : "bg-white/5 text-white/25 cursor-not-allowed"
              }`}
            >
              {pwSaving ? "Updating…" : "Update Password"}
            </button>
          </div>
        </div>

        {/* Session */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
          <p className="text-white/25 text-[10px] font-semibold uppercase tracking-wider mb-4">Session</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Sign out of SyncCycle</p>
              <p className="text-white/30 text-xs mt-0.5">You will be redirected to the sign-in page.</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/60 text-sm hover:bg-white/[0.07] hover:text-white/80 transition-colors"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-rose-500/[0.04] border border-rose-500/20 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={13} className="text-rose-400/80" />
            <p className="text-rose-400/80 text-[10px] font-semibold uppercase tracking-wider">Danger Zone</p>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-white/70 text-sm">Delete Account</p>
              <p className="text-white/30 text-xs mt-0.5 leading-relaxed">
                Permanently delete your account and all associated data. This cannot be undone.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(v => !v)}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm hover:bg-rose-500/20 transition-colors"
            >
              <Trash2 size={13} />
              Delete
            </button>
          </div>

          {showDeleteConfirm && (
            <div className="pt-3 border-t border-rose-500/10 space-y-3">
              <p className="text-white/50 text-xs">
                Type <span className="font-mono text-white/70 bg-white/5 px-1.5 py-0.5 rounded">DELETE</span> to confirm.
              </p>
              <div className="flex gap-3">
                <input
                  value={deleteInput}
                  onChange={e => setDeleteInput(e.target.value)}
                  className="flex-1 bg-white/[0.04] border border-rose-500/20 rounded-lg px-3 py-2 text-white/80 text-sm focus:outline-none focus:border-rose-500/50 transition-colors font-mono placeholder:text-white/20"
                  placeholder="DELETE"
                />
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteInput !== "DELETE" || deleting}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    deleteInput === "DELETE" && !deleting
                      ? "bg-rose-500 hover:bg-rose-400 text-white cursor-pointer"
                      : "bg-white/5 text-white/25 cursor-not-allowed"
                  }`}
                >
                  {deleting ? "Deleting…" : "Confirm Delete"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="pb-6" />
      </div>
    </div>
  );
}
