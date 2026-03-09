-- ============================================================
-- AI Marketing Command Center — Initial Schema
-- ============================================================
-- Order: trigger function → tables/indexes/triggers → RLS helpers → RLS policies → storage

-- ────────────────────────────────────────────────────────────
-- 1. TRIGGER FUNCTION
-- ────────────────────────────────────────────────────────────

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- 2. TABLES, INDEXES, TRIGGERS
-- ============================================================

-- ── AGENCIES ────────────────────────────────────────────────

create table public.agencies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  logo_url    text,
  stripe_customer_id text unique,
  plan        text not null default 'free'
              check (plan in ('free','starter','growth','agency','scale','enterprise')),
  onboarding_completed boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger agencies_updated_at
  before update on public.agencies
  for each row execute function public.handle_updated_at();

-- ── USERS ───────────────────────────────────────────────────

create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  agency_id   uuid not null references public.agencies(id) on delete cascade,
  email       text not null,
  full_name   text,
  role        text not null default 'member'
              check (role in ('owner','admin','member')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_users_agency_id on public.users(agency_id);

create trigger users_updated_at
  before update on public.users
  for each row execute function public.handle_updated_at();

-- ── CLIENTS ─────────────────────────────────────────────────

create table public.clients (
  id          uuid primary key default gen_random_uuid(),
  agency_id   uuid not null references public.agencies(id) on delete cascade,
  name        text not null,
  website_url text,
  industry    text,
  logo_url    text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_clients_agency_id on public.clients(agency_id);

create trigger clients_updated_at
  before update on public.clients
  for each row execute function public.handle_updated_at();

-- ── BRAND CONTEXT ───────────────────────────────────────────

create table public.brand_context (
  id                  uuid primary key default gen_random_uuid(),
  client_id           uuid not null unique references public.clients(id) on delete cascade,
  agency_id           uuid not null references public.agencies(id) on delete cascade,
  voice               text,
  icp                 text,
  services            jsonb default '[]'::jsonb,
  competitors         jsonb default '[]'::jsonb,
  keywords            jsonb default '[]'::jsonb,
  goals               text,
  additional_context  text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_brand_context_agency_id on public.brand_context(agency_id);

create trigger brand_context_updated_at
  before update on public.brand_context
  for each row execute function public.handle_updated_at();

-- ── AUDIT RUNS ──────────────────────────────────────────────

create table public.audit_runs (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.clients(id) on delete cascade,
  agency_id     uuid not null references public.agencies(id) on delete cascade,
  type          text not null
                check (type in ('full','seo','content','technical','competitors','conversion')),
  status        text not null default 'pending'
                check (status in ('pending','running','completed','failed')),
  started_at    timestamptz,
  completed_at  timestamptz,
  error_message text,
  created_at    timestamptz not null default now()
);

create index idx_audit_runs_client_agency on public.audit_runs(client_id, agency_id);

-- ── AUDIT RESULTS ───────────────────────────────────────────

create table public.audit_results (
  id              uuid primary key default gen_random_uuid(),
  audit_run_id    uuid not null references public.audit_runs(id) on delete cascade,
  agency_id       uuid not null references public.agencies(id) on delete cascade,
  dimension       text not null
                  check (dimension in ('seo','content','technical','competitors','conversion')),
  score           integer check (score >= 0 and score <= 100),
  findings        jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  raw_output      text,
  tokens_used     integer not null default 0,
  created_at      timestamptz not null default now()
);

create index idx_audit_results_run_id on public.audit_results(audit_run_id);

-- ── GENERATED CONTENT ───────────────────────────────────────

create table public.generated_content (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients(id) on delete cascade,
  agency_id   uuid not null references public.agencies(id) on delete cascade,
  type        text not null
              check (type in ('copy','email','social','ad','landing_page','blog','custom')),
  prompt      text,
  output      text not null,
  tokens_used integer not null default 0,
  created_at  timestamptz not null default now()
);

create index idx_generated_content_client_agency on public.generated_content(client_id, agency_id);

-- ── REPORT EXPORTS ──────────────────────────────────────────

create table public.report_exports (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.clients(id) on delete cascade,
  agency_id     uuid not null references public.agencies(id) on delete cascade,
  audit_run_id  uuid references public.audit_runs(id) on delete set null,
  title         text not null,
  pdf_url       text not null,
  storage_path  text not null,
  delivered_at  timestamptz,
  created_at    timestamptz not null default now()
);

create index idx_report_exports_client on public.report_exports(client_id);

-- ── SUBSCRIPTIONS ───────────────────────────────────────────

create table public.subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  agency_id               uuid not null unique references public.agencies(id) on delete cascade,
  stripe_subscription_id  text unique,
  stripe_price_id         text not null,
  plan                    text not null
                          check (plan in ('free','starter','growth','agency','scale','enterprise')),
  status                  text not null
                          check (status in ('active','past_due','canceled','trialing','incomplete')),
  current_period_start    timestamptz,
  current_period_end      timestamptz,
  cancel_at_period_end    boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.handle_updated_at();

-- ============================================================
-- 3. RLS HELPER FUNCTIONS (after users table exists)
-- ============================================================

create or replace function public.get_user_agency_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select agency_id from public.users where id = auth.uid()
$$;

create or replace function public.get_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.users where id = auth.uid()
$$;

-- ============================================================
-- 4. ENABLE RLS + POLICIES
-- ============================================================

-- ── AGENCIES POLICIES ───────────────────────────────────────

alter table public.agencies enable row level security;

create policy "agencies_select" on public.agencies
  for select using (id = public.get_user_agency_id());

create policy "agencies_update" on public.agencies
  for update using (
    id = public.get_user_agency_id()
    and public.get_user_role() = 'owner'
  );

-- ── USERS POLICIES ──────────────────────────────────────────

alter table public.users enable row level security;

create policy "users_select" on public.users
  for select using (agency_id = public.get_user_agency_id());

create policy "users_update_own" on public.users
  for update using (id = auth.uid());

create policy "users_update_owner" on public.users
  for update using (
    agency_id = public.get_user_agency_id()
    and public.get_user_role() = 'owner'
  );

create policy "users_delete_owner" on public.users
  for delete using (
    agency_id = public.get_user_agency_id()
    and public.get_user_role() = 'owner'
    and id != auth.uid()
  );

-- ── CLIENTS POLICIES ────────────────────────────────────────

alter table public.clients enable row level security;

create policy "clients_select" on public.clients
  for select using (agency_id = public.get_user_agency_id());

create policy "clients_insert" on public.clients
  for insert with check (agency_id = public.get_user_agency_id());

create policy "clients_update" on public.clients
  for update using (agency_id = public.get_user_agency_id());

create policy "clients_delete" on public.clients
  for delete using (agency_id = public.get_user_agency_id());

-- ── BRAND CONTEXT POLICIES ──────────────────────────────────

alter table public.brand_context enable row level security;

create policy "brand_context_select" on public.brand_context
  for select using (agency_id = public.get_user_agency_id());

create policy "brand_context_insert" on public.brand_context
  for insert with check (agency_id = public.get_user_agency_id());

create policy "brand_context_update" on public.brand_context
  for update using (agency_id = public.get_user_agency_id());

create policy "brand_context_delete" on public.brand_context
  for delete using (
    agency_id = public.get_user_agency_id()
    and public.get_user_role() in ('owner','admin')
  );

-- ── AUDIT RUNS POLICIES ────────────────────────────────────

alter table public.audit_runs enable row level security;

create policy "audit_runs_select" on public.audit_runs
  for select using (agency_id = public.get_user_agency_id());

create policy "audit_runs_insert" on public.audit_runs
  for insert with check (agency_id = public.get_user_agency_id());

create policy "audit_runs_update" on public.audit_runs
  for update using (agency_id = public.get_user_agency_id());

-- ── AUDIT RESULTS POLICIES ──────────────────────────────────

alter table public.audit_results enable row level security;

create policy "audit_results_select" on public.audit_results
  for select using (agency_id = public.get_user_agency_id());

create policy "audit_results_insert" on public.audit_results
  for insert with check (agency_id = public.get_user_agency_id());

create policy "audit_results_update" on public.audit_results
  for update using (agency_id = public.get_user_agency_id());

-- ── GENERATED CONTENT POLICIES ──────────────────────────────

alter table public.generated_content enable row level security;

create policy "generated_content_select" on public.generated_content
  for select using (agency_id = public.get_user_agency_id());

create policy "generated_content_insert" on public.generated_content
  for insert with check (agency_id = public.get_user_agency_id());

create policy "generated_content_update" on public.generated_content
  for update using (agency_id = public.get_user_agency_id());

create policy "generated_content_delete" on public.generated_content
  for delete using (agency_id = public.get_user_agency_id());

-- ── REPORT EXPORTS POLICIES ────────────────────────────────

alter table public.report_exports enable row level security;

create policy "report_exports_select" on public.report_exports
  for select using (agency_id = public.get_user_agency_id());

create policy "report_exports_insert" on public.report_exports
  for insert with check (agency_id = public.get_user_agency_id());

create policy "report_exports_delete" on public.report_exports
  for delete using (
    agency_id = public.get_user_agency_id()
    and public.get_user_role() in ('owner','admin')
  );

-- ── SUBSCRIPTIONS POLICIES ──────────────────────────────────

alter table public.subscriptions enable row level security;

create policy "subscriptions_select" on public.subscriptions
  for select using (agency_id = public.get_user_agency_id());

-- INSERT/UPDATE/DELETE on subscriptions is service-role only (Stripe webhooks).
-- No additional policies needed — RLS blocks all non-select for anon/authenticated.

-- ============================================================
-- 5. STORAGE BUCKETS
-- ============================================================

insert into storage.buckets (id, name, public)
values
  ('reports', 'reports', false),
  ('logos', 'logos', true);

-- Reports bucket: only agency members can read their own reports
create policy "reports_select" on storage.objects
  for select using (
    bucket_id = 'reports'
    and (storage.foldername(name))[1] = public.get_user_agency_id()::text
  );

create policy "reports_insert" on storage.objects
  for insert with check (
    bucket_id = 'reports'
    and (storage.foldername(name))[1] = public.get_user_agency_id()::text
  );

-- Logos bucket: agency members can upload their own logos, public read
create policy "logos_select" on storage.objects
  for select using (bucket_id = 'logos');

create policy "logos_insert" on storage.objects
  for insert with check (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = public.get_user_agency_id()::text
  );

create policy "logos_update" on storage.objects
  for update using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = public.get_user_agency_id()::text
  );
