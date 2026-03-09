-- 002_invite_system.sql
-- Invite-based signup system with admin approval

-- 1. Add columns to agencies table
alter table public.agencies
  add column account_type text not null default 'solo'
    check (account_type in ('solo', 'team')),
  add column status text not null default 'active'
    check (status in ('active', 'suspended'));

-- 2. Create invite_requests table (no RLS — service role only)
create table public.invite_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  account_type text not null check (account_type in ('solo', 'team')),
  company text,
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- 3. Create invites table (no RLS — service role only)
create table public.invites (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.invite_requests(id),
  email text not null,
  account_type text not null,
  token uuid not null unique default gen_random_uuid(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_at timestamptz,
  created_at timestamptz not null default now()
);

-- 4. Create active_sessions table (no RLS — service role only)
create table public.active_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  agency_id uuid not null references public.agencies(id) on delete cascade,
  session_token text not null,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_invite_requests_status on public.invite_requests(status);
create index idx_invite_requests_email on public.invite_requests(email);
create index idx_invites_token on public.invites(token);
create index idx_invites_email on public.invites(email);
create index idx_active_sessions_user_id on public.active_sessions(user_id);
create index idx_active_sessions_session_token on public.active_sessions(session_token);
