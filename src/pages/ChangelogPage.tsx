import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Rss, Send, Sparkles, Clock, CheckCircle2, AlertTriangle, Archive } from 'lucide-react';
import type { Deal } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import {
  buildChangelogEntries,
  groupChangelogByDate,
  type ChangelogEventType,
} from '@/lib/changelog';

interface ChangelogPageProps {
  deals: Deal[];
  telegramChannelUrl?: string;
  onOpenDeal?: (slug: string) => void;
  onBackToHome?: () => void;
}

const BADGE_STYLES: Record<
  ChangelogEventType,
  { labelAr: string; labelEn: string; className: string; Icon: typeof CheckCircle2 }
> = {
  verified: {
    labelAr: '✓ مُراجَع ومؤكَّد',
    labelEn: '✓ Verified & Active',
    className: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
    Icon: CheckCircle2,
  },
  active: {
    labelAr: 'نشط',
    labelEn: 'Active',
    className: 'border-slate-600 bg-slate-800/60 text-slate-300',
    Icon: CheckCircle2,
  },
  ending_soon: {
    labelAr: '⏳ ينتهي قريبًا',
    labelEn: '⏳ Ending Soon',
    className: 'border-amber-500/40 bg-amber-500/15 text-amber-300',
    Icon: AlertTriangle,
  },
  expired: {
    labelAr: 'انتهى العرض',
    labelEn: 'Expired',
    className: 'border-slate-600 bg-slate-800 text-slate-400',
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
  const [activeTab, setActiveTab] = useState<'all' | ChangelogEventType>('all');

  const ArrowIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  const filterTabs: { value: 'all' | ChangelogEventType; labelAr: string; labelEn: string }[] = [
    { value: 'all', labelAr: 'جميع التحديثات', labelEn: 'All Updates' },
    { value: 'verified', labelAr: 'عروض مؤكّدة', labelEn: 'Verified' },
    { value: 'active', labelAr: 'نشطة', labelEn: 'Active' },
    { value: 'ending_soon', labelAr: 'تنتهي قريبًا', labelEn: 'Ending Soon' },
    { value: 'expired', labelAr: 'انتهت مؤخرًا', labelEn: 'Recently Expired' },
  ];

  const allEntries = useMemo(() => buildChangelogEntries(deals), [deals]);

  const filteredGroups = useMemo(() => {
    const filtered =
      activeTab === 'all'
        ? allEntries
        : allEntries.filter((e) => e.type === activeTab);
    return groupChangelogByDate(filtered);
  }, [allEntries, activeTab]);

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
              <Sparkles className="h-3.5 w-3.5" />
              <span>{lang === 'ar' ? 'سجل المراجعات' : 'Review Log'}</span>
            </div>
            <h1 className="font-heading mt-3 text-2xl font-extrabold text-white sm:text-3xl">
              {lang === 'ar'
                ? 'سجل التغييرات وتحديثات العروض'
                : 'Deals Changelog & Updates'}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              {lang === 'ar'
                ? 'متابعة دورية للعروض المضافة، عرض الشروط من مصادرها، وتنبيهات التفعيل قبل انتهاء الصلاحية.'
                : 'Continuous tracking of AI perks, official terms updates, and urgent deadline warnings.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {telegramChannelUrl && (
              <a
                href={telegramChannelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/15 px-3.5 py-2 text-xs font-medium text-sky-300 transition hover:bg-sky-500/25"
                title={lang === 'ar' ? 'اشترك في قناة تيليغرام' : 'Subscribe to Telegram channel'}
              >
                <Send className="h-3.5 w-3.5" />
                <span>{lang === 'ar' ? 'تنبيهات تيليغرام' : 'Telegram Alerts'}</span>
              </a>
            )}
            <a
              href="/feed.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-medium text-slate-300 transition hover:border-emerald-500/50 hover:text-emerald-300"
              title={lang === 'ar' ? 'تغذية RSS للأخبار' : 'RSS Feed'}
            >
              <Rss className="h-3.5 w-3.5 text-amber-400" />
              <span>{lang === 'ar' ? 'تغذية RSS' : 'RSS Feed'}</span>
            </a>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-800/80 pt-4">
          {filterTabs.map((tab) => {
            const isSelected = activeTab === tab.value;
            const count =
              tab.value === 'all'
                ? allEntries.length
                : allEntries.filter((e) => e.type === tab.value).length;
            return (
              <button
                key={tab.value}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setActiveTab(tab.value)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                    : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                }`}
              >
                <span>{lang === 'ar' ? tab.labelAr : tab.labelEn}</span>
                <span className="rounded-full bg-slate-900/60 px-1.5 py-0.2 text-[10px] text-slate-400">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {filteredGroups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 py-16 text-center text-sm text-slate-400">
          <Clock className="mx-auto mb-3 h-8 w-8 text-slate-600" />
          <p>{lang === 'ar' ? 'لا توجد تحديثات مسجلة ضمن هذا التصنيف حالياً.' : 'No updates found in this category.'}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredGroups.map((group) => (
            <section
              key={group.date}
              className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-sm sm:p-6"
            >
              <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="font-heading flex items-center gap-2 text-sm font-bold text-slate-200 sm:text-base">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span>
                    {lang === 'ar' ? `تحديثات ${group.date}` : `Updates on ${group.date}`}
                  </span>
                </h2>
                <span className="text-xs text-slate-500">
                  {group.entries.length}{' '}
                  {lang === 'ar'
                    ? group.entries.length === 1
                      ? 'تحديث'
                      : 'تحديثات'
                    : group.entries.length === 1
                      ? 'update'
                      : 'updates'}
                </span>
              </div>

              <div className="divide-y divide-slate-800/70">
                {group.entries.map((entry) => {
                  const badge = BADGE_STYLES[entry.type];
                  const Icon = badge.Icon;
                  return (
                    <article
                      key={entry.id}
                      className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${badge.className}`}
                          >
                            <Icon className="h-3 w-3" />
                            <span>{lang === 'ar' ? badge.labelAr : badge.labelEn}</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              if (onOpenDeal) onOpenDeal(entry.dealSlug);
                              else window.location.href = `/deal/${entry.dealSlug}`;
                            }}
                            className="text-start font-semibold text-slate-100 transition hover:text-emerald-400"
                          >
                            {entry.dealTitle}
                          </button>

                          {entry.headlineValue && (
                            <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                              {entry.headlineValue}
                            </span>
                          )}
                        </div>
                        <p className="text-xs leading-relaxed text-slate-400">{entry.summary}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenDeal) onOpenDeal(entry.dealSlug);
                          else window.location.href = `/deal/${entry.dealSlug}`;
                        }}
                        className="self-start text-xs font-medium text-emerald-400 transition hover:text-emerald-300 hover:underline sm:self-center"
                      >
                        {lang === 'ar' ? 'عرض التفاصيل ←' : 'View Details →'}
                      </button>
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
