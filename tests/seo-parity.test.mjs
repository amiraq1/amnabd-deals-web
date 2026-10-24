import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';

const { loadDealSlugSnapshot, verifySeoParity } = await import(
  pathToFileURL(join(process.cwd(), 'scripts/seo-parity.mjs'))
);

const baseHtml = '<!doctype html><html lang="ar"><head><title>AMNABD</title></head><body><div id="root"></div></body></html>';
const catalogDeals = [{ slug: 'reviewed-deal' }];
const liveDealSlugs = ['live-only-deal', 'reviewed-deal'];

function fixture() {
  const distDir = mkdtempSync(join(tmpdir(), 'amnabd-seo-parity-'));
  mkdirSync(join(distDir, 'deal', 'reviewed-deal'), { recursive: true });
  mkdirSync(join(distDir, 'deal', 'live-only-deal'), { recursive: true });
  mkdirSync(join(distDir, 'og'), { recursive: true });
  writeFileSync(
    join(distDir, 'deal', 'reviewed-deal', 'index.html'),
    '<!doctype html><html><head><link rel="canonical" href="https://amnabd.com/deal/reviewed-deal"></head></html>',
    'utf8'
  );
  writeFileSync(join(distDir, 'deal', 'live-only-deal', 'index.html'), baseHtml, 'utf8');
  writeFileSync(join(distDir, 'og', 'reviewed-deal.svg'), '<svg></svg>', 'utf8');
  writeFileSync(
    join(distDir, 'sitemap.xml'),
    '<urlset><url><loc>https://amnabd.com/</loc></url><url><loc>https://amnabd.com/deal/reviewed-deal</loc></url></urlset>',
    'utf8'
  );
  writeFileSync(
    join(distDir, 'llms.txt'),
    '# AMNABD Deals\n\n- [Reviewed deal](https://amnabd.com/deal/reviewed-deal): sourced details.\n',
    'utf8'
  );
  return distDir;
}

function verify(distDir, overrides = {}) {
  return verifySeoParity({
    distDir,
    catalogDeals,
    liveDealSlugs,
    baseHtml,
    baseUrl: 'https://amnabd.com',
    ...overrides,
  });
}

test('F-07 accepts full live-route coverage and an exact generic shell for live-only deals', () => {
  const distDir = fixture();
  try {
    assert.deepEqual(verify(distDir), []);
  } finally {
    rmSync(distDir, { recursive: true, force: true });
  }
});

test('F-07 fails when a live deal route is missing or a live-only route publishes SEO claims', () => {
  const missingDir = fixture();
  try {
    rmSync(join(missingDir, 'deal', 'live-only-deal'), { recursive: true, force: true });
    assert.match(verify(missingDir).join('\n'), /required public route artifact is missing/);
  } finally {
    rmSync(missingDir, { recursive: true, force: true });
  }

  const missingIndexDir = fixture();
  try {
    unlinkSync(join(missingIndexDir, 'deal', 'live-only-deal', 'index.html'));
    assert.match(verify(missingIndexDir).join('\n'), /route index document is missing/);
  } finally {
    rmSync(missingIndexDir, { recursive: true, force: true });
  }

  const claimDir = fixture();
  try {
    writeFileSync(
      join(claimDir, 'deal', 'live-only-deal', 'index.html'),
      '<html><head><title>Live-only: free and verified</title></head></html>',
      'utf8'
    );
    assert.match(verify(claimDir).join('\n'), /must remain the exact generic app shell/);
  } finally {
    rmSync(claimDir, { recursive: true, force: true });
  }
});

test('F-07 fails when the catalog, sitemap, or llms index diverges from its expected slug set', () => {
  const distDir = fixture();
  try {
    writeFileSync(
      join(distDir, 'sitemap.xml'),
      '<urlset><url><loc>https://amnabd.com/deal/stale-deal</loc></url></urlset>',
      'utf8'
    );
    writeFileSync(
      join(distDir, 'llms.txt'),
      '# Deals\n- [Stale](https://amnabd.com/deal/stale-deal): stale.\n',
      'utf8'
    );
    const result = verify(distDir).join('\n');
    assert.match(result, /sitemap\.xml: unreviewed or unknown SEO slug stale-deal/);
    assert.match(result, /llms\.txt: unreviewed or unknown SEO slug stale-deal/);
    const staleCatalog = verify(distDir, {
      catalogDeals: [...catalogDeals, { slug: 'removed-catalog-deal' }],
    }).join('\n');
    assert.match(staleCatalog, /SEO catalog slug is not present in the current public deals/);
  } finally {
    rmSync(distDir, { recursive: true, force: true });
  }
});

test('F-07 rejects legacy hash routes in generated sitemap and llms artifacts', () => {
  const distDir = fixture();
  try {
    writeFileSync(
      join(distDir, 'sitemap.xml'),
      '<urlset><url><loc>https://amnabd.com/#/deal/reviewed-deal</loc></url></urlset>',
      'utf8'
    );
    writeFileSync(
      join(distDir, 'llms.txt'),
      '# Deals\n- [Reviewed](https://amnabd.com/#/deal/reviewed-deal): stale route.\n',
      'utf8'
    );
    const result = verify(distDir).join('\n');
    assert.match(result, /sitemap\.xml: legacy hash-based deal URL found/);
    assert.match(result, /llms\.txt: legacy hash-based deal URL found/);
  } finally {
    rmSync(distDir, { recursive: true, force: true });
  }
});

test('reviewed public slug snapshot is valid, unique, and complete', () => {
  const slugs = loadDealSlugSnapshot(process.cwd());
  assert.equal(slugs.length, 43);
  assert.deepEqual(slugs, [...slugs].sort());
  assert.ok(slugs.includes('anthropic-api-starter-credit'));
  assert.ok(slugs.includes('zenmux'));
});
