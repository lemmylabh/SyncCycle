-- ── CRM: Landing page lead capture ───────────────────────────────────────────
-- Run this in the Supabase SQL editor to set up the leads table.

create table if not exists public.leads (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  source     text not null default 'landing',
  created_at timestamptz not null default now()
);

-- Index for fast email lookups / dedup checks
create index if not exists leads_email_idx on public.leads (email);

-- Enable Row Level Security
alter table public.leads enable row level security;

-- Anyone (anon or logged-in) can submit their email — public form
create policy "anon_insert_leads"
  on public.leads
  for insert
  to anon
  with check (true);

create policy "auth_insert_leads"
  on public.leads
  for insert
  to authenticated
  with check (true);

-- Grant table-level permissions
grant insert on public.leads to anon;
grant insert on public.leads to authenticated;

-- Only authenticated users (team / admins) can view leads
create policy "auth_select_leads"
  on public.leads
  for select
  to authenticated
  using (true);

-- Only authenticated users can update or delete leads
create policy "auth_update_leads"
  on public.leads
  for update
  to authenticated
  using (true);

create policy "auth_delete_leads"
  on public.leads
  for delete
  to authenticated
  using (true);
