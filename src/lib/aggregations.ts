import type { Deal } from '@/types';

export interface AggregationConfig {
  slug: string;
  path: string;
  titleAr: string;
  titleEn: string;
  headingAr: string;
  headingEn: string;
  descriptionAr: string;
  descriptionEn: string;
  metaDescriptionAr: string;
  metaDescriptionEn: string;
  badgeLabelAr: string;
  badgeLabelEn: string;
  filter: (deal: Deal) => boolean;
}

export const AGGREGATIONS: Record<string, AggregationConfig> = {
  'for-students': {
    slug: 'for-students',
    path: '/for-students',
    titleAr: 'أفضل عروض وأرصدة الذكاء الاصطناعي للطلاب — مع روابط مصادرها',
    titleEn: 'Best Free AI Deals & Cloud Credits for Students',
    headingAr: 'عروض ومنافع الذكاء الاصطناعي المخصصة للطلاب',
    headingEn: 'AI Deals & Cloud Credits for Students',
    descriptionAr:
      'قائمة بروابط مصادرها لأرصدة وحزم أدوات الذكاء الاصطناعي المتاحة لطلاب الجامعات والمدارس عبر البريد الأكاديمي أو بطاقة الطالب.',
    descriptionEn:
      'AI credits, compute tiers, and perks available for students via academic email or student ID, each with a source link.',
    metaDescriptionAr:
      'دليل بأفضل أرصدة وأدوات الذكاء الاصطناعي للطلاب مع شروط القبول وخطوات التفعيل.',
    metaDescriptionEn:
      'Curated directory of AI tool perks and cloud credits for students, with the requirements each source states.',
    badgeLabelAr: 'مخصص للطلاب',
    badgeLabelEn: 'Students Only',
    filter: (deal: Deal) => deal.eligibility?.student_status === 'required',
  },
  'no-credit-card': {
    slug: 'no-credit-card',
    path: '/no-credit-card',
    titleAr: 'عروض ذكاء اصطناعي بدون بطاقة بنكية (No Credit Card)',
    titleEn: 'Free AI Deals Without Credit Card (No Card Required)',
    headingAr: 'أدوات وأرصدة ذكاء اصطناعي بدون بطاقة بنكية',
    headingEn: 'Free AI Tools & Credits Without Credit Card',
    descriptionAr:
      'عروض وحزم ذكاء اصطناعي يمكنك تفعيلها والبدء في استخدامها فوراً دون الحاجة لإدخال أي وسيلة دفع أو بطاقة مصرفية.',
    descriptionEn:
      'AI tool benefits and credits that you can activate immediately with zero credit card or billing details required.',
    metaDescriptionAr:
      'تصفح أدوات الذكاء الاصطناعي والأرصدة السحابية التي لا تتطلب بطاقة بنكية أو وسيلة دفع للتفعيل.',
    metaDescriptionEn:
      'Explore AI tools and cloud credits with zero credit card or payment method required.',
    badgeLabelAr: 'بدون بطاقة بنكية',
    badgeLabelEn: 'No Card Required',
    filter: (deal: Deal) => deal.eligibility?.card_required === 'not_required',
  },
  coding: {
    slug: 'coding',
    path: '/coding',
    titleAr: 'أفضل أدوات ووكلاء الذكاء الاصطناعي للبرمجة والتطوير',
    titleEn: 'Best AI Coding Tools, IDEs & Developer Agents',
    headingAr: 'أدوات ومحررات ووكلاء البرمجة بالذكاء الاصطناعي',
    headingEn: 'AI Coding Tools, IDEs & Developer Agents',
    descriptionAr:
      'أرصدة سحابية، محررات كود ذكية، ومساعدات تطوير مدعومة بنماذج الذكاء الاصطناعي المتقدمة للمبرمجين والمطورين.',
    descriptionEn:
      'Cloud compute, agentic code editors, and AI coding assistants for developers, engineers, and builders.',
    metaDescriptionAr:
      'دليل عروض وأرصدة أدوات البرمجة بالذكاء الاصطناعي ووكلاء الكود مع روابط التفعيل المباشرة.',
    metaDescriptionEn:
      'Directory of AI coding tools, developer credits, and agentic IDE offers with source links.',
    badgeLabelAr: 'برمجة وتطوير',
    badgeLabelEn: 'Coding & Dev',
    filter: (deal: Deal) => {
      const uses = (deal.use_cases || []).map((u) => u.toLowerCase());
      return Boolean(
        uses.includes('برمجة') ||
          uses.includes('coding') ||
          uses.includes('وكلاء ذكاء اصطناعي') ||
          uses.includes('agents') ||
          uses.includes('استضافة') ||
          uses.includes('deployment') ||
          deal.category?.value?.toLowerCase()?.includes('code') ||
          deal.category?.value?.toLowerCase()?.includes('developer')
      );
    },
  },
  'ending-soon': {
    slug: 'ending-soon',
    path: '/ending-soon',
    titleAr: 'عروض ذكاء اصطناعي تنتهي قريباً — سارع بالتفعيل قبل الإغلاق',
    titleEn: 'AI Deals Ending Soon — Claim Before They Expire',
    headingAr: 'عروض تنتهي قريباً — سارع بالتفعيل قبل الإغلاق',
    headingEn: 'AI Deals Ending Soon — Claim Before Expiry',
    descriptionAr:
      'فرص وأرصدة محدودة الوقت في أيامها الأخيرة وفق ما تسجّله البيانات. سارع بالتسجيل والتفعيل قبل انقضاء الموعد النهائي.',
    descriptionEn:
      'Time-limited AI perks and promotional credits in their final days. Claim now before deadline closes.',
    metaDescriptionAr:
      'تنبيهات فورية بالعروض والأرصدة للذكاء الاصطناعي التي تقترب من موعد انتهائها المسجّل.',
    metaDescriptionEn:
      'Immediate alerts on AI perks and cloud compute credits nearing their recorded expiration date.',
    badgeLabelAr: '⏳ ينتهي قريباً',
    badgeLabelEn: '⏳ Ending Soon',
    filter: (deal: Deal) => deal.status === 'ending_soon',
  },
};

export const AGGREGATION_KEYS = Object.keys(AGGREGATIONS) as (keyof typeof AGGREGATIONS)[];

export function getAggregationConfig(key: string): AggregationConfig | null {
  return AGGREGATIONS[key] ?? null;
}
