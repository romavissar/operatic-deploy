-- Store commenter email so we can display it when Clerk name lookup fails
alter table public.comments
  add column if not exists author_email text;

comment on column public.comments.author_email is 'Primary email of the comment author (from Clerk at write time).';
