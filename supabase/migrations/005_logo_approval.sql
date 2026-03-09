-- 005_logo_approval.sql
-- Add logo approval workflow columns to agencies

ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS logo_original_url text,
  ADD COLUMN IF NOT EXISTS logo_pending_url text,
  ADD COLUMN IF NOT EXISTS logo_status text
    DEFAULT 'none'
    CHECK (logo_status IN ('none', 'pending', 'approved', 'rejected'));

-- logo_url = approved logo (already exists)
-- logo_original_url = original upload before background removal
-- logo_pending_url = processed PNG awaiting approval
-- logo_status = current state
