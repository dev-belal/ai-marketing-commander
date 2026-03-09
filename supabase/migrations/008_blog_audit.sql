-- 008_blog_audit.sql
-- Blog Audit feature — audits live published blog URLs for SEO quality

CREATE TABLE public.blog_audit_runs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id uuid REFERENCES public.agencies(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  created_by uuid REFERENCES public.users(id),

  -- Inputs
  page_url text NOT NULL,
  target_keyword text NOT NULL,

  -- Scraped data
  page_title text,
  meta_description text,
  h1 text,
  word_count integer,

  -- Audit results
  overall_score integer DEFAULT 0,
  qa_issues jsonb DEFAULT '[]',

  -- Extended checks (beyond QA engine)
  has_schema boolean DEFAULT false,
  schema_type text,
  canonical_url text,
  has_canonical boolean DEFAULT false,
  internal_link_count integer DEFAULT 0,
  external_link_count integer DEFAULT 0,
  image_count integer DEFAULT 0,
  images_missing_alt integer DEFAULT 0,
  keyword_count integer DEFAULT 0,
  h2_count integer DEFAULT 0,
  h3_count integer DEFAULT 0,

  -- AI recommendations
  recommendations text,
  priority_fixes jsonb DEFAULT '[]',

  status text DEFAULT 'pending'
    CHECK (status IN ('pending','scraping','analyzing','complete','failed')),
  error_message text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.blog_audit_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency members can manage blog audits"
  ON public.blog_audit_runs FOR ALL
  USING (
    agency_id IN (
      SELECT agency_id FROM public.users
      WHERE id = auth.uid()
    )
  );

