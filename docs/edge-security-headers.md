# Edge security headers (AMN-003)

## Observed deployment (2026-11-15)

Read-only samples of `https://amnabd.com/`, `/guide`, `/favorites`, `/coding`,
and a missing deal path came from GitHub Pages and included
`Strict-Transport-Security: max-age=31556952`. They did not include CSP,
`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, or
`Permissions-Policy`. Samples do not prove behavior on every host or path.

Cloudflare DNS inspection showed that the apex A records were **DNS-only**
(`proxied: false`). A Cloudflare response-header rule will therefore not affect
those requests until traffic actually passes through a suitable edge. Files such
as `_headers`, `netlify.toml`, and `vercel.json` do not configure GitHub Pages.
No DNS or header changes were made as part of this audit.

## Safe rollout

1. Inventory the actual hosting, DNS, TLS certificates, subdomains, redirects,
   dependencies and service worker. Choose an edge or hosting platform that can
   set response headers. Test a representative staging hostname first.
2. Evaluate `X-Content-Type-Options: nosniff`, a suitable framing policy,
   `Referrer-Policy: strict-origin-when-cross-origin`, and a minimal
   `Permissions-Policy` against actual application requirements. Validate
   headers on successful responses, redirects, errors, assets and API calls.
3. Start CSP in **report-only** mode. Derive the allowlist from real requests,
   including fonts, Supabase, assets, PWA behavior and any required inline code;
   review violation reports, then enforce only after cross-browser testing.
   Avoid blanket `unsafe-inline` or expanding source lists without evidence.
4. GitHub Pages already supplies HSTS in the sampled responses. Do not add
   `includeSubDomains` or preload until every intended subdomain has been
   verified for HTTPS and the operational consequences are understood.
5. Proxy/DNS/TLS changes affect production availability and caching. Plan a
   staged change, rollback, monitoring and explicit operational approval.

Repeat verification over multiple hosts and paths, for example:

```sh
curl -sI https://amnabd.com/ | grep -iE 'content-security|strict-transport|x-content-type|x-frame|referrer-policy|permissions-policy'
```
