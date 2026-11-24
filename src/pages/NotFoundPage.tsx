import { Compass } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface NotFoundPageProps {
  onBack: () => void;
}

export default function NotFoundPage({ onBack }: NotFoundPageProps) {
  const { lang } = useLanguage();

  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <Compass aria-hidden="true" className="h-14 w-14 text-stone-500" />
      <h1 className="font-heading mt-6 text-4xl font-bold tracking-tight text-stone-100">404</h1>
      <p className="mt-3 text-stone-400">
        {lang === 'ar'
          ? 'الصفحة غير موجودة. ربما تغيّر الرابط أو حُذف العرض.'
          : 'Page not found. The link may have changed or the offer was removed.'}
      </p>
      <button
        type="button"
        onClick={onBack}
        className="mt-8 inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-surface-raised px-6 py-2.5 text-sm font-medium text-stone-100 transition-colors hover:border-line-hover hover:bg-surface-overlay focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-[0.98]"
      >
        {lang === 'ar' ? 'العودة إلى العروض' : 'Back to deals'}
      </button>
    </main>
  );
}
