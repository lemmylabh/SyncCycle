"use client";

import { Check, Sparkles, Receipt, CreditCard, Clock } from "lucide-react";

const FREE_FEATURES = [
  "Cycle tracking",
  "Habit tracking",
  "Limited AI insights",
  "Educational content",
  "Ads & sponsored content",
];

export default function SubscriptionSettingsPage() {
  return (
    <div className="flex flex-col p-4 lg:p-6 lg:h-full lg:overflow-hidden overflow-y-auto gap-4">

      {/* ── TOP ROW — natural height so right column aligns with upgrade card ── */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">

        {/* LEFT */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">

          {/* Current Plan */}
          <div>
            <p className="text-white/50 text-xs uppercase tracking-widest mb-3">Current Plan</p>
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-white font-light text-base tracking-wide">Free</span>
                  <p className="text-white/35 text-xs mt-0.5">Basic cycle tracking</p>
                </div>
                <span className="text-[10px] text-white/40 border border-white/10 rounded-full px-2 py-0.5">
                  Current Plan
                </span>
              </div>
              <div className="border-t border-white/[0.06] my-4" />
              <ul className="space-y-2">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check size={12} className="text-white/20 flex-shrink-0" />
                    <span className="text-white/40 text-xs">{f}</span>
                  </li>
                ))}
              </ul>
              <p className="text-white/20 text-xs underline cursor-not-allowed mt-5">Cancel plan</p>
            </div>
          </div>

          {/* Upgrade banner */}
          <div className="bg-violet-500/[0.06] border border-violet-500/30 rounded-xl p-5 flex items-center gap-4">
            <Sparkles size={16} className="text-violet-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-light">Upgrade to Syncycle Plus</p>
              <p className="text-white/40 text-xs mt-0.5">
                Advanced AI insights, ad-free, personalised recommendations.
              </p>
            </div>
            <button
              disabled
              className="bg-violet-500 text-white text-xs py-1.5 px-4 rounded-lg flex-shrink-0 cursor-not-allowed opacity-70"
            >
              Upgrade
            </button>
          </div>

        </div>

        {/* RIGHT */}
        <div className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-4">

          {/* Billing */}
          <div>
            <p className="text-white/50 text-xs uppercase tracking-widest mb-3">Billing</p>
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
              <div className="flex items-center gap-2 text-white/25">
                <CreditCard size={14} />
                <span className="text-xs">No payment method saved.</span>
              </div>
              <button
                disabled
                className="border border-white/10 text-white/25 text-xs py-1.5 rounded-lg w-full mt-3 cursor-not-allowed"
              >
                Add Payment Method
              </button>
            </div>
          </div>

          {/* Invoice History — flex-1 so it stretches to match left column bottom */}
          <div className="flex-1 min-h-0 flex flex-col">
            <p className="text-white/50 text-xs uppercase tracking-widest mb-3">Invoice History</p>
            <div className="flex-1 min-h-[80px] bg-white/[0.03] border border-white/[0.08] rounded-xl flex flex-col items-center justify-center gap-2">
              <Receipt size={18} className="text-white/10" />
              <p className="text-white/25 text-xs">No invoices yet.</p>
            </div>
          </div>

        </div>
      </div>

      {/* ── BOTTOM — Coming soon note, full width ────────────────────────── */}
      <div className="flex items-center gap-4 flex-shrink-0 mt-4">
        <div className="flex-1 h-px bg-white/[0.05]" />
        <div className="flex items-center gap-2.5 text-white/25">
          <Clock size={12} className="flex-shrink-0" />
          <p className="text-xs">
            Subscription management is coming soon.{" "}
            <span className="text-white/35 italic">— The Syncycle Team</span>
          </p>
        </div>
        <div className="flex-1 h-px bg-white/[0.05]" />
      </div>

    </div>
  );
}
