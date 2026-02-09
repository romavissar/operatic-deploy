-- Add author to posts (Clerk user email)
alter table public.posts
  add column if not exists author_email text;

comment on column public.posts.author_email is 'Email of the post author (from Clerk).';
