-- Editable site pages (Home, About) for admin panel
create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null default '',
  body text not null default '',
  updated_at timestamptz not null default now()
);

create index if not exists pages_slug_idx on public.pages (slug);

comment on table public.pages is 'Editable site pages (e.g. home, about) managed via admin.';

-- Seed default Home and About content
insert into public.pages (slug, title, body, updated_at)
values
  (
    'home',
    'operatic',
    'A minimal blog on optimization, linear programming, and decision science.',
    now()
  ),
  (
    'about',
    'About',
    'This is a minimal blog focused on operations research: optimization, linear and integer programming, and decision science.

Built with Next.js, Clerk, and Supabase. Black and white, thin type, no clutter.',
    now()
  )
on conflict (slug) do nothing;
