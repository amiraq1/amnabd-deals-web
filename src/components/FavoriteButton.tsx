import { Heart } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { useLanguage } from '@/context/LanguageContext';

export interface FavoriteButtonProps {
  slug: string;
  dealName?: string;
  className?: string;
  iconClassName?: string;
  showText?: boolean;
}

export default function FavoriteButton({
  slug,
  dealName,
  className = '',
  iconClassName = 'h-4 w-4',
  showText = false,
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { lang } = useLanguage();
  const favorited = isFavorite(slug);

  const label =
    lang === 'ar'
      ? favorited
        ? 'إزالة من المفضلة'
        : 'أضف للمفضلة'
      : favorited
        ? 'Remove from favorites'
        : 'Add to favorites';

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(slug);
  };

  const stateColorClass = favorited
    ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
    : 'text-slate-400 hover:bg-slate-800 hover:text-rose-400';

  const defaultButtonClass = showText
    ? `inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400 ${
        favorited
          ? 'border-rose-500/50 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
          : 'border-slate-700 bg-slate-900/80 text-slate-300 hover:border-slate-600 hover:text-white'
      }`
    : `flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400 ${stateColorClass}`;

  const resolvedClass = className ? `${defaultButtonClass} ${className}` : defaultButtonClass;

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={favorited}
      aria-label={label}
      title={dealName ? `${dealName} — ${label}` : label}
      className={resolvedClass}
    >
      <Heart
        className={`${iconClassName} transition-transform duration-200 active:scale-90 ${
          favorited ? 'fill-rose-500 text-rose-500' : ''
        }`}
      />
      {showText && <span className="text-sm font-medium">{label}</span>}
    </button>
  );
}
