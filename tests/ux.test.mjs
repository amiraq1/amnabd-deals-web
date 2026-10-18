import assert from 'node:assert/strict';
import { test } from 'node:test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const load = (name) =>
  import(pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, `src/lib/${name}.js`)));
const { categoryKey, categoryOptions, matchesCategory } = await load('discovery');
const { recordedPrice, registrationDeadline, extraBenefitsLabel } = await load('cardFacts');
const { buildDealLink, copyLink } = await load('share');
const pricing = (changes = {}) => ({
  currency: 'USD',
  offer_price: 0,
  original_price: 20,
  billing_cycle: 'monthly',
  ...changes,
});

test('UX categories group only case/spacing variants with unclassified last', () => {
  const options = categoryOptions(
    [' Cloud ', 'cloud', 'AI Models', 'unknown', '', 'أدوات تطوير', '__proto__', 'constructor'].map(
      (value) => ({ category: { value } })
    ),
    'ar'
  );
  assert.equal(options.find((x) => x.key === 'cloud').count, 2);
  assert.equal(options.find((x) => x.key === 'ai models').count, 1);
  assert.equal(options.at(-1).key, '');
  assert.equal(options.at(-1).count, 2);
  assert.equal(options.at(-1).label, 'غير مصنّف');
  assert.ok(options.some((x) => x.key === '__proto__'));
  assert.ok(options.some((x) => x.key === 'constructor'));
  assert.equal({}.polluted, undefined);
});
test('UX category all, unknown and actual all category are distinct', () => {
  assert.equal(matchesCategory('unknown', null), true);
  assert.equal(matchesCategory('unknown', ''), true);
  assert.equal(matchesCategory('cloud', ''), false);
  assert.equal(matchesCategory('all', 'all'), true);
  assert.equal(matchesCategory('cloud', 'all'), false);
  assert.equal(categoryKey(null), '');
  assert.equal(categoryKey('  أَدوات  تطوير  '), 'أَدوات تطوير');
});
test('UX category labels change only for unknown, not inferred translations', () => {
  const options = categoryOptions(
    [{ category: { value: 'Vendor New Category' } }, { category: { value: 'unknown' } }],
    'en'
  );
  assert.equal(options[0].label, 'Vendor New Category');
  assert.equal(options[1].label, 'Uncategorized');
});
test('UX recorded zero price includes period but never claims universal free/savings', () => {
  const label = recordedPrice(pricing(), 'en');
  assert.equal(label, 'Recorded price: 0 USD · monthly');
  assert.doesNotMatch(label, /free|save|100%|20/i);
  assert.match(recordedPrice(pricing(), 'ar'), /٠ USD/);
});
for (const value of [null, undefined, NaN, Infinity, -1, '0'])
  test(`UX unknown/invalid price ${String(value)}`, () => {
    assert.equal(recordedPrice(pricing({ offer_price: value }), 'en'), 'Recorded price: Unknown');
  });
test('UX prices never invent currency, billing period or reference discount', () => {
  assert.match(
    recordedPrice(pricing({ currency: null, billing_cycle: 'unknown' }), 'en'),
    /currency unknown · billing period unknown/
  );
  assert.match(recordedPrice(pricing({ currency: 'usd', offer_price: 12.75 }), 'en'), /12.75 USD/);
  assert.match(
    recordedPrice(pricing({ currency: 'unknown', billing_cycle: 'constructor' }), 'ar'),
    /العملة غير معلومة.*دورة الفوترة غير معلومة/
  );
  assert.doesNotMatch(recordedPrice(pricing({ original_price: 10000 }), 'en'), /10000|100%|save/i);
});
for (const lang of ['ar', 'en'])
  test(`UX deadline keeps date-only and explicit timezone (${lang})`, () => {
    assert.match(
      registrationDeadline({ status: 'known', date: '2028-02-29' }, lang),
      /2028-02-29$/
    );
    assert.match(
      registrationDeadline({ status: 'known', date: '2026-10-31T16:00:00Z' }, lang),
      /2026-10-31T16:00:00Z$/
    );
    assert.match(
      registrationDeadline({ status: 'known', date: '2026-10-31T19:00:00+03:00' }, lang),
      /2026-10-31T19:00:00\+03:00$/
    );
  });
for (const date of [
  null,
  '2026-02-29',
  '2026-02-30',
  '2026-10-31T16:00:00',
  '2026-10-31T24:00:00Z',
  '2026-10-31T16:60:00Z',
  '2026-10-31T16:00:60Z',
  'junk',
])
  test(`UX deadline is unknown for invalid/unzoned date ${date}`, () => {
    assert.equal(
      registrationDeadline({ status: 'known', date }, 'en'),
      'Registration deadline: Unknown'
    );
  });
test('UX unknown or unrecognized deadline status cannot become permanent or urgent', () => {
  for (const status of ['unknown', 'no_deadline', 'future-status', 'constructor'])
    assert.equal(
      registrationDeadline({ status, date: '2026-10-31' }, 'en'),
      'Registration deadline: Unknown'
    );
});
test('UX additional benefits handles Arabic grammar and zero/single total', () => {
  assert.equal(extraBenefitsLabel(0, 'ar'), null);
  assert.equal(extraBenefitsLabel(1, 'en'), null);
  assert.equal(extraBenefitsLabel(2, 'ar'), 'منفعة إضافية واحدة');
  assert.equal(extraBenefitsLabel(3, 'ar'), 'منفعتان إضافيتان');
  assert.equal(extraBenefitsLabel(4, 'ar'), '+٣ منافع إضافية');
  assert.equal(extraBenefitsLabel(12, 'ar'), '+١١ منفعة إضافية');
  assert.equal(extraBenefitsLabel(2, 'en'), '+1 additional benefit');
  assert.equal(extraBenefitsLabel(3, 'en'), '+2 additional benefits');
  assert.equal(extraBenefitsLabel(NaN, 'en'), null);
});
test('UX share URL is canonical for slug, preserves subdirectory, removes query', () => {
  assert.equal(
    buildDealLink('https://amnabd.com/?tracking=x#/deal/old', 'offer'),
    'https://amnabd.com/#/deal/offer'
  );
  assert.equal(
    buildDealLink('https://example.org/amnabd-deals-web/?x=y#/', 'نبض'),
    'https://example.org/amnabd-deals-web/#/deal/%D9%86%D8%A8%D8%B6'
  );
  assert.equal(buildDealLink('https://amnabd.com/', '%2F'), 'https://amnabd.com/#/deal/%252F');
});
test('UX share rejects invalid schemes, credentials and invalid slugs', () => {
  for (const url of [
    'javascript:alert(1)',
    'file:///data/test',
    'broken',
    'https://name:password@example.org/',
  ])
    assert.equal(buildDealLink(url, 'offer'), null);
  for (const slug of ['bad/slug', '', '\ud800'])
    assert.equal(buildDealLink('https://amnabd.com/', slug), null);
});
test('UX clipboard success, rejection and unsupported are handled without reads', async () => {
  let written;
  assert.equal(
    await copyLink('https://example.org/#/deal/x', async (text) => {
      written = text;
    }),
    true
  );
  assert.equal(written, 'https://example.org/#/deal/x');
  assert.equal(await copyLink('link', undefined), false);
  assert.equal(
    await copyLink('link', async () => {
      throw Error('PRIVATE');
    }),
    false
  );
});

test('UX clipboard permission timeout offers manual recovery and observes late rejection', async () => {
  let fail;
  const result = await copyLink(
    'link',
    () =>
      new Promise((_resolve, reject) => {
        fail = reject;
      }),
    5
  );
  assert.equal(result, false);
  fail(Error('late rejection'));
  await new Promise((resolve) => setTimeout(resolve, 5));
});
