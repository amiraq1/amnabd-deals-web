# Review and evidence contract

These are distinct concepts; neither guarantees eligibility, availability, or
that every claim has been substantiated.

- **Record reviewed**: the existing `isVerifiedReview` compatibility rule reads
  `review.verdict`, then legacy `verification_status`, then a valid
  `verified_on` date, respecting explicit negative states. The collection
  count, card/detail review label, SEO description and OG image use this rule.
  It describes the record's review state, not source support for every field.
- **Evidence support**: `review.verification_status` is interpreted separately
  by `evidenceStatus` as supported, partial, unsupported, or unknown. Legacy
  `verified` is not automatically mapped to `supported`; it may yield a
  reviewed record with unknown evidence support. Resolve ambiguous or conflicting
  historical data through a source review rather than a bulk conversion.

No database values are migrated by this change. Future data producers should
store an explicit review verdict and a distinct evidence-support status, and
supply field-level evidence where available.

## Time and static publishing

`getTimingState` is the shared expiry rule for the UI, SEO, RSS and static
lists. A known end in the past overrides an active status; date-only ends use
the existing UTC-12 boundary. The build pins one reference time and, when
available, overlays live `status` and `ends_at` on catalog rows. Static HTML is
only as fresh as the latest successful build: the scheduled rebuild is daily,
so it cannot guarantee an exact expiry transition between builds. The browser
refreshes its metadata and displayed timing each minute and on visibility
changes. This does not independently validate the underlying offer data.
