import { ArrowLeft, ArrowRight, ExternalLink, RotateCcw } from 'lucide-react';
import type { Deal } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { getDealDisplayName } from '@/lib/dealMetadata';
import { buildComparisonRows, type ComparisonCell } from '@/lib/comparison';

interface ComparisonPageProps {
  deals: Deal[];
  slugs: string[];
  onBackToHome: () => void;
  onClearAndBack: () => void;
  onOpenDeal: (slug: string) => void;
}

function renderCell(cell: ComparisonCell) {
  if (cell.kind === 'text') return cell.text;
  return (
    <ul className="space-y-2">
      {cell.sources.map((source, index) => (
        <li key={`${source.url ?? source.title}-${index}`} className="break-words">
          {source.url ? (
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex max-w-full items-start gap-1.5 text-stone-200 underline decoration-stone-500 underline-offset-2 hover:text-white"
            >
              <span className="min-w-0 [overflow-wrap:anywhere]">{source.title}</span>
              <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 rtl:-scale-x-100" aria-hidden="true" />
            </a>
          ) : (
            <span>{source.title}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function ComparisonPage({
  deals,
  slugs,
  onBackToHome,
  onClearAndBack,
  onOpenDeal,
}: ComparisonPageProps) {
  const { lang, dir } = useLanguage();
  const Arrow = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const bySlug = new Map(deals.map((deal) => [deal.slug, deal]));
  const pair = (() => {
    if (slugs.length !== 2 || !slugs[0] || !slugs[1] || slugs[0] === slugs[1]) return null;
    const first = bySlug.get(slugs[0]);
    const second = bySlug.get(slugs[1]);
    return first && second ? ([first, second] as const) : null;
  })();

  if (!pair) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <button
          type="button"
          onClick={onBackToHome}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-medium text-stone-400 transition-colors hover:text-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
        >
          <Arrow className="h-4 w-4" aria-hidden="true" />
          {lang === 'ar' ? 'العودة إلى العروض' : 'Back to offers'}
        </button>
        <section className="mt-6 rounded-card border border-line bg-surface-raised p-6">
          <h1 className="font-heading text-2xl font-bold text-stone-100 [overflow-wrap:anywhere]">
            {lang === 'ar' ? 'المقارنة تحتاج عرضين محددين' : 'A comparison needs two selected offers'}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-stone-300">
            {lang === 'ar'
              ? 'اختر عرضين من القائمة أو من صفحات التفاصيل. لا تُعرض نتيجة عند غياب أحدهما.'
              : 'Choose two offers from the list or their detail pages. No comparison is shown if either offer is missing.'}
          </p>
          <button
            type="button"
            onClick={onBackToHome}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-surface px-5 py-2 text-sm font-medium text-stone-100 transition-colors hover:border-line-hover hover:bg-surface-overlay focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
          >
            {lang === 'ar' ? 'اختيار عرضين' : 'Choose two offers'}
          </button>
        </section>
      </main>
    );
  }

  const [first, second] = pair;
  const names = [getDealDisplayName(first), getDealDisplayName(second)] as const;
  const rows = buildComparisonRows([first, second], lang);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToHome}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-medium text-stone-400 transition-colors hover:text-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
        >
          <Arrow className="h-4 w-4" aria-hidden="true" />
          {lang === 'ar' ? 'كل العروض' : 'All offers'}
        </button>
        <button
          type="button"
          onClick={onClearAndBack}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line bg-surface-raised px-3 py-2 text-sm text-stone-300 transition-colors hover:border-line-hover hover:text-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          {lang === 'ar' ? 'بدء اختيار جديد' : 'Start a new comparison'}
        </button>
      </div>

      <header className="mt-6 rounded-card border border-line bg-surface-raised p-5 sm:p-7">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-stone-100 sm:text-3xl [overflow-wrap:anywhere]">
          {lang === 'ar' ? 'مقارنة عرضين' : 'Compare two offers'}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-stone-300">
          {lang === 'ar'
            ? 'مقارنة للحقول المسجلة فقط؛ لا تقييم ولا ترتيب. «غير معلوم» تعني أن البيانات لا تثبت القيمة.'
            : 'Recorded fields only—no score or ranking. “Unknown” means the data does not establish a value.'}
        </p>
      </header>

      <section className="mt-5 overflow-x-auto rounded-card border border-line bg-surface-raised" aria-label={lang === 'ar' ? 'حقول المقارنة' : 'Comparison fields'}>
        <table className="w-full table-fixed border-collapse tabular-nums">
          <thead>
            <tr className="border-b border-line bg-surface/90">
              <th scope="col" className="w-[28%] p-2 text-start text-[11px] font-medium text-stone-400 sm:p-4 sm:text-xs">
                {lang === 'ar' ? 'الحقل' : 'Field'}
              </th>
              {([first, second] as const).map((deal, index) => (
                <th key={deal.slug} scope="col" className="w-[36%] p-2 text-start align-top sm:p-4">
                  <button
                    type="button"
                    onClick={() => onOpenDeal(deal.slug)}
                    className="block w-full min-w-0 text-start font-heading text-xs font-bold leading-snug text-stone-100 hover:underline sm:text-sm [overflow-wrap:anywhere] focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
                  >
                    <span className="mb-1 block text-[10px] font-medium text-stone-400 sm:text-[11px]">
                      {lang === 'ar' ? `العرض ${index === 0 ? 'الأول' : 'الثاني'}` : `Offer ${index + 1}`}
                    </span>
                    <bdi>{names[index]}</bdi>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-line-subtle last:border-b-0">
                <th scope="row" className="w-[28%] p-2 text-start align-top text-[11px] font-semibold leading-relaxed text-stone-400 sm:p-4 sm:text-xs [overflow-wrap:anywhere]">
                  {row.label[lang]}
                </th>
                {row.values.map((value, index) => (
                  <td key={`${row.key}-${index}`} className="w-[36%] break-words p-2 align-top text-[11px] leading-relaxed text-stone-200 sm:p-4 sm:text-sm [overflow-wrap:anywhere]">
                    {renderCell(value)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <p className="mt-4 text-xs leading-relaxed text-stone-400">
        {lang === 'ar'
          ? 'تحقق من المصدر الرسمي قبل اتخاذ القرار؛ ظهور الحقول هنا لا يضمن استمرار العرض أو انطباق الأهلية.'
          : 'Check the official source before deciding; these recorded fields do not guarantee that an offer remains available or that you qualify.'}
      </p>
    </main>
  );
}
