import assert from 'node:assert/strict';
import { test } from 'node:test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const { unknownFieldLabel } = await import(
  pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, 'src/lib/unknownFieldLabels.js'))
);

// The recorded public review keys are intentionally unchanged, including legacy names.
const publishedFields = Object.freeze([
  '2026_final_rules',
  'advertised monthly dollar value',
  'all_student_types_receive_AI_credits',
  'API_operational_availability',
  'benefits.0.amount',
  'benefits.0.amount.value',
  'benefits.0.duration',
  'benefits.0.frequency',
  'benefits.0.type',
  'benefits.1.duration',
  'bounty_amounts',
  'campaign deadline',
  'card requirement',
  'category.legacy_value',
  'category.value',
  'commercial rights of other model assets',
  'country availability',
  'country eligibility',
  'credit expiration',
  'eligibility',
  'eligibility.applicant_type',
  'eligibility.card_required',
  'eligibility.countries',
  'eligibility.countries.values',
  'eligibility.new_account',
  'eligibility.phone_required',
  'eligibility.student_status',
  'exact language count',
  'fixed_term',
  'generic_new_user_offer',
  'independent benchmark reproduction',
  'Iraq_availability',
  'launch_discount_end',
  'minimum runtime hardware',
  'monthly_balance_carryover',
  'new-account requirement',
  'offer_status',
  'old_price',
  'optional cloud benefit terms',
  'other_signup_restrictions',
  'post_year_renewal',
  'pricing',
  'pricing.billing_cycle',
  'pricing.offer_price',
  'pricing.original_price',
  'profile_completion_bonus',
  'registration.credit_validity',
  'registration.deadline',
  'review.offer_status',
  'specific quantized model size',
  'supported_academic_email_domains',
  'team_size',
  'token renewal and expiration',
  'unused-credit rollover',
]);

const representativeLabels = [
  ['all_student_types_receive_AI_credits', 'فئات الطلاب المشمولة بأرصدة الذكاء الاصطناعي', 'Student-type scope of AI credits'],
  ['eligibility.card_required', 'اشتراط بطاقة ائتمان', 'Credit-card requirement'],
  ['benefits.0.duration', 'مدة المنفعة الأولى', 'First benefit duration'],
  ['eligibility.countries', 'البلدان المشمولة بالأهلية', 'Eligible countries'],
  ['Iraq_availability', 'مدى توفر العرض في العراق', 'Availability in Iraq'],
  ['registration.deadline', 'الموعد النهائي للتسجيل', 'Registration deadline'],
  ['registration.credit_validity', 'مدة صلاحية الرصيد', 'Credit validity period'],
];

for (const [field, ar, en] of representativeLabels) {
  test(`unknown field ${field} has neutral bilingual labels`, () => {
    assert.equal(unknownFieldLabel(field, 'ar'), ar);
    assert.equal(unknownFieldLabel(field, 'en'), en);
  });
}

for (const lang of ['ar', 'en']) {
  test(`every currently published unknown key has an explicit human-readable label (${lang})`, () => {
    const fallback = unknownFieldLabel('unmapped.future_field', lang);
    const original = [...publishedFields];
    const labels = publishedFields.map((field) => unknownFieldLabel(field, lang));
    for (let i = 0; i < publishedFields.length; i++) {
      assert.notEqual(labels[i], fallback, `${publishedFields[i]} must be mapped`);
      assert.notEqual(labels[i], publishedFields[i], 'a recorded identifier is not a display label');
      assert.doesNotMatch(labels[i], /[_.]/, 'technical separators stay out of labels');
      if (lang === 'ar') assert.match(labels[i], /[\u0600-\u06ff]/);
    }
    assert.deepEqual(publishedFields, original, 'label lookup does not mutate the recorded keys');
  });
}

test('unmapped and prototype-like identifiers never leak through the display fallback', () => {
  for (const field of ['unmapped.future_field', '__proto__', 'constructor', 'toString', '<img src=x onerror="alert(1)">\nraw_field']) {
    assert.equal(unknownFieldLabel(field, 'ar'), 'حقل إضافي غير معلوم');
    assert.equal(unknownFieldLabel(field, 'en'), 'Additional unknown field');
  }
});
