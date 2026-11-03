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
    <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
      <div>
        <dt className="font-semibold text-slate-400">{labels.benefit}</dt>
        <dd className="mt-1 leading-relaxed text-slate-200">{entry.benefit[lang]}</dd>
      </div>
      <div>
        <dt className="font-semibold text-slate-400">{labels.limits}</dt>
        <dd className="mt-1 leading-relaxed text-slate-200">{entry.limits?.[lang] ?? labels.noExtraLimits}</dd>
      </div>
      <div>
        <dt className="font-semibold text-slate-400">{labels.card}</dt>
        <dd className="mt-1 leading-relaxed text-slate-200">
          {entry.cardPolicy === 'not_required' ? labels.noCard : labels.unknown}
        </dd>
      </div>
      <div>
        <dt className="font-semibold text-slate-400">{labels.iraq}</dt>
        <dd className="mt-1 leading-relaxed text-slate-200">
          {entry.iraq === 'ok' ? labels.iraqOk : labels.unknown}
        </dd>
      </div>
      <div>
        <dt className="font-semibold text-slate-400">{labels.source}</dt>
        <dd className="mt-1 break-all leading-relaxed">
          {officialUrl ? (
            <a
              href={officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-300 underline decoration-emerald-500/40 underline-offset-2 hover:text-emerald-200"
            >
              <bdi dir="ltr">{officialUrl}</bdi>
            </a>
          ) : (
            <span className="text-slate-300">{labels.unknown}</span>
          )}
        </dd>
      </div>
      <div>
        <dt className="font-semibold text-slate-400">{labels.verified}</dt>
        <dd className="mt-1 text-slate-200">
          <time dateTime={entry.verified} dir="ltr">{entry.verified}</time>
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
    <main className="mx-auto w-full max-w-4xl px-4 pb-10 pt-10 sm:px-6">
      <header>
        <h1 className="font-heading text-3xl font-extrabold text-white">{t.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">{t.note}</p>
      </header>

      <div className="mt-8 space-y-10">
        {groups.map((group) => {
          const entries = FREE_API_KEY_ENTRIES.filter((entry) => entry.type === group.type);
          return (
            <section key={group.type} aria-labelledby={`api-directory-${group.type}`}>
              <h2 id={`api-directory-${group.type}`} className="font-heading text-xl font-bold text-emerald-300">
                {group.title[lang]}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-400">{group.description[lang]}</p>
              <div className="mt-5">
                {entries.map((entry) => (
                  <article key={entry.name} className="border-t border-slate-800 py-5 first:border-t-0 first:pt-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="font-heading text-lg font-bold text-white">{entry.name}</h3>
                      <span className="rounded-full border border-slate-700 px-2.5 py-1 text-xs font-medium text-slate-300">
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
