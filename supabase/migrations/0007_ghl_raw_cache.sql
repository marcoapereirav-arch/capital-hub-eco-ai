-- Raw cache tables for GHL data
-- Guardamos opps individuales para poder filtrar por fechas, pipeline, etc.

-- =========================================
-- PIPELINES (funnels de GHL)
-- =========================================
CREATE TABLE IF NOT EXISTS public.ghl_pipelines_cache (
  id text PRIMARY KEY,
  name text NOT NULL,
  stages jsonb DEFAULT '[]'::jsonb,
  synced_at timestamptz DEFAULT now()
);

ALTER TABLE public.ghl_pipelines_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read pipelines" ON public.ghl_pipelines_cache;
CREATE POLICY "Admins read pipelines" ON public.ghl_pipelines_cache
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- =========================================
-- OPPORTUNITIES (cada oportunidad de GHL)
-- =========================================
CREATE TABLE IF NOT EXISTS public.ghl_opportunities_cache (
  id text PRIMARY KEY,
  pipeline_id text,
  pipeline_stage_id text,
  contact_id text,
  name text,
  status text,
  monetary_value numeric DEFAULT 0,
  source text,
  tags text[] DEFAULT '{}'::text[],
  opp_created_at timestamptz,
  opp_updated_at timestamptz,
  synced_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ghl_opps_pipeline ON public.ghl_opportunities_cache(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_ghl_opps_status ON public.ghl_opportunities_cache(status);
CREATE INDEX IF NOT EXISTS idx_ghl_opps_created ON public.ghl_opportunities_cache(opp_created_at DESC);

ALTER TABLE public.ghl_opportunities_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read opps" ON public.ghl_opportunities_cache;
CREATE POLICY "Admins read opps" ON public.ghl_opportunities_cache
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- =========================================
-- CONTACTS (leads, customers, etc.)
-- =========================================
CREATE TABLE IF NOT EXISTS public.ghl_contacts_cache (
  id text PRIMARY KEY,
  type text,
  tags text[] DEFAULT '{}'::text[],
  source text,
  contact_created_at timestamptz,
  synced_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ghl_contacts_type ON public.ghl_contacts_cache(type);
CREATE INDEX IF NOT EXISTS idx_ghl_contacts_created ON public.ghl_contacts_cache(contact_created_at DESC);

ALTER TABLE public.ghl_contacts_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read contacts" ON public.ghl_contacts_cache;
CREATE POLICY "Admins read contacts" ON public.ghl_contacts_cache
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
