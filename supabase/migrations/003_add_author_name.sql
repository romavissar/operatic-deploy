-- Display name for post author (first + last from Clerk)
alter table public.posts
  add column if not exists author_name text;

comment on column public.posts.author_name is 'Display name of the post author (first + last from Clerk).';
