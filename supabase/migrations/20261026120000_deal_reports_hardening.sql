-- Migration: harden public.deal_reports against flooding (REC-08)
--
-- The table is written by anonymous visitors and readable only by operators, so
-- every guard has to live in the database: the browser cooldown is per-device
-- and trivially bypassed.
--
-- Two corrections against the shape proposed in the architecture audit:
--   1. The per-slug index already exists as `idx_deal_reports_slug_created`
--      from 20261020210000_deal_reports.sql. Only the global window index is new.
--   2. The note limit stays 280 characters, matching the existing CHECK
--      constraint and the client's own slice(0, 280). A 1000-character limit in
--      the trigger would never be reachable and would read as the real rule.
--
-- Applying this migration is an operator action: it touches production data
-- policies and cannot be verified from the repository.

begin;

-- Global window index: the throttle counts every report in the last hour, which
-- would otherwise scan the whole table on each insert.
create index if not exists idx_deal_reports_created_at
  on public.deal_reports (created_at desc);

-- SECURITY DEFINER so the counting SELECT succeeds even though `anon` holds no
-- SELECT policy on this table.
create or replace function public.deal_reports_throttle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  per_slug integer;
  global_hour integer;
begin
  if char_length(coalesce(new.note, '')) > 280 then
    raise exception 'note_too_long' using errcode = '22001';
  end if;

  select count(*) into per_slug
  from public.deal_reports
  where deal_slug = new.deal_slug
    and created_at > now() - interval '10 minutes';

  if per_slug >= 5 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  select count(*) into global_hour
  from public.deal_reports
  where created_at > now() - interval '1 hour';

  if global_hour >= 300 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

-- The trigger is the only caller. Without this, the function is reachable as
-- POST /rest/v1/rpc/deal_reports_throttle by anyone holding the anon key.
revoke all on function public.deal_reports_throttle() from public;
revoke all on function public.deal_reports_throttle() from anon;
revoke all on function public.deal_reports_throttle() from authenticated;

drop trigger if exists trg_deal_reports_throttle on public.deal_reports;
create trigger trg_deal_reports_throttle
  before insert on public.deal_reports
  for each row
  execute function public.deal_reports_throttle();

commit;
