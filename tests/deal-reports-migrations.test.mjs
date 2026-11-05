import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const migrations = join(process.cwd(), 'supabase', 'migrations');
const slugFk = readFileSync(
  join(migrations, '20261023000001_deal_reports_slug_fk.sql'),
  'utf8'
);
const hardening = readFileSync(
  join(migrations, '20261026120000_deal_reports_hardening.sql'),
  'utf8'
);
const createdAtHardening = readFileSync(
  join(migrations, '20261103120000_deal_reports_created_at_hardening.sql'),
  'utf8'
);

test('deal_reports FK migration reuses any single-column UNIQUE constraint on deals.slug', () => {
  assert.match(slugFk, /and\s+c\.contype\s*=\s*'u'/i);
  assert.match(slugFk, /and\s+c\.conkey\s*=\s*array\[slug_attnum\]::smallint\[\]/i);
  assert.doesNotMatch(slugFk, /conname\s*=\s*'deals_slug_unique'/i);
  assert.match(slugFk, /add constraint deals_slug_unique unique \(slug\)/i);
});

test('deal_reports throttle keeps pg_catalog search_path and does not grant direct execution', () => {
  assert.match(hardening, /security definer\s+set search_path\s*=\s*pg_catalog/i);
  assert.doesNotMatch(hardening, /set search_path\s*=\s*public/i);
  for (const role of ['public', 'anon', 'authenticated', 'service_role']) {
    assert.match(
      hardening,
      new RegExp(`revoke all on function public\\.deal_reports_throttle\\(\\) from ${role};`, 'i')
    );
  }
  assert.doesNotMatch(
    hardening,
    /\bgrant\s+(?:execute|all)\s+on\s+function\s+public\.deal_reports_throttle\(\)/i
  );
});

test('deal_reports hardening enforces server time, serializes the existing limits, and restricts client inserts', () => {
  // 1. Enforces NEW.created_at := pg_catalog.now() before COUNT
  assert.match(createdAtHardening, /new\.created_at\s*:=\s*pg_catalog\.now\(\);/i);
  const countIndex = createdAtHardening.search(/select\s+count\(\*\)/i);
  const timestampIndex = createdAtHardening.search(/new\.created_at\s*:=\s*pg_catalog\.now\(\);/i);
  assert.ok(timestampIndex > 0 && timestampIndex < countIndex, 'timestamp must be assigned before count');

  // 2. Global advisory lock
  assert.match(createdAtHardening, /perform\s+pg_catalog\.pg_advisory_xact_lock\(74839201\);/i);

  // 3. Security definer search path
  assert.match(createdAtHardening, /security definer\s+set search_path\s*=\s*pg_catalog/i);

  // 4. Numeric rate limits are unchanged: 5 per deal/10 minutes and 300/hour.
  assert.match(createdAtHardening, /interval\s+'10 minutes'[\s\S]*?limit\s+5/i);
  assert.match(createdAtHardening, /interval\s+'1 hour'[\s\S]*?limit\s+300/i);

  // 5. Revoke table-level client inserts and grant only the submitted fields.
  assert.match(
    createdAtHardening,
    /revoke\s+insert\s+on\s+table\s+public\.deal_reports\s+from\s+anon,\s*authenticated;/i
  );
  assert.match(
    createdAtHardening,
    /grant\s+insert\s*\(deal_slug,\s*reason,\s*note\)\s+on\s+table\s+public\.deal_reports\s+to\s+anon,\s*authenticated;/i
  );

  // 6. Preserves service_role access
  assert.match(createdAtHardening, /grant\s+all\s+on\s+table\s+public\.deal_reports\s+to\s+service_role;/i);
  assert.doesNotMatch(
    createdAtHardening,
    /revoke\s+(?:all|insert)\s+on\s+table\s+public\.deal_reports\s+from\s+service_role;/i
  );
});

test('vite remains rooted at /', () => {
  const viteConfig = readFileSync(join(process.cwd(), 'vite.config.ts'), 'utf8');
  assert.match(viteConfig, /base:\s*['"]\/['"]/);
});
