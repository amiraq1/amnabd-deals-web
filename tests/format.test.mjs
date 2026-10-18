import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
const { benefitAmount, durationLabel, reviewDateLabel } = await import(
  pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, 'src/lib/format.js'))
);
const amount = (value, unit, currency = null) => ({ value, unit, currency });

for (const [lang, expected] of [
  ['ar', 'غير معلوم'],
  ['en', 'Unknown'],
]) {
  test(`missing amount/value remains unknown (${lang})`, () => {
    assert.equal(benefitAmount(undefined, lang), expected);
    assert.equal(benefitAmount(amount(null, 'tokens'), lang), expected);
    assert.equal(benefitAmount(amount('5', 'tokens'), lang), expected);
  });
  for (const invalid of [-1, NaN, Infinity]) {
    test(`reject invalid amount ${invalid} (${lang})`, () => {
      assert.equal(benefitAmount(amount(invalid, 'tokens'), lang), expected);
    });
  }
}
for (const value of [0, 1, 2, 3, 11]) {
  test(`video quantity ${value} has a unit and is not money`, () => {
    assert.match(benefitAmount(amount(value, 'videos'), 'ar'), /فيديو/);
    assert.equal(
      benefitAmount(amount(value, 'videos'), 'en'),
      `${value} ${value === 1 ? 'video' : 'videos'}`
    );
    assert.doesNotMatch(benefitAmount(amount(value, 'videos'), 'ar'), /USD|مشاريع/);
  });
}
test('seven million tokens retain their unit', () => {
  assert.equal(benefitAmount(amount(7000000, 'tokens'), 'en'), '7,000,000 tokens');
  assert.match(benefitAmount(amount(7000000, 'tokens'), 'ar'), /رمز/);
});
test('explicit currency and credit metadata remain distinct from quotas', () => {
  assert.equal(benefitAmount(amount(200, 'USD', 'USD'), 'en'), 'USD 200');
  assert.equal(benefitAmount(amount(200, 'credits', 'USD'), 'en'), 'USD 200 usage credits');
  assert.equal(benefitAmount(amount(0, 'USD', 'USD'), 'en'), 'USD 0');
  assert.equal(benefitAmount(amount(2, 'credits'), 'en'), '2 credits');
  assert.equal(benefitAmount(amount(5, 'tokens', 'USD'), 'en'), 'Unknown');
  assert.equal(benefitAmount(amount(5, 'USD', 'EUR'), 'en'), 'Unknown');
});
test('currency is not guessed from unspecified dollars', () => {
  assert.equal(benefitAmount(amount(5, 'dollars'), 'en'), '5 — currency unknown');
  assert.equal(benefitAmount(amount(5, null, 'IQD'), 'en'), 'IQD 5');
});
test('missing/unfamiliar unit is explicit, not fabricated', () => {
  assert.equal(benefitAmount(amount(5, null), 'en'), '5 — unit unknown');
  assert.equal(benefitAmount(amount(5, 'unknown'), 'en'), '5 — unit unknown');
  assert.equal(benefitAmount(amount(5, 'API'), 'en'), '5 API');
  assert.equal(benefitAmount(amount(5, '__proto__'), 'en'), '5 __proto__');
});
test('no numeric inference for plan access', () => {
  assert.equal(benefitAmount(amount(null, 'plan_access'), 'en'), 'Plan access');
  assert.equal(benefitAmount(amount(null, 'features'), 'ar'), 'ميزات');
});
test('percent metadata is not treated as a currency', () => {
  assert.equal(benefitAmount(amount(20, 'percent'), 'en'), '20%');
});
for (const [value, expected] of [
  [0, '٠ أشهر'],
  [1, 'شهر واحد'],
  [2, 'شهران'],
  [3, '٣ أشهر'],
  [11, '١١ شهرًا'],
]) {
  test(`Arabic month grammar for ${value}`, () => {
    assert.equal(durationLabel({ value, unit: 'months', status: 'known' }, 'ar'), expected);
  });
}
test('English singular/plural, fractional precision and unknown duration', () => {
  assert.equal(durationLabel({ value: 1, unit: 'years', status: 'known' }, 'en'), '1 year');
  assert.equal(durationLabel({ value: 2, unit: 'years', status: 'known' }, 'en'), '2 years');
  assert.equal(benefitAmount(amount(0.00001, 'USD', 'USD'), 'en'), 'USD 0.00001');
  assert.equal(durationLabel({ value: 12, unit: 'months', status: 'unknown' }, 'en'), 'Unknown');
  assert.equal(
    durationLabel({ value: null, unit: null, status: 'no_expiration' }, 'en'),
    'Until used up'
  );
});
test('review dates: no invented date or timezone', () => {
  assert.equal(reviewDateLabel('2026-10-17', 'ar'), '2026-10-17');
  assert.equal(reviewDateLabel('2024-02-29', 'en'), '2024-02-29');
  for (const invalid of [
    null,
    undefined,
    '',
    'Unknown',
    '2026-02-30',
    '2026-02-29',
    '2026-10-17T00:00:00Z',
  ]) {
    assert.equal(reviewDateLabel(invalid, 'en'), 'Unknown');
  }
});
