-- 004_agency_settings.sql
-- Add website_url and primary_color columns to agencies

ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#000000';
