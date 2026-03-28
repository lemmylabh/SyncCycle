"use client";

import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";

const FAQS = [
  {
    q: "Where is my data stored?",
    a: "Securely in Supabase (PostgreSQL), hosted in the EU. Your health data is never stored on third-party ad platforms.",
  },
  {
    q: "Who can see my health data?",
    a: "Only you. Our team cannot view your personal entries. AI insights are generated without exposing raw data to third parties.",
  },
  {
    q: "What does AI access mean?",
    a: "Enabling AI access for a tracker lets Fiona use that data to personalise suggestions. You control which trackers Fiona can see in App Settings.",
  },
  {
    q: "Is my data shared with third parties?",
    a: "No. We do not sell or share personal health data. Anonymous aggregated trends may be used to improve the product.",
  },
  {
    q: "How accurate are the cycle predictions?",
    a: "Predictions improve over time as Syncycle learns your unique patterns. Most users see reliable predictions after 2–3 logged cycles.",
  },
  {
    q: "Can I export my data?",
    a: "Data export is coming soon. You'll be able to download your full cycle history, symptoms, and wellness logs as a CSV.",
  },
  {
    q: "How do I delete my account and data?",
    a: "Go to Settings → Account and use the Delete Account option. All data will be permanently removed within 30 days.",
  },
];

const CATEGORIES = ["General Feedback", "Bug Report", "Feature Request", "Data & Privacy"];

export default function HelpSettingsPage() {
  const [open, setOpen] = useState<number | null>(null);
  const [category, setCategory] = useState("General Feedback");
  const [message, setMessage] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSend() {
    if (!message.trim()) return;

    let body = `Category: ${category}\n\n${message}`;

    if (!anonymous) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        body += `\n\n— ${session.user.email}`;
      }
    }

    const subject = encodeURIComponent(`[${category}] Syncycle Feedback`);
    const encodedBody = encodeURIComponent(body);
    window.location.href = `mailto:support@syncycle.app?subject=${subject}&body=${encodedBody}`;
    setSubmitted(true);
  }

  return (
    <div className="flex flex-col lg:flex-row gap-5 lg:gap-6 p-4 lg:p-6 lg:h-full lg:overflow-hidden overflow-y-auto">

      {/* ── LEFT — FAQ ───────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col lg:min-h-0">
        <p className="text-white/50 text-xs uppercase tracking-widest mb-3 flex-shrink-0">
          Frequently Asked Questions
        </p>
        <div className="flex-1 min-h-0 bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden flex flex-col">
          {FAQS.map((faq, i) => (
            <div key={i} className={`flex-shrink-0 ${i < FAQS.length - 1 ? "border-b border-white/[0.05]" : ""}`}>
              <button
                className="w-full flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-white/[0.02] transition-colors text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="text-white/70 text-sm pr-4">{faq.q}</span>
                <ChevronDown
                  size={14}
                  className={`text-white/30 flex-shrink-0 transition-transform duration-200 ${open === i ? "rotate-180" : ""}`}
                />
              </button>
              {open === i && (
                <p className="px-4 pb-3.5 text-white/40 text-xs leading-relaxed">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
          {/* Footer */}
          <div className="flex-1 flex items-end">
            <div className="w-full border-t border-white/[0.05] px-4 py-4 flex items-center justify-between">
              <p className="text-white/25 text-xs">Still have questions?</p>
              <a
                href="mailto:support@syncycle.app"
                className="text-violet-400/70 hover:text-violet-400 text-xs transition-colors"
              >
                Contact support
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT — Feedback ─────────────────────────────────────────────── */}
      <div className="w-full lg:w-72 flex-shrink-0 flex flex-col lg:min-h-0">
        <p className="text-white/50 text-xs uppercase tracking-widest mb-3 flex-shrink-0">Help Us Improve</p>
        <div className="lg:flex-1 lg:min-h-0 bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 flex flex-col">
          {submitted ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <Check size={20} className="text-violet-400" />
              <p className="text-white/50 text-sm text-center">Thanks for the feedback!</p>
            </div>
          ) : (
            <>
              <p className="text-white/35 text-xs leading-relaxed flex-shrink-0">
                Your feedback shapes Syncycle. Tell us what's working and what could be better.
              </p>

              <div className="mt-3 flex-shrink-0">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="bg-transparent border border-white/[0.08] rounded-lg px-3 py-2 text-white/60 text-sm w-full appearance-none cursor-pointer focus:outline-none focus:border-white/20"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-[#1e1e2a]">{c}</option>
                  ))}
                </select>
              </div>

              {/* Textarea grows to fill space */}
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us more..."
                rows={5}
                className="lg:flex-1 lg:min-h-0 mt-3 bg-transparent border border-white/[0.08] rounded-lg px-3 py-2 text-white/60 text-sm w-full resize-none placeholder:text-white/20 focus:outline-none focus:border-white/20"
              />

              <label className="flex items-center gap-2 cursor-pointer select-none mt-3 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border border-white/20 bg-white/[0.03] accent-violet-500 cursor-pointer"
                />
                <span className="text-white/40 text-xs">Send anonymously</span>
              </label>

              <button
                onClick={handleSend}
                disabled={!message.trim()}
                className="mt-3 flex-shrink-0 bg-violet-500 hover:bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs py-2 rounded-lg w-full transition-colors"
              >
                Send Feedback
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
