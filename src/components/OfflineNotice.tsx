import { WifiOff } from 'lucide-react';
import type { Lang } from '@/types';

export default function OfflineNotice({
  lang,
  onRetry,
}: {
  lang: Lang;
  onRetry: () => void;
}) {
  const isAr = lang === 'ar';
  return (
    <main
      className="mx-auto my-10 w-full max-w-3xl px-4 sm:px-6"
      role="status"
      aria-labelledby="offline-title"
    >
      <section className="rounded-card border border-line bg-surface-raised p-6 sm:p-9">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-surface text-amber-300">
          <WifiOff className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 id="offline-title" className="font-heading mt-5 text-2xl font-bold tracking-tight text-stone-100">
          {isAr ? 'أنت غير متصل بالإنترنت' : 'You’re offline'}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-300">
          {isAr
            ? 'لا نعرض نسخة مخزنة من كتالوج العروض على أنها حديثة. أعد الاتصال بالإنترنت لتحميل أحدث البيانات.'
            : 'We don’t present a cached offers catalog as current. Reconnect to load the latest data.'}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-stone-400">
          {isAr
            ? 'مفضلاتك المحلية محفوظة في هذا المتصفح، وستظهر عند عودة الاتصال.'
            : 'Your local favorites remain saved in this browser and will return when you’re online.'}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-surface px-5 py-2.5 text-sm font-medium text-stone-100 transition-colors hover:border-line-hover hover:bg-surface-overlay focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {isAr ? 'إعادة المحاولة' : 'Try again'}
        </button>
      </section>
    </main>
  );
}
