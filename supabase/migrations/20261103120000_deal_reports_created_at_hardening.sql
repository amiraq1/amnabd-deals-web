-- Migration: deal reports created_at enforcement, global advisory lock, and column-level grant hardening
--
-- 1. Enforces NEW.created_at := pg_catalog.now() before any COUNT in the throttle trigger.
--    This prevents client-side timestamp spoofing from bypassing rate limits or manipulating report chronology.
-- 2. Adds global advisory transaction lock pg_catalog.pg_advisory_xact_lock(74839201) to serialize
--    global rate limit evaluations across concurrent transactions.
-- 3. Hardens function with SECURITY DEFINER SET search_path = pg_catalog.
-- 4. Revokes table-level INSERT on public.deal_reports from anon and authenticated, then grants
--    only (deal_slug, reason, note) to both client-facing roles, preserving service_role access.

begin;

create or replace function public.deal_reports_throttle()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  per_slug integer;
  global_hour integer;
begin
  -- Enforce server timestamp before any limit counting to prevent spoofed created_at
  new.created_at := pg_catalog.now();

  if char_length(coalesce(new.note, '')) > 280 then
    raise exception 'note_too_long' using errcode = '22001';
  end if;

  -- Global advisory transaction lock to serialize rate evaluation
  perform pg_catalog.pg_advisory_xact_lock(74839201);

  -- Per-slug advisory lock to serialize concurrent inserts for the same deal slug
  perform pg_catalog.pg_advisory_xact_lock(hashtext('deal_reports:' || coalesce(new.deal_slug, '')));

  select count(*) into per_slug
  from (
    select 1
    from public.deal_reports
    where deal_slug = new.deal_slug
      and created_at > pg_catalog.now() - interval '10 minutes'
    limit 5
  ) recent_slug_reports;

  if per_slug >= 5 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  select count(*) into global_hour
  from (
    select 1
    from public.deal_reports
    where created_at > pg_catalog.now() - interval '1 hour'
    limit 300
  ) recent_global_reports;

  if global_hour >= 300 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

-- Ensure execution is restricted strictly to the trigger
revoke all on function public.deal_reports_throttle() from public;
revoke all on function public.deal_reports_throttle() from anon;
revoke all on function public.deal_reports_throttle() from authenticated;
revoke all on function public.deal_reports_throttle() from service_role;

-- Replace trigger
drop trigger if exists trg_deal_reports_throttle on public.deal_reports;
create trigger trg_deal_reports_throttle
  before insert on public.deal_reports
  for each row
  execute function public.deal_reports_throttle();

-- Remove table-level client inserts so clients cannot supply id or created_at.
-- Keep report submission available to both client-facing roles using only these columns.
revoke insert on table public.deal_reports from anon, authenticated;
grant insert (deal_slug, reason, note) on table public.deal_reports to anon, authenticated;

-- Preserve service_role table access
grant all on table public.deal_reports to service_role;

commit;
