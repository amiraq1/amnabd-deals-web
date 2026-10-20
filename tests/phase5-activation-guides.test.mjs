import assert from 'node:assert/strict';
import { test } from 'node:test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';

const { activationGuides, getActivationGuide } = await import(
  pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, 'src/content/activationGuides.js'))
);

test('activationGuides contains expected 4 top-value deals', () => {
  const targetSlugs = [
    'antigravity-ultra-scientists',
    'deepgram',
    'github-copilot',
    'blitz-cloud',
  ];

  const keys = Object.keys(activationGuides);
  assert.equal(keys.length, 4);

  for (const slug of targetSlugs) {
    assert.ok(keys.includes(slug), `Expected guide for ${slug} to exist`);
  }
});

test('getActivationGuide returns correct guide for valid slugs and undefined for unknown', () => {
  assert.equal(getActivationGuide('unknown-slug-123'), undefined);
  assert.equal(getActivationGuide(''), undefined);

  const copilotGuide = getActivationGuide('github-copilot');
  assert.ok(copilotGuide);
  assert.equal(copilotGuide.slug, 'github-copilot');
  assert.ok(copilotGuide.summary.includes('Copilot'));
  assert.ok(copilotGuide.steps.length >= 4);

  const antigravityGuide = getActivationGuide('antigravity-ultra-scientists');
  assert.ok(antigravityGuide);
  assert.equal(antigravityGuide.slug, 'antigravity-ultra-scientists');
  assert.ok(antigravityGuide.steps.length >= 5);
});

test('all activation guides have valid structure, steps, and notes', () => {
  for (const [slug, guide] of Object.entries(activationGuides)) {
    assert.equal(guide.slug, slug, `slug field in guide should match key ${slug}`);
    assert.equal(typeof guide.summary, 'string');
    assert.ok(guide.summary.length > 20, `Summary for ${slug} should be descriptive`);

    assert.ok(Array.isArray(guide.steps), `Steps for ${slug} must be an array`);
    assert.ok(guide.steps.length >= 3, `Guide for ${slug} should have at least 3 steps`);

    for (let i = 0; i < guide.steps.length; i++) {
      const step = guide.steps[i];
      assert.equal(typeof step, 'string');
      assert.ok(step.length >= 10, `Step ${i + 1} of ${slug} should not be empty`);
    }

    if (guide.notes) {
      assert.equal(typeof guide.notes, 'string');
      assert.ok(guide.notes.length >= 10, `Notes for ${slug} should be substantive`);
    }
  }
});

test('activation guide slugs correspond to catalog deals', () => {
  const catalogPath = join(process.cwd(), 'scripts', 'deals-catalog.json');
  const catalogRaw = readFileSync(catalogPath, 'utf8');
  const catalog = JSON.parse(catalogRaw);
  const items = catalog['@graph']?.[1]?.itemListElement || [];
  const catalogUrls = items.map((item) => item.url || '');

  for (const slug of Object.keys(activationGuides)) {
    const foundInCatalog = catalogUrls.some((url) => url.includes(slug));
    assert.ok(
      foundInCatalog,
      `Guide slug ${slug} should match a deal present in scripts/deals-catalog.json`
    );
  }
});
