import { useMemo } from 'react';
import { Heart, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import type { Deal } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { useFavorites } from '@/hooks/useFavorites';
import DealCard from '@/components/DealCard';
import ScrollToTop from '@/components/ScrollToTop';

interface FavoritesPageProps {
  deals: Deal[];
  onOpenDeal: (slug: string) => void;
  onBackToHome: () => void;
}

export default function FavoritesPage({
  deals,
  onOpenDeal,
  onBackToHome,
}: FavoritesPageProps) {
  const { lang, dir } = useLanguage();
  const { favorites } = useFavorites();

  // Match stored slugs with current deals; silently ignore missing slugs without modifying storage
  const favoriteDeals = useMemo(() => {
    const dealMap = new Map(deals.map((d) => [d.slug, d]));
    return favorites
      .map((slug) => dealMap.get(slug))
      .filter((deal): deal is Deal => Boolean(deal));
  }, [favorites, deals]);

  const ArrowIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-white"
          >
            <ArrowIcon className="h-4 w-4" />
            <span>{lang === 'ar' ? 'كل العروض' : 'All deals'}</span>
          </button>
          <h1 className="font-heading mt-3 text-3xl font-extrabold text-white">
            {lang === 'ar' ? 'مفضلتي' : 'My Favorites'}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {lang === 'ar'
              ? 'العروض المحفوظة محلياً في هذا المتصفح'
              : 'Deals saved locally in this browser'}
          </p>
        </div>

        {favoriteDeals.length > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3.5 py-1.5 text-xs font-semibold text-rose-300">
            <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
            <span>
              {favoriteDeals.length}{' '}
              {lang === 'ar'
                ? favoriteDeals.length === 1
                  ? 'عرض'
                  : favoriteDeals.length === 2
                    ? 'عرضان'
                    : 'عروض'
                : favoriteDeals.length === 1
                  ? 'deal'
                  : 'deals'}
            </span>
          </span>
        )}
      </div>

      {favoriteDeals.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40 px-6 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 shadow-inner">
            <Heart className="h-8 w-8 stroke-[1.5]" />
          </div>
          <h2 className="mt-5 text-xl font-bold text-white">
            {lang === 'ar' ? 'لا توجد عروض محفوظة بعد' : 'No saved deals yet'}
          </h2>
          <p className="mt-2 max-w-md text-sm text-slate-400">
            {lang === 'ar'
              ? 'اضغط على رمز القلب في أي بطاقة عرض لحفظها هنا والرجوع إليها بسهولة في أي وقت.'
              : 'Click the heart icon on any deal card to save it here for easy access anytime.'}
          </p>
          <button
            type="button"
            onClick={onBackToHome}
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-950/40 transition-all hover:bg-emerald-400 active:scale-95"
          >
            <Sparkles className="h-4 w-4" />
            <span>{lang === 'ar' ? 'استكشف العروض' : 'Browse deals'}</span>
          </button>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {favoriteDeals.map((deal, index) => (
            <DealCard
              key={deal.id}
              deal={deal}
              onOpen={onOpenDeal}
              index={index}
            />
          ))}
        </div>
      )}

      <ScrollToTop />
    </main>
  );
}
