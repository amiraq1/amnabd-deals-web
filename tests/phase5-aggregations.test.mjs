import assert from 'node:assert/strict';
import { test } from 'node:test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const { AGGREGATIONS, AGGREGATION_KEYS, getAggregationConfig } = await import(
  pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, 'src/lib/aggregations.js'))
);

const { parseLocationRoute, routeHash, routePath, migrateLegacyHashLocation } = await import(
  pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, 'src/lib/routes.js'))
);

const {
  STATIC_AGGREGATIONS,
  buildAggregationSeo,
  generateSitemapXml,
} = await import(pathToFileURL(join(process.cwd(), 'scripts/generate-static-seo.mjs')));

test('AGGREGATIONS defines all 4 primary curated collections', () => {
  assert.equal(AGGREGATION_KEYS.length, 4);
  assert.deepEqual(AGGREGATION_KEYS, [
    'for-students',
    'no-credit-card',
    'coding',
    'ending-soon',
  ]);

  for (const key of AGGREGATION_KEYS) {
    const config = getAggregationConfig(key);
    assert.ok(config, `Missing config for ${key}`);
    assert.ok(config.titleAr.length > 5);
    assert.ok(config.titleEn.length > 5);
    assert.ok(config.headingAr.length > 5);
    assert.ok(config.descriptionAr.length > 10);
    assert.equal(typeof config.filter, 'function');
  }
});

test('aggregation filters accurately match qualifying deals', () => {
  const studentDeal = {
    id: '1',
    slug: 'student-deal',
    eligibility: { student_status: 'required', card_required: 'required' },
    status: 'active',
  };
  const freeNoCardDeal = {
    id: '2',
    slug: 'no-card-deal',
    eligibility: { student_status: 'not_required', card_required: 'not_required' },
    status: 'active',
  };
  const codingDeal = {
    id: '3',
    slug: 'coding-deal',
    use_cases: ['برمجة', 'وكلاء ذكاء اصطناعي'],
    eligibility: { student_status: 'not_required', card_required: 'required' },
    status: 'active',
  };
  const endingSoonDeal = {
    id: '4',
    slug: 'ending-deal',
    status: 'ending_soon',
    ends_at: '2026-10-31',
  };

  assert.equal(AGGREGATIONS['for-students'].filter(studentDeal), true);
  assert.equal(AGGREGATIONS['for-students'].filter(freeNoCardDeal), false);

  assert.equal(AGGREGATIONS['no-credit-card'].filter(freeNoCardDeal), true);
  assert.equal(AGGREGATIONS['no-credit-card'].filter(studentDeal), false);

  assert.equal(AGGREGATIONS['coding'].filter(codingDeal), true);
  assert.equal(AGGREGATIONS['coding'].filter(studentDeal), false);

  assert.equal(AGGREGATIONS['ending-soon'].filter(endingSoonDeal), true);
  assert.equal(AGGREGATIONS['ending-soon'].filter(studentDeal), false);
});

test('routes.ts supports collection routes cleanly and via legacy hash', () => {
  assert.deepEqual(parseLocationRoute('/for-students'), {
    name: 'collection',
    collectionKey: 'for-students',
  });
  assert.deepEqual(parseLocationRoute('/no-credit-card'), {
    name: 'collection',
    collectionKey: 'no-credit-card',
  });
  assert.deepEqual(parseLocationRoute('/coding'), {
    name: 'collection',
    collectionKey: 'coding',
  });
  assert.deepEqual(parseLocationRoute('/ending-soon'), {
    name: 'collection',
    collectionKey: 'ending-soon',
  });

  // Legacy hash routes migrate to their path form once, at boot.
  assert.equal(
    migrateLegacyHashLocation({ pathname: '/', search: '', hash: '#/for-students' }),
    '/for-students'
  );
  assert.equal(
    migrateLegacyHashLocation({ pathname: '/', search: '', hash: '#/coding' }),
    '/coding'
  );

  // routePath and routeHash
  assert.equal(
    routePath({ name: 'collection', collectionKey: 'for-students' }),
    '/for-students'
  );
  assert.equal(
    routeHash({ name: 'collection', collectionKey: 'for-students' }),
    '#/for-students'
  );
});

test('buildAggregationSeo generates structured ItemList schema and canonical URL', () => {
  const sampleAgg = STATIC_AGGREGATIONS[0];
  const sampleDeals = [
    { slug: 'copilot-student', name: 'GitHub Copilot', name_ar: 'جيت هب كوبايلوت', headline_value: 'مجاني للطلاب' },
    { slug: 'figma-edu', name: 'Figma', name_ar: 'فيجما التعليمي', headline_value: 'مجاني للتعليم' },
  ];

  const seo = buildAggregationSeo(sampleAgg, sampleDeals, 'https://amnabd.com');

  assert.equal(seo.canonicalUrl, 'https://amnabd.com/for-students');
  assert.ok(seo.title.includes('للطلاب'));
  assert.equal(seo.jsonLd['@type'], 'ItemList');
  assert.equal(seo.jsonLd.numberOfItems, 2);
  assert.equal(seo.jsonLd.itemListElement.length, 2);
  assert.equal(seo.jsonLd.itemListElement[0].name, 'جيت هب كوبايلوت');
  assert.equal(seo.jsonLd.itemListElement[0].url, 'https://amnabd.com/deal/copilot-student');
});

test('generateSitemapXml lists only collections that contain a deal', () => {
  // C-01: an empty collection page would advertise deals that do not exist.
  const empty = generateSitemapXml([], 'https://amnabd.com');
  assert.equal(empty.includes('<loc>https://amnabd.com/for-students</loc>'), false);
  assert.equal(empty.includes('<loc>https://amnabd.com/no-credit-card</loc>'), false);
  assert.equal(empty.includes('<loc>https://amnabd.com/coding</loc>'), false);
  assert.equal(empty.includes('<loc>https://amnabd.com/ending-soon</loc>'), false);

  const populated = generateSitemapXml(
    [
      {
        id: '1',
        slug: 'figma',
        status: 'active',
        eligibility: { student_status: 'required', card_required: 'required' },
      },
      {
        id: '2',
        slug: 'zed',
        status: 'ending_soon',
        eligibility: { student_status: 'required', card_required: 'required' },
      },
    ],
    'https://amnabd.com'
  );
  assert.ok(populated.includes('<loc>https://amnabd.com/for-students</loc>'));
  assert.ok(populated.includes('<loc>https://amnabd.com/ending-soon</loc>'));
  assert.ok(populated.includes('<priority>0.9</priority>'));
  assert.equal(populated.includes('<loc>https://amnabd.com/no-credit-card</loc>'), false);
});
