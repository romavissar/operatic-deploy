-- Tags for blog posts
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique
);

create index if not exists tags_slug_idx on public.tags (slug);

-- Post–tag many-to-many
create table if not exists public.post_tags (
  post_id uuid not null references public.posts(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (post_id, tag_id)
);

create index if not exists post_tags_tag_id_idx on public.post_tags (tag_id);

comment on table public.tags is 'Tags for categorizing posts.';
comment on table public.post_tags is 'Junction: which tags are assigned to each post.';
