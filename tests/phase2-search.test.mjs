import assert from 'node:assert/strict';
import { test } from 'node:test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const load = (name) =>
  import(pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, `src/lib/${name}.js`)));
const { matchesQuery, tokenVariants, compileQuery } = await load('normalize');
const { buildDealCorpus, matchesCorpus } = await load('discovery');
const { validateDeals } = await load('validate');
const deal = (changes) =>
  validateDeals([{ id: 'a', slug: 'a', name_en: 'Example', ...changes }]).values[0];
for (const [text, query] of [
  ['أَرْصِدَة سَحابِيّة', 'ارصده سحابيه'],
  ['GPT-4', 'gpt4'],
  ['gpt4', 'GPT-4'],
  ['node.js', 'nodejs'],
  ['nodejs', 'node.js'],
  ['Nabd ٤', 'nabd 4'],
])
  test(`search symmetric ${text}/${query}`, () => assert.equal(matchesQuery(text, query), true));
test('technical codes have no invented reverse variants', () => {
  for (const code of ['mp3', 'h264', 'c++', 'c#', '.net'])
    assert.deepEqual(tokenVariants(code), [code]);
  assert.equal(matchesQuery('C++ development', 'c#'), false);
  assert.equal(matchesQuery('C# development', 'c++'), false);
  assert.equal(matchesQuery('network tools', '.net'), false);
});
test('corpus includes benefit-only content in either language and real unit labels', () => {
  const corpus = buildDealCorpus(
    deal({
      category: { value: 'Cloud' },
      benefits: [
        {
          type: 'feature_access',
          description: { ar: 'توليد خاص', en: 'Acoustic synthesis' },
          amount: { unit: 'tokens', value: 7000000, currency: null },
        },
      ],
    })
  );
  for (const q of ['توليد', 'synthesis', 'رمز', 'tokens', 'Cloud acoustic'])
    assert.equal(matchesCorpus(corpus, q), true, q);
  assert.equal(matchesCorpus(corpus, 'cloud unrelated'), false);
  assert.equal(matchesCorpus(corpus, compileQuery('cloud synthesis')), true);
});
test('uncategorized is searchable and category metadata is not invented', () => {
  const corpus = buildDealCorpus(deal({ category: { value: 'unknown' } }));
  assert.equal(matchesCorpus(corpus, 'غير مصنف'), true);
  assert.equal(matchesCorpus(corpus, 'uncategorized'), true);
  assert.equal(matchesCorpus(corpus, 'cloud'), false);
});
test('AND crosses real fields, empty queries include all', () => {
  const corpus = buildDealCorpus(
    deal({ name_ar: 'رؤية', description_en: 'Research assistant', category: { value: 'Cloud' } })
  );
  assert.equal(matchesCorpus(corpus, 'رويه research cloud'), true);
  assert.equal(matchesCorpus(corpus, 'رويه video'), false);
  assert.equal(matchesCorpus(corpus, ''), true);
});
