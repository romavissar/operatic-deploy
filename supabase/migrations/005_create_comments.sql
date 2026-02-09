-- Comments on blog posts
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id text not null,
  author_name text not null default '',
  author_image_url text,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists comments_post_id_idx on public.comments (post_id);
create index if not exists comments_created_at_idx on public.comments (created_at asc);

comment on table public.comments is 'Comments on blog posts; author info from Clerk at write time.';
