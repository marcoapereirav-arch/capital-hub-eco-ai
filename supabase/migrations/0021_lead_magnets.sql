-- Lead Magnets — entorno completo (Fase A1 del PRP-005)
-- Ver SOP marketing/06-lead-magnets para diseño completo y rationale.
--
-- Cambios:
--   1. Tabla lead_magnets (CRUD admin de cada lead magnet)
--   2. Tabla lead_magnet_deliveries (pivote: cada entrega individual con JWT + opened tracking)
--   3. ALTER mifge_leads:
--      - CHECK enum añade 'lead' como valor válido
--      - default cambia a 'lead' (la entrada por LM es el flujo más frío)
--      - 3 columnas nuevas: first_touch_lead_magnet_id, lead_source, manychat_subscriber_id
--   4. Trigger updated_at en lead_magnets

-- =========================================
-- 1. lead_magnets (CRUD)
-- =========================================
CREATE TABLE IF NOT EXISTS public.lead_magnets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  delivery_kind text NOT NULL CHECK (delivery_kind IN ('static', 'dynamic')),
  delivery_asset_url text,                -- si static: URL del PDF/imagen en Storage
  delivery_route text,                    -- si dynamic: ruta interna (ej /lm/test-vocacional)
  manychat_keywords text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lm_slug ON public.lead_magnets(slug);
CREATE INDEX IF NOT EXISTS idx_lm_active ON public.lead_magnets(active) WHERE active = true;
-- GIN para búsqueda eficiente de keyword en el array (caso muy común al recibir comments)
CREATE INDEX IF NOT EXISTS idx_lm_keywords ON public.lead_magnets USING GIN (manychat_keywords);

ALTER TABLE public.lead_magnets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage lead_magnets" ON public.lead_magnets;
CREATE POLICY "Admins manage lead_magnets" ON public.lead_magnets
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at_lead_magnets()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lead_magnets_updated_at ON public.lead_magnets;
CREATE TRIGGER trg_lead_magnets_updated_at
BEFORE UPDATE ON public.lead_magnets
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_lead_magnets();

-- =========================================
-- 2. ALTER mifge_leads
-- =========================================
ALTER TABLE public.mifge_leads DROP CONSTRAINT IF EXISTS mifge_leads_pipeline_stage_check;
ALTER TABLE public.mifge_leads ADD CONSTRAINT mifge_leads_pipeline_stage_check
  CHECK (pipeline_stage IN ('lead', 'free_trial', 'agendados', 'no_show', 'no_agendados',
                             'won_ano', 'won_mes', 'pago_fallido', 'beta'));

-- Default cambia a 'lead': la entrada vía LM (canal frío) es el caso más común para inserts nuevos.
-- Los webhooks Whop (upsertLeadStage en /api/whop/webhook) ya asignan stage explícito, no dependen del default.
ALTER TABLE public.mifge_leads ALTER COLUMN pipeline_stage SET DEFAULT 'lead';

ALTER TABLE public.mifge_leads
  ADD COLUMN IF NOT EXISTS first_touch_lead_magnet_id uuid REFERENCES public.lead_magnets(id);
ALTER TABLE public.mifge_leads
  ADD COLUMN IF NOT EXISTS lead_source text;
ALTER TABLE public.mifge_leads DROP CONSTRAINT IF EXISTS mifge_leads_lead_source_check;
ALTER TABLE public.mifge_leads ADD CONSTRAINT mifge_leads_lead_source_check
  CHECK (lead_source IS NULL OR lead_source IN ('manychat', 'web_form', 'api', 'direct_url', 'whop_webhook'));

ALTER TABLE public.mifge_leads
  ADD COLUMN IF NOT EXISTS manychat_subscriber_id text;

-- Unique parcial: solo cuando manychat_subscriber_id no es null (un mismo subscriber = un solo lead)
CREATE UNIQUE INDEX IF NOT EXISTS idx_mifge_leads_manychat_sub
  ON public.mifge_leads(manychat_subscriber_id)
  WHERE manychat_subscriber_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mifge_leads_first_touch_lm
  ON public.mifge_leads(first_touch_lead_magnet_id)
  WHERE first_touch_lead_magnet_id IS NOT NULL;

-- =========================================
-- 3. lead_magnet_deliveries (pivote)
-- =========================================
CREATE TABLE IF NOT EXISTS public.lead_magnet_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.mifge_leads(id) ON DELETE CASCADE,
  lead_magnet_id uuid NOT NULL REFERENCES public.lead_magnets(id) ON DELETE RESTRICT,
  reel_post_id text,                      -- post de IG que generó el opt-in (si lo tenemos)
  reel_comment_id text,                   -- comment específico (granularidad mayor que el post)
  manychat_subscriber_id text,
  jwt_token text NOT NULL,                -- token firmado para acceso a /lm/<slug>?t=<jwt>
  delivered_at timestamptz NOT NULL DEFAULT now(),
  opened_at timestamptz                   -- null hasta que el usuario clica el link
);

CREATE INDEX IF NOT EXISTS idx_lmd_lead ON public.lead_magnet_deliveries(lead_id, delivered_at DESC);
CREATE INDEX IF NOT EXISTS idx_lmd_lm ON public.lead_magnet_deliveries(lead_magnet_id, delivered_at DESC);
CREATE INDEX IF NOT EXISTS idx_lmd_reel_post ON public.lead_magnet_deliveries(reel_post_id) WHERE reel_post_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lmd_subscriber ON public.lead_magnet_deliveries(manychat_subscriber_id) WHERE manychat_subscriber_id IS NOT NULL;

ALTER TABLE public.lead_magnet_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read lead_magnet_deliveries" ON public.lead_magnet_deliveries;
CREATE POLICY "Admins read lead_magnet_deliveries" ON public.lead_magnet_deliveries
  FOR SELECT USING (public.is_admin());

-- Inserts/updates solo via service role (admin client del webhook router) — no hay policy permisiva,
-- el service role bypassea RLS automáticamente.
