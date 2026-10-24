import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';

const built = (rel) => pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, rel));
const { buildChangelogEntries, groupChangelogByDate, reviewHistoryDealHref } = await import(built('src/lib/changelog.js'));
const { routeMetadata } = await import(built('src/lib/metadata.js'));
const now = new Date('2026-10-24T12:00:00Z');
const offer = {
  slug: 'bolt-builders-week',
  name: 'Bolt',
  name_ar: 'Bolt — عرض محدود المدة',
  name_en: 'Bolt — a limited-time offer',
  status: 'active',
  review: {
    reviewed_on: '2026-10-17',
    verification_status: 'verified',
    notes: { ar: 'المصدر يحدد نافذة زمنية للعرض.', en: 'The source records a limited offer window.' },
  },
};

test('F-06: an elapsed end date is a real, separately dated expiry event, not a review-date transition', () => {
  const entries = buildChangelogEntries([
    { ...offer, status: 'expired', ends_at: '2026-10-19T06:59:00+00:00' },
  ], 'ar', now);
  assert.equal(entries.length, 2);
  const [expiry, review] = entries;
  assert.equal(expiry.event, 'expired');
  assert.equal(expiry.date, '2026-10-19');
  assert.equal(expiry.timestamp, Date.parse('2026-10-19T06:59:00Z'));
  assert.match(expiry.summary, /2026-10-19T06:59:00\+00:00/);
  assert.equal(review.event, 'review');
  assert.equal(review.date, '2026-10-17');
  assert.match(review.summary, /لا تتوفر مقارنة محفوظة/);
  assert.equal(review.reviewNote, offer.review.notes.ar);
  assert.doesNotMatch(entries.map((e) => e.summary).join(' '), /أرشف|تم تغيير|تمت إضافة/);
  assert.deepEqual(groupChangelogByDate(entries).map((g) => g.date), ['2026-10-19', '2026-10-17']);
});

test('F-06: manual expiry without an elapsed recorded date never fabricates an expiry date', () => {
  for (const ends_at of [undefined, 'invalid', '2026-12-01T00:00:00Z']) {
    const entries = buildChangelogEntries([{ ...offer, status: 'expired', ends_at }], 'en', now);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].event, 'review');
    assert.equal(entries[0].date, '2026-10-17');
    assert.match(entries[0].timingNote, /no elapsed end date is recorded/);
    assert.doesNotMatch(entries[0].summary, /archiv|added|changed/i);
  }
});

test('F-06: future deadlines remain current notices, not future history or claimed additions', () => {
  const entries = buildChangelogEntries([{ ...offer, ends_at: '2026-10-31T16:00:00Z' }], 'en', now);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].event, 'review');
  assert.equal(entries[0].date, '2026-10-17');
  assert.match(entries[0].timingNote, /Current deadline status: ending soon/);
  assert.match(entries[0].timingNote, /2026-10-31T16:00:00Z/);
  assert.equal(buildChangelogEntries([{ ...offer, review: undefined, ends_at: '2026-10-31T16:00:00Z' }], 'en', now).length, 0);
  assert.equal(buildChangelogEntries([{ ...offer, review: undefined, created_at: '2026-10-23T12:00:00Z' }], 'en', now).length, 0);
  assert.equal(buildChangelogEntries([{ ...offer, review: { verified_on: '2026-10-23' } }], 'en', now).length, 0);
});

test('F-06: expiry boundaries and UTC grouping use the shared timing model', () => {
  const dateOnly = { ...offer, review: undefined, ends_at: '2026-10-18' };
  assert.equal(buildChangelogEntries([dateOnly], 'en', new Date('2026-10-19T11:59:59.999Z')).length, 0);
  const [expired] = buildChangelogEntries([dateOnly], 'en', new Date('2026-10-19T12:00:00Z'));
  assert.equal(expired.date, '2026-10-19');
  assert.equal(expired.timestamp, Date.parse('2026-10-19T12:00:00Z'));

  const [offset] = buildChangelogEntries([{ ...offer, review: undefined, ends_at: '2026-10-20T23:30:00-07:00' }], 'en', now);
  assert.equal(offset.date, '2026-10-21');
  assert.equal(offset.timestamp, Date.parse('2026-10-21T06:30:00Z'));
});

test('F-06: strict dates reject invalid/future reviews without masking a valid expiry', () => {
  for (const reviewed_on of ['2026-02-30', 'not-a-date', '2026-10-25']) {
    const entries = buildChangelogEntries([{ ...offer, review: { reviewed_on }, ends_at: '2026-10-20T12:00:00Z' }], 'en', now);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].event, 'expired');
  }
  assert.equal(buildChangelogEntries([{ ...offer, review: undefined, ends_at: '2026-02-30' }], 'en', now).length, 0);
  assert.throws(() => buildChangelogEntries([offer], 'en', new Date('invalid')), /Invalid referenceNow/);
});

test('F-06: localized titles, notes and summaries do not duplicate the provider or invent a diff', () => {
  const [ar] = buildChangelogEntries([offer], 'ar', now);
  const [en] = buildChangelogEntries([offer], 'en', now);
  assert.equal(ar.dealTitle, offer.name_ar);
  assert.equal(en.dealTitle, offer.name_en);
  assert.equal(ar.reviewNote, offer.review.notes.ar);
  assert.equal(en.reviewNote, offer.review.notes.en);
  assert.match(en.summary, /No saved comparison/);
  assert.doesNotMatch(en.summary + en.dealTitle + en.reviewNote, /[\u0600-\u06ff]/);
  assert.doesNotMatch(en.dealTitle, /Bolt — Bolt/);
  assert.equal(reviewHistoryDealHref(offer.slug, 'en'), '/deal/bolt-builders-week?lang=en');
  assert.equal(reviewHistoryDealHref(offer.slug, 'ar'), '/deal/bolt-builders-week?lang=ar');
  assert.equal(reviewHistoryDealHref('../bad', 'en'), '/404?lang=en');
});

test('F-06: newest-first ordering and same-day incoming batch order are preserved without mutating records', () => {
  const older = { ...offer, slug: 'older', review: { ...offer.review, reviewed_on: '2026-10-16' } };
  const newest = { ...offer, slug: 'newest', review: { ...offer.review, reviewed_on: '2026-10-24' } };
  const sameDay = { ...newest, slug: 'same-day' };
  const records = [older, newest, sameDay];
  const before = JSON.stringify(records);
  const entries = buildChangelogEntries(records, 'en', now);
  assert.deepEqual(entries.map((e) => e.dealSlug), ['newest', 'same-day', 'older']);
  assert.deepEqual(groupChangelogByDate(entries).map((g) => g.date), ['2026-10-24', '2026-10-16']);
  assert.equal(JSON.stringify(records), before);
});

test('F-06: both title and details are real localized links with modified-click behavior preserved', () => {
  const page = readFileSync(join(process.cwd(), 'src/pages/ChangelogPage.tsx'), 'utf8');
  assert.equal((page.match(/href=\{reviewHistoryDealHref\(entry\.dealSlug, lang\)\}/g) ?? []).length, 2);
  assert.match(page, /aria-label=\{`\$\{lang === 'ar' \? 'عرض تفاصيل' : 'View details for'\}/);
  assert.match(page, /event\.button !== 0 \|\| event\.metaKey \|\| event\.ctrlKey \|\| event\.shiftKey \|\| event\.altKey/);
  assert.match(page, /event\.preventDefault\(\);\s+onOpenDeal\(slug\)/);
  assert.match(page, /buildChangelogEntries\(deals, lang\)/);
  assert.doesNotMatch(page, /window\.location\.href|Deals Changelog & Updates|سجل التغييرات وتحديثات العروض/);
});

test('F-06: metadata and navigation reframe the unchanged route as review history', () => {
  assert.match(routeMetadata({ name: 'changelog' }, 'ar').title, /سجل مراجعات العروض/);
  assert.match(routeMetadata({ name: 'changelog' }, 'en').title, /Offer Review History/);
  assert.equal(routeMetadata({ name: 'changelog' }, 'en').canonicalUrl, 'https://amnabd.com/changelog');
  for (const file of ['src/components/Footer.tsx', 'src/components/Navbar.tsx']) {
    const source = readFileSync(join(process.cwd(), file), 'utf8');
    assert.match(source, /Review History/);
    assert.doesNotMatch(source, /'Changelog'/);
  }
  const staticSeo = readFileSync(join(process.cwd(), 'scripts/generate-static-seo.mjs'), 'utf8');
  assert.match(staticSeo, /title: 'سجل مراجعات العروض —/);
  assert.doesNotMatch(staticSeo, /سجل التغييرات وتحديثات العروض/);
});
