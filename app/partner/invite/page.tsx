"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

type State = "validating" | "ready" | "invalid" | "accepting" | "done";

export default function PartnerInvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [state, setState] = useState<State>("validating");
  const [inviterName, setInviterName] = useState("your partner");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setErrorMsg("No invite token found in the link.");
      setState("invalid");
      return;
    }

    // Validate token via the accept endpoint (dry-run check)
    fetch(`/api/partner/invite/validate?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(data => {
        if (data.valid) {
          setInviterName(data.inviterName || "your partner");
          setState("ready");
        } else {
          setErrorMsg(data.error || "This invite link is invalid or has expired.");
          setState("invalid");
        }
      })
      .catch(() => {
        setErrorMsg("Could not validate the invite. Please try again.");
        setState("invalid");
      });
  }, [token]);

  async function handleAccept() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      // Store token and send to sign up
      sessionStorage.setItem("pendingInviteToken", token);
      router.push("/signup");
      return;
    }

    // Already signed in — accept immediately
    setState("accepting");
    try {
      const res = await fetch("/api/partner/invite/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (res.ok) {
        setState("done");
        setTimeout(() => router.replace("/partner"), 1500);
      } else {
        setErrorMsg(data.error || "Failed to accept invite.");
        setState("invalid");
      }
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
      setState("invalid");
    }
  }

  return (
    <div className="min-h-screen bg-[var(--page-bg,#0e0e14)] flex items-center justify-center p-6 text-white">
      <div className="max-w-md w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 text-center space-y-6">

        <Image src="/logo-dark.png" alt="SyncCycle" width={48} height={48} className="rounded-xl mx-auto" />

        {state === "validating" && (
          <div className="space-y-3">
            <div className="w-6 h-6 rounded-full border-2 border-rose-500 border-t-transparent animate-spin mx-auto" />
            <p className="text-white/60 text-sm">Validating invite…</p>
          </div>
        )}

        {state === "ready" && (
          <div className="space-y-4">
            <div>
              <h1 className="text-xl font-semibold text-white">You&apos;ve been invited</h1>
              <p className="text-white/60 text-sm mt-1">
                <span className="text-white">{inviterName}</span> has invited you to view their SyncCycle insights.
              </p>
            </div>
            <p className="text-white/40 text-xs">
              As a partner, you&apos;ll have a read-only view of their dashboard and insights.
            </p>
            <button
              onClick={handleAccept}
              className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-medium transition-colors"
            >
              Accept Invite
            </button>
          </div>
        )}

        {state === "accepting" && (
          <div className="space-y-3">
            <div className="w-6 h-6 rounded-full border-2 border-rose-500 border-t-transparent animate-spin mx-auto" />
            <p className="text-white/60 text-sm">Setting up your partner account…</p>
          </div>
        )}

        {state === "done" && (
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 text-xl">✓</div>
            <p className="text-white font-medium">All set! Redirecting you now…</p>
          </div>
        )}

        {state === "invalid" && (
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mx-auto text-red-400 text-xl">✕</div>
            <div>
              <h1 className="text-lg font-semibold text-white">Invite Invalid</h1>
              <p className="text-white/60 text-sm mt-1">{errorMsg}</p>
            </div>
            <p className="text-white/40 text-xs">Ask your partner to send a new invite from their Account Settings.</p>
          </div>
        )}

      </div>
    </div>
  );
}
