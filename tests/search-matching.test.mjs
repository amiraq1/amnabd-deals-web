// AMN-007 — search matching policy C (word start, Arabic clitics allowed).
//
// The audit's synthetic case was `matchesQuery('paid plan', 'ai') === true`
// because `ai` occurs inside `paid`. This file is the corpus that
// `docs/search-matching-policy.md` asked for before the policy could ship: it
// pins the behaviour that changes, and the behaviour that must not.
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';

const load = (name) =>
  import(pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, `src/lib/${name}.js`)));

const { matchesQuery, compileQuery, normalizeArabic, expandTextWithVariants } = await load('normalize');
const { matchesCorpus } = await load('discovery');

test('AMN-007: a short token no longer matches inside an unrelated word', () => {
  assert.equal(matchesQuery('paid plan', 'ai'), false);
  assert.equal(matchesQuery('claim your reward', 'ai'), false);
});

test('AMN-007: prefix search still works, so short queries keep finding offers', () => {
  assert.equal(matchesQuery('AI credits', 'ai'), true);
  assert.equal(matchesQuery('aim confidently', 'ai'), true);
  assert.equal(matchesQuery('Airtable credits', 'ai'), true);
});

test('AMN-007: `ai` does not match `openai` — the documented cost of policy C', () => {
  // This is the explicit decision the policy doc asked for. Under policy B or C
  // the mid-word occurrence is dropped; a suffix rule would keep it.
  assert.equal(matchesQuery('OpenAI API credits', 'ai'), false);
});

test('AMN-007: Arabic proclitics do not hide a word', () => {
  const corpus = 'الذكاء الاصطناعي';
  assert.equal(matchesQuery(corpus, 'ذكاء'), true);
  assert.equal(matchesQuery('بالذكاء الاصطناعي', 'ذكاء'), true);
  assert.equal(matchesQuery('والذكاء الاصطناعي', 'ذكاء'), true);
  assert.equal(matchesQuery('للذكاء الاصطناعي', 'ذكاء'), true);
  assert.equal(matchesQuery('كالذكاء الاصطناعي', 'ذكاء'), true);
});

test('AMN-007: a bare single-letter prefix is not stripped into a fake stem', () => {
  // `ب` + `رمجة` would invent `رمجة`; only the definite-article family is stripped.
  assert.equal(matchesQuery('برمجة تطبيقات', 'رمجة'), false);
  assert.equal(matchesQuery('برمجة تطبيقات', 'برمجة'), true);
});

test('AMN-007: protected technical symbols still match exactly', () => {
  assert.equal(matchesQuery('C++ development', 'c++'), true);
  assert.equal(matchesQuery('C# development', 'c#'), true);
  assert.equal(matchesQuery('network tools', '.net'), false);
  assert.equal(matchesQuery('.NET runtime', '.net'), true);
  assert.equal(matchesQuery('C++ development', 'c#'), false);
});

test('AMN-007: normalization is unchanged by the matching policy', () => {
  assert.equal(normalizeArabic('أحمد'), normalizeArabic('احمد'));
  assert.equal(matchesQuery('إئتمان مجاني', 'ائتمان'), true);
  assert.equal(matchesQuery('١٠٠ دولار', '100'), true);
});

test('AMN-007: token AND semantics survive the policy change', () => {
  const corpus = 'GitHub Copilot free for students';
  assert.equal(matchesQuery(corpus, 'github students'), true);
  assert.equal(matchesQuery(corpus, 'github enterprise'), false);
});

test('AMN-007: the app corpus path and the synthetic path agree', () => {
  const corpus = 'free credits for students';
  for (const query of ['free', 'students', 'free students', 'enterprise', 'credit']) {
    assert.equal(
      matchesCorpus(corpus, compileQuery(query)),
      matchesQuery(corpus, query),
      `disagreement for "${query}"`
    );
  }
});

test('AMN-007: a filtered query keeps its result count across a re-run', () => {
  // `matchesCorpus` receives what `buildDealCorpus` produces: normalized and
  // variant-expanded text. Passing raw mixed-case text would test the wrong thing.
  const corpus = expandTextWithVariants('Vercel AI Gateway credits');
  const groups = compileQuery('vercel credits');
  const first = matchesCorpus(corpus, groups);
  const second = matchesCorpus(corpus, compileQuery('vercel credits'));
  assert.equal(first, second);
  assert.equal(first, true);
});
