import assert from 'node:assert/strict';
import { test } from 'node:test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';

const { activationGuides, getActivationGuide } = await import(
  pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, 'src/content/activationGuides.js'))
);

const formerlyPublishedUnreviewedSlugs = [
  'antigravity-ultra-scientists',
  'deepgram',
  'github-copilot',
  'blitz-cloud',
];

test('unreviewed static activation guides stay out of the public registry', () => {
  assert.deepEqual(Object.keys(activationGuides), []);
  assert.equal(Object.isFrozen(activationGuides), true);
  for (const slug of formerlyPublishedUnreviewedSlugs) {
    assert.equal(
      getActivationGuide(slug),
      undefined,
      `Unreviewed guide for ${slug} must remain hidden`
    );
  }
});

test('unknown activation guides fail closed', () => {
  assert.equal(getActivationGuide('unknown-slug-123'), undefined);
  assert.equal(getActivationGuide(''), undefined);
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
