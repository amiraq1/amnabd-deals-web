import type { Lang, Localized } from '@/types';

// Display labels only: keep the recorded keys intact for evidence and guide checks.
// These keys include legacy/free-form review fields still used by public deals.
const FIELD_LABELS: Readonly<Record<string, Readonly<Localized>>> = Object.freeze({
  '2026_final_rules': { ar: 'القواعد النهائية لعام 2026', en: '2026 final rules' },
  'advertised monthly dollar value': {
    ar: 'القيمة الشهرية المعلنة بالدولار',
    en: 'Advertised monthly dollar value',
  },
  all_student_types_receive_AI_credits: {
    ar: 'فئات الطلاب المشمولة بأرصدة الذكاء الاصطناعي',
    en: 'Student-type scope of AI credits',
  },
  API_operational_availability: {
    ar: 'توفر واجهة برمجة التطبيقات للتشغيل',
    en: 'API operational availability',
  },
  'benefits.0.amount': { ar: 'قيمة المنفعة الأولى', en: 'First benefit amount' },
  'benefits.0.amount.value': { ar: 'قيمة المنفعة الأولى', en: 'First benefit amount' },
  'benefits.0.duration': { ar: 'مدة المنفعة الأولى', en: 'First benefit duration' },
  'benefits.0.frequency': { ar: 'وتيرة المنفعة الأولى', en: 'First benefit frequency' },
  'benefits.0.type': { ar: 'نوع المنفعة الأولى', en: 'First benefit type' },
  'benefits.1.duration': { ar: 'مدة المنفعة الثانية', en: 'Second benefit duration' },
  bounty_amounts: { ar: 'مبالغ المكافآت', en: 'Bounty amounts' },
  'campaign deadline': { ar: 'الموعد النهائي للحملة', en: 'Campaign deadline' },
  'card requirement': { ar: 'اشتراط بطاقة', en: 'Card requirement' },
  'category.legacy_value': { ar: 'تصنيف العرض القديم', en: 'Legacy deal category' },
  'category.value': { ar: 'تصنيف العرض', en: 'Deal category' },
  'commercial rights of other model assets': {
    ar: 'الحقوق التجارية لأصول النماذج الأخرى',
    en: 'Commercial rights for other model assets',
  },
  'country availability': { ar: 'توفر العرض حسب البلد', en: 'Country availability' },
  'country eligibility': { ar: 'أهلية البلدان', en: 'Country eligibility' },
  'credit expiration': { ar: 'انتهاء صلاحية الرصيد', en: 'Credit expiration' },
  eligibility: { ar: 'شروط الأهلية', en: 'Eligibility terms' },
  'eligibility.applicant_type': { ar: 'فئة المتقدم', en: 'Applicant type' },
  'eligibility.card_required': { ar: 'اشتراط بطاقة ائتمان', en: 'Credit-card requirement' },
  'eligibility.countries': { ar: 'البلدان المشمولة بالأهلية', en: 'Eligible countries' },
  'eligibility.countries.values': { ar: 'قائمة البلدان المؤهلة', en: 'Eligible-country list' },
  'eligibility.new_account': { ar: 'اشتراط حساب جديد', en: 'New-account requirement' },
  'eligibility.phone_required': { ar: 'اشتراط رقم هاتف', en: 'Phone-number requirement' },
  'eligibility.student_status': { ar: 'اشتراط صفة الطالب', en: 'Student-status requirement' },
  'exact language count': { ar: 'العدد الدقيق للغات', en: 'Exact number of languages' },
  fixed_term: { ar: 'المدة الثابتة للعرض', en: 'Fixed offer term' },
  generic_new_user_offer: { ar: 'العرض العام للمستخدمين الجدد', en: 'Generic new-user offer' },
  'independent benchmark reproduction': {
    ar: 'إعادة إنتاج الاختبار المرجعي بشكل مستقل',
    en: 'Independent benchmark reproducibility',
  },
  Iraq_availability: { ar: 'مدى توفر العرض في العراق', en: 'Availability in Iraq' },
  launch_discount_end: { ar: 'نهاية خصم الإطلاق', en: 'Launch discount end date' },
  'minimum runtime hardware': { ar: 'الحد الأدنى لأجهزة التشغيل', en: 'Minimum runtime hardware' },
  monthly_balance_carryover: { ar: 'ترحيل الرصيد الشهري المتبقي', en: 'Monthly balance rollover' },
  'new-account requirement': { ar: 'اشتراط حساب جديد', en: 'New-account requirement' },
  offer_status: { ar: 'حالة العرض', en: 'Offer status' },
  old_price: { ar: 'السعر السابق', en: 'Previous price' },
  'optional cloud benefit terms': {
    ar: 'شروط المنفعة السحابية الاختيارية',
    en: 'Optional cloud benefit terms',
  },
  other_signup_restrictions: { ar: 'قيود التسجيل الأخرى', en: 'Other signup restrictions' },
  post_year_renewal: { ar: 'التجديد بعد السنة الأولى', en: 'Renewal after the first year' },
  pricing: { ar: 'تفاصيل الأسعار', en: 'Pricing details' },
  'pricing.billing_cycle': { ar: 'دورة الفوترة', en: 'Billing cycle' },
  'pricing.offer_price': { ar: 'سعر العرض', en: 'Offer price' },
  'pricing.original_price': { ar: 'السعر الأصلي', en: 'Original price' },
  profile_completion_bonus: { ar: 'مكافأة إكمال الملف الشخصي', en: 'Profile-completion bonus' },
  'registration.credit_validity': { ar: 'مدة صلاحية الرصيد', en: 'Credit validity period' },
  'registration.deadline': { ar: 'الموعد النهائي للتسجيل', en: 'Registration deadline' },
  'review.offer_status': { ar: 'حالة العرض في المراجعة', en: 'Reviewed offer status' },
  'specific quantized model size': {
    ar: 'الحجم المحدد للنموذج بعد التكميم',
    en: 'Specific quantized model size',
  },
  supported_academic_email_domains: {
    ar: 'نطاقات البريد الأكاديمي المدعومة',
    en: 'Supported academic email domains',
  },
  team_size: { ar: 'حجم الفريق', en: 'Team size' },
  'token renewal and expiration': { ar: 'تجديد الرموز وانتهاء صلاحيتها', en: 'Token renewal and expiration' },
  'unused-credit rollover': { ar: 'ترحيل الرصيد غير المستخدم', en: 'Unused-credit rollover' },
});

export function unknownFieldLabel(field: string, lang: Lang): string {
  const label = Object.prototype.hasOwnProperty.call(FIELD_LABELS, field) ? FIELD_LABELS[field] : undefined;
  if (label) return label[lang];
  // A new/legacy field must remain unknown, without exposing a technical key.
  return lang === 'ar' ? 'حقل إضافي غير معلوم' : 'Additional unknown field';
}
