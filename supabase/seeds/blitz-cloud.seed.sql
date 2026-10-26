/*
# Seed: blitz-cloud claims

Proves the claims model on one deal before rolling it out to the other four.

What this file does and does not contain:
- Four claims, exactly as approved: three `pending`, one `rejected`.
- ZERO evidence rows. Nobody has opened blitz.cloud and recorded a real excerpt
  for this seed, and inventing a URL, an excerpt or a `result` is the one thing
  this schema exists to prevent. A claim without evidence is the honest starting
  state: `claim_evidence_status` returns 'no_evidence' and nothing is published.
- The evidence shape a reviewer fills after checking the page is shown at the
  bottom, commented out, so the wiring is visible without faking data.

Run against staging only. Not applied by this repository.
*/

begin;

-- Fail with a readable message instead of a bare foreign-key violation.
do $$
begin
  if not exists (select 1 from public.deals where slug = 'blitz-cloud') then
    raise exception 'seed aborted: deal blitz-cloud does not exist';
  end if;
end;
$$;

-- 1. Claims ---------------------------------------------------------------

insert into public.deal_claims as c
  (deal_slug, claim_key, claim_type, variant_key, claim_value,
   display_text_ar, display_text_en, review_decision, review_note)
values
  (
    'blitz-cloud',
    'price.amount',
    'money',
    '',
    jsonb_build_object('amount', 0, 'currency', 'EUR'),
    'الخطة المجانية بسعر 0 يورو',
    'The free plan costs EUR 0',
    'pending',
    null
  ),
  (
    'blitz-cloud',
    'eligibility.card_required',
    'enum',
    '',
    to_jsonb('not_required'::text),
    'لا تُطلب بطاقة بنكية',
    'No credit card is required',
    'pending',
    null
  ),
  (
    'blitz-cloud',
    'apps.maximum',
    'number',
    '',
    jsonb_build_object('value', 5, 'unit', 'apps'),
    'حتى 5 تطبيقات',
    'Up to 5 apps',
    'pending',
    null
  ),
  (
    'blitz-cloud',
    'benefit.duration',
    'enum',
    '',
    to_jsonb('unlimited'::text),
    'بلا حد زمني',
    'No time limit',
    'rejected',
    'صفحة الأسعار لا تثبت استمرار الخطة بلا حد؛ أُزيلت العبارة من العرض بدل تخفيفها'
  )
on conflict (deal_slug, claim_key, variant_key) do update
  set claim_type     = excluded.claim_type,
      claim_value    = excluded.claim_value,
      display_text_ar = excluded.display_text_ar,
      display_text_en = excluded.display_text_en
  -- Only untouched rows are refreshed. A human touching a claim — deciding it,
  -- leaving a note, or attaching evidence — freezes it, so re-seeding can never
  -- change the value under evidence that was recorded against the old value.
  where c.review_decision = 'pending'
    and c.review_note is null
    and not exists (
      select 1
      from public.deal_claim_evidence e
      where e.claim_id = c.id
    );

commit;

-- ---------------------------------------------------------------------------
-- Evidence, once a reviewer has actually opened the source page.
-- Fill these in a separate file (or by hand); they are deliberately not seeded.
--
-- insert into public.deal_claim_evidence
--   (claim_id, source_url, evidence_excerpt, source_locator, result, checked_at)
-- select
--   c.id,
--   'https://<real https url the reviewer opened>',
--   '<verbatim excerpt, 10..500 chars, copied from that page>',
--   '<heading or table cell where it appears>',
--   'supports',      -- or 'contradicts' / 'unclear'
--   now()
-- from public.deal_claims c
-- where c.deal_slug = 'blitz-cloud'
--   and c.claim_key = 'price.amount';
--
-- After that, publishing still requires a human decision:
--   update public.deal_claims set review_decision = 'accepted'
--   where deal_slug = 'blitz-cloud' and claim_key = 'price.amount';
--
-- Expected state after this seed alone:
--   claim_evidence_status = 'no_evidence' for all four
--   is_publishable        = false        for all four
--   publishable_claims    = 0 rows for blitz-cloud
-- ---------------------------------------------------------------------------
