import type { Deal, Localized } from '@/types';
import { getTimingState } from './dealTiming.js';

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
  studentVerificationGuide?: {
    heading: Localized;
    intro: Localized;
    steps: Array<{
      title: Localized;
      body: Localized;
      sourceUrl: string;
      sourceLabel: Localized;
    }>;
    creditNote: Localized;
    packTermsUrl: string;
    packTermsLabel: Localized;
  };
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
      'قائمة بعروض ومنافع للطلاب وروابط المصادر الرسمية. تختلف متطلبات البريد الأكاديمي وإثبات القيد والتفعيل حسب كل مزوّد؛ راجع شروط كل عرض.',
    descriptionEn:
      'Student offers with official provider sources. Academic-email, enrollment-proof, and activation requirements vary by provider; check each offer’s terms.',
    metaDescriptionAr:
      'دليل عروض الطلاب بروابط الجهات الرسمية؛ تختلف متطلبات البريد الأكاديمي وإثبات القيد والتفعيل حسب كل عرض.',
    metaDescriptionEn:
      'Student offers with official provider sources; academic-email, enrollment-proof, and activation requirements vary by offer.',
    badgeLabelAr: 'مخصص للطلاب',
    badgeLabelEn: 'Students Only',
    studentVerificationGuide: {
      heading: {
        ar: 'افصل بين البريد وإثبات القيد والتفعيل',
        en: 'Separate email, enrollment proof, and activation',
      },
      intro: {
        ar: 'هذا مثال موثّق لـGitHub Education وCopilot Student؛ لا تفترض أن الشروط نفسها تنطبق على بقية العروض.',
        en: 'This is a sourced example for GitHub Education and Copilot Student; do not assume the same rules apply to other offers.',
      },
      steps: [
        {
          title: { ar: 'البريد الأكاديمي', en: 'Academic email' },
          body: {
            ar: 'تكيّف GitHub التحقق حسب المدرسة. إذا طلب نموذج التقديم بريدًا أكاديميًا، أضِفه وتحقّق منه قبل التقديم؛ ليس شرطًا موحّدًا لكل المدارس.',
            en: 'GitHub tailors verification by school. If the application asks for an academic email, add and verify it before applying; it is not a universal requirement.',
          },
          sourceUrl:
            'https://docs.github.com/en/education/about-github-education/github-education-for-students/apply-to-github-education-as-a-student',
          sourceLabel: {
            ar: 'متطلبات التقديم إلى GitHub Education',
            en: 'GitHub Education student application requirements',
          },
        },
        {
          title: { ar: 'إثبات القيد الحالي', en: 'Proof of current enrollment' },
          body: {
            ar: 'تطلب GitHub إثبات الحالة الدراسية الحالية. ومن أمثلتها: بطاقة طالب بتاريخ قيد حالي، أو جدول دراسي، أو كشف درجات، أو خطاب انتساب/تأكيد قيد.',
            en: 'GitHub requires proof of current student status. Examples include a student ID with a current enrollment date, class schedule, transcript, or affiliation/enrollment letter.',
          },
          sourceUrl:
            'https://docs.github.com/en/education/about-github-education/github-education-for-students/apply-to-github-education-as-a-student',
          sourceLabel: {
            ar: 'أمثلة GitHub على إثبات الحالة الدراسية',
            en: 'GitHub examples of student-status proof',
          },
        },
        {
          title: { ar: 'تفعيل Copilot خطوة منفصلة', en: 'Copilot activation is separate' },
          body: {
            ar: 'بعد اعتماد GitHub Education، افتح Education benefits، ثم اختر Learn more ضمن موارد المطورين المجانية للطلاب والمعلمين، واتبع المطالبات لتفعيل Copilot Student. التحقق والتفعيل خطوتان منفصلتان.',
            en: 'After GitHub Education approves you, open Education benefits, select Learn more under free GitHub developer resources for students and teachers, and follow the prompts to activate Copilot Student. Verification and activation are separate steps.',
          },
          sourceUrl:
            'https://docs.github.com/copilot/how-tos/manage-your-account/free-access-with-copilot-student',
          sourceLabel: {
            ar: 'خطوات تفعيل Copilot Student',
            en: 'Copilot Student activation steps',
          },
        },
      ],
      creditNote: {
        ar: 'لا تخلط بين اعتماد GitHub Education ورصيد API: يسجّل هذا الدليل Copilot Student كـ«وصول إلى ميزات»، وصفحة GitHub تصف وصولًا مجانيًا للميزات ولا تذكر مبلغًا لرصيد API. عروض الشركاء في Student Developer Pack لها شروط منفصلة لدى مزوّديها.',
        en: 'Do not confuse GitHub Education approval with API credit: this directory records Copilot Student as feature access, and GitHub describes free access to Copilot features without stating an API-credit amount. Student Developer Pack partner offers have separate terms from their providers.',
      },
      packTermsUrl:
        'https://docs.github.com/en/education/about-github-education/github-education-for-students/github-terms-and-conditions-for-the-student-developer-pack',
      packTermsLabel: {
        ar: 'شروط GitHub Student Developer Pack والعروض الشريكة',
        en: 'GitHub Student Developer Pack and partner-offer terms',
      },
    },
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
    // Same model as the card and the sort: an explicit flag or an ends_at inside
    // the window. A registration deadline never qualifies an offer here.
    filter: (deal: Deal) => getTimingState(deal, new Date()).offer.state === 'ending_soon',
  },
};

export const AGGREGATION_KEYS = Object.keys(AGGREGATIONS) as (keyof typeof AGGREGATIONS)[];

export function getAggregationConfig(key: string): AggregationConfig | null {
  return AGGREGATIONS[key] ?? null;
}
