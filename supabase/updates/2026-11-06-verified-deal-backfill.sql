-- Backfill the review shape for the 12 deals inserted on 2026-11-05
-- (PR #45, aad13a6, supabase/updates/2026-11-05-verified-deal-batch.sql).
--
-- What was wrong: the inserted review objects carry only
-- verdict / reviewed_at / notes, but the UI reads verification_status,
-- reviewed_on, offer_status and unknown_fields — so all 12 deals showed
-- "Evidence support unknown / آخر مراجعة: غير معلوم", the honest-uncertainty
-- banner disappeared even though Iraq eligibility is unknown for all 12 and
-- the card requirement is unknown for 7 of them, and "sort by review"
-- (dealSort.ts reads review.reviewed_on) had nothing to sort on.
--
-- What this does: merges the missing keys into review for exactly these 12
-- rows, preserving verdict / reviewed_at / notes. No rows are inserted or
-- deleted; no other field is touched. Each bounded UPDATE also checks the
-- expected verdict/date, absent backfill keys, unknown Iraq status and the
-- matching card-required group; re-running this file is a no-op.
--
-- Values (verified against src/lib/countryAvailability.ts,
-- src/lib/unknownFieldLabels.ts, src/lib/verification.ts and the 2026-11-04
-- batch, which carries the full shape):
--   verification_status "supported" — a reviewed state (REVIEWED_STATES);
--     verdict stays "verified", which is what isVerifiedReview() reads.
--   reviewed_on / verified_on "2026-11-05" — the review date of the batch.
--   offer_status "active".
--   unknown_fields: "Iraq_availability" for all 12 (eligibility.countries is
--     "unknown" for every row in the batch); "eligibility.card_required"
--     additionally for the 7 rows whose eligibility.card_required is
--     "unknown" in the batch file (StepFun, Daytona, Raon-1 mini, Fly.io
--     Sprites, Vercel Sandbox, Freestyle, Z.ai). The other 5 rows record
--     card_required "no", so no card entry is added for them.
--
-- Apply: run the preflight SELECT first and confirm 12 expected rows. Then run
-- this file against production once and confirm the post-write SELECT returns
-- the full expected shape. The checked-in 2026-11-05 batch file is amended in
-- the same change so its review objects match the backfilled state.

-- Preflight: the 12 rows must currently carry the thin review shape.
-- Expected: verdict/reviewed_at match the batch, new review keys are absent,
-- Iraq is unknown, and card_required matches the 5/no + 7/unknown split.
SELECT id, slug,
       eligibility->>'card_required' AS card_required,
       eligibility->'countries'->>'status' AS countries_status,
       review->>'verdict' AS verdict,
       review->>'reviewed_at' AS reviewed_at,
       review->>'reviewed_on' AS reviewed_on,
       review->>'verified_on' AS verified_on,
       review->>'verification_status' AS verification_status,
       review->>'offer_status' AS offer_status,
       review->'unknown_fields' AS unknown_fields,
       review ? 'reviewed_on' AS has_reviewed_on,
       review ? 'verified_on' AS has_verified_on,
       review ? 'verification_status' AS has_verification_status,
       review ? 'offer_status' AS has_offer_status,
       review ? 'unknown_fields' AS has_unknown_fields
FROM public.deals
WHERE id IN ('mindshub-free-tier', 'cto-new-free-forever', 'stepfun-stepaudio-3-free', 'cloady-free-tier', 'daytona-200-free-compute', 'prized-30-free-credit', 'raon-1-mini-free-api', 'tensorlake-free-sandbox', 'flyio-sprites-30-trial', 'vercel-sandbox-free-hobby', 'freestyle-free-vms', 'zai-free-flash-models')
ORDER BY id
LIMIT 50;

BEGIN;
-- 5 rows whose card requirement is known ("no"): Iraq eligibility is the
-- only unknown field.
UPDATE public.deals
SET review = review || '{
  "verification_status": "supported",
  "reviewed_on": "2026-11-05",
  "verified_on": "2026-11-05",
  "offer_status": "active",
  "unknown_fields": ["Iraq_availability"]
}'::jsonb
WHERE id IN ('mindshub-free-tier', 'cto-new-free-forever', 'cloady-free-tier', 'prized-30-free-credit', 'tensorlake-free-sandbox')
  AND eligibility->'countries'->>'status' = 'unknown'
  AND eligibility->>'card_required' = 'no'
  AND review->>'verdict' = 'verified'
  AND review->>'reviewed_at' = '2026-11-05'
  AND review->>'reviewed_on' IS NULL
  AND review->>'verified_on' IS NULL
  AND review->>'verification_status' IS NULL
  AND review->>'offer_status' IS NULL
  AND NOT (review ? 'reviewed_on')
  AND NOT (review ? 'verified_on')
  AND NOT (review ? 'verification_status')
  AND NOT (review ? 'offer_status')
  AND NOT (review ? 'unknown_fields');

-- 7 rows whose card requirement is unknown: both unknown fields.
UPDATE public.deals
SET review = review || '{
  "verification_status": "supported",
  "reviewed_on": "2026-11-05",
  "verified_on": "2026-11-05",
  "offer_status": "active",
  "unknown_fields": ["Iraq_availability", "eligibility.card_required"]
}'::jsonb
WHERE id IN ('stepfun-stepaudio-3-free', 'daytona-200-free-compute', 'raon-1-mini-free-api', 'flyio-sprites-30-trial', 'vercel-sandbox-free-hobby', 'freestyle-free-vms', 'zai-free-flash-models')
  AND eligibility->'countries'->>'status' = 'unknown'
  AND eligibility->>'card_required' = 'unknown'
  AND review->>'verdict' = 'verified'
  AND review->>'reviewed_at' = '2026-11-05'
  AND review->>'reviewed_on' IS NULL
  AND review->>'verified_on' IS NULL
  AND review->>'verification_status' IS NULL
  AND review->>'offer_status' IS NULL
  AND NOT (review ? 'reviewed_on')
  AND NOT (review ? 'verified_on')
  AND NOT (review ? 'verification_status')
  AND NOT (review ? 'offer_status')
  AND NOT (review ? 'unknown_fields');
COMMIT;

-- Post-write verification: must return 12 rows.
-- Expected on every row: verdict "verified", verification_status "supported",
-- reviewed_on / verified_on "2026-11-05", offer_status "active".
-- unknown_fields must be ["Iraq_availability"] on the 5 card-known rows and
-- ["Iraq_availability", "eligibility.card_required"] on the 7 card-unknown rows.
SELECT id, slug, status,
       eligibility->>'card_required' AS card_required,
       eligibility->'countries'->>'status' AS countries_status,
       review->>'verdict' AS verdict,
       review->>'verification_status' AS verification_status,
       review->>'reviewed_on' AS reviewed_on,
       review->>'verified_on' AS verified_on,
       review->>'offer_status' AS offer_status,
       review->'unknown_fields' AS unknown_fields
FROM public.deals
WHERE id IN ('mindshub-free-tier', 'cto-new-free-forever', 'stepfun-stepaudio-3-free', 'cloady-free-tier', 'daytona-200-free-compute', 'prized-30-free-credit', 'raon-1-mini-free-api', 'tensorlake-free-sandbox', 'flyio-sprites-30-trial', 'vercel-sandbox-free-hobby', 'freestyle-free-vms', 'zai-free-flash-models')
ORDER BY id
LIMIT 50;
