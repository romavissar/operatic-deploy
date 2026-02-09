-- Posts table for Operations Research blog
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  published_at timestamptz not null default now(),
  excerpt text not null default '',
  content text not null default '',
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_slug_idx on public.posts (slug);
create index if not exists posts_published_at_idx on public.posts (published_at desc);
create index if not exists posts_published_idx on public.posts (published) where published = true;

comment on table public.posts is 'Blog posts; only published posts are visible to non-admins.';
