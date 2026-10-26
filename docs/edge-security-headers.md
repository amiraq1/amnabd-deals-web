# Edge security headers (AMN-003)

The live root response carries none of `Content-Security-Policy`,
`X-Content-Type-Options`, `X-Frame-Options`, `Permissions-Policy`,
`Strict-Transport-Security` or `Referrer-Policy`.

**This cannot be fixed inside this repository.** The site is served by GitHub
Pages behind Cloudflare. GitHub Pages has no header configuration, and files
such as `_headers`, `netlify.toml` or `vercel.json` have no effect there — adding
them would look like a fix while changing nothing. The headers have to be set at
the edge, in the Cloudflare zone that fronts `amnabd.com`.

This document is the exact configuration to apply there. It is not applied by
the audit, and nothing in the repository activates it.

## Header set

| Header | Value |
| --- | --- |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `SAMEORIGIN` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=()` |
| `Content-Security-Policy` | see below |

`X-Frame-Options` and the CSP `frame-ancestors` directive overlap; keep both
while the CSP is still in report-only.

## Content-Security-Policy

Derived from what the built site actually requests:

- one inline bootstrap script in `index.html` (language/direction setup before React mounts)
- Google Fonts CSS from `fonts.googleapis.com`, font files from `fonts.gstatic.com`
- Supabase PostgREST calls to the project origin, injected at build time from `VITE_SUPABASE_URL`
- own assets, `og-image.png` and the generated per-deal OG cards

```
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data:;
connect-src 'self' https://<project-ref>.supabase.co;
frame-ancestors 'self';
base-uri 'self';
form-action 'self';
object-src 'none'
```

`'unsafe-inline'` in `script-src` is the one weak point, and it exists only for
that bootstrap block. Removing it requires either a hash of the block or moving
it into a bundled module. Prefer the hash: it keeps the pre-paint behaviour and
needs no code change to the app.

`style-src 'unsafe-inline'` is needed because React sets inline style attributes.
Dropping it would break layout, not just styling.

## Rollout

1. Apply everything **except** CSP first. Those five headers cannot break the site.
2. Apply CSP as `Content-Security-Policy-Report-Only` with the policy above and a
   `report-uri` you can read. Browse the home page, one deal page, the changelog,
   `/compare/`, and a search with filters — these cover fonts, Supabase reads and
   client-side routing.
3. Read the reports. Anything flagged is a source the policy is missing, not a
   reason to widen `default-src`.
4. Only then switch the header name from `-Report-Only` to the enforcing form.

## Verifying

```sh
curl -sI https://amnabd.com/ | grep -iE 'content-security|strict-transport|x-content-type|x-frame|referrer-policy|permissions-policy'
```

A single response is a sample, not proof for every host and path. Repeat for
`/deal/<slug>`, `/changelog/` and a deliberately missing path.

## If the hosting platform ever changes

Cloudflare Pages honours a `_headers` file at the site root, and Netlify and
Vercel honour their own config files. If the site moves to one of those, the
header set above ports over unchanged — that is the point of writing it down
here rather than only in a dashboard. Until then, no such file belongs in this
repository.
