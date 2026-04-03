# GDPR Compliance — SyncCycle (EU)

> Menstrual and health data qualifies as **special category data** under Article 9 of GDPR,
> requiring a higher standard of care than standard personal data.

---

## What Is Already Done

| Protection | How |
|---|---|
| Encryption in transit | Supabase enforces TLS on all connections |
| Encryption at rest | Supabase (AWS) uses AES-256 at the storage layer |
| Access control | Row Level Security (RLS) — users can only read/write their own rows |
| Authentication | Supabase Auth — JWT-based, session-managed |

These satisfy the baseline **Article 32** (security of processing) requirement.

---

## What Is Not Necessary (Right Now)

| Item | Reason |
|---|---|
| Client-side encryption (Web Crypto API) | Supabase's existing protections satisfy Article 32 for most EU regulators. Would also break Fiona's server-side context building. Not worth the trade-off unless a specific compliance claim (e.g. ISO 27001) is required. |
| Separate encryption key management system | No current requirement. Revisit if app scales or seeks formal certification. |
| Full HIPAA compliance | US healthcare regulation, not applicable for EU. |
| Full anonymisation pipeline | Not required — pseudonymised pattern summaries satisfy data minimisation. True anonymisation (removing all re-identifiability) is a higher bar than GDPR demands here. |

---

## Data Minimisation Architecture

This architecture directly satisfies two core GDPR principles:
- **Article 5(1)(c)** — Data minimisation: only keep what is necessary for the purpose
- **Article 5(1)(e)** — Storage limitation: delete raw data once the purpose is fulfilled

**How it works:**
1. Raw health data (cycles, symptoms, mood, notes, logs) is stored in Supabase short-term
2. Periodically — per cycle or monthly (retention period TBD) — a self-hosted EU model processes raw data into a natural language pattern summary per user
3. Raw data is deleted after processing
4. Fiona uses pattern summaries instead of raw tables for context

**Important:** Pattern summaries are still personal data — derived from identifiable health data, still special category. RLS and all existing protections continue to apply.

**GDPR obligation:** The chosen retention period must be stated explicitly in the Privacy Policy once decided (e.g. "raw health logs are deleted at the end of each cycle, approximately every 28 days").

---

## Alternative: Mistral AI API

If the team decides against self-hosting, **Mistral AI** (French company, servers in EU) is the closest compliant alternative. This section documents what changes and what extra steps are required.

### What Changes vs Self-Hosted

| Area | Self-Hosted VPS | Mistral AI API |
|---|---|---|
| Data leaves your infrastructure | No | Yes — sent to Mistral's EU servers |
| Third-party AI processor | No | Yes — Mistral is a sub-processor |
| DPA required for AI | No | **Yes — with Mistral** |
| User disclosure required | Minimal | Must name Mistral in privacy policy |
| Infrastructure maintenance | Your responsibility | None |
| Model updates / improvements | Manual | Automatic |
| Cost | VPS cost + ops time | Per-token API pricing |
| Latency | Depends on VPS spec | Generally faster, managed infra |

### Extra Steps Required (Mistral)

1. **Sign Mistral's DPA** — available in their account dashboard. Must be completed before sending any user health data to their API.
2. **Update Privacy Policy** — must explicitly name Mistral AI as a sub-processor receiving special category health data.
3. **Update Article 30 RoPA** — recipients field changes from "none" to "Mistral AI SAS, France".
4. **Separate Fiona consent** — users should be informed specifically that their health context is sent to a third-party AI (even if EU-based). Recommended as a distinct consent step when first using Fiona.
5. **Confirm data retention with Mistral** — verify their API does not retain or train on your users' data (Mistral's API Terms state no training on API data, but confirm this in their DPA for special category data).

### Good

- No server maintenance — no DevOps burden on the team
- Mistral is a French company, fully under EU jurisdiction and GDPR by default
- State-of-the-art models (Mistral Large, Mistral Small) without infrastructure investment
- Easier to scale — no VPS resizing needed as user base grows
- DPA is straightforward and available self-serve

### Bad

- Health data leaves your direct control — you are trusting a third party with special category data
- Requires ongoing DPA management — if Mistral updates their terms, you must re-review
- Adds Mistral as a named sub-processor — users must be informed and consent
- API costs grow with usage — self-hosted has a fixed VPS cost ceiling
- If Mistral has an outage, Fiona and pattern processing go down with it

### Verdict

For a student/early-stage project, **Mistral API is pragmatically easier** — no ops overhead. For a production app with serious GDPR posture, **self-hosted is cleaner** — health data never leaves your infrastructure. Both options are legally viable under GDPR if the DPA and consent steps above are followed.

---

## Immediate Priorities (EU Launch)

### 1. Explicit Consent for Health Data — Article 9
- Add a clear, standalone consent screen before any health data is collected
- Must name *what* is collected (cycle, symptoms, mood, notes) and *why*
- "By signing up" consent is not sufficient for special category data
- Log consent timestamp and version per user

### 2. Migrate AI from OpenRouter (US) to EU-hosted Model — Article 28 / Article 46

**Current state (non-compliant):** `app/api/fiona/chat/route.ts` calls OpenRouter via `OPENROUTER_API_KEY`, routing to two US-based models:
- `perplexity/sonar-pro` — used for web-grounded answers with citations
- `openai/gpt-4o-mini` — also used in Fiona chat

Every Fiona message sends extensive special category health data to US servers, including: diagnosed conditions, contraceptive use, cycle day/phase, last 7 days of mood/energy/libido scores, symptoms, period flow, sleep, workouts, nutrition, and journal entries.

**Required — choose one path:**

**Option A — Self-hosted EU VPS (professor's mandate)**
- Deploy model (e.g. Ollama + Mistral or LLaMA) on Hetzner or OVHcloud
- Replace OpenRouter call in `app/api/fiona/chat/route.ts`
- Sign DPA with VPS provider only — no third-party AI DPA required
- ⚠️ The Perplexity citation feature (`X-Citations` response header, `data.citations`) will be lost — this is Perplexity-specific and must be removed from `FionaMessage.tsx`

**Option B — Mistral AI API (see Mistral section in this doc)**
- Replace OpenRouter with Mistral API endpoints
- Sign Mistral DPA before sending any health data
- ⚠️ Citations feature will also be lost

**Until migration is complete (interim obligations):**
- Sign a DPA with OpenRouter (available in their dashboard)
- List OpenRouter as a sub-processor in the Privacy Policy
- Inform users their health data is sent to a US-based AI provider
- Standard Contractual Clauses (SCCs) are required for US data transfer — Article 46

### 3. VPS Provider DPA — Article 28 *(applies only if choosing Option A above)*
- The EU VPS provider (Hetzner, OVHcloud, etc.) is a sub-processor — a DPA must be signed with them
- Both Hetzner and OVHcloud offer self-serve standard DPAs in their account settings
- No DPA is required for the AI model itself since it is self-hosted

### 3. Privacy Policy
- Must explicitly state:
  - Special category health data is processed
  - AI model provider (once migration is complete — name the EU provider chosen)
  - Supabase is the data storage processor (link their DPA)
  - If self-hosted: VPS provider is a sub-processor for AI inference
  - Raw data retention period (once decided)
  - User rights: access, rectification, erasure, portability
  - Legal basis for processing (explicit consent — Article 6(1)(a) + Article 9(2)(a))

### 4. Record of Processing Activities — Article 30
- Required for any organisation processing special category data
- Must document the pattern processing job as a processing activity:
  - Purpose: generating personalised cycle insights
  - Legal basis: explicit consent
  - Data categories: health data (special category)
  - Retention: raw data deleted after processing; pattern summaries retained
  - Recipients: none if self-hosted; Mistral AI SAS if using Mistral API

### 5. Right to Erasure — Article 17
- Audit that deleting a user account cascades through **all tables**:
  `user_profiles`, `cycles`, `period_logs`, `symptom_logs`, `mood_logs`,
  `daily_notes`, `workout_logs`, `nutrition_logs`, `meal_entries`, `sleep_logs`,
  `fiona_sessions`, `fiona_messages`, `symptom_types`, `workout_types`
  and any future `user_patterns` / pattern summary table
- Add a self-serve "Delete my account" option in account settings

### 6. Data Portability — Article 20
- Users must be able to export all their data (raw logs + pattern summaries)
- A JSON or CSV export is sufficient
- Can be a manual trigger in account settings initially

### 7. Supabase Region Check
- Confirm the Supabase project is on an **EU region** (e.g. `eu-west-1`)
- EU users' data leaving the EU requires Standard Contractual Clauses (SCCs)
- Supabase's DPA covers this — but only if the project is on an EU region

---

## Summary Table

| Area | Status |
|---|---|
| Encryption in transit | Done |
| Encryption at rest | Done |
| Row-level access control | Done |
| Client-side encryption | Not necessary |
| Migrate AI from OpenRouter (US) to EU-hosted model | **Priority** |
| Data minimisation / pattern architecture | In Progress |
| Article 9 consent flow | **Priority** |
| VPS provider DPA | **Priority** |
| Privacy policy (incl. retention period) | **Priority** |
| Record of Processing Activities (Art. 30) | **Priority** |
| Right to erasure (cascade deletes) | **Priority** |
| Data export / portability | **Priority** |
| Supabase EU region | **Check** |

---

*Last reviewed: 2026-04-03*
