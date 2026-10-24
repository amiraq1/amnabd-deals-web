import assert from 'node:assert/strict';
import { test } from 'node:test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
const { validateGuides } = await import(
  pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, 'src/lib/validate.js'))
);
const { filterActivationGuide, hasSensitiveClaimCoverage } = await import(
  pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, 'src/lib/activationGuideSafety.js'))
);

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

function validReviewedGuideRow() {
  const section = {
    ar: 'راجع المصدر الرسمي قبل المتابعة.',
    en: 'Check the official source before proceeding.',
    sources: ['https://deepgram.com/pricing'],
  };
  return {
    slug: 'deepgram',
    sections: {
      eligibility: section,
      registration: section,
      limitations: section,
      after_expiry: section,
      activation_guide: {
        review_status: 'reviewed_with_unknowns',
        reviewed_on: '2026-10-24',
        summary: {
          ar: 'تعلن Deepgram رصيدًا قدره 200 دولار للحسابات الجديدة.',
          en: 'Deepgram advertises $200 credit for new accounts.',
        },
        summary_sources: ['https://deepgram.com/pricing'],
        summary_claim_fields: ['benefits.0.amount.value'],
        steps: [
          {
            ar: 'افتح صفحة الأسعار واختر Sign Up Free.',
            en: 'Open the pricing page and select Sign Up Free.',
            sources: ['https://deepgram.com/pricing'],
            claim_fields: ['registration.application_url'],
          },
          {
            ar: 'لا يلزم إدخال بطاقة ائتمان لهذا الرصيد.',
            en: 'No credit card is required for this credit.',
            sources: ['https://console.deepgram.com/signup'],
            claim_fields: ['eligibility.card_required'],
          },
        ],
        notes: {
          ar: 'مدة صلاحية الرصيد غير محسومة؛ راجع الشروط الرسمية لحسابك.',
          en: 'The credit validity period is unresolved; check the official terms for your account.',
        },
        notes_sources: [
          'https://deepgram.com/pricing',
          'https://developers.deepgram.com/guides/deep-dives/managing-projects',
        ],
        unknown_fields: ['registration.credit_validity'],
      },
    },
  };
}

test('reviewed bilingual guide records require a date, official sources, and mapped claims', () => {
  const result = validateGuides([validReviewedGuideRow()]);
  assert.equal(result.rejectedRows, 0);
  assert.equal(result.values.length, 1);
  assert.equal(result.values[0].activation.reviewed_on, '2026-10-24');
  assert.equal(result.values[0].activation.steps.length, 2);
});

test('card claims cannot be added without mapping to the reviewed card field', () => {
  const row = validReviewedGuideRow();
  row.sections.activation_guide.steps[1].claim_fields = ['benefits.0.amount.value'];
  const result = validateGuides([row]);
  assert.equal(result.rejectedRows, 1);
  assert.equal(result.values.length, 0);
  assert.equal(
    hasSensitiveClaimCoverage('No credit card is required', ['benefits.0.amount.value']),
    false
  );
});

test('term claims cannot be added without mapping to an explicit validity or deadline field', () => {
  assert.equal(
    hasSensitiveClaimCoverage('Valid for one year', ['benefits.0.amount.value']),
    false
  );
  assert.equal(
    hasSensitiveClaimCoverage('Valid for one year', ['registration.credit_validity']),
    true
  );
  const row = validReviewedGuideRow();
  row.sections.activation_guide.steps[0].en = 'The free credit never expires.';
  row.sections.activation_guide.steps[0].ar = 'الرصيد المجاني لا تنتهي صلاحيته.';
  row.sections.activation_guide.steps[0].claim_fields = ['benefits.0.amount.value'];
  const result = validateGuides([row]);
  assert.equal(result.rejectedRows, 1);
});

test('claims that conflict with deal unknown_fields are suppressed at render time', () => {
  const parsed = validateGuides([validReviewedGuideRow()]).values[0].activation;
  const visible = filterActivationGuide(parsed, [
    'eligibility.card_required',
    'registration.credit_validity',
  ]);
  assert.ok(visible);
  assert.equal(visible.steps.length, 1);
  assert.match(visible.steps[0].en, /Sign Up Free/);
  assert.equal(
    filterActivationGuide(parsed, ['benefits.0.amount.value']),
    undefined,
    'A summary claim for a field marked unknown must hide the whole guide'
  );
});

test('activation sources outside the provider official-domain allowlist fail closed', () => {
  const row = validReviewedGuideRow();
  row.sections.activation_guide.steps[0].sources = ['https://example.com/fake'];
  const result = validateGuides([row]);
  assert.equal(result.rejectedRows, 1);
  assert.equal(result.values.length, 0);
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
