export type ApiDirectoryType = 'gateway' | 'provider';
export type DirectoryEvidenceState = 'ok' | 'unknown';
export type CardPolicy = 'not_required' | 'unknown';

export interface FreeApiKeyEntry {
  name: string;
  type: ApiDirectoryType;
  benefit: { ar: string; en: string };
  limits: { ar: string; en: string } | null;
  cardPolicy: CardPolicy;
  iraq: DirectoryEvidenceState;
  officialUrl: string;
  verified: string;
}

export const FREE_API_DIRECTORY_LAST_VERIFIED = '2026-11-04';

// The facts and verification dates below come from the supplied official-source review.
// Paid-only platforms in that review are intentionally not included here.
export const FREE_API_KEY_ENTRIES: readonly FreeApiKeyEntry[] = [
  {
    name: 'OpenRouter',
    type: 'gateway',
    benefit: {
      ar: 'نماذج مجانية (:free:) — 50 طلبًا يوميًا، وتصبح 1,000 يوميًا بعد شراء رصيد بقيمة $10 لمرة واحدة.',
      en: 'Free models marked :free: — 50 requests per day, increasing to 1,000 per day after a one-time $10 credit purchase.',
    },
    limits: {
      ar: 'تُحسب الطلبات الفاشلة ضمن الحصة.',
      en: 'Failed requests count toward the quota.',
    },
    cardPolicy: 'not_required',
    iraq: 'unknown',
    officialUrl: 'https://openrouter.ai/docs',
    verified: '2026-11-02',
  },
  {
    name: 'AnyAPI',
    type: 'gateway',
    benefit: {
      ar: '100 ألف ANY Tokens يوميًا (وحدة الاستخدام الداخلية) على النماذج المجانية/الأساسية؛ بوابة لأكثر من 400 نموذج.',
      en: '100K ANY Tokens per calendar day (the service billing unit) on free/basic models; gateway to 400+ models.',
    },
    limits: {
      ar: 'إعادة الضبط عند منتصف الليل UTC بلا ترحيل؛ الاستخدام محدود للتقييم والمنخفض، وحساب مجاني واحد للفرد/الجهة. قد تتغير الخطة أو تتوقف.',
      en: 'Resets at midnight UTC with no carryover; intended for evaluation/low-volume use, one free account per person/entity. The plan may change or be discontinued.',
    },
    cardPolicy: 'not_required',
    iraq: 'unknown',
    officialUrl: 'https://anyapi.ai/pricing',
    verified: '2026-11-04',
  },
  {
    name: 'LLM7.io',
    type: 'gateway',
    benefit: {
      ar: '100 ألف توكن مجاني كل 24 ساعة متدحرجة.',
      en: '100K free tokens every rolling 24 hours.',
    },
    limits: {
      ar: 'نافذة متدحرجة وليست يومًا تقويميًا.',
      en: 'The window is rolling, not a calendar day.',
    },
    cardPolicy: 'unknown',
    iraq: 'unknown',
    officialUrl: 'https://llm7.io',
    verified: '2026-11-03',
  },
  {
    name: 'Free.ai',
    type: 'gateway',
    benefit: {
      ar: '30 ألف توكن مجاني يوميًا.',
      en: '30K free tokens per day.',
    },
    limits: null,
    cardPolicy: 'unknown',
    iraq: 'unknown',
    officialUrl: 'https://free.ai',
    verified: '2026-11-03',
  },
  {
    name: 'BazaarLink',
    type: 'gateway',
    benefit: {
      ar: '6 نماذج مجانية — 10 طلبات في الدقيقة و60 وحدة مرجّحة يوميًا، مشتركة.',
      en: '6 free models — 10 requests per minute and 60 shared weighted units per day.',
    },
    limits: {
      ar: 'الحصة مشتركة بين النماذج؛ المدخلات الطويلة تستهلك وحدات أكثر. يوجد حد عام 20 طلبًا/دقيقة وبحد أقصى طلبان مجانيان متزامنان لكل حساب.',
      en: 'Quota is shared across models; longer inputs use more weighted units. A site-wide cap of 20 requests/minute and a maximum of two concurrent free requests per account also apply.',
    },
    cardPolicy: 'not_required',
    iraq: 'unknown',
    officialUrl: 'https://bazaarlink.ai/free',
    verified: '2026-11-04',
  },
  {
    name: 'Google AI Studio',
    type: 'provider',
    benefit: {
      ar: 'Gemini 2.5 Flash حتى 1,500 طلب مجاني يوميًا.',
      en: 'Up to 1,500 free Gemini 2.5 Flash requests per day.',
    },
    limits: {
      ar: 'قد تُستخدم بيانات الطبقة المجانية لتدريب نماذج Google.',
      en: 'Free-tier data may be used to train Google models.',
    },
    cardPolicy: 'not_required',
    iraq: 'ok',
    officialUrl: 'https://ai.google.dev/gemini-api/docs/pricing',
    verified: '2026-11-02',
  },
  {
    name: 'Groq',
    type: 'provider',
    benefit: {
      ar: '1,000 طلب يوميًا و200 ألف توكن يوميًا لكل نموذج.',
      en: '1,000 requests per day and 200K tokens per day per model.',
    },
    limits: {
      ar: 'لا يوجد تاريخ انتهاء مذكور.',
      en: 'No expiry is listed.',
    },
    cardPolicy: 'not_required',
    iraq: 'unknown',
    officialUrl: 'https://console.groq.com/docs/rate-limits',
    verified: '2026-11-02',
  },
  {
    name: 'Novita AI',
    type: 'provider',
    benefit: {
      ar: 'رصيد Sandbox بقيمة $100.',
      en: '$100 in Sandbox credit.',
    },
    limits: {
      ar: 'سياسة البطاقة غير مؤكدة رسميًا.',
      en: 'The card policy is not officially confirmed.',
    },
    cardPolicy: 'unknown',
    iraq: 'unknown',
    officialUrl: 'https://novita.ai',
    verified: '2026-11-03',
  },
  {
    name: 'Fireworks AI',
    type: 'provider',
    benefit: {
      ar: 'تدريب SFT مجاني لنموذج Muse Glimmer 30B حتى 30 نوفمبر 2026.',
      en: 'Free SFT training for the Muse Glimmer 30B model through November 30, 2026.',
    },
    limits: {
      ar: 'تقول صفحة العرض «بلا بطاقة»، لكن توثيق الحصص يذكر صفر GPU للتدريب عند عدم وجود وسيلة دفع؛ إمكانية التدريب بلا وسيلة دفع غير محسومة. حد العرض/حصة GPU غير موضحين.',
      en: 'The offer page says “no credit card,” but quota docs show zero training GPUs with no payment method on file; access without a payment method is unresolved. The offer cap/GPU quota is not stated.',
    },
    cardPolicy: 'unknown',
    iraq: 'unknown',
    officialUrl: 'https://docs.fireworks.ai/fine-tuning/finetuning-intro',
    verified: '2026-11-04',
  },
  {
    name: 'Mistral',
    type: 'provider',
    benefit: {
      ar: 'خطة مجانية محدودة.',
      en: 'A limited free plan.',
    },
    limits: {
      ar: 'ادعاء رصيد $10 شهريًا متجدد مرفوض؛ لا يرد في المصدر الرسمي.',
      en: 'The claim of a recurring $10 monthly credit is rejected; it does not appear in the official source.',
    },
    cardPolicy: 'not_required',
    iraq: 'unknown',
    officialUrl: 'https://mistral.ai',
    verified: '2026-11-02',
  },
  {
    name: 'Cohere',
    type: 'provider',
    benefit: {
      ar: 'مفتاح تجريبي يتيح 1,000 استدعاء شهريًا.',
      en: 'A trial key allows 1,000 calls per month.',
    },
    limits: {
      ar: 'للتجربة والتقييم فقط، وليس للاستخدام التجاري.',
      en: 'For trial and evaluation only; not for commercial use.',
    },
    cardPolicy: 'not_required',
    iraq: 'unknown',
    officialUrl: 'https://cohere.com',
    verified: '2026-11-02',
  },
];
