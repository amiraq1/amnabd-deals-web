-- Migration: F-02 — enforce referential integrity on deal_reports.deal_slug
-- A report for a non-existent deal slug is meaningless and wastes the
-- browser-side 24-hour cooldown slot. This migration adds a FK so the
-- database rejects such INSERTs with 23503 before they reach the table.

begin;

-- Step 1: make deals.slug unique so it can be a FK target.
-- IF NOT EXISTS is not available for constraints; use DO block instead.
do $$
begin
  if not exists (
    select 1
    from   pg_constraint
    where  conrelid = 'public.deals'::regclass
    and    contype  = 'u'
    and    conname  = 'deals_slug_unique'
  ) then
    alter table public.deals
      add constraint deals_slug_unique unique (slug);
  end if;
end
$$;

-- Step 2: add the FK on deal_reports. Drop first so the migration is
-- re-runnable (ALTER TABLE ADD CONSTRAINT has no IF NOT EXISTS).
alter table public.deal_reports
  drop constraint if exists deal_reports_slug_fk;

alter table public.deal_reports
  add constraint deal_reports_slug_fk
  foreign key (deal_slug)
  references public.deals (slug)
  on update cascade
  on delete restrict;

commit;
