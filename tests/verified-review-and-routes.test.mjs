import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';

const { isVerifiedReview } = await import(
  pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, 'src/lib/verification.js'))
);
const { isAuditFixtureEnv, loadPublicDealSlugs, writeMissingDealRoutePages } = await import(
  pathToFileURL(join(process.cwd(), 'scripts/generate-static-seo.mjs'))
);

test('verification recognizes current verdicts and earlier explicit verified fields', () => {
  assert.equal(isVerifiedReview({ verdict: 'verified', verification_status: 'supported' }), true);
  assert.equal(isVerifiedReview({ verification_status: 'verified' }), true);
  assert.equal(
    isVerifiedReview({ verification_status: 'supported', verified_on: '2026-10-24' }),
    true
  );
  assert.equal(
    isVerifiedReview({ verification_status: 'partially_supported', verified_on: '2026-10-24' }),
    true
  );
  assert.equal(
    isVerifiedReview({ verdict: 'needs_review', verified_on: '2026-10-24' }),
    false
  );
  assert.equal(isVerifiedReview({ verification_status: 'needs_review' }), false);
  assert.equal(
    isVerifiedReview({ verification_status: 'supported', verified_on: '2026-02-30' }),
    false
  );
  assert.equal(isVerifiedReview(null), false);
});

test('public deal-slug lookup paginates and rejects non-public keys', async () => {
  const anonKey = `eyJhbGciOiJub25lIn0.${Buffer.from(JSON.stringify({ role: 'anon' })).toString('base64url')}.sig`;
  const requests = [];
  const slugs = await loadPublicDealSlugs({
    rootDir: process.cwd(),
    publicUrl: 'https://project.supabase.co',
    publicKey: anonKey,
    pageSize: 2,
    fetchImpl: async (input, init) => {
      const url = new URL(input);
      requests.push({ url, init });
      const rows = url.searchParams.get('offset') === '0'
        ? [{ slug: 'z-deal' }, { slug: 'a-deal' }]
        : [{ slug: 'b-deal' }];
      return new Response(JSON.stringify(rows), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  });

  assert.deepEqual(slugs, ['a-deal', 'b-deal', 'z-deal']);
  assert.equal(requests.length, 2);
  assert.equal(requests[0].url.searchParams.get('select'), 'slug');
  assert.equal(requests[0].init.headers.apikey, anonKey);
  assert.equal(requests[0].init.headers.Authorization, `Bearer ${anonKey}`);
  await assert.rejects(
    loadPublicDealSlugs({
      publicUrl: 'https://project.supabase.co',
      publicKey: 'sb_secret_not-a-public-key',
      fetchImpl: async () => {
        throw new Error('The request must not be sent with a private key');
      },
    }),
    /anon\/publishable/i
  );
});

test('public deal-slug lookup rejects duplicate route identities', async () => {
  const anonKey = `eyJhbGciOiJub25lIn0.${Buffer.from(JSON.stringify({ role: 'anon' })).toString('base64url')}.sig`;
  await assert.rejects(
    loadPublicDealSlugs({
      publicUrl: 'https://project.supabase.co',
      publicKey: anonKey,
      fetchImpl: async () =>
        new Response(JSON.stringify([{ slug: 'duplicate' }, { slug: 'duplicate' }]), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    }),
    /duplicate public slug/
  );
});

test('uncatalogued public deal slugs receive safe static route shells', () => {
  const distDir = mkdtempSync(join(tmpdir(), 'amnabd-deal-routes-'));
  try {
    const knownFile = join(distDir, 'deal', 'catalogued', 'index.html');
    mkdirSync(join(distDir, 'deal', 'catalogued'), { recursive: true });
    writeFileSync(knownFile, 'catalog SEO page', 'utf8');

    const written = writeMissingDealRoutePages({
      distDir,
      baseHtml: '<!doctype html><html><div id="root"></div></html>',
      catalogSlugs: ['catalogued'],
      databaseSlugs: ['catalogued', 'modal-30-monthly', 'modal-30-monthly', '../escape', 'bad/slug'],
    });

    assert.equal(written, 1);
    assert.equal(readFileSync(knownFile, 'utf8'), 'catalog SEO page');
    assert.equal(
      readFileSync(join(distDir, 'deal', 'modal-30-monthly', 'index.html'), 'utf8'),
      '<!doctype html><html><div id="root"></div></html>'
    );
    // E3: verify the flat file was also generated and is identical to index.html
    assert.equal(
      readFileSync(join(distDir, 'deal', 'modal-30-monthly.html'), 'utf8'),
      '<!doctype html><html><div id="root"></div></html>'
    );
    assert.equal(existsSync(join(distDir, 'escape', 'index.html')), false);
  } finally {
    rmSync(distDir, { recursive: true, force: true });
  }
});

test('isAuditFixtureEnv enforces fail-closed guard on refs/heads/main', () => {
  assert.equal(
    isAuditFixtureEnv({ VITE_SUPABASE_URL: 'https://audit-fixture.supabase.co', GITHUB_REF: 'refs/pull/123/merge' }),
    true
  );
  assert.equal(
    isAuditFixtureEnv({ SEO_SOURCE: 'snapshot' }),
    true
  );
  assert.equal(
    isAuditFixtureEnv({ VITE_SUPABASE_URL: 'https://xyz.supabase.co' }),
    false
  );
  assert.throws(
    () => isAuditFixtureEnv({ VITE_SUPABASE_URL: 'https://audit-fixture.supabase.co', GITHUB_REF: 'refs/heads/main' }),
    /Refusing to use audit-fixture URL on refs\/heads\/main/
  );
  assert.throws(
    () => isAuditFixtureEnv({ SUPABASE_URL: 'https://audit-fixture.supabase.co/', GITHUB_REF: 'refs/heads/main' }),
    /Refusing to use audit-fixture URL on refs\/heads\/main/
  );
});
