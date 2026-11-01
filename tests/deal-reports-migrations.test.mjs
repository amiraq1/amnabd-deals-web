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

test('vite remains rooted at /', () => {
  const viteConfig = readFileSync(join(process.cwd(), 'vite.config.ts'), 'utf8');
  assert.match(viteConfig, /base:\s*['"]\/['"]/);
});
