import { ShieldAlert, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function Footer() {
  const { lang } = useLanguage();

  return (
    <footer className="mt-16 border-t border-slate-800/80 bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl">
            <h3 className="font-heading flex items-center gap-2 text-sm font-semibold text-gold">
              <ShieldAlert className="h-4 w-4" />
              {lang === 'ar' ? 'إخلاء مسؤولية' : 'Disclaimer'}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              {lang === 'ar'
                ? 'يجمع هذا الموقع معلومات عامة عن عروض أدوات الذكاء الاصطناعي كما تظهر في صفحات الجهات المزوّدة. لا نضمن استمرار أي عرض أو انطباق شروطه عليك، ولا نتحمل مسؤولية أي استخدام. تحقق من الشروط الحالية لدى الجهة المزوّدة قبل التسجيل أو الاستخدام المدفوع.'
                : 'This site aggregates public information about AI tool offers as shown on their official pages. We do not guarantee that any offer is ongoing or that its terms apply to you, and we accept no liability for any use. Verify current terms with the official provider before registering or using paid services.'}
            </p>
          </div>
          <div className="text-sm text-slate-500">
            <p className="font-heading font-semibold text-slate-300">
              {lang === 'ar' ? 'نبض' : 'AMNABD Deals'}
            </p>
            <p className="mt-1">
              {lang === 'ar'
                ? 'دليل مراجعي بسرية — البيانات من صفحات الجهات المزوّدة'
                : 'A review-first directory — data from official sources'}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-semibold">{lang === 'ar' ? 'مجموعات مميزة:' : 'Collections:'}</span>
              <a href="/for-students" className="text-slate-400 hover:text-emerald-400">
                {lang === 'ar' ? 'للطلاب' : 'For Students'}
              </a>
              <span className="text-slate-700">·</span>
              <a href="/no-credit-card" className="text-slate-400 hover:text-emerald-400">
                {lang === 'ar' ? 'بدون بطاقة' : 'No Card'}
              </a>
              <span className="text-slate-700">·</span>
              <a href="/coding" className="text-slate-400 hover:text-emerald-400">
                {lang === 'ar' ? 'أدوات البرمجة' : 'Coding Tools'}
              </a>
              <span className="text-slate-700">·</span>
              <a href="/ending-soon" className="text-slate-400 hover:text-amber-400">
                {lang === 'ar' ? 'تنتهي قريباً' : 'Ending Soon'}
              </a>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <a
                href="/changelog"
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400"
              >
                {lang === 'ar' ? 'سجل التغييرات' : 'Changelog'}
              </a>
              <span className="text-slate-600">·</span>
              <a
                href="/feed.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400"
              >
                {lang === 'ar' ? 'تغذية RSS' : 'RSS Feed'}
              </a>
              <span className="text-slate-600">·</span>
              <a
                href="https://github.com/amiraq1/amnabd-deals"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-emerald-400 transition-colors hover:text-emerald-300"
              >
                {lang === 'ar' ? 'المشروع الأصلي' : 'Original project'}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
