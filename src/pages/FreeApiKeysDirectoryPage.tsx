import { ExternalLink } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import {
  FREE_API_KEY_ENTRIES,
  type ApiDirectoryType,
  type FreeApiKeyEntry,
} from '@/content/freeApiKeysDirectory';
import { safeUrl } from '@/lib/safeUrl';

const groups: readonly {
  type: ApiDirectoryType;
  title: { ar: string; en: string };
  description: { ar: string; en: string };
}[] = [
  {
    type: 'gateway',
    title: { ar: 'البوابات', en: 'Gateways' },
    description: {
      ar: 'تجمع نماذج من جهات متعددة خلف مفتاح واحد متوافق مع OpenAI.',
      en: 'Route requests to models from multiple providers through one OpenAI-compatible key.',
    },
  },
  {
    type: 'provider',
    title: { ar: 'مزوّدو النماذج', en: 'Providers' },
    description: {
      ar: 'تستضيف نماذجها الخاصة وتتيح الوصول إليها مباشرة.',
      en: 'Host their own models and provide direct access to them.',
    },
  },
];

function EntryDetails({ entry, lang }: { entry: FreeApiKeyEntry; lang: 'ar' | 'en' }) {
  const labels = lang === 'ar'
    ? {
        benefit: 'الفائدة',
        limits: 'الحدود والشروط',
        card: 'سياسة البطاقة',
        iraq: 'حالة العراق',
        source: 'المصدر الرسمي',
        verified: 'تاريخ التحقق',
        noCard: 'لا تتطلب بطاقة وفق المصدر الرسمي',
        unknown: 'غير مذكور رسميًا',
        iraqOk: 'مقبول',
        noExtraLimits: 'غير مذكور رسميًا',
      }
    : {
        benefit: 'Benefit',
        limits: 'Limits and conditions',
        card: 'Card policy',
        iraq: 'Iraq status',
        source: 'Official source',
        verified: 'Verified date',
        noCard: 'No card required per official source',
        unknown: 'Not stated officially',
        iraqOk: 'OK',
        noExtraLimits: 'Not stated officially',
      };
  const officialUrl = safeUrl(entry.officialUrl);

  return (
    <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 text-sm tabular-nums sm:grid-cols-2">
      <div>
        <dt className="font-semibold text-stone-400">{labels.benefit}</dt>
        <dd className="mt-1 leading-relaxed text-stone-200">{entry.benefit[lang]}</dd>
      </div>
      <div>
        <dt className="font-semibold text-stone-400">{labels.limits}</dt>
        <dd className="mt-1 leading-relaxed text-stone-200">{entry.limits?.[lang] ?? labels.noExtraLimits}</dd>
      </div>
      <div>
        <dt className="font-semibold text-stone-400">{labels.card}</dt>
        <dd className="mt-1 leading-relaxed text-stone-200">
          {entry.cardPolicy === 'not_required' ? labels.noCard : labels.unknown}
        </dd>
      </div>
      <div>
        <dt className="font-semibold text-stone-400">{labels.iraq}</dt>
        <dd className="mt-1 leading-relaxed text-stone-200">
          {entry.iraq === 'ok' ? labels.iraqOk : labels.unknown}
        </dd>
      </div>
      <div>
        <dt className="font-semibold text-stone-400">{labels.source}</dt>
        <dd className="mt-1 break-all leading-relaxed">
          {officialUrl ? (
            <a
              href={officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex max-w-full items-center gap-1 text-stone-200 underline decoration-stone-500 underline-offset-2 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
            >
              <bdi dir="ltr">{officialUrl}</bdi>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 rtl:-scale-x-100" aria-hidden="true" />
            </a>
          ) : (
            <span className="text-stone-400">{labels.unknown}</span>
          )}
        </dd>
      </div>
      <div>
        <dt className="font-semibold text-stone-400">{labels.verified}</dt>
        <dd className="mt-1 text-stone-200">
          <time dateTime={entry.verified} dir="ltr" className="font-mono">{entry.verified}</time>
        </dd>
      </div>
    </dl>
  );
}

export default function FreeApiKeysDirectoryPage() {
  const { lang } = useLanguage();
  const t = lang === 'ar'
    ? {
        title: 'دليل مفاتيح API المجانية',
        note: 'تم التحقق من جميع الإدخالات في مصادرها الرسمية. تعني «غير مذكور رسميًا» أن المصدر الرسمي لم يذكر المعلومة.',
        typeGateway: 'بوابة',
        typeProvider: 'مزوّد',
      }
    : {
        title: 'Free API Keys Directory',
        note: 'All entries were verified at their official sources. “Not stated officially” means the official source does not state the information.',
        typeGateway: 'Gateway',
        typeProvider: 'Provider',
      };

  return (
    <main className="mx-auto w-full max-w-4xl px-4 pb-12 pt-10 sm:px-6">
      <header>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-stone-100 sm:text-3xl">{t.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-stone-400">{t.note}</p>
        <p className="mt-4 rounded-card border border-line bg-surface-raised p-4 text-sm leading-relaxed text-stone-300">{lang === 'ar' ? 'الحصص تختلف في وحدتها ونطاقها ودورة تجديدها: يوم تقويمي أو نافذة متدحرجة، حساب أو نموذج، رصيد لمرة واحدة أو متجدد. إذا لم يذكر المصدر التفاصيل فتبقى غير معلومة؛ وقد تتطلب الزيادة شراءً مدفوعًا.' : 'Quotas differ in units, scope and reset: calendar day or rolling window, account or model, one-time or recurring credit. Details not stated by the source remain unknown; increased limits may require a purchase.'}</p>
        <a
          href="/free-ai-models-directory"
          className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-line bg-surface px-4 text-sm font-medium text-stone-200 transition-colors hover:border-line-hover hover:text-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
        >
          {lang === 'ar' ? 'استكشف دليل نماذج الذكاء الاصطناعي المجانية' : 'Explore the Free AI Models Directory'}
        </a>
      </header>

      <div className="mt-10 space-y-10">
        {groups.map((group) => {
          const entries = FREE_API_KEY_ENTRIES.filter((entry) => entry.type === group.type);
          return (
            <section key={group.type} aria-labelledby={`api-directory-${group.type}`}>
              <h2 id={`api-directory-${group.type}`} className="font-heading text-xl font-bold text-stone-100">
                {group.title[lang]}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-stone-400">{group.description[lang]}</p>
              <div className="mt-5">
                {entries.map((entry) => (
                  <article key={entry.name} className="border-t border-line-subtle py-5 first:border-t-0 first:pt-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="font-heading text-lg font-bold text-stone-100">{entry.name}</h3>
                      <span className="rounded-md border border-line bg-surface-raised px-2.5 py-0.5 text-xs font-medium text-stone-300">
                        {entry.type === 'gateway' ? t.typeGateway : t.typeProvider}
                      </span>
                    </div>
                    <EntryDetails entry={entry} lang={lang} />
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
