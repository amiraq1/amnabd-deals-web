# DMARC Security Runbook

This runbook records the verified DMARC state for `amnabd.com` and the standards used to interpret its policy and external report destination. The current remediation is documentation-only; it does not require a DNS update.

## Verified state

The live verification recorded for AMN-03 on 15 November 2026 found:

- `_dmarc.amnabd.com` publishes `v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:dmarc_rua@onsecureserver.net;`.
- `amnabd.com._report._dmarc.onsecureserver.net` publishes a TXT value of `v=DMARC1`, authorizing the external aggregate-report destination.

The external authorization name follows RFC 9990, Section 4: the policy domain is prepended to `._report._dmarc.` and the report destination host follows it. For these records, the resulting name is `amnabd.com._report._dmarc.onsecureserver.net`. The policy-domain-first ordering matters when checking the authorization record.

Because the existing external-destination authorization was verified, no DNS change is needed for this documentation update. Keep the DMARC policy at `p=quarantine` and SPF at `~all`; this remediation does not change either value to `p=reject` or `-all`.

## Standards

The RFC Editor and IETF Datatracker identify the following DMARC specifications as published in May 2026:

- **RFC 9989** — [Domain-Based Message Authentication, Reporting, and Conformance (DMARC)](https://www.rfc-editor.org/info/rfc9989/) is the core DMARC specification. [IETF publication record](https://datatracker.ietf.org/doc/rfc9989/).
- **RFC 9990** — [Domain-Based Message Authentication, Reporting, and Conformance (DMARC) Aggregate Reporting](https://www.rfc-editor.org/rfc/rfc9990.html), Section 4, **Verifying External Destinations**, defines how receivers authorize external report destinations. The verification TXT record must include `v=DMARC1` as its first tag. [IETF publication record](https://datatracker.ietf.org/doc/rfc9990/).
- **RFC 9991** — [Domain-Based Message Authentication, Reporting, and Conformance (DMARC) Failure Reporting](https://www.rfc-editor.org/info/rfc9991/) covers failure reports. Its Section 5 applies the RFC 9990, Section 4 verification procedure to external `ruf` destinations, using `ruf` in place of `rua`. [IETF publication record](https://datatracker.ietf.org/doc/rfc9991/).

For future destination changes, validate the exact RFC 9990, Section 4 lookup name and the returned TXT record before treating an external destination as authorized. Any DMARC or SPF policy change is outside this runbook update and requires separate sender-authentication review.
