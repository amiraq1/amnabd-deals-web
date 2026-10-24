import assert from 'node:assert/strict';
import { mkdtempSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temp = mkdtempSync(join(tmpdir(), 'amnabd-env-'));
const key = 'sb_publishable_AUDIT_FIXTURE_NOT_A_REAL_KEY_0001';
const baseline = {
  VITE_SUPABASE_URL: 'https://audit-fixture.supabase.co',
  VITE_SUPABASE_ANON_KEY: key,
  SEO_PARITY_SOURCE: 'snapshot',
};
const privateJwt = [
  'eyJhbGciOiJIUzI1NiJ9',
  Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url'),
  'synthetic_signature',
].join('.');
const cases = [
  ['missing-url', { VITE_SUPABASE_URL: '' }, 'missing_url'],
  ['missing-key', { VITE_SUPABASE_ANON_KEY: '' }, 'missing_key'],
  ['invalid-url', { VITE_SUPABASE_URL: 'not-a-url' }, 'invalid_url'],
  ['private-key', { VITE_SUPABASE_ANON_KEY: 'sb_secret_FAKE_TEST_ONLY' }, 'private_key'],
  ['private-jwt', { VITE_SUPABASE_ANON_KEY: privateJwt }, 'private_key'],
  ['invalid-key', { VITE_SUPABASE_ANON_KEY: 'opaque-key' }, 'invalid_public_key'],
  ['valid-fixture', {}, null],
];
try {
  for (const [name, override, reason] of cases) {
    const out = join(temp, name);
    const result = spawnSync(
      process.execPath,
      [join(root, 'node_modules/vite/bin/vite.js'), 'build', '--outDir', out],
      {
        cwd: root,
        env: { ...process.env, ...baseline, ...override },
        encoding: 'utf8',
        // A cold, cache-less runner needs well over a minute for the one full
        // build case; a shorter timeout turns a slow machine into a red gate.
        timeout: 180000,
      }
    );
    if (result.error) throw result.error;
    if (reason) {
      assert.notEqual(result.status, 0, name);
      assert.match(result.stdout + result.stderr, new RegExp(reason));
      assert.equal(existsSync(join(out, 'index.html')), false);
    } else {
      assert.equal(result.status, 0, name);
      assert.equal(existsSync(join(out, 'index.html')), true);
    }
    assert.doesNotMatch(
      result.stdout + result.stderr,
      /sb_secret_FAKE_TEST_ONLY|AUDIT_FIXTURE_NOT_A_REAL_KEY/
    );
    assert.equal((result.stdout + result.stderr).includes(privateJwt), false);
    console.log('PASS build-env:', name);
  }
} finally {
  rmSync(temp, { recursive: true, force: true });
}
