import assert from 'node:assert/strict';
import { test } from 'node:test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const {
  getChangelogEventType,
  buildChangelogSummary,
  buildChangelogEntries,
  groupChangelogByDate,
} = await import(
  pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, 'src/lib/changelog.js'))
);

const { parseLocationRoute, routeHash, routePath, migrateLegacyHashLocation } = await import(
  pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, 'src/lib/routes.js'))
);

const {
  generateRssFeedXml,
  toRfc822Date,
  generateSitemapXml,
} = await import(pathToFileURL(join(process.cwd(), 'scripts/generate-static-seo.mjs')));

test('getChangelogEventType accurately reflects deal status', () => {
  assert.equal(getChangelogEventType({ status: 'expired' }), 'expired');
  assert.equal(getChangelogEventType({ status: 'ending_soon' }), 'ending_soon');
  // H-11: an active deal is only "verified" when the status says so.
  assert.equal(getChangelogEventType({ status: 'active' }), 'active');
  assert.equal(getChangelogEventType({}), 'active');
  assert.equal(
    getChangelogEventType({ status: 'active', review: { verification_status: 'verified' } }),
    'verified'
  );
  assert.equal(
    getChangelogEventType({ status: 'active', review: { verification_status: 'verifying' } }),
    'active'
  );
});

test('buildChangelogSummary produces tailored notes for each event type', () => {
  const expiredSummary = buildChangelogSummary({ status: 'expired' }, 'expired');
  assert.ok(expiredSummary.includes('انتهت صلاحية العرض'));

  const endingSoonSummary = buildChangelogSummary(
    { status: 'ending_soon', ends_at: '2026-10-31' },
    'ending_soon'
  );
  assert.ok(endingSoonSummary.includes('2026-10-31'));

  const verifiedSummary = buildChangelogSummary(
    {
      status: 'active',
      eligibility: { card_required: 'not_required', student_status: 'required' },
    },
    'verified'
  );
  assert.ok(verifiedSummary.includes('بدون بطاقة'));
  assert.ok(verifiedSummary.includes('للطلاب'));
});

test('buildChangelogEntries extracts and sorts entries chronologically descending', () => {
  const deals = [
    {
      id: '1',
      slug: 'old-deal',
      name: 'Old Deal',
      name_ar: 'عرض قديم',
      status: 'active',
      review: { reviewed_on: '2026-10-10' },
    },
    {
      id: '2',
      slug: 'new-deal',
      name: 'New Deal',
      name_ar: 'عرض جديد',
      status: 'ending_soon',
      ends_at: '2026-10-25',
      review: { reviewed_on: '2026-10-20' },
    },
    {
      id: '3',
      slug: 'no-date',
      name: 'No Date Deal',
      status: 'active',
    },
  ];

  const entries = buildChangelogEntries(deals);
  assert.equal(entries.length, 2);
  assert.equal(entries[0].dealSlug, 'new-deal');
  assert.equal(entries[1].dealSlug, 'old-deal');

  const groups = groupChangelogByDate(entries);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].date, '2026-10-20');
  assert.equal(groups[1].date, '2026-10-10');
});

test('routes module supports changelog page', () => {
  assert.deepEqual(parseLocationRoute('/changelog'), { name: 'changelog' });
  // A01: the legacy hash form is migrated to the path, then parsed as a path.
  assert.equal(
    migrateLegacyHashLocation({ pathname: '/', search: '', hash: '#/changelog' }),
    '/changelog'
  );
  assert.deepEqual(parseLocationRoute('/changelog'), { name: 'changelog' });
  assert.equal(routeHash({ name: 'changelog' }), '#/changelog');
  assert.equal(routePath({ name: 'changelog' }), '/changelog');
});

test('toRfc822Date produces valid RFC-822 formatted UTC date strings', () => {
  const rfc = toRfc822Date('2026-10-18T12:00:00Z');
  assert.ok(rfc.includes('GMT') || rfc.includes('UTC'));
  assert.ok(rfc.includes('2026'));
  assert.ok(rfc.includes('18'));

  // Invalid date fallback returns current time RFC-822 without crashing
  const fallback = toRfc822Date('not-a-valid-date');
  assert.ok(fallback.includes('GMT') || fallback.includes('UTC'));
});

test('generateRssFeedXml creates compliant RSS 2.0 feed', () => {
  const deals = [
    {
      slug: 'bolt-active',
      name: 'Bolt',
      title: 'رصيد Bolt',
      status: 'active',
      headline_value: '$100',
      summary: 'رصيد سحابي لبناء تطبيقات الذكاء الاصطناعي',
      review: { reviewed_on: '2026-10-18' },
    },
    {
      slug: 'cursor-ending',
      name: 'Cursor',
      title: 'اشتراك كيرسور',
      status: 'ending_soon',
      ends_at: '2026-10-25',
      review: { reviewed_on: '2026-10-19' },
    },
    {
      slug: 'expired-deal',
      name: 'Expired Deal',
      title: 'عرض منتهي',
      status: 'expired',
      review: { reviewed_on: '2026-10-15' },
    },
  ];

  const xml = generateRssFeedXml(deals, 'https://amnabd.com');

  // Verify XML structure and RSS 2.0 namespace
  assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(xml.includes('<rss version="2.0"'));
  assert.ok(xml.includes('<channel>'));
  assert.ok(xml.includes('<atom:link href="https://amnabd.com/feed.xml"'));

  // Expired deal must be excluded from active feed
  assert.ok(!xml.includes('expired-deal'));

  // Active and ending_soon deals must be included
  assert.ok(xml.includes('bolt-active'));
  assert.ok(xml.includes('cursor-ending'));

  // Ending soon deal gets prefix in item title
  assert.ok(xml.includes('⏳ ينتهي قريبًا: اشتراك كيرسور'));

  // Guid is composite for bot change detection
  assert.ok(xml.includes('<guid isPermaLink="false">cursor-ending:ending_soon:2026-10-19</guid>'));
});

test('generateSitemapXml includes changelog page with daily changefreq', () => {
  const sitemap = generateSitemapXml([], 'https://amnabd.com');
  assert.ok(sitemap.includes('<loc>https://amnabd.com/changelog</loc>'));
  assert.ok(sitemap.includes('<priority>0.8</priority>'));
});
