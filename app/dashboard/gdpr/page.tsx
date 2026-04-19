import { ReactNode } from "react";

const STATUS_STYLES: Record<string, string> = {
  Done: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  Priority: "bg-amber-500/15 border-amber-500/30 text-amber-300",
  "In Progress": "bg-blue-500/10 border-blue-500/20 text-blue-400",
  Check: "bg-violet-500/10 border-violet-500/20 text-violet-400",
  "Not necessary": "bg-white/[0.05] border-white/[0.08] text-gray-500",
};

function PriorityItem({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500/15 border border-violet-500/25 text-violet-400 text-xs font-bold flex items-center justify-center mt-0.5">
        {number}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold">{title}</p>
        {children}
      </div>
    </div>
  );
}

function Bullet({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm text-gray-400 leading-relaxed">
      <span className="flex-shrink-0 text-gray-600 mt-0.5">•</span>
      {children}
    </li>
  );
}

function Code({ children }: { children: ReactNode }) {
  return (
    <code className="font-mono text-xs bg-white/[0.06] px-1.5 py-0.5 rounded text-violet-300">
      {children}
    </code>
  );
}

export default function WhatsNextPage() {
  return (
    <div className="flex justify-center px-4 py-5">
      <div className="w-full space-y-4" style={{ maxWidth: "860px" }}>

        {/* Page header */}
        <div>
          <h1 className="text-white text-xl font-bold tracking-tight">GDPR Compliance</h1>
          <p className="text-gray-500 text-xs mt-0.5">SyncCycle EU — compliance status and immediate priorities</p>
        </div>

        {/* Card 1: What Is Already Done */}
        <div className="bg-[var(--card-bg)] card-glass rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b border-white/[0.05]">
            <h2 className="text-white text-sm font-semibold">What Is Already Done</h2>
            <p className="text-gray-500 text-xs mt-0.5">Satisfies the baseline Article 32 (security of processing) requirement.</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.05]">
                <th className="text-gray-500 text-xs font-medium text-left px-5 py-2.5">Protection</th>
                <th className="text-gray-500 text-xs font-medium text-left px-3 py-2.5">How</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Encryption in transit", "Supabase enforces TLS on all connections"],
                ["Encryption at rest", "Supabase (AWS) uses AES-256 at the storage layer"],
                ["Access control", "Row Level Security (RLS) — users can only read/write their own rows"],
                ["Authentication", "Supabase Auth — JWT-based, session-managed"],
              ].map(([protection, how]) => (
                <tr key={protection} className="border-t border-white/[0.05]">
                  <td className="px-5 py-2.5 text-gray-300 text-sm font-medium whitespace-nowrap">{protection}</td>
                  <td className="px-3 py-2.5 text-gray-400 text-sm leading-relaxed">{how}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Card 2: What Is Not Necessary */}
        <div className="bg-[var(--card-bg)] card-glass rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b border-white/[0.05]">
            <h2 className="text-white text-sm font-semibold">What Is Not Necessary (Right Now)</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.05]">
                <th className="text-gray-500 text-xs font-medium text-left px-5 py-2.5">Item</th>
                <th className="text-gray-500 text-xs font-medium text-left px-3 py-2.5">Reason</th>
              </tr>
            </thead>
            <tbody>
              {[
                [
                  "Client-side encryption (Web Crypto API)",
                  "Supabase's existing protections satisfy Article 32 for most EU regulators. Would also break Fiona's server-side context building. Not worth the trade-off unless a specific compliance claim (e.g. ISO 27001) is required.",
                ],
                [
                  "Separate encryption key management system",
                  "No current requirement. Revisit if app scales or seeks formal certification.",
                ],
                [
                  "Full HIPAA compliance",
                  "US healthcare regulation, not applicable for EU.",
                ],
                [
                  "Full anonymisation pipeline",
                  "Not required — pseudonymised pattern summaries satisfy data minimisation. True anonymisation (removing all re-identifiability) is a higher bar than GDPR demands here.",
                ],
              ].map(([item, reason]) => (
                <tr key={item} className="border-t border-white/[0.05]">
                  <td className="px-5 py-2.5 text-gray-300 text-sm font-medium align-top">{item}</td>
                  <td className="px-3 py-2.5 text-gray-400 text-sm leading-relaxed">{reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Card 3: Data Minimisation Architecture */}
        <div className="bg-[var(--card-bg)] card-glass rounded-2xl border border-[var(--border)] p-5 space-y-4">
          <div>
            <h2 className="text-white text-sm font-semibold">Data Minimisation Architecture</h2>
            <p className="text-gray-500 text-xs mt-0.5">Satisfies Article 5(1)(c) (data minimisation) and Article 5(1)(e) (storage limitation).</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-2">How it works</p>
            <ol className="space-y-1.5 list-none">
              {[
                "Raw health data (cycles, symptoms, mood, notes, logs) is stored in Supabase short-term",
                "Periodically — per cycle or monthly (retention period TBD) — a self-hosted EU model processes raw data into a natural language pattern summary per user",
                "Raw data is deleted after processing",
                "Fiona uses pattern summaries instead of raw tables for context",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-400 leading-relaxed">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/[0.06] border border-white/[0.08] text-gray-500 text-[10px] font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
          <div className="bg-amber-500/[0.06] border border-amber-500/20 rounded-xl px-4 py-3">
            <p className="text-amber-300/90 text-xs leading-relaxed">
              <span className="font-semibold">Important:</span> Pattern summaries are still personal data — derived from identifiable health data, still special category. RLS and all existing protections continue to apply.
            </p>
          </div>
          <div className="bg-amber-500/[0.06] border border-amber-500/20 rounded-xl px-4 py-3">
            <p className="text-amber-300/90 text-xs leading-relaxed">
              <span className="font-semibold">GDPR obligation:</span> The chosen retention period must be stated explicitly in the Privacy Policy once decided (e.g. &ldquo;raw health logs are deleted at the end of each cycle, approximately every 28 days&rdquo;).
            </p>
          </div>
        </div>

        {/* Card 4: Alternative: Mistral AI API */}
        <div className="bg-[var(--card-bg)] card-glass rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b border-white/[0.05]">
            <h2 className="text-white text-sm font-semibold">Alternative: Mistral AI API</h2>
            <p className="text-gray-500 text-xs mt-0.5">
              If the team decides against self-hosting, Mistral AI (French company, servers in EU) is the closest compliant alternative.
            </p>
          </div>

          {/* What Changes vs Self-Hosted */}
          <div className="px-5 pt-4">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-2">What Changes vs Self-Hosted</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  <th className="text-gray-500 text-xs font-medium text-left px-5 py-2.5">Area</th>
                  <th className="text-gray-500 text-xs font-medium text-left px-3 py-2.5">Self-Hosted VPS</th>
                  <th className="text-gray-500 text-xs font-medium text-left px-3 py-2.5">Mistral AI API</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Data leaves your infrastructure", "No", "Yes — sent to Mistral's EU servers"],
                  ["Third-party AI processor", "No", "Yes — Mistral is a sub-processor"],
                  ["DPA required for AI", "No", "Yes — with Mistral"],
                  ["User disclosure required", "Minimal", "Must name Mistral in privacy policy"],
                  ["Infrastructure maintenance", "Your responsibility", "None"],
                  ["Model updates / improvements", "Manual", "Automatic"],
                  ["Cost", "VPS cost + ops time", "Per-token API pricing"],
                  ["Latency", "Depends on VPS spec", "Generally faster, managed infra"],
                ].map(([area, selfHosted, mistral]) => (
                  <tr key={area} className="border-t border-white/[0.05]">
                    <td className="px-5 py-2.5 text-gray-300 text-sm font-medium align-top">{area}</td>
                    <td className="px-3 py-2.5 text-gray-400 text-sm">{selfHosted}</td>
                    <td className="px-3 py-2.5 text-gray-400 text-sm">{mistral}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Extra Steps */}
          <div className="px-5 pt-5">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-3">Extra Steps Required (Mistral)</p>
            <ol className="space-y-2 list-none">
              {[
                ["Sign Mistral&apos;s DPA", "Available in their account dashboard. Must be completed before sending any user health data to their API."],
                ["Update Privacy Policy", "Must explicitly name Mistral AI as a sub-processor receiving special category health data."],
                ["Update Article 30 RoPA", "Recipients field changes from \"none\" to \"Mistral AI SAS, France\"."],
                ["Separate Fiona consent", "Users should be informed specifically that their health context is sent to a third-party AI (even if EU-based). Recommended as a distinct consent step when first using Fiona."],
                ["Confirm data retention with Mistral", "Verify their API does not retain or train on your users' data. Mistral's API Terms state no training on API data, but confirm this in their DPA for special category data."],
              ].map(([title, body], i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-400 leading-relaxed">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/[0.06] border border-white/[0.08] text-gray-500 text-[10px] font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span>
                    <span className="text-gray-300 font-medium">{title}</span>
                    {" — "}
                    {body}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* Pros / Cons */}
          <div className="px-5 pt-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-2">Good</p>
              <ul className="space-y-1.5">
                {[
                  "No server maintenance — no DevOps burden on the team",
                  "Mistral is a French company, fully under EU jurisdiction and GDPR by default",
                  "State-of-the-art models (Mistral Large, Mistral Small) without infrastructure investment",
                  "Easier to scale — no VPS resizing needed as user base grows",
                  "DPA is straightforward and available self-serve",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-gray-400 leading-relaxed">
                    <span className="flex-shrink-0 text-emerald-500 mt-0.5">+</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-rose-400 text-xs font-semibold uppercase tracking-widest mb-2">Bad</p>
              <ul className="space-y-1.5">
                {[
                  "Health data leaves your direct control — you are trusting a third party with special category data",
                  "Requires ongoing DPA management — if Mistral updates their terms, you must re-review",
                  "Adds Mistral as a named sub-processor — users must be informed and consent",
                  "API costs grow with usage — self-hosted has a fixed VPS cost ceiling",
                  "If Mistral has an outage, Fiona and pattern processing go down with it",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-gray-400 leading-relaxed">
                    <span className="flex-shrink-0 text-rose-500 mt-0.5">−</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Verdict */}
          <div className="px-5 pb-5">
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Verdict</p>
              <p className="text-gray-400 text-sm leading-relaxed">
                For a student/early-stage project, <span className="text-white font-medium">Mistral API is pragmatically easier</span> — no ops overhead.
                For a production app with serious GDPR posture, <span className="text-white font-medium">self-hosted is cleaner</span> — health data never leaves your infrastructure.
                Both options are legally viable under GDPR if the DPA and consent steps above are followed.
              </p>
            </div>
          </div>
        </div>

        {/* Card 5: Immediate Priorities */}
        <div className="bg-[var(--card-bg)] card-glass rounded-2xl border border-[var(--border)] p-5 space-y-5">
          <div>
            <h2 className="text-white text-sm font-semibold">Immediate Priorities (EU Launch)</h2>
            <p className="text-gray-500 text-xs mt-0.5">8 items to address before launching to EU users</p>
          </div>

          {/* Priority 1 */}
          <PriorityItem number={1} title="Explicit Consent for Health Data — Article 9">
            <ul className="space-y-1 mt-1">
              {[
                "Add a clear, standalone consent screen before any health data is collected",
                "Must name what is collected (cycle, symptoms, mood, notes) and why",
                "\"By signing up\" consent is not sufficient for special category data",
                "Log consent timestamp and version per user",
              ].map((item) => (
                <Bullet key={item}>{item}</Bullet>
              ))}
            </ul>
          </PriorityItem>

          {/* Priority 2 */}
          <PriorityItem number={2} title="Migrate AI from OpenRouter (US) to EU-hosted Model — Article 28 / Article 46">
            <div className="mt-2 bg-amber-500/[0.06] border border-amber-500/20 rounded-xl px-4 py-3">
              <p className="text-amber-300/90 text-xs leading-relaxed">
                <span className="font-semibold">Current state (non-compliant):</span>{" "}
                <Code>app/api/fiona/chat/route.ts</Code>{" "}
                calls OpenRouter via <Code>OPENROUTER_API_KEY</Code>, routing to two US-based models:{" "}
                <Code>perplexity/sonar-pro</Code> and <Code>openai/gpt-4o-mini</Code>.
                Every Fiona message sends extensive special category health data to US servers.
              </p>
            </div>
            <div className="mt-3 space-y-3">
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-3">
                <p className="text-gray-300 text-xs font-semibold mb-1.5">Option A — Self-hosted EU VPS (professor&apos;s mandate)</p>
                <ul className="space-y-1">
                  {[
                    "Deploy model (e.g. Ollama + Mistral or LLaMA) on Hetzner or OVHcloud",
                    "Sign DPA with VPS provider only — no third-party AI DPA required",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-gray-400 leading-relaxed">
                      <span className="flex-shrink-0 text-gray-600 mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                  <li className="flex items-start gap-2 text-xs text-gray-400 leading-relaxed">
                    <span className="flex-shrink-0 text-gray-600 mt-0.5">•</span>
                    Replace OpenRouter call in <Code>app/api/fiona/chat/route.ts</Code>
                  </li>
                </ul>
                <div className="mt-2 flex items-start gap-2 text-xs text-amber-300/80">
                  <span>⚠</span>
                  <span>
                    The Perplexity citation feature (<Code>X-Citations</Code> response header, <Code>data.citations</Code>) will be lost — this is Perplexity-specific and must be removed from <Code>FionaMessage.tsx</Code>.
                  </span>
                </div>
              </div>
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-3">
                <p className="text-gray-300 text-xs font-semibold mb-1.5">Option B — Mistral AI API (see Mistral section)</p>
                <ul className="space-y-1">
                  {[
                    "Replace OpenRouter with Mistral API endpoints",
                    "Sign Mistral DPA before sending any health data",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-gray-400 leading-relaxed">
                      <span className="flex-shrink-0 text-gray-600 mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex items-start gap-2 text-xs text-amber-300/80">
                  <span>⚠</span>
                  <span>Citations feature will also be lost.</span>
                </div>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-gray-500 text-xs font-semibold mb-1.5">Until migration is complete (interim obligations):</p>
              <ul className="space-y-1">
                {[
                  "Sign a DPA with OpenRouter (available in their dashboard)",
                  "List OpenRouter as a sub-processor in the Privacy Policy",
                  "Inform users their health data is sent to a US-based AI provider",
                  "Standard Contractual Clauses (SCCs) are required for US data transfer — Article 46",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-gray-400 leading-relaxed">
                    <span className="flex-shrink-0 text-gray-600 mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </PriorityItem>

          {/* Priority 3 */}
          <PriorityItem number={3} title="VPS Provider DPA — Article 28 (applies only if choosing Option A)">
            <ul className="space-y-1 mt-1">
              {[
                "The EU VPS provider (Hetzner, OVHcloud, etc.) is a sub-processor — a DPA must be signed with them",
                "Both Hetzner and OVHcloud offer self-serve standard DPAs in their account settings",
                "No DPA is required for the AI model itself since it is self-hosted",
              ].map((item) => (
                <Bullet key={item}>{item}</Bullet>
              ))}
            </ul>
          </PriorityItem>

          {/* Priority 4 */}
          <PriorityItem number={4} title="Privacy Policy">
            <p className="text-gray-400 text-sm mt-1 leading-relaxed">Must explicitly state:</p>
            <ul className="space-y-1 mt-1">
              {[
                "Special category health data is processed",
                "AI model provider (once migration is complete — name the EU provider chosen)",
                "Supabase is the data storage processor (link their DPA)",
                "If self-hosted: VPS provider is a sub-processor for AI inference",
                "Raw data retention period (once decided)",
                "User rights: access, rectification, erasure, portability",
                "Legal basis for processing (explicit consent — Article 6(1)(a) + Article 9(2)(a))",
              ].map((item) => (
                <Bullet key={item}>{item}</Bullet>
              ))}
            </ul>
          </PriorityItem>

          {/* Priority 5 */}
          <PriorityItem number={5} title="Record of Processing Activities — Article 30">
            <p className="text-gray-400 text-sm mt-1 leading-relaxed">
              Required for any organisation processing special category data. Must document the pattern processing job as a processing activity:
            </p>
            <ul className="space-y-1 mt-1">
              {[
                "Purpose: generating personalised cycle insights",
                "Legal basis: explicit consent",
                "Data categories: health data (special category)",
                "Retention: raw data deleted after processing; pattern summaries retained",
                "Recipients: none if self-hosted; Mistral AI SAS if using Mistral API",
              ].map((item) => (
                <Bullet key={item}>{item}</Bullet>
              ))}
            </ul>
          </PriorityItem>

          {/* Priority 6 */}
          <PriorityItem number={6} title="Right to Erasure — Article 17">
            <p className="text-gray-400 text-sm mt-1 leading-relaxed">
              Audit that deleting a user account cascades through all tables:
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[
                "user_profiles", "cycles", "period_logs", "symptom_logs", "mood_logs",
                "daily_notes", "workout_logs", "nutrition_logs", "meal_entries", "sleep_logs",
                "fiona_sessions", "fiona_messages", "symptom_types", "workout_types", "user_patterns",
              ].map((tbl) => (
                <Code key={tbl}>{tbl}</Code>
              ))}
            </div>
            <p className="text-gray-400 text-sm mt-2 leading-relaxed">
              Add a self-serve &ldquo;Delete my account&rdquo; option in account settings.
            </p>
          </PriorityItem>

          {/* Priority 7 */}
          <PriorityItem number={7} title="Data Portability — Article 20">
            <ul className="space-y-1 mt-1">
              {[
                "Users must be able to export all their data (raw logs + pattern summaries)",
                "A JSON or CSV export is sufficient",
                "Can be a manual trigger in account settings initially",
              ].map((item) => (
                <Bullet key={item}>{item}</Bullet>
              ))}
            </ul>
          </PriorityItem>

          {/* Priority 8 */}
          <PriorityItem number={8} title="Supabase Region Check">
            <ul className="space-y-1 mt-1">
              {[
                "Confirm the Supabase project is on an EU region (e.g. eu-west-1)",
                "EU users' data leaving the EU requires Standard Contractual Clauses (SCCs)",
                "Supabase's DPA covers this — but only if the project is on an EU region",
              ].map((item) => (
                <Bullet key={item}>{item}</Bullet>
              ))}
            </ul>
          </PriorityItem>
        </div>

        {/* Card 6: Summary Table */}
        <div className="bg-[var(--card-bg)] card-glass rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b border-white/[0.05]">
            <h2 className="text-white text-sm font-semibold">Summary Table</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.05]">
                <th className="text-gray-500 text-xs font-medium text-left px-5 py-2.5">Area</th>
                <th className="text-gray-500 text-xs font-medium text-left px-3 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {([
                ["Encryption in transit", "Done"],
                ["Encryption at rest", "Done"],
                ["Row-level access control", "Done"],
                ["Client-side encryption", "Not necessary"],
                ["Migrate AI from OpenRouter (US) to EU-hosted model", "Priority"],
                ["Data minimisation / pattern architecture", "In Progress"],
                ["Article 9 consent flow", "Priority"],
                ["VPS provider DPA", "Priority"],
                ["Privacy policy (incl. retention period)", "Priority"],
                ["Record of Processing Activities (Art. 30)", "Priority"],
                ["Right to erasure (cascade deletes)", "Priority"],
                ["Data export / portability", "Priority"],
                ["Supabase EU region", "Check"],
              ] as [string, string][]).map(([area, status]) => (
                <tr key={area} className="border-t border-white/[0.05]">
                  <td className="px-5 py-2.5 text-gray-300 text-sm">{area}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[status] ?? ""}`}>
                      {status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <p className="text-gray-600 text-xs text-center pb-2">Last reviewed: 2026-04-03</p>

      </div>
    </div>
  );
}
