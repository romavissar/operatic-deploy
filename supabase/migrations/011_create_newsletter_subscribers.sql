-- Newsletter subscribers (email signup). confirmed_at null = unconfirmed (double opt-in).
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create index if not exists idx_newsletter_subscribers_email on public.newsletter_subscribers (email);
create index if not exists idx_newsletter_subscribers_confirmed on public.newsletter_subscribers (confirmed_at) where confirmed_at is not null;

comment on table public.newsletter_subscribers is 'Newsletter email signups; confirmed_at set when subscribed (or after double opt-in).';
