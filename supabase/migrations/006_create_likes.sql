-- Likes on blog posts (one like per user per post)
create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id text not null,
  created_at timestamptz not null default now(),
  unique(post_id, user_id)
);

create index if not exists likes_post_id_idx on public.likes (post_id);
create index if not exists likes_user_id_idx on public.likes (user_id);

comment on table public.likes is 'Likes on blog posts; user_id is Clerk user id.';
