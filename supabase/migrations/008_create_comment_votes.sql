-- Upvotes/downvotes on comments (one vote per user per comment: 1 = up, -1 = down)
create table if not exists public.comment_votes (
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id text not null,
  vote smallint not null check (vote in (1, -1)),
  primary key (comment_id, user_id)
);

create index if not exists comment_votes_comment_id_idx on public.comment_votes (comment_id);

comment on table public.comment_votes is 'Votes on comments; user_id is Clerk user id, vote is 1 (up) or -1 (down).';
