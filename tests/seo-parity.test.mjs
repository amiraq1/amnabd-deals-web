import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';

const { loadDealSlugSnapshot, verifySeoParity } = await import(
  pathToFileURL(join(process.cwd(), 'scripts/seo-parity.mjs'))
);

const NOV_15_AUTO1_SLUGS = [
  'ai21-labs-10-trial-credit',
  'siliconflow-1-free-credit',
  'vercel-ai-gateway-monthly-credit',
  'e2b-100-hobby-credit',
  'sail-research-5-monthly-credit',
  'napkin-ai-free-500-weekly-credits',
  'ovhcloud-ai-endpoints-7-free-models',
  'pollinations-classic-api-free',
  'apify-free-5-monthly',
  'bright-data-web-unlocker-free-tier',
  'parallel-decisions-fast-free-vercel-gateway',
  'claude-api-free-trial-credits-new-users',
  'nanonets-50-free-credits',
  'datalab-free-20-10-monthly',
  'voicegain-50-free-credits',
];

const baseHtml = '<!doctype html><html lang="ar"><head><title>AMNABD</title></head><body><div id="root"></div></body></html>';
// A live-only route is a neutral noindex document that names its own address.
const liveOnlyShell =
  '<!doctype html><html lang="ar"><head><title>نبض — عرض قيد المزامنة</title>' +
  '<meta name="robots" content="noindex,follow">' +
  '<meta property="og:url" content="https://amnabd.com/deal/live-only-deal">' +
  '<link rel="canonical" href="https://amnabd.com/deal/live-only-deal"></head>' +
  '<body><div id="root"></div></body></html>';
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
  writeFileSync(join(distDir, 'deal', 'live-only-deal', 'index.html'), liveOnlyShell, 'utf8');
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
    assert.match(verify(claimDir).join('\n'), /live-only canonical mismatch/);
    assert.match(verify(claimDir).join('\n'), /live-only route must be explicitly noindex/);
  } finally {
    rmSync(claimDir, { recursive: true, force: true });
  }

  // The exact defect: the route is a byte-for-byte copy of the homepage, so a
  // share preview and a crawler see the homepage's canonical on a deal URL.
  const copyDir = fixture();
  try {
    writeFileSync(join(copyDir, 'deal', 'live-only-deal', 'index.html'), baseHtml, 'utf8');
    const result = verify(copyDir).join('\n');
    assert.match(result, /copies the homepage shell/);
    assert.match(result, /live-only canonical mismatch/);
  } finally {
    rmSync(copyDir, { recursive: true, force: true });
  }

  // A homepage canonical on an otherwise valid noindex shell is still refused.
  const rootCanonicalDir = fixture();
  try {
    writeFileSync(
      join(rootCanonicalDir, 'deal', 'live-only-deal', 'index.html'),
      liveOnlyShell.replace(
        'https://amnabd.com/deal/live-only-deal"></head>',
        'https://amnabd.com/"></head>'
      ),
      'utf8'
    );
    assert.match(verify(rootCanonicalDir).join('\n'), /live-only canonical mismatch/);
  } finally {
    rmSync(rootCanonicalDir, { recursive: true, force: true });
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

test('curated SEO catalog includes the 15 source-reviewed November 15 auto1 additions', () => {
  const catalog = JSON.parse(readFileSync(join(process.cwd(), 'scripts/deals-catalog.json'), 'utf8'));
  const itemList = catalog['@graph'].find((entry) => entry['@type'] === 'ItemList');
  assert.equal(itemList.numberOfItems, itemList.itemListElement.length);
  assert.equal(itemList.itemListElement.length, 122);
  const slugs = new Set(itemList.itemListElement.map((entry) => new URL(entry.url).pathname.split('/').at(-1)));
  for (const slug of [
    'context-dev-1000-api',
    'runway-free-125-credits',
    'cartesia-free-tts-stt',
    'tavily-student-4-months',
    'speechmatics-signup-bonus',
    'aiven-free-tier-managed-db',
    'layerbase-free-db',
    'apple-pcc-free-foundation-models',
    'inferall-open-models-free',
    'geekflare-api-500-credits',
    'hetzner-experiments-inference-api',
    'orcarouter-free-models',
    'requesty-free-200-day',
    'mindshub-free-tier',
    'cto-new-free-forever',
    'stepfun-stepaudio-3-free',
    'cloady-free-tier',
    'daytona-200-free-compute',
    'prized-30-free-credit',
    'raon-1-mini-free-api',
    'tensorlake-free-sandbox',
    'flyio-sprites-30-trial',
    'vercel-sandbox-free-hobby',
    'freestyle-free-vms',
    'zai-free-flash-models',
    'amd-token-lab-10-points',
    'gonkarouter-1m-free-tokens',
    'vectoree-5-welcome-credit',
    'novai-2-credit-free-models',
    'ai-horde-free-generation',
    'manus-free-300-daily-credits',
    'searlo-3000-free-credits',
    'retell-ai-10-free-credits',
    'meganova-ai-free-tier',
    'ngram-free-1000-monthly-credits',
    'articul8-bivia-1b-free-tokens',
    'lindy-50-free-credits',
    'deapi-5-free-credits',
    'dahl-inference-100m-free-tokens',
    'vmodel-10-free-signup-credit',
    ...NOV_15_AUTO1_SLUGS,
  ]) {
    assert.ok(slugs.has(slug), `missing curated SEO slug: ${slug}`);
  }
  assert.ok(!slugs.has('gemini-4-hydrogen'), 'excluded gemini slug must stay out of the curated SEO catalog');
});

test('reviewed public slug snapshot is valid, unique, and complete', () => {
  const slugs = loadDealSlugSnapshot(process.cwd());
  assert.equal(slugs.length, 137);
  assert.deepEqual(slugs, [...slugs].sort());
  assert.ok(slugs.includes('anthropic-api-starter-credit'));
  assert.ok(slugs.includes('context-dev-1000-api'));
  assert.ok(slugs.includes('requesty-free-200-day'));
  assert.ok(slugs.includes('zenmux'));
  for (const slug of NOV_15_AUTO1_SLUGS) assert.ok(slugs.includes(slug), `missing public route snapshot slug: ${slug}`);
  assert.ok(!slugs.includes('gemini-4-hydrogen'), 'excluded gemini slug must stay out of the public route snapshot');
});
