# Language indexing decision (AMN-008)

## The question

The audit found that switching to English updates `?lang=en` and flips
`lang`/`dir`, but the page carries no `hreflang` and the canonical does not move
to a separate English URL. The open question was whether English is a separate
indexing target.

## Decision

**No. Arabic is the indexed version; English is the same page in another
language, not a second document.**

Reasons:

1. Both languages are served from one URL. `?lang=en` is a rendering preference,
   not a distinct address. Search engines treat parameter variants of one path
   as one resource far more often than as two.
2. `hreflang` requires each language to have its own URL. Emitting
   `hreflang="en"` pointing at the same URL as `hreflang="ar"` is not a valid
   annotation — it tells crawlers two languages share one address, which is what
   already happens by default.
3. Adding English URLs is a routing change, not a metadata change: it needs
   path-based language routes, canonical rules per language, and a sitemap
   split. That is a product decision with a real cost, and nothing in the audit
   showed English traffic is being lost.

## What this commits us to

* `canonical` stays self-referential and **query-free**: the clean route path,
  never `?lang=…`. Two visitors on different languages therefore declare the
  same canonical, which is the point.
* No `hreflang` tags are emitted. Their absence is now a decision, not an
  oversight.
* The HTML keeps `lang="ar"` / `dir="rtl"` as the default document language, and
  the client updates it on toggle, so assistive technology is told the truth
  about the current page even though the canonical is shared.

## If this is revisited

The trigger would be evidence that English queries land on the Arabic page and
bounce — Search Console data, not intuition. At that point the work is:

1. path-based language routes (`/en/deal/<slug>`), with the Arabic path as
   `x-default`;
2. `hreflang` between the two paths plus `x-default`;
3. per-language canonical and sitemap entries;
4. a redirect rule so `?lang=en` keeps working for existing links.

Guarded by `tests/language-indexing.test.mjs`, which fails if a canonical ever
starts carrying a query string.
