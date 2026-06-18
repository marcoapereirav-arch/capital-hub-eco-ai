-- Sistema de comunidades estilo Skool sobre tabla legacy public.communities (bigint id).
-- - Extiende communities con slug + product_key (para mapear a producto comprado)
-- - Seed 3 comunidades canónicas (IA / MBD / CC)
-- - Posts con título + body + categoría + pinned
-- - Reacciones (like/fire/love/clap)
-- - Comentarios anidados (parent_id self-ref)
--
-- Visibilidad por producto:
-- - Alumno REP/COMPANY: SOLO la comunidad del producto que compró
-- - Staff (ADMIN/USER): TODAS las comunidades
-- - Edición/post/comentar: cualquiera autenticado con visibilidad

-- 1. Extender communities legacy
alter table public.communities
  add column if not exists slug text,
  add column if not exists product_key text;

create unique index if not exists communities_slug_uniq on public.communities(slug) where slug is not null;

-- Seed idempotente vía NOT EXISTS (ON CONFLICT no funciona con índice parcial)
insert into public.communities (name, type, slug, product_key, description)
select 'Comunidad IA Integrator', 'ROUTE', 'ia-integrator', 'ia_integrator', 'Espacio IA Integrator: posts, dudas, wins, networking'
where not exists (select 1 from public.communities where slug = 'ia-integrator');

insert into public.communities (name, type, slug, product_key, description)
select 'Comunidad Media Buyer Digital', 'ROUTE', 'media-buyer-digital', 'media_buyer_digital', 'Espacio Media Buyer Digital: campañas, análisis, casos'
where not exists (select 1 from public.communities where slug = 'media-buyer-digital');

insert into public.communities (name, type, slug, product_key, description)
select 'Comunidad Comercial Closing', 'ROUTE', 'comercial-closing', 'comercial_closing', 'Espacio Comercial Closing: scripts, roleplays, cierres'
where not exists (select 1 from public.communities where slug = 'comercial-closing');

-- 2. Posts (uuid id pero FK a communities.id bigint)
create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  community_id bigint not null references public.communities(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  title text,
  body text not null,
  category text not null default 'general',
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists community_posts_community_idx on public.community_posts(community_id, created_at desc);
create index if not exists community_posts_author_idx on public.community_posts(author_id);

alter table public.community_posts
  drop constraint if exists community_posts_category_check;
alter table public.community_posts
  add constraint community_posts_category_check
  check (category = any (array['wins'::text, 'soporte'::text, 'general'::text]));

-- 3. Reacciones
create table if not exists public.community_post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction_type text not null default 'like',
  created_at timestamptz not null default now(),
  unique (post_id, user_id, reaction_type)
);
create index if not exists community_post_reactions_post_idx on public.community_post_reactions(post_id);

alter table public.community_post_reactions
  drop constraint if exists community_post_reactions_type_check;
alter table public.community_post_reactions
  add constraint community_post_reactions_type_check
  check (reaction_type = any (array['like'::text, 'fire'::text, 'love'::text, 'clap'::text]));

-- 4. Comentarios anidados
create table if not exists public.community_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references public.community_post_comments(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists community_post_comments_post_idx on public.community_post_comments(post_id, created_at);
create index if not exists community_post_comments_parent_idx on public.community_post_comments(parent_id);

-- RLS
alter table public.community_posts enable row level security;
alter table public.community_post_reactions enable row level security;
alter table public.community_post_comments enable row level security;

drop policy if exists "posts read auth" on public.community_posts;
create policy "posts read auth" on public.community_posts
  for select to authenticated using (true);

drop policy if exists "posts insert own" on public.community_posts;
create policy "posts insert own" on public.community_posts
  for insert to authenticated with check (author_id = auth.uid());

drop policy if exists "posts update own or staff" on public.community_posts;
create policy "posts update own or staff" on public.community_posts
  for update to authenticated using (
    author_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('super_admin','admin'))
  );

drop policy if exists "posts delete own or staff" on public.community_posts;
create policy "posts delete own or staff" on public.community_posts
  for delete to authenticated using (
    author_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('super_admin','admin'))
  );

drop policy if exists "reactions read auth" on public.community_post_reactions;
create policy "reactions read auth" on public.community_post_reactions
  for select to authenticated using (true);

drop policy if exists "reactions insert own" on public.community_post_reactions;
create policy "reactions insert own" on public.community_post_reactions
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "reactions delete own" on public.community_post_reactions;
create policy "reactions delete own" on public.community_post_reactions
  for delete to authenticated using (user_id = auth.uid());

drop policy if exists "comments read auth" on public.community_post_comments;
create policy "comments read auth" on public.community_post_comments
  for select to authenticated using (true);

drop policy if exists "comments insert own" on public.community_post_comments;
create policy "comments insert own" on public.community_post_comments
  for insert to authenticated with check (author_id = auth.uid());

drop policy if exists "comments delete own or staff" on public.community_post_comments;
create policy "comments delete own or staff" on public.community_post_comments
  for delete to authenticated using (
    author_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('super_admin','admin'))
  );
