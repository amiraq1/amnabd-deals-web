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

// Phase 2: Expanded Search, URL State, and Safe Sorting Tests
const { normalizeArabic, matchesQuery, extractTokens, tokenVariants, expandTextWithVariants } =
  await load('normalize');
const { buildDealCorpus, matchesCorpus } = await load('discovery');
const { parseFilterState, serializeFilterState, buildDiscoveryHash, DEFAULT_FILTER_STATE } =
  await load('filterState');
const { sortDeals, classifyDeadline, deadlineTierLabel } = await load('dealSort');
const { parseHash, extractHashSearch } = await load('routes');

test('UX Phase 2: Arabic normalization handles digits, tatweel, hamzas and diacritics', () => {
  assert.equal(normalizeArabic('ذَكاءٌ اصْطِنَاعِيّ'), 'ذكاء اصطناعي');
  assert.equal(normalizeArabic('إنسان وأحمد وآلة واكتب'), 'انسان واحمد واله واكتب');
  assert.equal(normalizeArabic('مدرّسة ومستشفى'), 'مدرسه ومستشفي');
  assert.equal(normalizeArabic('سنة ٢٠٢٦ م'), 'سنه 2026 م');
  assert.equal(normalizeArabic('نــــبــــض'), 'نبض');
});

test('UX Phase 2: Technical normalization preserves c++, c#, .net and generates compact variants', () => {
  assert.deepEqual(extractTokens('C++ and C# with .NET'), ['c++', 'and', 'c#', 'with', '.net']);
  assert.deepEqual(tokenVariants('c++'), ['c++']);
  assert.deepEqual(tokenVariants('c#'), ['c#']);
  assert.deepEqual(tokenVariants('.net'), ['.net']);
  assert.deepEqual(tokenVariants('gpt-4'), ['gpt-4', 'gpt4']);
  assert.deepEqual(tokenVariants('node.js'), ['node.js', 'nodejs']);

  // Symmetric matching
  assert.equal(matchesQuery('Supported on GPT-4 platform', 'gpt4'), true);
  assert.equal(matchesQuery('Supported on GPT-4 platform', 'gpt-4'), true);
  assert.equal(matchesQuery('Supports gpt4 models', 'GPT-4'), true);
  assert.equal(matchesQuery('Supports Node.js runtime', 'nodejs'), true);
  assert.equal(matchesQuery('C++ SDK available', 'c++'), true);
  assert.equal(matchesQuery('C++ SDK available', 'c#'), false);
  assert.equal(matchesQuery('C# client library', 'c++'), false);
  assert.equal(matchesQuery('.NET Core framework', '.net'), true);
});

test('UX Phase 2: Search corpus includes benefits, units, and matches across fields with AND semantics', () => {
  const dummyDeal = {
    id: 'test-deal-1',
    slug: 'test-deal',
    name_ar: 'نبض كلاود',
    name_en: 'Nabd Cloud',
    description_ar: 'منصة حوسبة سحابية متقدمة',
    description_en: 'Advanced cloud computing platform with python sdk',
    category: { value: 'Cloud' },
    benefits: [
      {
        type: 'usage_credits',
        amount: { unit: 'tokens', value: 1000000, currency: 'USD' },
        frequency: 'monthly',
        description: { ar: 'مليون رمز مجاني شهرياً', en: 'One million free tokens per month' },
      },
    ],
  };

  const corpus = buildDealCorpus(dummyDeal);
  assert.ok(corpus.includes('tokens'));
  assert.ok(corpus.includes('cloud'));

  // Matches benefit text
  assert.equal(matchesCorpus(corpus, 'tokens'), true);
  assert.equal(matchesCorpus(corpus, 'مليون'), true);
  // Cross-field AND query
  assert.equal(matchesCorpus(corpus, 'Nabd python tokens'), true);
  // Missing token in AND query fails
  assert.equal(matchesCorpus(corpus, 'Nabd rust'), false);
  // Empty query returns true
  assert.equal(matchesCorpus(corpus, ''), true);
  assert.equal(matchesCorpus(corpus, '   '), true);
});

test('UX Phase 2: URL FilterState parse -> serialize -> parse is idempotent and safe', () => {
  const state = {
    q: 'gpt-4 developer',
    category: 'cloud',
    applicant: 'student',
    card: 'not_required',
    sort: 'deadline',
  };
  const qs = serializeFilterState(state);
  const parsed = parseFilterState(qs, new Set(['cloud']));
  assert.deepEqual(parsed, state);
  assert.equal(serializeFilterState(parsed), qs);

  // Default values are stripped
  const defaultQs = serializeFilterState(DEFAULT_FILTER_STATE);
  assert.equal(defaultQs, '');
});

test('UX Phase 2: URL FilterState handles single %, 50%, truncation, duplicate and unknown params', () => {
  // Single % or 50% does not throw URIError
  assert.doesNotThrow(() => parseFilterState('?q=50%'));
  assert.doesNotThrow(() => parseFilterState('?q=%'));
  const p1 = parseFilterState('?q=50%');
  assert.equal(p1.q, '50%');

  // Truncation at 120 chars
  const longQ = 'a'.repeat(200);
  const p2 = parseFilterState(`?q=${longQ}`);
  assert.equal(p2.q.length, 120);

  // Duplicate params take the first valid value
  const p3 = parseFilterState('?sort=reviewed&sort=deadline');
  assert.equal(p3.sort, 'reviewed');

  // Unknown params are ignored
  const p4 = parseFilterState('?foo=bar&utm_source=twitter&sort=deadline');
  assert.equal(p4.sort, 'deadline');
  assert.equal(serializeFilterState(p4), 'sort=deadline');
});

test('UX Phase 2: Invalid category in URL is captured and not re-serialized', () => {
  const validKeys = new Set(['cloud', 'ai models']);
  const parsed = parseFilterState('?category=unsupported-category&sort=reviewed', validKeys);
  assert.equal(parsed.category, 'all');
  assert.equal(parsed.invalidCategory, 'unsupported-category');
  assert.equal(parsed.sort, 'reviewed');

  // Serialization does not output invalidCategory
  const reserialized = serializeFilterState(parsed);
  assert.equal(reserialized, 'sort=reviewed');
  assert.doesNotMatch(reserialized, /unsupported-category/);
});

test('UX Phase 2: Routes separates path from search query and parses #?q= and #/?q= as home', () => {
  assert.deepEqual(parseHash(''), { name: 'home' });
  assert.deepEqual(parseHash('#'), { name: 'home' });
  assert.deepEqual(parseHash('#/'), { name: 'home' });
  assert.deepEqual(parseHash('#?q=test'), { name: 'home' });
  assert.deepEqual(parseHash('#/?q=test'), { name: 'home' });
  assert.deepEqual(parseHash('#/guide?ref=nav'), { name: 'guide' });
  assert.deepEqual(parseHash('#/deal/nabd-tool?search=true'), { name: 'deal', slug: 'nabd-tool' });
  assert.deepEqual(parseHash('#/deal/%'), { name: 'notfound' });

  assert.equal(extractHashSearch('#/?q=gpt&sort=deadline'), 'q=gpt&sort=deadline');
  assert.equal(extractHashSearch('#/'), '');
});

test('UX Phase 2: Safe sorting is pure, stable, and strictly orders the 4 deadline tiers', () => {
  const refNow = new Date('2026-10-18T12:00:00Z');

  const deals = [
    {
      id: 'd-tier4-bad',
      slug: 'd4-bad',
      registration: { deadline: { status: 'known', date: '2026-02-30' } }, // impossible leap date -> tier 4
      review: { reviewed_on: '2026-10-01' },
    },
    {
      id: 'd-tier2-later',
      slug: 'd2-later',
      registration: { deadline: { status: 'known', date: '2026-10-25' } }, // future calendar -> tier 2
      review: { reviewed_on: '2026-10-10' },
    },
    {
      id: 'd-tier1-exact-soon',
      slug: 'd1-soon',
      registration: { deadline: { status: 'known', date: '2026-10-18T18:00:00Z' } }, // future exact -> tier 1
      review: { reviewed_on: '2026-10-15' },
    },
    {
      id: 'd-tier3-expired-exact',
      slug: 'd3-exact',
      registration: { deadline: { status: 'known', date: '2026-10-17T15:00:00Z' } }, // expired exact -> tier 3
      review: { reviewed_on: '2026-09-20' },
    },
    {
      id: 'd-tier1-exact-later',
      slug: 'd1-later',
      registration: { deadline: { status: 'known', date: '2026-10-20T10:00:00Z' } }, // future exact later -> tier 1
      review: { reviewed_on: '2026-10-16' },
    },
    {
      id: 'd-tier2-today',
      slug: 'd2-today',
      registration: { deadline: { status: 'known', date: '2026-10-18' } }, // today calendar -> tier 2
      review: { reviewed_on: '2026-10-17' },
    },
    {
      id: 'd-tier4-unknown',
      slug: 'd4-unk',
      registration: { deadline: { status: 'unknown', date: null } }, // unknown -> tier 4
      review: { reviewed_on: '' },
    },
    {
      id: 'd-tier3-expired-calendar',
      slug: 'd3-cal',
      registration: { deadline: { status: 'known', date: '2026-10-10' } }, // expired calendar -> tier 3
      review: { reviewed_on: '2026-08-01' },
    },
  ];

  // Immutability check
  Object.freeze(deals);
  const sortedDeadline = sortDeals(deals, 'deadline', refNow);
  assert.equal(sortedDeadline.length, deals.length);

  // Tier 1 items come first: d1-soon (18:00) then d1-later (Oct 20)
  assert.equal(sortedDeadline[0].id, 'd-tier1-exact-soon');
  assert.equal(sortedDeadline[1].id, 'd-tier1-exact-later');

  // Tier 2 items come second: d2-today (Oct 18) then d2-later (Oct 25)
  assert.equal(sortedDeadline[2].id, 'd-tier2-today');
  assert.equal(sortedDeadline[3].id, 'd-tier2-later');

  // Tier 3 items come third, sorted descending (most recently expired first): Oct 17 then Oct 10
  assert.equal(sortedDeadline[4].id, 'd-tier3-expired-exact');
  assert.equal(sortedDeadline[5].id, 'd-tier3-expired-calendar');

  // Tier 4 items come last in original order: d-tier4-bad then d-tier4-unknown
  assert.equal(sortedDeadline[6].id, 'd-tier4-bad');
  assert.equal(sortedDeadline[7].id, 'd-tier4-unknown');

  // Reviewed sorting: newest dates first, missing/invalid at end
  const sortedReviewed = sortDeals(deals, 'reviewed', refNow);
  assert.equal(sortedReviewed[0].id, 'd-tier2-today'); // 2026-10-17
  assert.equal(sortedReviewed[1].id, 'd-tier1-exact-later'); // 2026-10-16
  assert.equal(sortedReviewed[2].id, 'd-tier1-exact-soon'); // 2026-10-15
  assert.equal(sortedReviewed.at(-1).id, 'd-tier4-unknown'); // empty date

  // Default sorting preserves exact original order
  const sortedDefault = sortDeals(deals, 'default', refNow);
  assert.deepEqual(
    sortedDefault.map((d) => d.id),
    deals.map((d) => d.id)
  );
});
