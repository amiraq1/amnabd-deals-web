# Operational review queue

This is a local, operator-invoked report tool, not a public page, browser feature, scheduled job, or default CI step. Run it only when an operator chooses to check the current catalogue:

```sh
npm --silent run review:queue
# Optional deterministic review date:
npm --silent run review:queue -- --as-of 2026-10-24
```

It reads a bounded public projection of `public.deals` using only the Supabase anon/publishable key and checks the recorded official-source URLs with bounded, unauthenticated HTTPS requests. It does not query or write moderation/report records, update `status`, or persist report output. Its output stays in the invoking terminal unless the operator redirects it elsewhere.

The report flags review dates more than 30 calendar days old (and missing/invalid review dates), source URLs that could not be fetched, and text that states a closing date/window while `ends_at` is absent or invalid. A failed source request is labeled `could not fetch / review needed`; it is never interpreted as expiration. Date-window findings are also review signals only; a human must check the official evidence and decide whether to update the offer.

User reports are deliberately omitted. The checked live public schema contained `deals`, `usage_guides`, and `site_config`, but no `deal_reports` table; the repository migration is not proof that the production table exists. The local tool has no safe non-public read path, so it does not try an elevated credential or query report data.

No database migration is needed for this tool. It is not wired into `build`, `postbuild`, or GitHub Actions. Preserve the app's existing Arabic/English offer structures and official-evidence requirements when acting on any queue item.
