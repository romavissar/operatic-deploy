-- Newsletter sends: post-based or custom, scheduled or sent.
create table if not exists public.newsletter_sends (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  body_html text,
  body_text text,
  post_id uuid references public.posts (id) on delete set null,
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_newsletter_sends_scheduled on public.newsletter_sends (scheduled_at) where sent_at is null;
create index if not exists idx_newsletter_sends_sent_at on public.newsletter_sends (sent_at);

comment on table public.newsletter_sends is 'Newsletter send jobs; sent_at null means not yet sent (scheduled or draft).';
