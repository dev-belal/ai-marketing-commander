-- 003_roles_update.sql
-- Expanded role system and team member invite support

-- 1. Update role constraint on users table
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('owner', 'admin', 'lead', 'member'));

-- 2. Add team member invite columns to invite_requests
ALTER TABLE public.invite_requests
  ADD COLUMN invited_by uuid REFERENCES public.agencies(id),
  ADD COLUMN assigned_role text CHECK (assigned_role IN ('lead', 'member'));
