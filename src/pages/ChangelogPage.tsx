import { useMemo, useState, type MouseEvent } from 'react';
import { ArrowLeft, ArrowRight, Rss, Send, History, Clock, CheckCircle2, Archive } from 'lucide-react';
import type { Deal } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import {
  buildChangelogEntries,
  groupChangelogByDate,
  reviewHistoryDealHref,
  type ReviewHistoryEvent,
} from '@/lib/changelog';

interface ChangelogPageProps {
  deals: Deal[];
  telegramChannelUrl?: string;
  onOpenDeal?: (slug: string) => void;
  onBackToHome?: () => void;
}

const BADGE_STYLES: Record<
  ReviewHistoryEvent,
  { labelAr: string; labelEn: string; className: string; Icon: typeof CheckCircle2 }
> = {
  review: {
    labelAr: 'آخر مراجعة مسجّلة',
    labelEn: 'Latest recorded review',
    className: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
    Icon: CheckCircle2,
  },
  expired: {
    labelAr: 'انتهاء بموعد مسجّل',
    labelEn: 'Recorded expiry',
    className: 'border-slate-600 bg-slate-800 text-slate-300',
    Icon: Archive,
  },
};

export default function ChangelogPage({
  deals,
  telegramChannelUrl = 'https://t.me/amnabd_deals',
  onOpenDeal,
  onBackToHome,
}: ChangelogPageProps) {
  const { lang, dir } = useLanguage();
  const [activeTab, setActiveTab] = useState<'all' | ReviewHistoryEvent>('all');
  const ArrowIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const filterTabs: { value: 'all' | ReviewHistoryEvent; labelAr: string; labelEn: string }[] = [
    { value: 'all', labelAr: 'جميع السجلات', labelEn: 'All records' },
    { value: 'review', labelAr: 'آخر المراجعات', labelEn: 'Latest reviews' },
    { value: 'expired', labelAr: 'أحداث الانتهاء', labelEn: 'Expiry events' },
  ];
  const allEntries = useMemo(() => buildChangelogEntries(deals, lang), [deals, lang]);
  const filteredGroups = useMemo(() => groupChangelogByDate(
    activeTab === 'all' ? allEntries : allEntries.filter((entry) => entry.event === activeTab)
  ), [allEntries, activeTab]);

  const openDeal = (event: MouseEvent<HTMLAnchorElement>, slug: string) => {
    // Keep normal links (including copy/open in a new tab) while supporting SPA navigation.
    if (!onOpenDeal || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onOpenDeal(slug);
  };
  const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400';

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {onBackToHome && (
        <button
          type="button"
          onClick={onBackToHome}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-white"
        >
          <ArrowIcon className="h-4 w-4" />
          <span>{lang === 'ar' ? 'العودة للعروض الرئيسية' : 'Back to main catalog'}</span>
        </button>
      )}

      <header className="mb-8 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-950 to-slate-900/80 p-6 shadow-xl sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              <History className="h-3.5 w-3.5" />
              <span>{lang === 'ar' ? 'مراجعات ومواعيد مسجّلة' : 'Recorded reviews & deadlines'}</span>
            </div>
            <h1 className="font-heading mt-3 text-2xl font-extrabold text-white sm:text-3xl">
              {lang === 'ar' ? 'سجل مراجعات العروض' : 'Offer Review History'}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              {lang === 'ar'
                ? 'آخر مراجعة محفوظة لكل عرض، وأحداث انتهاء محسوبة من موعد الانتهاء المسجّل. لا يحتفظ السجل بنسخ سابقة لإظهار فروق الحقول، ولا تعني المراجعة أن الشروط تغيّرت.'
                : 'The latest saved review for each offer, plus expiry events calculated from recorded end dates. Previous field values are not stored here; a review does not mean the terms changed.'}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {lang === 'ar' ? 'تواريخ أحداث الانتهاء بتوقيت UTC.' : 'Expiry event dates use UTC.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {telegramChannelUrl && (
              <a href={telegramChannelUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/15 px-3.5 py-2 text-xs font-medium text-sky-300 transition hover:bg-sky-500/25">
                <Send className="h-3.5 w-3.5" />
                <span>{lang === 'ar' ? 'تنبيهات تيليغرام' : 'Telegram Alerts'}</span>
              </a>
            )}
            <a href="/feed.xml" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-medium text-slate-300 transition hover:border-emerald-500/50 hover:text-emerald-300">
              <Rss className="h-3.5 w-3.5 text-amber-400" />
              <span>{lang === 'ar' ? 'تغذية RSS' : 'RSS Feed'}</span>
            </a>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-800/80 pt-4">
          {filterTabs.map((tab) => {
            const isSelected = activeTab === tab.value;
            const count = tab.value === 'all' ? allEntries.length : allEntries.filter((entry) => entry.event === tab.value).length;
            return (
              <button key={tab.value} type="button" aria-pressed={isSelected} onClick={() => setActiveTab(tab.value)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                  isSelected ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300' : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                }`}>
                <span>{lang === 'ar' ? tab.labelAr : tab.labelEn}</span>
                <span className="rounded-full bg-slate-900/60 px-1.5 text-[10px] text-slate-400">{count}</span>
              </button>
            );
          })}
        </div>
      </header>

      {filteredGroups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 py-16 text-center text-sm text-slate-400">
          <Clock className="mx-auto mb-3 h-8 w-8 text-slate-600" />
          <p>{lang === 'ar' ? 'لا توجد سجلات ضمن هذا التصنيف حاليًا.' : 'No records in this category.'}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredGroups.map((group) => (
            <section key={group.date} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="font-heading flex items-center gap-2 text-sm font-bold text-slate-200 sm:text-base">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span>{lang === 'ar' ? 'سجلات ' : 'Records for '}<time dateTime={group.date}>{group.date}</time></span>
                </h2>
                <span className="text-xs text-slate-500">
                  {group.entries.length}{' '}{lang === 'ar' ? (group.entries.length === 1 ? 'سجل' : 'سجلات') : (group.entries.length === 1 ? 'record' : 'records')}
                </span>
              </div>
              <div className="divide-y divide-slate-800/70">
                {group.entries.map((entry) => {
                  const badge = BADGE_STYLES[entry.event];
                  const Icon = badge.Icon;
                  return (
                    <article key={entry.id} data-event={entry.event} className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-start">
                      <div className="min-w-0 space-y-2">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${badge.className}`}>
                          <Icon className="h-3 w-3" />
                          <span>{lang === 'ar' ? badge.labelAr : badge.labelEn}</span>
                        </span>
                        <h3 className="font-semibold text-slate-100">
                          <a href={reviewHistoryDealHref(entry.dealSlug, lang)} onClick={(event) => openDeal(event, entry.dealSlug)}
                            className={`transition hover:text-emerald-400 hover:underline ${focusRing}`}>
                            {entry.dealTitle}
                          </a>
                        </h3>
                        <p className="text-xs leading-relaxed text-slate-400">{entry.summary}</p>
                        {entry.reviewNote && (
                          <p className="text-sm leading-relaxed text-slate-300">
                            <span className="font-semibold">{lang === 'ar' ? 'ملاحظة المراجعة: ' : 'Review note: '}</span>{entry.reviewNote}
                          </p>
                        )}
                        {entry.timingNote && <p className="text-xs leading-relaxed text-amber-300">{entry.timingNote}</p>}
                      </div>
                      <a href={reviewHistoryDealHref(entry.dealSlug, lang)} onClick={(event) => openDeal(event, entry.dealSlug)}
                        aria-label={`${lang === 'ar' ? 'عرض تفاصيل' : 'View details for'} ${entry.dealTitle}`}
                        className={`shrink-0 self-start text-xs font-medium text-emerald-400 transition hover:text-emerald-300 hover:underline ${focusRing}`}>
                        {lang === 'ar' ? 'عرض التفاصيل ←' : 'View Details →'}
                      </a>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
