-- Harden name resolution for the two claim helpers without changing their
-- grants; anon execution is required by the publishable-claims RLS policy.
alter function public.claim_evidence_status(uuid)
  set search_path = pg_catalog;

alter function public.claim_is_publishable(uuid)
  set search_path = pg_catalog;
***
