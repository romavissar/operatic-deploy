-- Allow comments to be replies to another comment
alter table public.comments
  add column if not exists parent_id uuid references public.comments(id) on delete cascade;

create index if not exists comments_parent_id_idx on public.comments (parent_id);

comment on column public.comments.parent_id is 'When set, this comment is a reply to the comment with this id.';
