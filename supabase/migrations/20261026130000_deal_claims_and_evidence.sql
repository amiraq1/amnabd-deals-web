/*
# Deal claims and per-claim evidence

Replaces the "official_sources holds every claim" model (where a claim was a
free-text paragraph and the evidence was the source link itself) with one row per
claim and one row per piece of evidence.

Approved design decisions:
- `deal_slug` references `deals(slug)` ON UPDATE CASCADE / ON DELETE RESTRICT.
  Deleting a deal must not erase its review history; delete is refused instead.
- `claim_key` is a closed vocabulary (CHECK), `claim_type` one of six.
- One claim per (deal_slug, claim_key, variant_key).
- Evidence is never deleted; an older row is marked with `superseded_at`.
- `review_decision` is the reviewer's call. `evidence_status` and
  `is_publishable` are derived in SQL and never written by a human.
- A claim is published only when it is accepted AND its current evidence
  supports it AND nothing current contradicts it.
- Public read: publishable claims and their evidence. No public writes.

Not applied. Review, then run against a staging project first.
*/

-- 1. Claims ---------------------------------------------------------------

create table if not exists public.deal_claims (
  id uuid primary key default gen_random_uuid(),
  deal_slug text not null
    references public.deals (slug) on update cascade on delete restrict,
  claim_key text not null,
  claim_type text not null,
  -- Distinguishes repeated claims of the same kind (e.g. two benefits).
  variant_key text not null default '',
  claim_value jsonb not null,
  display_text_ar text,
  display_text_en text,
  review_decision text not null default 'pending',
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint deal_claims_key_vocabulary check (
    claim_key in (
      'price.amount',
      'price.currency',
      'price.billing_cycle',
      'eligibility.card_required',
      'eligibility.student_status',
      'eligibility.new_account',
      'eligibility.applicant_type',
      'eligibility.open_to_all',
      'eligibility.countries',
      'benefit.amount',
      'benefit.duration',
      'quota.tokens_per_day',
      'apps.maximum',
      'registration.deadline',
      'offer.status'
    )
  ),

  constraint deal_claims_type_vocabulary check (
    claim_type in ('money', 'number', 'boolean', 'enum', 'date', 'text')
  ),

  constraint deal_claims_decision_vocabulary check (
    review_decision in ('pending', 'accepted', 'rejected', 'withdrawn')
  ),

  -- The value must match the declared type, otherwise the export cannot compare
  -- it and the gate cannot decide. coalesce() matters: a CHECK passes on NULL,
  -- so a money claim missing its currency would otherwise slip through.
  constraint deal_claims_value_shape check (
    (claim_type = 'money'
      and jsonb_typeof(claim_value) = 'object'
      and coalesce(jsonb_typeof(claim_value -> 'amount'), '') = 'number'
      and coalesce(claim_value ->> 'currency', '') ~ '^[A-Z]{3}$')
    or (claim_type = 'number' and jsonb_typeof(claim_value) = 'number')
    or (claim_type = 'number'
      and jsonb_typeof(claim_value) = 'object'
      and coalesce(jsonb_typeof(claim_value -> 'value'), '') = 'number')
    or (claim_type = 'boolean' and jsonb_typeof(claim_value) = 'boolean')
    or (claim_type = 'enum' and jsonb_typeof(claim_value) = 'string')
    or (claim_type = 'date' and jsonb_typeof(claim_value) = 'string')
    or (claim_type = 'text' and jsonb_typeof(claim_value) = 'string')
  ),

  constraint deal_claims_unique_key unique (deal_slug, claim_key, variant_key)
);

create index if not exists deal_claims_deal_slug_idx on public.deal_claims (deal_slug);

-- 2. Evidence -------------------------------------------------------------

create table if not exists public.deal_claim_evidence (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null
    references public.deal_claims (id) on update cascade on delete restrict,
  source_url text not null,
  evidence_excerpt text not null,
  -- Where in the source: a heading, a table cell, a selector. Free text on
  -- purpose; the excerpt is what a reviewer re-checks.
  source_locator text,
  result text not null,
  checked_at timestamptz not null default now(),
  -- Set when a newer check replaces this one. The row is kept, not deleted.
  superseded_at timestamptz,
  created_at timestamptz not null default now(),

  constraint deal_claim_evidence_result_vocabulary check (
    result in ('supports', 'contradicts', 'unclear')
  ),
  constraint deal_claim_evidence_https check (source_url ~ '^https://'),
  constraint deal_claim_evidence_excerpt_length check (
    char_length(evidence_excerpt) between 10 and 500
  )
);

create index if not exists deal_claim_evidence_claim_idx
  on public.deal_claim_evidence (claim_id, checked_at desc);

-- 3. updated_at -----------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists deal_claims_touch_updated_at on public.deal_claims;
create trigger deal_claims_touch_updated_at
  before update on public.deal_claims
  for each row execute function public.touch_updated_at();

-- 4. Derived state --------------------------------------------------------
-- One implementation, used by the view and by the RLS policy, so a claim can
-- never look publishable in one place and not in the other.

create or replace function public.claim_evidence_status(p_claim_id uuid)
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with current_evidence as (
    select result
    from public.deal_claim_evidence
    where claim_id = p_claim_id
      and superseded_at is null
      -- A claim that has not been re-checked in 90 days is stale, not supported.
      and checked_at > now() - interval '90 days'
  )
  select case
    when exists (select 1 from current_evidence where result = 'contradicts')
      then 'contradicted'
    when exists (select 1 from current_evidence where result = 'supports')
      then 'supported'
    when exists (select 1 from current_evidence)
      then 'unclear'
    else 'no_evidence'
  end;
$$;

create or replace function public.claim_is_publishable(p_claim_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((
    select c.review_decision = 'accepted'
       and public.claim_evidence_status(c.id) = 'supported'
    from public.deal_claims c
    where c.id = p_claim_id
  ), false);
$$;

revoke all on function public.claim_evidence_status(uuid) from public;
revoke all on function public.claim_is_publishable(uuid) from public;
grant execute on function public.claim_evidence_status(uuid) to anon, authenticated, service_role;
grant execute on function public.claim_is_publishable(uuid) to anon, authenticated, service_role;

create or replace view public.publishable_claims
with (security_invoker = true)
as
select
  c.id,
  c.deal_slug,
  c.claim_key,
  c.claim_type,
  c.variant_key,
  c.claim_value,
  c.display_text_ar,
  c.display_text_en,
  c.review_decision,
  public.claim_evidence_status(c.id) as evidence_status,
  public.claim_is_publishable(c.id) as is_publishable
from public.deal_claims c;

-- Supabase's default privileges cover tables, not views, so the view needs an
-- explicit grant or anon gets "permission denied for view" despite the RLS
-- policy allowing the rows.
grant select on public.publishable_claims to anon, authenticated;

-- 5. Access ---------------------------------------------------------------

alter table public.deal_claims enable row level security;
alter table public.deal_claim_evidence enable row level security;

drop policy if exists "public read publishable claims" on public.deal_claims;
create policy "public read publishable claims"
  on public.deal_claims
  for select
  to anon, authenticated
  using (public.claim_is_publishable(id));

drop policy if exists "public read evidence of publishable claims" on public.deal_claim_evidence;
create policy "public read evidence of publishable claims"
  on public.deal_claim_evidence
  for select
  to anon, authenticated
  using (public.claim_is_publishable(claim_id));

-- No insert/update/delete policies: writes go through the service role only.
