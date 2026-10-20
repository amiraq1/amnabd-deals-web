-- Migration: Deal Reports (Phase 4.1)
-- Stores structured user reports about deals (expired, terms changed, broken link, card requirement changed)

create table if not exists public.deal_reports (
  id uuid primary key default gen_random_uuid(),
  deal_slug text not null check (char_length(deal_slug) between 2 and 120),
  reason text not null check (reason in ('expired', 'card_changed', 'terms_changed', 'broken_link')),
  note text check (note is null or char_length(note) <= 280),
  created_at timestamptz not null default now()
);

create index if not exists idx_deal_reports_slug_created
  on public.deal_reports (deal_slug, created_at desc);

alter table public.deal_reports enable row level security;

-- Policy: Allow anonymous users and authenticated users to insert reports only.
-- Reading or modifying reports is restricted to administrative/service roles.
create policy "Allow anonymous insert on deal_reports"
  on public.deal_reports
  for insert
  to anon, authenticated
  with check (
    char_length(deal_slug) between 2 and 120
    and reason in ('expired', 'card_changed', 'terms_changed', 'broken_link')
    and (note is null or char_length(note) <= 280)
  );
