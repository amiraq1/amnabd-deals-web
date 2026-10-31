import config from '../tailwind.config.js';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const {
  offerInitial,
  offerTone,
  categoryDecoration,
  primaryBenefit,
  eligibilitySummary,
} = await import(
  pathToFileURL(
    join(process.env.AMN_TEST_BUILD_DIR, 'src/lib/offerPresentation.js'),
  )
);

test('local initials preserve a real Unicode letter and never invent a provider', () => {
  for (const [name, expected] of [
    ['عمار', 'ع'],
    ['  Example', 'E'],
    ['--Cloud', 'C'],
    ['😀 منصة', 'م'],
    ['', '·'],
    ['123', '1'],
    ['𐐀abc', '𐐀'],
  ])
    assert.equal(offerInitial(name), expected);
});
test('monogram tone is deterministic, NFC-stable and bounded to six tones', () => {
  for (const name of ['عمار', 'Example', '𐐀', '', 'e\u0301', 'é']) {
    assert.equal(offerTone(name), offerTone(name));
    assert.ok(offerTone(name) >= 0 && offerTone(name) < 6);
  }
  assert.equal(offerTone('e\u0301'), offerTone('é'));
});
test('category decorations do not translate, merge, infer or accept prototype keys', () => {
  assert.equal(categoryDecoration(' Cloud '), 'cloud');
  for (const value of [
    'New Category',
    'cloud hosting',
    '__proto__',
    'constructor',
    'unknown',
    'سحابة',
  ])
    assert.equal(categoryDecoration(value), 'neutral');
});
test('first benefit uses existing formatter, including zero; never another benefit or reference price', () => {
  const benefit = {
    amount: { value: 200, unit: 'credits', currency: 'USD' },
    description: { ar: 'وصف حرفي', en: 'Literal description' },
  };
  assert.equal(
    primaryBenefit({ benefits: [benefit] }, 'en'),
    'USD 200 usage credits',
  );
  assert.equal(
    primaryBenefit(
      { benefits: [{ ...benefit, amount: { ...benefit.amount, value: 0 } }] },
      'en',
    ),
    'USD 0 usage credits',
  );
  assert.equal(
    primaryBenefit(
      {
        benefits: [{ ...benefit, amount: { ...benefit.amount, value: null } }],
      },
      'ar',
    ),
    'وصف حرفي',
  );
  assert.equal(primaryBenefit({ benefits: [] }, 'en'), 'Unknown');
  assert.equal(
    primaryBenefit(
      {
        benefits: [
          { description: { ar: 'غير معلوم', en: 'Unknown' } },
          benefit,
        ],
      },
      'en',
    ),
    'Unknown',
  );
});
test('universal eligibility reuses exactly the existing conservative predicate', () => {
  const e = {
    applicant_type: 'any',
    open_to_all: 'yes',
    student_status: 'not_required',
    new_account: 'not_required',
    countries: { status: 'worldwide', values: [] },
  };
  assert.equal(eligibilitySummary({ eligibility: e }, 'en'), 'Open to all');
  for (const patch of [
    { open_to_all: 'unknown' },
    { student_status: 'unknown' },
    { new_account: 'required' },
    { countries: { status: 'worldwide', values: ['X'] } },
  ])
    assert.equal(
      eligibilitySummary({ eligibility: { ...e, ...patch } }, 'en'),
      'Unknown',
    );
  assert.equal(
    eligibilitySummary(
      { eligibility: { ...e, applicant_type: 'individual' } },
      'en',
    ),
    'Individuals',
  );
});
const read = (p) => readFileSync(p, 'utf8');
function luminance(hex) {
  const c = hex
    .match(/\w\w/g)
    .map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
}
function contrast(a, b) {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
test('every local monogram pair and the brand action pass AA normal-text contrast', () => {
  const colors = config.theme.extend.colors;
  const tones = Object.values(colors.identity);
  assert.equal(tones.length, 6);
  for (const { ink, surface } of tones)
    assert.ok(
      contrast(ink.slice(1), surface.slice(1)) >= 4.5,
      `${ink}/${surface}`,
    );
  assert.ok(
    contrast(colors.brand.DEFAULT.slice(1), colors.surface.DEFAULT.slice(1)) >=
      4.5,
  );
  assert.ok(
    contrast(colors.ink.muted.slice(1), colors.surface.raised.slice(1)) >= 4.5,
  );
});
test('meaningful control borders pass non-text AA on raised and base surfaces', () => {
  const colors = config.theme.extend.colors;
  for (const surface of [colors.surface.DEFAULT, colors.surface.raised])
    assert.ok(contrast(colors.line.control.slice(1), surface.slice(1)) >= 3);
});
test('audited surfaces have no remote fonts, automatic provider discovery or urgency claims', () => {
  assert.doesNotMatch(read('index.html'), /fonts\.google|preconnect/);
  assert.doesNotMatch(
    read('src/components/DealIcon.tsx'),
    /getDealIconSources|https:\/\//,
  );
  assert.match(
    read('src/components/DealIcon.tsx'),
    /selfHostedIconUrl\(deal.icon_url, window.location.origin\)/,
  );
  assert.match(read('src/components/DealIcon.tsx'), /src=\{safeIcon\}/);
  assert.match(read('src/components/DealIcon.tsx'), /referrerPolicy="no-referrer"/);
  assert.doesNotMatch(read('src/components/Footer.tsx'), /<img|src="https:/);
  assert.doesNotMatch(
    read('src/components/DealCard.tsx'),
    /endsLabel|animate-ping|isRecentlyReviewed|ending_soon|isNew/,
  );
  assert.doesNotMatch(
    read('src/pages/DealDetailPage.tsx'),
    /offerTimingLabel|getTimingState/,
  );
  assert.match(
    read('src/components/OfferFacts.tsx'),
    /recordedPrice\(deal.pricing, lang\)/,
  );
  assert.match(
    read('src/components/OfferFacts.tsx'),
    /registrationDeadline\(deal.registration.deadline, lang\)/,
  );
});
