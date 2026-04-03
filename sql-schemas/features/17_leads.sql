-- =============================================================================
-- SyncCycle — leads table (CRM / Landing page lead capture)
-- Collects email submissions from the public landing page.
-- Anon users can INSERT. Only authenticated users (team) can SELECT/UPDATE/DELETE.
-- Requires: nothing (standalone table)
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.leads (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text        NOT NULL UNIQUE,
  source     text        NOT NULL DEFAULT 'landing',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast email lookups / dedup checks
CREATE INDEX IF NOT EXISTS leads_email_idx ON public.leads (email);

-- RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_leads"  ON public.leads;
DROP POLICY IF EXISTS "auth_insert_leads"  ON public.leads;
DROP POLICY IF EXISTS "auth_select_leads"  ON public.leads;
DROP POLICY IF EXISTS "auth_update_leads"  ON public.leads;
DROP POLICY IF EXISTS "auth_delete_leads"  ON public.leads;

-- Anyone (anon or logged-in) can submit their email — public form
CREATE POLICY "anon_insert_leads"  ON public.leads FOR INSERT TO anon          WITH CHECK (true);
CREATE POLICY "auth_insert_leads"  ON public.leads FOR INSERT TO authenticated WITH CHECK (true);

-- Only authenticated users (team / admins) can read, update, delete
CREATE POLICY "auth_select_leads"  ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_update_leads"  ON public.leads FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_leads"  ON public.leads FOR DELETE TO authenticated USING (true);

-- Grant table-level permissions
GRANT INSERT ON public.leads TO anon;
GRANT INSERT ON public.leads TO authenticated;

COMMIT;
