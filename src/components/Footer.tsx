import { ShieldAlert, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { languageSearchForLocation } from '@/lib/languageStorage';

export default function Footer() {
  const { lang } = useLanguage();
  const languageQuery = languageSearchForLocation(
    '',
    lang,
    window.location.search,
  );
  const localizedPath = (path: string) =>
    `${path}${languageQuery ? `?${languageQuery}` : ''}`;

  return (
    <footer className="mt-20 border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-12 md:gap-8">
          {/* العمود الأول: الهوية وإخلاء المسؤولية التحريري */}
          <div className="md:col-span-5 lg:col-span-6">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md border border-line bg-surface-raised text-xs font-bold text-stone-200">
                {lang === 'ar' ? 'ن' : 'N'}
              </span>
              <p className="font-heading text-base font-bold text-stone-100">
                {lang === 'ar' ? 'نبض' : 'AMNABD Deals'}
              </p>
            </div>
            <p className="mt-2 text-sm text-stone-400">
              {lang === 'ar'
                ? 'دليل مراجعي بسرية — البيانات من صفحات الجهات المزوّدة'
                : 'A review-first directory — data from official sources'}
            </p>

            <div className="mt-6 rounded-lg border border-line bg-surface-raised p-4">
              <h3 className="font-heading flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-300">
                <ShieldAlert className="h-3.5 w-3.5 text-stone-400" />
                <span>{lang === 'ar' ? 'إخلاء مسؤولية' : 'Disclaimer'}</span>
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-stone-400">
                {lang === 'ar'
                  ? 'يجمع هذا الموقع معلومات عامة عن عروض أدوات الذكاء الاصطناعي كما تظهر في صفحات الجهات المزوّدة. لا نضمن استمرار أي عرض أو انطباق شروطه عليك، ولا نتحمل مسؤولية أي استخدام. تحقق من الشروط الحالية لدى الجهة المزوّدة قبل التسجيل أو الاستخدام المدفوع.'
                  : 'This site aggregates public information about AI tool offers as shown on their official pages. We do not guarantee that any offer is ongoing or that its terms apply to you, and we accept no liability for any use. Verify current terms with the official provider before registering or using paid services.'}
              </p>
            </div>
          </div>

          {/* العمود الثاني: مجموعات وفهارس العروض */}
          <div className="md:col-span-4 lg:col-span-3">
            <h4 className="font-heading text-xs font-semibold uppercase tracking-wider text-stone-300">
              {lang === 'ar' ? 'مجموعات مميزة:' : 'Collections:'}
            </h4>
            <ul className="mt-3 space-y-1 text-sm">
              <li>
                <a
                  href={localizedPath('/for-students')}
                  className="inline-flex min-h-11 items-center text-stone-400 transition-colors hover:text-stone-100"
                >
                  {lang === 'ar' ? 'للطلاب' : 'For Students'}
                </a>
              </li>
              <li>
                <a
                  href={localizedPath('/no-credit-card')}
                  className="inline-flex min-h-11 items-center text-stone-400 transition-colors hover:text-stone-100"
                >
                  {lang === 'ar' ? 'بدون بطاقة' : 'No Card'}
                </a>
              </li>
              <li>
                <a
                  href={localizedPath('/coding')}
                  className="inline-flex min-h-11 items-center text-stone-400 transition-colors hover:text-stone-100"
                >
                  {lang === 'ar' ? 'أدوات البرمجة' : 'Coding Tools'}
                </a>
              </li>
              <li>
                <a
                  href={localizedPath('/ending-soon')}
                  className="inline-flex min-h-11 items-center text-stone-400 transition-colors hover:text-amber-400"
                >
                  {lang === 'ar' ? 'حسب تاريخ الانتهاء' : 'Recorded end dates'}
                </a>
              </li>
              <li>
                <a
                  href={localizedPath('/free-api-keys-directory')}
                  className="inline-flex min-h-11 items-center text-stone-400 transition-colors hover:text-stone-100"
                >
                  {lang === 'ar'
                    ? 'دليل مفاتيح API المجانية'
                    : 'Free API Keys Directory'}
                </a>
              </li>
              <li>
                <a
                  href={localizedPath('/free-ai-models-directory')}
                  className="inline-flex min-h-11 items-center text-stone-400 transition-colors hover:text-stone-100"
                >
                  {lang === 'ar'
                    ? 'دليل نماذج الذكاء الاصطناعي المجانية'
                    : 'Free AI Models Directory'}
                </a>
              </li>
              <li>
                <a
                  href={localizedPath('/sms-suppliers-directory')}
                  className="inline-flex min-h-11 items-center text-stone-400 transition-colors hover:text-stone-100"
                >
                  {lang === 'ar'
                    ? 'دليل خدمات وأدلة أرقام SMS'
                    : 'SMS Number Services Directory'}
                </a>
              </li>
            </ul>
          </div>

          {/* العمود الثالث: الشفافية والروابط الخارجية */}
          <div className="md:col-span-3 lg:col-span-3">
            <h4 className="font-heading text-xs font-semibold uppercase tracking-wider text-stone-300">
              {lang === 'ar' ? 'المشروع والتوثيق' : 'Project & Trust'}
            </h4>
            <ul className="mt-3 space-y-1 text-sm">
              <li>
                <a
                  href={localizedPath('/changelog')}
                  className="inline-flex min-h-11 items-center gap-1.5 text-stone-400 transition-colors hover:text-stone-100"
                >
                  <span>{lang === 'ar' ? 'سجل المراجعات' : 'Review History'}</span>
                </a>
              </li>
              <li>
                <a
                  href={localizedPath('/privacy-policy')}
                  className="inline-flex min-h-11 items-center text-stone-400 transition-colors hover:text-stone-100"
                >
                  {lang === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
                </a>
              </li>
              <li>
                <a
                  href="/feed.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-1 text-stone-400 transition-colors hover:text-stone-100"
                >
                  <span>{lang === 'ar' ? 'تغذية RSS' : 'RSS Feed'}</span>
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/amiraq1/amnabd-deals-web"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-1 text-stone-300 transition-colors hover:text-stone-100"
                >
                  <span>{lang === 'ar' ? 'المشروع الأصلي' : 'Original project'}</span>
                  <ExternalLink className="h-3.5 w-3.5 text-stone-400" />
                </a>
              </li>
              <li className="pt-2">
                <a
                  href="https://www.f6s.com/member/ammar-mohammed?follow=1"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Follow Ammar Mohammed on F6S"
                  className="inline-flex min-h-11 items-center gap-2 text-stone-300 hover:text-stone-100"
                >
                  <span>{lang === 'ar' ? 'متابعة على F6S' : 'Follow on F6S'}</span>
                  <ExternalLink aria-hidden="true" className="h-4 w-4 text-stone-400" />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
