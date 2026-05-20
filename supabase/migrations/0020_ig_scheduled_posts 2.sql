-- Calendario de publicación de Instagram
-- Cada fila = un post planeado. Cron de Edge Function publica vía Meta Graph cuando llega su hora.

CREATE TABLE IF NOT EXISTS public.ig_scheduled_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  scheduled_for timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'publishing', 'published', 'failed')),
  media_type text NOT NULL DEFAULT 'reel'
    CHECK (media_type IN ('reel', 'image', 'carousel', 'story')),
  caption text,
  media_url text,
  thumbnail_url text,
  ig_media_id text,
  script_id uuid REFERENCES public.ci_scripts(id) ON DELETE SET NULL,
  publish_error text,
  published_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ig_sched_scheduled
  ON public.ig_scheduled_posts(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_ig_sched_status
  ON public.ig_scheduled_posts(status);
CREATE INDEX IF NOT EXISTS idx_ig_sched_user
  ON public.ig_scheduled_posts(user_id);

ALTER TABLE public.ig_scheduled_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read schedule" ON public.ig_scheduled_posts;
CREATE POLICY "Admins read schedule" ON public.ig_scheduled_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins write schedule" ON public.ig_scheduled_posts;
CREATE POLICY "Admins write schedule" ON public.ig_scheduled_posts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE OR REPLACE FUNCTION public.touch_ig_scheduled_posts_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ig_scheduled_posts_updated_at ON public.ig_scheduled_posts;
CREATE TRIGGER trg_ig_scheduled_posts_updated_at
  BEFORE UPDATE ON public.ig_scheduled_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_ig_scheduled_posts_updated_at();
