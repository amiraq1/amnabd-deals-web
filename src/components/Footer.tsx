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
                ? 'يجمع هذا الموقع معلومات عامة عن عروض أدوات الذكاء الاصطناعي كما تظهر في صفحاتها الرسمية. لا نضمن استمرار أي عرض أو انطباق شروطه عليك، ولا نتحمل مسؤولية أي استخدام. تحقق من الشروط الحالية لدى الجهة الرسمية قبل التسجيل أو الاستخدام المدفوع.'
                : 'This site aggregates public information about AI tool offers as shown on their official pages. We do not guarantee that any offer is ongoing or that its terms apply to you, and we accept no liability for any use. Verify current terms with the official provider before registering or using paid services.'}
            </p>
          </div>
          <div className="text-sm text-slate-500">
            <p className="font-heading font-semibold text-slate-300">
              {lang === 'ar' ? 'نبض' : 'AMNABD Deals'}
            </p>
            <p className="mt-1">
              {lang === 'ar'
                ? 'دليل مراجعي بسرية — البيانات من المصادر الرسمية'
                : 'A review-first directory — data from official sources'}
            </p>
            <a
              href="https://github.com/amiraq1/amnabd-deals"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-emerald-400 transition-colors hover:text-emerald-300"
            >
              {lang === 'ar' ? 'المشروع الأصلي' : 'Original project'}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
