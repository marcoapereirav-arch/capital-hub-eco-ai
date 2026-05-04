-- ManyChat — DMs de Instagram (suscriptores, tags, custom fields, eventos)
-- Sigue el patron de ghl_raw_cache: cache compartida lectura admin, escritura via service role.

-- =========================================
-- Extender CHECK constraints para incluir 'manychat'
-- =========================================
ALTER TABLE public.api_connections DROP CONSTRAINT IF EXISTS api_connections_platform_check;
ALTER TABLE public.api_connections ADD CONSTRAINT api_connections_platform_check
  CHECK (platform IN ('ghl', 'meta_ads', 'youtube', 'instagram', 'manychat'));

ALTER TABLE public.metrics_cache DROP CONSTRAINT IF EXISTS metrics_cache_platform_check;
ALTER TABLE public.metrics_cache ADD CONSTRAINT metrics_cache_platform_check
  CHECK (platform IN ('ghl', 'meta_ads', 'youtube', 'instagram', 'manychat'));

-- =========================================
-- SUBSCRIBERS (cada usuario que ha hablado con tu IG via ManyChat)
-- =========================================
CREATE TABLE IF NOT EXISTS public.manychat_subscribers_cache (
  id text PRIMARY KEY,
  page_id text,
  name text,
  first_name text,
  last_name text,
  gender text,
  profile_pic text,
  locale text,
  language text,
  timezone text,
  ig_username text,
  ig_id text,
  last_input_text text,
  last_interaction_at timestamptz,
  last_seen_at timestamptz,
  subscribed_at timestamptz,
  status text,
  optin_fb boolean DEFAULT false,
  optin_email boolean DEFAULT false,
  optin_sms boolean DEFAULT false,
  optin_whatsapp boolean DEFAULT false,
  tags text[] DEFAULT '{}'::text[],
  custom_fields jsonb DEFAULT '{}'::jsonb,
  synced_at timestamptz DEFAULT now(),
  raw jsonb
);

CREATE INDEX IF NOT EXISTS idx_mc_subs_last_interaction
  ON public.manychat_subscribers_cache(last_interaction_at DESC);
CREATE INDEX IF NOT EXISTS idx_mc_subs_subscribed
  ON public.manychat_subscribers_cache(subscribed_at DESC);
CREATE INDEX IF NOT EXISTS idx_mc_subs_status
  ON public.manychat_subscribers_cache(status);
CREATE INDEX IF NOT EXISTS idx_mc_subs_ig_username
  ON public.manychat_subscribers_cache(ig_username);

ALTER TABLE public.manychat_subscribers_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read manychat subscribers" ON public.manychat_subscribers_cache;
CREATE POLICY "Admins read manychat subscribers" ON public.manychat_subscribers_cache
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- =========================================
-- TAGS (etiquetas globales de la pagina)
-- =========================================
CREATE TABLE IF NOT EXISTS public.manychat_tags_cache (
  id text PRIMARY KEY,
  name text NOT NULL,
  synced_at timestamptz DEFAULT now()
);

ALTER TABLE public.manychat_tags_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read manychat tags" ON public.manychat_tags_cache;
CREATE POLICY "Admins read manychat tags" ON public.manychat_tags_cache
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- =========================================
-- CUSTOM FIELDS (definiciones de campos personalizados)
-- =========================================
CREATE TABLE IF NOT EXISTS public.manychat_custom_fields_cache (
  id text PRIMARY KEY,
  name text NOT NULL,
  type text,
  description text,
  synced_at timestamptz DEFAULT now()
);

ALTER TABLE public.manychat_custom_fields_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read manychat custom fields" ON public.manychat_custom_fields_cache;
CREATE POLICY "Admins read manychat custom fields" ON public.manychat_custom_fields_cache
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- =========================================
-- EVENTS (log de eventos via webhooks de ManyChat)
-- subscriber_added, tag_added, tag_removed, flow_triggered, message_sent, etc.
-- =========================================
CREATE TABLE IF NOT EXISTS public.manychat_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id text,
  event_type text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  received_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mc_events_subscriber
  ON public.manychat_events(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_mc_events_type
  ON public.manychat_events(event_type);
CREATE INDEX IF NOT EXISTS idx_mc_events_received
  ON public.manychat_events(received_at DESC);

ALTER TABLE public.manychat_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read manychat events" ON public.manychat_events;
CREATE POLICY "Admins read manychat events" ON public.manychat_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
