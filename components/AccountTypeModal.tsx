"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Users, User, KeyRound } from "lucide-react";

interface Props {
  accessToken: string;
  onMainAccount: () => void;
}

export function AccountTypeModal({ accessToken, onMainAccount }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<"type" | "passcode">("type");
  const [passcode, setPasscode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleActivate() {
    if (!passcode.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/partner/invite/accept-passcode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ passcode: passcode.trim() }),
      });
      const data = await res.json();
      if (data.activated) {
        router.replace("/partner");
      } else {
        setError("Invalid code — check with your partner or try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const modal = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-6">
      <div className="w-full max-w-sm bg-[#0d0d12] border border-white/[0.08] rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.8)] overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-5 border-b border-white/[0.06]">
          {step === "passcode" && (
            <button
              onClick={() => { setStep("type"); setError(""); setPasscode(""); }}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors -ml-1"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <Image src="/logo-dark.png" alt="SyncCycle" width={24} height={24} className="rounded-md" />
          <span className="text-white font-semibold text-sm">SyncCycle</span>
        </div>

        {/* Step 1 — account type */}
        {step === "type" && (
          <div className="p-6 space-y-5">
            <div>
              <h2 className="text-white font-semibold text-base">Welcome to SyncCycle</h2>
              <p className="text-white/40 text-sm mt-1">What type of account are you setting up?</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={onMainAccount}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-violet-500/30 transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-500/25 transition-colors">
                  <User size={16} className="text-violet-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">My own account</p>
                  <p className="text-white/35 text-xs mt-0.5">Track your cycle and get personalized insights</p>
                </div>
              </button>

              <button
                onClick={() => setStep("passcode")}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-rose-500/30 transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-xl bg-rose-500/15 flex items-center justify-center flex-shrink-0 group-hover:bg-rose-500/25 transition-colors">
                  <Users size={16} className="text-rose-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Partner account</p>
                  <p className="text-white/35 text-xs mt-0.5">View your partner&apos;s shared dashboard</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — passcode */}
        {step === "passcode" && (
          <div className="p-6 space-y-5">
            <div>
              <h2 className="text-white font-semibold text-base">Enter Partner Code</h2>
              <p className="text-white/40 text-sm mt-1">
                Ask your partner for the code from their Settings → Account page.
              </p>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                <input
                  type="text"
                  value={passcode}
                  onChange={e => { setPasscode(e.target.value.toUpperCase()); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleActivate()}
                  placeholder="e.g. A3F7X2QK"
                  maxLength={8}
                  autoFocus
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-9 pr-4 py-2.5 text-white text-sm font-mono tracking-widest uppercase focus:outline-none focus:border-rose-500/50 transition-colors placeholder:text-white/20 placeholder:tracking-normal placeholder:font-sans placeholder:uppercase-none"
                />
              </div>

              {error && (
                <p className="text-rose-400 text-xs">{error}</p>
              )}

              <button
                onClick={handleActivate}
                disabled={!passcode.trim() || loading}
                className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  passcode.trim() && !loading
                    ? "bg-rose-500 hover:bg-rose-400 text-white cursor-pointer"
                    : "bg-white/5 text-white/25 cursor-not-allowed"
                }`}
              >
                {loading ? "Activating…" : "Activate Partner Account"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
