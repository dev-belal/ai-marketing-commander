-- 007_add_humanizing_status.sql
-- Add 'humanizing' to seo_blog_runs status check constraint

ALTER TABLE public.seo_blog_runs
  DROP CONSTRAINT IF EXISTS seo_blog_runs_status_check;

ALTER TABLE public.seo_blog_runs
  ADD CONSTRAINT seo_blog_runs_status_check
  CHECK (status IN (
    'pending','researching','writing','humanizing',
    'qa_check','revising','complete','failed'
  ));
