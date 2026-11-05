import { useMemo, useState } from 'react';
import { ExternalLink, Filter, RotateCcw, Search, ShieldCheck } from 'lucide-react';
import {
  FREE_AI_MODEL_ENTRIES,
  FREE_AI_MODEL_PROVIDERS,
  type AiModelAccessType,
  type AiModelCapability,
  type AiModelModality,
  type AiModelUnknownPolicy,
  type FreeAiModelEntry,
} from '@/content/freeAiModelsDirectory';
import { useLanguage } from '@/context/LanguageContext';

const MILLION_TOKENS = 1_000_000;
type CategoryFilter = 'all' | AiModelCapability | 'no-card' | 'long-context';
type SortOrder = 'recent' | 'context';

function contextLabel(tokens: number | null): string {
  if (tokens === null) return '—';
  return `${tokens.toLocaleString('en-US')} (≈${(tokens / MILLION_TOKENS).toFixed(2)}M)`;
}

function accessLabel(access: AiModelAccessType, lang: 'ar' | 'en'): string {
  const labels: Record<AiModelAccessType, { ar: string; en: string }> = {
    direct: { ar: 'مباشر', en: 'Direct provider' },
    gateway: { ar: 'بوابة', en: 'Gateway' },
    broker: { ar: 'وسيط', en: 'Broker' },
    unknown: { ar: 'غير محدد', en: 'Unspecified' },
  };
  return labels[access][lang];
}

function policyLabel(policy: AiModelUnknownPolicy, lang: 'ar' | 'en'): string {
  if (policy === 'not_required') return lang === 'ar' ? 'غير مطلوبة وفق المصدر' : 'Not required per source';
  if (policy === 'required') return lang === 'ar' ? 'مطلوبة وفق المصدر' : 'Required per source';
  return lang === 'ar' ? 'غير مذكور رسميًا' : 'Not stated officially';
}

function matchesCategory(entry: FreeAiModelEntry, category: CategoryFilter): boolean {
  if (category === 'all') return true;
  if (category === 'no-card') return entry.cardPolicy === 'not_required';
  if (category === 'long-context') return (entry.contextTokens ?? 0) >= MILLION_TOKENS;
  return entry.capabilities.includes(category);
}

function sourceLink(url: string, label: string) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-emerald-300 underline decoration-emerald-500/40 underline-offset-4 hover:text-emerald-200"
    >
      {label}<ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
    </a>
  );
}

function ModelCard({ entry, lang }: { entry: FreeAiModelEntry; lang: 'ar' | 'en' }) {
  const copy = lang === 'ar'
    ? {
        id: 'معرّف النموذج', developer: 'المطوّر', provider: 'المزوّد / الوصول', context: 'حجم السياق',
        inputs: 'المدخلات', outputs: 'المخرجات', capabilities: 'الاستخدامات الموثّقة', card: 'البطاقة',
        phone: 'الهاتف', limits: 'حدود وشروط الوصول', source: 'صفحة النموذج الرسمية', terms: 'شروط الوصول والأسعار',
        checked: 'آخر تحقق', verified: 'معلومات موثقة رسميًا', partial: 'الحقائق المعروضة موثّقة؛ بعض الحقول غير منشورة', unknown: 'غير مذكور رسميًا',
        text: 'نص', image: 'صورة', audio: 'صوت', video: 'فيديو', pdf: 'PDF', chat: 'محادثة', coding: 'برمجة',
        reasoning: 'استدلال', vision: 'رؤية', 'tool-calling': 'استدعاء الأدوات',
      }
    : {
        id: 'Model ID', developer: 'Developer', provider: 'Provider / access', context: 'Context window',
        inputs: 'Inputs', outputs: 'Outputs', capabilities: 'Verified use cases', card: 'Credit card',
        phone: 'Phone', limits: 'Access limits and terms', source: 'Official model page', terms: 'Access terms and pricing',
        checked: 'Last checked', verified: 'Officially verified', partial: 'Displayed facts verified; some fields are not published', unknown: 'Not stated officially',
        text: 'Text', image: 'Image', audio: 'Audio', video: 'Video', pdf: 'PDF', chat: 'Chat', coding: 'Coding',
        reasoning: 'Reasoning', vision: 'Vision', 'tool-calling': 'Tool calling',
      };
  const modalityName: Record<AiModelModality, string> = {
    text: copy.text, image: copy.image, audio: copy.audio, video: copy.video, pdf: copy.pdf,
  };
  const capabilityName: Record<AiModelCapability, string> = {
    chat: copy.chat, coding: copy.coding, reasoning: copy.reasoning, vision: copy.vision,
    'tool-calling': copy['tool-calling'], audio: copy.audio, video: copy.video, pdf: copy.pdf,
  };
  const evidenceLabel = entry.evidenceStatus === 'verified' ? copy.verified : entry.evidenceStatus === 'partial' ? copy.partial : copy.unknown;

  return (
    <article className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-5 shadow-lg shadow-black/10 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-heading text-xl font-extrabold text-white">{entry.name}</h3>
            <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-200">
              {entry.tierLabel[lang]}
            </span>
          </div>
          <p className="mt-1 font-mono text-sm text-slate-400"><bdi dir="ltr">{entry.modelId}</bdi></p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-200">
          <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />{evidenceLabel}
        </span>
      </div>

      <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">{entry.description[lang]}</p>

      <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-4 border-t border-slate-800 pt-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-slate-400">{copy.developer}</dt>
          <dd className="mt-1 text-slate-200">{entry.developer}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-400">{copy.provider}</dt>
          <dd className="mt-1 text-slate-200">{lang === 'ar' ? entry.providerNameAr : entry.providerName} · {accessLabel(entry.accessType, lang)}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-400">{copy.context}</dt>
          <dd className="mt-1 font-mono text-slate-100" dir="ltr">{contextLabel(entry.contextTokens)}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-400">{copy.id}</dt>
          <dd className="mt-1 font-mono text-slate-200" dir="ltr">{entry.modelId}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-400">{copy.inputs}</dt>
          <dd className="mt-1 text-slate-200">{entry.modalities.map((item) => modalityName[item]).join(' · ')}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-400">{copy.outputs}</dt>
          <dd className="mt-1 text-slate-200">{entry.outputModalities.map((item) => modalityName[item]).join(' · ')}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-400">{copy.capabilities}</dt>
          <dd className="mt-1 flex flex-wrap gap-1.5">
            {entry.capabilities.map((capability) => (
              <span key={capability} className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-200">{capabilityName[capability]}</span>
            ))}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-400">{copy.card} / {copy.phone}</dt>
          <dd className="mt-1 text-slate-200">{policyLabel(entry.cardPolicy, lang)} · {policyLabel(entry.phonePolicy, lang)}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-semibold text-slate-400">{copy.limits}</dt>
          <dd className="mt-1 leading-7 text-slate-200">{entry.trialLimits[lang]}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-400">{copy.checked}</dt>
          <dd className="mt-1 text-slate-200"><time dateTime={entry.verifiedDate} dir="ltr">{entry.verifiedDate}</time></dd>
        </div>
        <div className="flex flex-wrap items-end gap-x-5 gap-y-1">
          {sourceLink(entry.officialUrl, copy.source)}
          {entry.termsUrl && sourceLink(entry.termsUrl, copy.terms)}
        </div>
      </dl>
    </article>
  );
}

export default function FreeAiModelsDirectoryPage() {
  const { lang } = useLanguage();
  const [query, setQuery] = useState('');
  const [providerFilter, setProviderFilter] = useState('all');
  const [accessFilter, setAccessFilter] = useState<'all' | AiModelAccessType>('all');
  const [usageFilter, setUsageFilter] = useState<'all' | AiModelCapability>('all');
  const [modalityFilter, setModalityFilter] = useState<'all' | AiModelModality>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [noCardOnly, setNoCardOnly] = useState(false);
  const [noPhoneOnly, setNoPhoneOnly] = useState(false);
  const [longContextOnly, setLongContextOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('recent');

  const ar = lang === 'ar';
  const text = ar
    ? {
        title: 'دليل نماذج الذكاء الاصطناعي المجانية',
        intro: 'قارن النماذج المتاحة عبر بوابات ومزوّدي الذكاء الاصطناعي اعتمادًا على المعلومات المنشورة رسميًا، مع توضيح الحصص والحقول غير المعروفة.',
        scope: 'يعرض هذا الإصدار النماذج التي أمكن توثيق معلومات الوصول إليها من مصادر المزوّدين الرسمية. الأعداد تخص السجلات في هذا الدليل ولا تمثل إحصاءً كاملًا للسوق؛ وبعضها تجربة محدودة أو خطة بحصص.',
        models: 'نماذج مدرجة', providers: 'مزوّدون مدرجون', noCard: 'مؤكد أنها بلا بطاقة', longContext: 'سياق ≥ مليون رمز',
        search: 'ابحث باسم النموذج أو المزوّد', provider: 'كل المزوّدين', access: 'كل أنواع الوصول', direct: 'مزوّد مباشر', gateway: 'بوابة',
        usage: 'كل الاستخدامات', modality: 'كل الوسائط', coding: 'برمجة', reasoning: 'استدلال', vision: 'رؤية', chat: 'محادثة',
        text: 'نص', image: 'صورة', audio: 'صوت', video: 'فيديو', pdf: 'PDF', noCardFilter: 'مؤكد أنها بلا بطاقة',
        noPhoneFilter: 'مؤكد أنها بلا هاتف', longFilter: 'سياق مليون رمز أو أكثر', verified: 'معلومات موثقة رسميًا',
        sort: 'الترتيب', recent: 'الأحدث تحققًا', contextSort: 'الأطول سياقًا', categories: 'استكشف حسب الاستخدام',
        all: 'الكل', quickCard: 'بلا بطاقة', quickLong: 'سياق طويل', results: 'نتيجة', reset: 'مسح الفلاتر',
        noResults: 'لا توجد نتائج تطابق الفلاتر. جرّب تعديلها أو مسحها.', providersTitle: 'المزوّدون', providerDesc: 'يعرض هذا القسم المزوّدين الذين لديهم نماذج موثقة في الدليل، دون استنتاج أعداد كاملة لكتالوجاتهم.',
        listed: 'نماذج مدرجة في هذا الدليل', best: 'النماذج الموثقة', providerSource: 'الموقع الرسمي',
        disclaimerTitle: 'ملاحظات مهمة', disclaimer: '«تجريبي» لا تعني استخدامًا مجانيًا دائمًا أو غير محدود. قد تتغير الحصص والأهلية حسب الحساب والبلد. لا ترسل بيانات شخصية أو سرية إلى نقاط نهاية تجريبية قبل مراجعة شروط الخصوصية والاستخدام.',
        apiLink: 'استكشف دليل مفاتيح API المجانية', sourceNote: 'تاريخ التحقق: 5 نوفمبر 2026. المصادر الرسمية مرتبطة بكل بطاقة. لم نستخدم درجات أو مزايا غير منشورة رسميًا.',
        emptyCategory: 'لا توجد نماذج موثقة في هذا التصنيف حاليًا.',
      }
    : {
        title: 'Free AI Models Directory',
        intro: 'Compare models available through AI gateways and providers using officially published information, with quotas and unknown fields called out.',
        scope: 'This release lists models whose access details could be checked against official provider sources. Counts describe this directory only, not the whole market; some entries are limited trials or quota-based tiers.',
        models: 'Listed models', providers: 'Listed providers', noCard: 'Confirmed no-card', longContext: 'Context ≥ 1M tokens',
        search: 'Search model or provider', provider: 'All providers', access: 'All access types', direct: 'Direct provider', gateway: 'Gateway',
        usage: 'All use cases', modality: 'All modalities', coding: 'Coding', reasoning: 'Reasoning', vision: 'Vision', chat: 'Chat',
        text: 'Text', image: 'Image', audio: 'Audio', video: 'Video', pdf: 'PDF', noCardFilter: 'Confirmed no card required',
        noPhoneFilter: 'Confirmed no phone required', longFilter: 'Context of 1M tokens or more', verified: 'Officially verified information',
        sort: 'Sort', recent: 'Most recently checked', contextSort: 'Largest context', categories: 'Explore by use case',
        all: 'All', quickCard: 'No card', quickLong: 'Long context', results: 'result(s)', reset: 'Clear filters',
        noResults: 'No entries match these filters. Adjust or clear them to see results.', providersTitle: 'Providers', providerDesc: 'This section lists providers with verified models in the directory; unverified catalog totals are not inferred.',
        listed: 'Models listed in this directory', best: 'Verified models', providerSource: 'Official site',
        disclaimerTitle: 'Important notes', disclaimer: '“Trial” does not mean permanently free or unlimited. Quotas and eligibility may vary by account and country. Do not send personal or confidential data to trial endpoints before reviewing privacy and use terms.',
        apiLink: 'Explore the Free API Keys Directory', sourceNote: 'Verified November 5, 2026. Official sources are linked on each card. Scores and unpublished features are not used.',
        emptyCategory: 'No verified models are currently available in this category.',
      };

  const modelCount = FREE_AI_MODEL_ENTRIES.length;
  const providerCount = new Set(FREE_AI_MODEL_ENTRIES.map((entry) => entry.providerId)).size;
  const confirmedNoCardCount = FREE_AI_MODEL_ENTRIES.filter((entry) => entry.cardPolicy === 'not_required').length;
  const longContextCount = FREE_AI_MODEL_ENTRIES.filter((entry) => (entry.contextTokens ?? 0) >= MILLION_TOKENS).length;

  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const entries = FREE_AI_MODEL_ENTRIES.filter((entry) => {
      const searchable = [entry.name, entry.modelId, entry.providerName, entry.providerNameAr, entry.developer].join(' ').toLocaleLowerCase();
      if (normalizedQuery && !searchable.includes(normalizedQuery)) return false;
      if (providerFilter !== 'all' && entry.providerId !== providerFilter) return false;
      if (accessFilter !== 'all' && entry.accessType !== accessFilter) return false;
      if (usageFilter !== 'all' && !entry.capabilities.includes(usageFilter)) return false;
      if (modalityFilter !== 'all' && !entry.modalities.includes(modalityFilter)) return false;
      if (!matchesCategory(entry, categoryFilter)) return false;
      if (noCardOnly && entry.cardPolicy !== 'not_required') return false;
      if (noPhoneOnly && entry.phonePolicy !== 'not_required') return false;
      if (longContextOnly && (entry.contextTokens ?? 0) < MILLION_TOKENS) return false;
      if (verifiedOnly && entry.evidenceStatus === 'unknown') return false;
      return true;
    });
    return [...entries].sort((a, b) => sortOrder === 'context'
      ? (b.contextTokens ?? 0) - (a.contextTokens ?? 0)
      : b.verifiedDate.localeCompare(a.verifiedDate));
  }, [query, providerFilter, accessFilter, usageFilter, modalityFilter, categoryFilter, noCardOnly, noPhoneOnly, longContextOnly, verifiedOnly, sortOrder]);

  const categoryButtons: { id: CategoryFilter; label: string; count: number }[] = [
    { id: 'coding', label: text.coding, count: FREE_AI_MODEL_ENTRIES.filter((entry) => entry.capabilities.includes('coding')).length },
    { id: 'reasoning', label: text.reasoning, count: FREE_AI_MODEL_ENTRIES.filter((entry) => entry.capabilities.includes('reasoning')).length },
    { id: 'vision', label: text.vision, count: FREE_AI_MODEL_ENTRIES.filter((entry) => entry.capabilities.includes('vision')).length },
    { id: 'video', label: text.video, count: FREE_AI_MODEL_ENTRIES.filter((entry) => entry.capabilities.includes('video')).length },
    { id: 'no-card', label: text.quickCard, count: confirmedNoCardCount },
    { id: 'long-context', label: text.quickLong, count: longContextCount },
  ];

  const resetFilters = () => {
    setQuery(''); setProviderFilter('all'); setAccessFilter('all'); setUsageFilter('all'); setModalityFilter('all');
    setCategoryFilter('all'); setNoCardOnly(false); setNoPhoneOnly(false); setLongContextOnly(false); setVerifiedOnly(false); setSortOrder('recent');
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-12 pt-8 sm:px-6 lg:pt-10">
      <header className="max-w-4xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-300">{ar ? 'دليل موثّق بالمصادر الرسمية' : 'Official-source directory'}</p>
        <h1 className="font-heading text-3xl font-extrabold leading-tight text-white sm:text-4xl">{text.title}</h1>
        <p className="mt-4 text-base leading-7 text-slate-300">{text.intro}</p>
        <p className="mt-3 rounded-xl border border-slate-700 bg-slate-900/50 p-4 text-sm leading-6 text-slate-400">{text.scope}</p>
      </header>

      <section className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label={ar ? 'ملخص الدليل' : 'Directory summary'}>
        {[
          { label: text.models, value: modelCount }, { label: text.providers, value: providerCount },
          { label: text.noCard, value: confirmedNoCardCount }, { label: text.longContext, value: longContextCount },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="font-heading text-2xl font-extrabold text-white" dir="ltr">{stat.value}</div>
            <div className="mt-1 text-xs leading-5 text-slate-400 sm:text-sm">{stat.label}</div>
          </div>
        ))}
      </section>

      <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 sm:p-5" aria-labelledby="ai-model-filters">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="ai-model-filters" className="flex items-center gap-2 font-heading text-lg font-bold text-white"><Filter aria-hidden="true" className="h-4 w-4 text-emerald-300" />{ar ? 'البحث والفلاتر' : 'Search and filters'}</h2>
          <button type="button" onClick={resetFilters} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"><RotateCcw aria-hidden="true" className="h-4 w-4" />{text.reset}</button>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="relative sm:col-span-2">
            <span className="sr-only">{text.search}</span>
            <Search aria-hidden="true" className={`pointer-events-none absolute top-3.5 h-4 w-4 text-slate-500 ${ar ? 'right-3' : 'left-3'}`} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text.search} className={`min-h-11 w-full rounded-lg border border-slate-700 bg-slate-900 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-400 ${ar ? 'pr-10 pl-3' : 'pl-10 pr-3'}`} />
          </label>
          <label>
            <span className="sr-only">{text.provider}</span>
            <select value={providerFilter} onChange={(event) => setProviderFilter(event.target.value)} className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-200 focus:border-emerald-400">
              <option value="all">{text.provider}</option>{FREE_AI_MODEL_PROVIDERS.map((provider) => <option key={provider.id} value={provider.id}>{ar ? provider.nameAr : provider.name}</option>)}
            </select>
          </label>
          <label>
            <span className="sr-only">{text.access}</span>
            <select value={accessFilter} onChange={(event) => setAccessFilter(event.target.value as 'all' | AiModelAccessType)} className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-200 focus:border-emerald-400">
              <option value="all">{text.access}</option><option value="direct">{text.direct}</option><option value="gateway">{text.gateway}</option>
            </select>
          </label>
          <label>
            <span className="sr-only">{text.usage}</span>
            <select value={usageFilter} onChange={(event) => setUsageFilter(event.target.value as 'all' | AiModelCapability)} className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-200 focus:border-emerald-400">
              <option value="all">{text.usage}</option><option value="chat">{text.chat}</option><option value="coding">{text.coding}</option><option value="reasoning">{text.reasoning}</option><option value="vision">{text.vision}</option><option value="tool-calling">{ar ? 'استدعاء الأدوات' : 'Tool calling'}</option>
            </select>
          </label>
          <label>
            <span className="sr-only">{text.modality}</span>
            <select value={modalityFilter} onChange={(event) => setModalityFilter(event.target.value as 'all' | AiModelModality)} className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-200 focus:border-emerald-400">
              <option value="all">{text.modality}</option><option value="text">{text.text}</option><option value="image">{text.image}</option><option value="video">{text.video}</option><option value="audio">{text.audio}</option><option value="pdf">PDF</option>
            </select>
          </label>
          <label>
            <span className="sr-only">{text.sort}</span>
            <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)} className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-200 focus:border-emerald-400">
              <option value="recent">{text.recent}</option><option value="context">{text.contextSort}</option>
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-sm text-slate-300">
          {[
            { checked: noCardOnly, change: setNoCardOnly, label: text.noCardFilter },
            { checked: noPhoneOnly, change: setNoPhoneOnly, label: text.noPhoneFilter },
            { checked: longContextOnly, change: setLongContextOnly, label: text.longFilter },
            { checked: verifiedOnly, change: setVerifiedOnly, label: text.verified },
          ].map((filter) => (
            <label key={filter.label} className="inline-flex min-h-8 cursor-pointer items-center gap-2">
              <input type="checkbox" checked={filter.checked} onChange={(event) => filter.change(event.target.checked)} className="h-4 w-4 accent-emerald-400" />{filter.label}
            </label>
          ))}
        </div>
        <div className="mt-4 border-t border-slate-800 pt-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-300">{text.categories}</h3>
          <div className="flex flex-wrap gap-2">
            <button type="button" aria-pressed={categoryFilter === 'all'} onClick={() => setCategoryFilter('all')} className={`min-h-9 rounded-full border px-3 text-xs font-semibold ${categoryFilter === 'all' ? 'border-emerald-400 bg-emerald-400/10 text-emerald-200' : 'border-slate-700 text-slate-300 hover:border-slate-500'}`}>{text.all} · {modelCount}</button>
            {categoryButtons.map((category) => (
              <button type="button" key={category.id} aria-pressed={categoryFilter === category.id} onClick={() => setCategoryFilter(category.id)} className={`min-h-9 rounded-full border px-3 text-xs font-semibold ${categoryFilter === category.id ? 'border-emerald-400 bg-emerald-400/10 text-emerald-200' : 'border-slate-700 text-slate-300 hover:border-slate-500'}`}>
                {category.label} · {category.count}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="ai-model-results">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 id="ai-model-results" className="font-heading text-xl font-bold text-white">{ar ? 'النماذج' : 'Models'}</h2>
          <p className="text-sm text-slate-400"><span dir="ltr">{filteredEntries.length}</span> {text.results}</p>
        </div>
        {filteredEntries.length ? <div className="space-y-4">{filteredEntries.map((entry) => <ModelCard key={entry.id} entry={entry} lang={lang} />)}</div> : <p className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-center text-sm leading-6 text-slate-400">{categoryFilter !== 'all' && FREE_AI_MODEL_ENTRIES.filter((entry) => matchesCategory(entry, categoryFilter)).length === 0 ? text.emptyCategory : text.noResults}</p>}
      </section>

      <section className="mt-10" aria-labelledby="ai-model-providers">
        <h2 id="ai-model-providers" className="font-heading text-xl font-bold text-white">{text.providersTitle}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-400">{text.providerDesc}</p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {FREE_AI_MODEL_PROVIDERS.map((provider) => {
            const models = FREE_AI_MODEL_ENTRIES.filter((entry) => entry.providerId === provider.id);
            return (
              <article key={provider.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-heading text-lg font-bold text-white">{ar ? provider.nameAr : provider.name}</h3>
                  <span className="rounded-full border border-slate-700 px-2.5 py-1 text-xs text-slate-300">{accessLabel(provider.type, lang)}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">{provider.summary[lang]}</p>
                <p className="mt-3 text-sm text-slate-400">{text.listed}: <strong className="text-slate-100">{models.length}</strong></p>
                <p className="mt-1 text-sm text-slate-400">{text.best}: <span className="text-slate-200">{models.map((entry) => entry.name).join(', ') || '—'}</span></p>
                <div className="mt-3">{sourceLink(provider.officialUrl, text.providerSource)}</div>
              </article>
            );
          })}
        </div>
      </section>

      <aside className="mt-8 rounded-xl border border-amber-400/25 bg-amber-400/5 p-5" aria-labelledby="ai-model-disclaimer">
        <h2 id="ai-model-disclaimer" className="font-heading text-base font-bold text-amber-100">{text.disclaimerTitle}</h2>
        <p className="mt-2 text-sm leading-7 text-slate-300">{text.disclaimer}</p>
      </aside>

      <div className="mt-6 flex flex-col gap-2 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <p>{text.sourceNote}</p>
        <a href="/free-api-keys-directory" className="inline-flex min-h-10 items-center font-semibold text-emerald-300 underline underline-offset-4 hover:text-emerald-200">{text.apiLink}</a>
      </div>
    </main>
  );
}
