-- 006_seo_blog_generator.sql
-- SEO Blog Generator pipeline table

CREATE TABLE public.seo_blog_runs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id uuid REFERENCES public.agencies(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  created_by uuid REFERENCES public.users(id),

  -- Inputs
  website_url text NOT NULL,
  target_keyword text NOT NULL,

  -- Pipeline outputs
  supporting_keywords text[],
  blog_title text,
  content_outline text,
  blog_html text,
  word_count integer,
  title_tag text,
  meta_description text,
  slug text,
  schema_markup text,

  -- QA
  qa_passed boolean DEFAULT false,
  qa_issues jsonb DEFAULT '[]',
  qa_score integer DEFAULT 0,
  revision_applied boolean DEFAULT false,

  -- Status
  status text DEFAULT 'pending'
    CHECK (status IN (
      'pending','researching','writing',
      'qa_check','revising','complete','failed'
    )),
  error_message text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.seo_blog_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency members can manage blog runs"
  ON public.seo_blog_runs FOR ALL
  USING (agency_id = get_user_agency_id(auth.uid()));
