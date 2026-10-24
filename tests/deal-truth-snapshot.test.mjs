import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { resolve } from 'node:path';

const root = process.cwd();
let vite;
let DealDetailPage;
let LanguageProvider;

before(async () => {
  vite = await createServer({
    configFile: resolve(root, 'vite.config.ts'),
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'error',
  });
  ({ default: DealDetailPage } = await vite.ssrLoadModule('/src/pages/DealDetailPage.tsx'));
  ({ LanguageProvider } = await vite.ssrLoadModule('/src/context/LanguageContext.tsx'));
});

after(async () => {
  await vite?.close();
});

const deal = {
  id: 'truth-snapshot-test',
  slug: 'truth-snapshot-test',
  name_ar: 'عرض تجريبي',
  name_en: 'Test offer',
  description_ar: 'وصف العرض التجريبي',
  description_en: 'Test offer description',
  category: { value: 'developer-tools' },
  benefits: [],
  eligibility: {
    countries: { status: 'unknown', values: [] },
    conditions: {
      ar: 'تنطبق الشروط التي يثبتها المصدر الرسمي فقط.',
      en: 'Only conditions established by the official source apply.',
    },
    new_account: 'not_required',
    card_required: 'unknown',
    applicant_type: 'unknown',
    phone_required: 'unknown',
    student_status: 'required',
  },
  pricing: { currency: null, offer_price: null, billing_cycle: 'unknown', original_price: null },
  registration: {
    deadline: { date: null, status: 'unknown' },
    credit_validity: { unit: null, status: 'unknown', duration: null },
  },
  official_sources: [
    {
      url: 'https://official.example.test/terms',
      title: 'Official provider terms',
      claims: [
        {
          field: 'eligibility.student_status',
          value: 'required',
          evidence: 'The provider describes student eligibility.',
        },
      ],
    },
  ],
  get_offer: {
    url: 'https://official.example.test/offer',
    type: 'official',
    label: { ar: 'صفحة العرض الرسمية', en: 'Official offer page' },
  },
  review: {
    notes: {
      ar: 'ملاحظة مراجعة ظاهرة قبل الإرشادات.',
      en: 'Review note shown before the guides.',
    },
    reviewed_on: '2026-10-24',
    verified_on: null,
    offer_status: 'active',
    unknown_fields: [
      'Iraq_availability',
      'benefits.0.duration',
      'eligibility.card_required',
      'eligibility.countries',
      'registration.credit_validity',
      'registration.deadline',
    ],
    verification_status: 'verified',
  },
};

const guide = {
  slug: deal.slug,
  sections: {
    eligibility: {
      ar: 'نص أهلية الدليل بعد ملخص الأدلة.',
      en: 'Guide eligibility instructions after the evidence summary.',
      sources: ['https://official.example.test/terms'],
    },
    registration: {
      ar: 'نص التسجيل في الدليل.',
      en: 'Guide registration instructions.',
      sources: ['https://official.example.test/terms'],
    },
    limitations: {
      ar: 'نص القيود في الدليل.',
      en: 'Guide limitations.',
      sources: ['https://official.example.test/terms'],
    },
    after_expiry: {
      ar: 'نص ما بعد انتهاء المنفعة.',
      en: 'Guide text after the benefit ends.',
      sources: ['https://official.example.test/terms'],
    },
  },
  activation: {
    review_status: 'reviewed_with_unknowns',
    reviewed_on: '2026-10-24',
    summary: { ar: 'ملخص تفعيل تجريبي.', en: 'Test activation summary.' },
    summary_sources: ['https://official.example.test/terms'],
    summary_claim_fields: ['eligibility.student_status'],
    steps: [
      {
        ar: 'خطوة تفعيل تجريبية.',
        en: 'Test activation instruction.',
        sources: ['https://official.example.test/terms'],
        claim_fields: ['eligibility.student_status'],
      },
    ],
    notes: { ar: 'ملاحظة تفعيل تجريبية.', en: 'Test activation note.' },
    notes_sources: ['https://official.example.test/terms'],
    unknown_fields: ['registration.credit_validity'],
  },
};

function renderForLanguage(lang) {
  const values = new Map();
  globalThis.window = {
    location: { search: `?lang=${lang}`, hash: '' },
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
      removeItem: (key) => values.delete(key),
    },
  };
  try {
    const element = React.createElement(
      LanguageProvider,
      null,
      React.createElement(DealDetailPage, {
        deal,
        guide,
        sectionLabels: {},
        onBack: () => {},
      })
    );
    return renderToStaticMarkup(element);
  } finally {
    delete globalThis.window;
  }
}

for (const lang of ['ar', 'en']) {
  test(`deal truth snapshot is present before both guides (${lang})`, () => {
    const originalDeal = JSON.stringify(deal);
    const html = renderForLanguage(lang);
    const isArabic = lang === 'ar';
    const truthHeading = isArabic
      ? 'ماذا نعرف وماذا لا نعرف؟'
      : 'What We Know and What Remains Unknown';
    const usageGuideCopy = isArabic
      ? 'نص أهلية الدليل بعد ملخص الأدلة.'
      : 'Guide eligibility instructions after the evidence summary.';
    const activationHeading = isArabic
      ? 'كيف تحصل على هذا العرض وتفعّله؟'
      : 'How to Claim &amp; Activate This Deal?';
    const unknownLabel = isArabic ? 'غير معلوم' : 'Unknown';
    const knownLabel = isArabic ? 'مطلوب' : 'Required';
    const reviewNote = isArabic
      ? 'ملاحظة مراجعة ظاهرة قبل الإرشادات.'
      : 'Review note shown before the guides.';

    const truthIndex = html.indexOf(truthHeading);
    const usageGuideIndex = html.indexOf(usageGuideCopy);
    const activationIndex = html.indexOf(activationHeading);

    assert.notEqual(truthIndex, -1, 'localized truth heading is rendered');
    assert.ok(html.includes(isArabic ? 'شروط الأهلية' : 'Eligibility facts'));
    assert.ok(html.includes(knownLabel), 'known eligibility state is preserved');
    assert.ok(html.includes(unknownLabel), 'unknown eligibility state is preserved');
    const fieldLabels = isArabic
      ? ['مدى توفر العرض في العراق', 'مدة المنفعة الأولى', 'اشتراط بطاقة ائتمان', 'البلدان المشمولة بالأهلية', 'مدة صلاحية الرصيد', 'الموعد النهائي للتسجيل']
      : ['Availability in Iraq', 'First benefit duration', 'Credit-card requirement', 'Eligible countries', 'Credit validity period', 'Registration deadline'];
    for (const label of fieldLabels) assert.ok(html.includes(label), `localized label ${label} is visible`);
    for (const field of deal.review.unknown_fields) {
      assert.ok(!html.includes(field), `raw identifier ${field} is not rendered`);
    }
    assert.equal(JSON.stringify(deal), originalDeal, 'rendering preserves all recorded keys and unknown values');
    assert.ok(html.includes(reviewNote), 'localized review notes are visible');
    assert.ok(html.includes('https://official.example.test/terms'));
    assert.ok(usageGuideIndex > truthIndex, 'usage guide follows the truth snapshot');
    assert.ok(activationIndex > truthIndex, 'activation guide follows the truth snapshot');
    assert.ok(html.indexOf(reviewNote) < usageGuideIndex, 'review notes precede guide instructions');
  });
}
