-- 009_general_content.sql
-- General Content Generation module

CREATE TABLE public.content_generations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id uuid REFERENCES public.agencies(id)
    ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id)
    ON DELETE CASCADE,
  created_by uuid REFERENCES public.users(id),

  content_category text NOT NULL
    CHECK (content_category IN ('seo','ads','email','social')),
  content_type text NOT NULL,
  input_params jsonb NOT NULL DEFAULT '{}',
  output text NOT NULL,
  word_count integer,

  -- Ad creative specific
  creative_image_url text,
  creative_design_brief text,
  creative_storage_path text,

  status text DEFAULT 'completed',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.content_generations
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency members can manage content"
  ON public.content_generations FOR ALL
  USING (
    agency_id IN (
      SELECT agency_id FROM public.users
      WHERE id = auth.uid()
    )
  );

-- Storage bucket for ad creatives
INSERT INTO storage.buckets (id, name, public)
VALUES ('creatives', 'creatives', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Agency members can upload creatives"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'creatives'
    AND (storage.foldername(name))[1] IN (
      SELECT agency_id::text FROM public.users
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Agency members can read creatives"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'creatives'
    AND (storage.foldername(name))[1] IN (
      SELECT agency_id::text FROM public.users
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Agency members can delete creatives"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'creatives'
    AND (storage.foldername(name))[1] IN (
      SELECT agency_id::text FROM public.users
      WHERE id = auth.uid()
    )
  );
