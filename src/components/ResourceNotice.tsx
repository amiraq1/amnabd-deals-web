import { CircleAlert } from 'lucide-react';
import type { Lang } from '@/types';
import type { ResourceErrorKind } from '@/lib/resource';
export type ResourceName = 'deals' | 'guides' | 'config';
function resourceLabel(name: ResourceName, lang: Lang): string {
  const labels = {
    deals: { ar: 'العروض', en: 'offers' },
    guides: { ar: 'دليل الاستخدام', en: 'usage guides' },
    config: { ar: 'إعدادات الموقع', en: 'site settings' },
  };
  return labels[name][lang];
}
export default function ResourceNotice({
  name,
  error,
  lang,
  retry,
}: {
  name: ResourceName;
  error: ResourceErrorKind | null;
  lang: Lang;
  retry: () => void;
}) {
  const label = resourceLabel(name, lang);
  let message: string;
  if (error === 'configuration')
    message =
      lang === 'ar'
        ? 'إعدادات الاتصال غير مكتملة أو غير صالحة. يلزم تصحيح إعدادات الموقع.'
        : 'Connection settings are missing or invalid. Site configuration needs correction.';
  else if (error === 'invalid')
    message =
      lang === 'ar'
        ? `تعذر عرض ${label} لأن البيانات غير صالحة.`
        : `The ${label} data could not be displayed because it is invalid.`;
  else if (error === 'timeout')
    message =
      lang === 'ar'
        ? `انتهت مهلة تحميل ${label}.`
        : `Loading ${label} timed out.`;
  else
    message =
      lang === 'ar'
        ? `تعذر تحميل ${label}. تحقق من الاتصال وحاول مجددًا.`
        : `Could not load ${label}. Check your connection and try again.`;
  return (
    <section
      className="mx-auto my-4 max-w-6xl rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm text-amber-100"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <CircleAlert aria-hidden="true" className="h-6 w-6 shrink-0" />
        <p>{message}</p>
      </div>
      <button
        className="mt-3 min-h-11 rounded-control border border-amber-400/50 px-3 py-2 underline"
        onClick={retry}
      >
        {lang === 'ar'
          ? `إعادة محاولة تحميل ${label}`
          : `Retry loading ${label}`}
      </button>
    </section>
  );
}
