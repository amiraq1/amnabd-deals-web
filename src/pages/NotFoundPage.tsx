import { Compass } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface NotFoundPageProps {
  onBack: () => void;
}

export default function NotFoundPage({ onBack }: NotFoundPageProps) {
  const { lang } = useLanguage();

  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <Compass className="h-14 w-14 text-slate-600" />
      <h1 className="font-heading mt-6 text-4xl font-extrabold text-white">404</h1>
      <p className="mt-3 text-slate-400">
        {lang === 'ar'
          ? 'الصفحة غير موجودة. ربما تغيّر الرابط أو حُذف العرض.'
          : 'Page not found. The link may have changed or the offer was removed.'}
      </p>
      <button
        onClick={onBack}
        className="mt-8 rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-400"
      >
        {lang === 'ar' ? 'العودة إلى العروض' : 'Back to deals'}
      </button>
    </main>
  );
}
