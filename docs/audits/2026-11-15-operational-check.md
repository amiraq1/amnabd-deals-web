# Operational check — 2026-11-15

Read-only point-in-time checks; no production configuration or data was changed.
The application bundle identified the public Supabase project used by the live
site. This is not a full production security audit or verification of every
migration.

## Live routes

Direct HTTPS requests to `/` returned 200; `/guide` and `/favorites` returned
404; `/coding` returned 301; an invalid deal URL returned 404. Phase 1 adds
static entries and a post-deployment HTTP smoke test. These fixes do not reach
the live domain until the pull requests are merged and deployed; recheck after
deployment.

## Reports table

Production inspection confirmed row-level security on `public.deal_reports`, an
insert policy for `anon` and `authenticated`, and column-level insert grants
limited to `deal_slug`, `reason`, and `note`. The enabled throttle trigger
sets the server timestamp and serializes checks, limiting reports to five per
deal in ten minutes and 300 overall per hour. The production migration history
includes `deal_reports_created_at_hardening`, although its applied version
number differs from the repository filename. This verifies the sampled
hardening behavior, not all migrations or every possible abuse path.

The shared ceiling can be exhausted by an abuser and deny legitimate reports;
it is not a per-sender rate limit. If usage warrants it, design and test an
edge intake/rate-limit strategy with minimal personal data and a failure plan.

## Categories and headers

The production deals table contained 12 rows with category value `coding` at
inspection time; this count includes all statuses and does not prove how many
should appear in the live collection. The category fix must be deployed before
its production effect can be verified.

See [edge security headers](../edge-security-headers.md) for sampled headers,
DNS-only apex records, and a staged rollout. No DNS, TLS, headers, or production
rate-limit settings were changed.

## Remaining validation

After deployment, run the direct-route smoke check, inspect security headers on
multiple hosts and paths, and run real-device/browser accessibility and
performance measurements against production. Synthetic local browser checks are
not substitutes for commercial source verification, formal accessibility
conformance testing, or real-user performance data.

Local Chromium smoke tests used a 375px viewport, synthetic Supabase responses,
and localhost preview. In one unthrottled sample, Arabic DCL/FCP were 86/268 ms
and English DCL/FCP were 85/168 ms. These are environment-dependent diagnostic
samples, not production or real-user metrics. The checks covered basic reflow,
not a full accessibility audit; production Lighthouse/real-device and field
measurements remain necessary.
