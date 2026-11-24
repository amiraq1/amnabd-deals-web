import { useLanguage } from '@/context/LanguageContext';

const POLICY = {
  ar: {
    title: 'سياسة الخصوصية',
    intro:
      'تشرح هذه الصفحة ما يطلبه الموقع من خدمات خارجية وما يحفظه داخل متصفحك. لا يطلب الموقع حسابًا لتصفح العروض.',
    sections: [
      {
        title: 'الاتصالات والخدمات الخارجية',
        paragraphs: [
          'Supabase: يطلب التطبيق بيانات العروض العامة وأدلة الاستخدام وإعدادات الموقع لعرضها. وإذا أرسلت بلاغًا عن عرض، يرسل معرّف العرض والسبب الذي اخترته والملاحظة الاختيارية (حتى 280 حرفًا) إلى قاعدة Supabase لمراجعتها. لا يحتوي نموذج البلاغ على حقول للاسم أو البريد أو الهاتف. يرسل المتصفح تلقائيًا بيانات الاتصال التقنية اللازمة للطلب.',
          'أيقونات العروض: تعرض بطاقات العروض وصفحاتها حروفًا أولى تُنشأ محليًا؛ ولا تحمّل صورًا من روابط الأيقونات المسجلة أو من Google Favicons أو SimpleIcons.',
          'النطاق والاستضافة: يستخدم الموقع Cloudflare لخدمة DNS الخاصة بالنطاق؛ يتضمن استعلام DNS اسم النطاق المطلوب. وتُقدَّم ملفات الموقع الثابتة عبر GitHub Pages، الذي يتلقى طلبات الصفحات وبيانات الاتصال التقنية اللازمة لتقديمها.',
          'الخطوط: لا يحمّل التطبيق الحالي خطوطًا من Google Fonts؛ تستخدم الواجهة خطوط النظام المتاحة على جهازك. وعند فتح رابط مصدر عرض، تنتقل إلى موقع الجهة الخارجية وتخضع معالجة بياناتك لسياساتها.',
        ],
      },
      {
        title: 'ما يُحفظ في متصفحك',
        paragraphs: [
          'يحفظ التطبيق تفضيل اللغة وقائمة العروض المحفوظة محليًا في تخزين المتصفح. كما يحفظ محليًا وقت آخر بلاغ عن كل عرض لتطبيق مهلة منع التكرار. لا تُرسل هذه التفضيلات إلى Supabase لمزامنتها.',
          'إذا كتبت مسودة في نموذج البلاغ، تُحفظ مؤقتًا في تخزين الجلسة على جهازك كي لا تضيع عند إعادة تحميل الصفحة. تُحذف المسودة بعد نجاح الإرسال. لا تُرسل الملاحظة إلى Supabase إلا عند اختيار «إرسال البلاغ».',
          'يمكنك حذف هذه البيانات من إعدادات المتصفح عبر مسح بيانات الموقع. لا تُستخدم ملفات تعريف ارتباط في الشيفرة الحالية للموقع.',
        ],
      },
      {
        title: 'التحليلات والتتبّع',
        paragraphs: [
          'لا تتضمن الشيفرة الحالية للموقع نصوص تحليلات أو أدوات تتبّع. مع ذلك، قد يتلقى Cloudflare وGitHub Pages وSupabase بيانات اتصال تقنية عند تقديم طلباتك؛ وتخضع معالجة كل مزوّد لشروطه وسياسة الخصوصية الخاصة به.',
        ],
      },
      {
        title: 'التحكم في بيانات البلاغات',
        paragraphs: [
          'إرسال البلاغ اختياري، وملاحظته النصية اختيارية أيضًا؛ يرجى عدم تضمين معلومات شخصية فيها. لا تحدد شيفرة الموقع مدة للاحتفاظ بالبلاغات المرسلة إلى Supabase. أما بيانات التفضيلات والمسودات المحفوظة على جهازك فيمكن حذفها بمسح بيانات الموقع من المتصفح.',
        ],
      },
    ],
  },
  en: {
    title: 'Privacy Policy',
    intro:
      'This page explains which external services the site contacts and what it stores in your browser. You do not need an account to browse offers.',
    sections: [
      {
        title: 'External connections and services',
        paragraphs: [
          'Supabase: the app requests public offer records, usage guides, and site settings for display. If you submit an offer report, it sends the offer identifier, your selected reason, and your optional note (up to 280 characters) to the Supabase database for review. The report form has no name, email, or phone fields. Your browser also sends the technical connection information needed for the request.',
          'Offer icons: offer cards and detail pages display locally generated initials; they do not load images from recorded icon URLs, Google Favicons, or SimpleIcons.',
          'Domain and hosting: Cloudflare provides DNS for the site domain; a DNS lookup includes the requested domain name. Static site files are served through GitHub Pages, which receives page requests and the technical connection data needed to serve them.',
          'Fonts: the current app does not load fonts from Google Fonts; it uses system fonts available on your device. Opening an offer-source link takes you to that external provider, whose privacy terms then apply.',
        ],
      },
      {
        title: 'What is stored in your browser',
        paragraphs: [
          'The app stores your language preference and saved-offer list locally in browser storage. It also stores the time of your last report for each offer locally to enforce a repeat-report cooldown. These preferences are not sent to Supabase for synchronization.',
          'If you type a draft in the report form, it is temporarily stored in session storage on your device so a page reload does not discard it. The draft is removed after a successful submission. The note is sent to Supabase only when you choose “Submit report.”',
          'You can remove this data through your browser settings by clearing this site’s data. The current site code does not use cookies.',
        ],
      },
      {
        title: 'Analytics and tracking',
        paragraphs: [
          'The current site code contains no analytics or tracking scripts. Cloudflare, GitHub Pages, and Supabase may still receive technical connection data when handling requests; each provider’s own terms and privacy policy govern its processing.',
        ],
      },
      {
        title: 'Control over submitted reports',
        paragraphs: [
          'Submitting a report is optional, and its note is optional too; please do not include personal information in it. The site code does not define a retention period for reports sent to Supabase. Preference data and drafts stored on your device can be removed by clearing this site’s data in your browser.',
        ],
      },
    ],
  },
} as const;

export default function PrivacyPolicyPage() {
  const { lang } = useLanguage();
  const copy = POLICY[lang];

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <article className="space-y-8">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
            {lang === 'ar' ? 'الخصوصية والبيانات' : 'Privacy & data'}
          </p>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-stone-100 sm:text-3xl">
            {copy.title}
          </h1>
          <p className="max-w-3xl text-base leading-relaxed text-stone-300">{copy.intro}</p>
        </header>

        {copy.sections.map((section) => (
          <section key={section.title} className="space-y-3 border-t border-line-subtle pt-6">
            <h2 className="font-heading text-lg font-bold text-stone-100 sm:text-xl">{section.title}</h2>
            <div className="space-y-3 text-sm leading-relaxed text-stone-300 sm:text-base">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </article>
    </main>
  );
}
