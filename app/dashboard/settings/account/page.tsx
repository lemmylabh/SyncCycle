"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, LogOut, Trash2, AlertTriangle } from "lucide-react";

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

  // Danger zone
  const [deleteInput, setDeleteInput]             = useState("");
  const [deleting, setDeleting]                   = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setEmail(session.user.email ?? "");
        setCreatedAt(
          new Date(session.user.created_at).toLocaleDateString("en-US", {
            year: "numeric", month: "long", day: "numeric",
          })
        );
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

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
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
