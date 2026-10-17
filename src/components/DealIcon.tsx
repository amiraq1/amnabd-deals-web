import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { Deal } from '@/types';
import { getDealDisplayName, getDealIconSources } from '@/lib/dealMetadata';

interface DealIconProps {
  deal: Deal;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function DealIcon({ deal, size = 'md', className = '' }: DealIconProps) {
  const sources = getDealIconSources(deal);
  const displayName = getDealDisplayName(deal);

  const [currentSrc, setCurrentSrc] = useState(sources.primary);
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    setCurrentSrc(sources.primary);
    setHasFailed(false);
  }, [sources.primary, sources.fallback]);

  const handleError = () => {
    if (currentSrc === sources.primary && sources.fallback && sources.primary !== sources.fallback) {
      setCurrentSrc(sources.fallback);
    } else {
      setHasFailed(true);
    }
  };

  const sizeClasses =
    size === 'sm'
      ? 'h-7 w-7 rounded-lg p-1'
      : size === 'lg'
        ? 'h-14 w-14 rounded-2xl p-2.5 sm:h-16 sm:w-16 sm:p-3'
        : 'h-10 w-10 rounded-xl p-2';

  const iconSizes =
    size === 'sm'
      ? 'h-3.5 w-3.5'
      : size === 'lg'
        ? 'h-7 w-7 sm:h-8 sm:w-8'
        : 'h-5 w-5';

  return (
    <div
      className={`flex shrink-0 items-center justify-center border border-slate-800 bg-slate-950/80 shadow-md shadow-black/40 transition-all duration-300 group-hover:border-emerald-500/40 group-hover:bg-slate-900 ${sizeClasses} ${className}`}
      title={displayName}
    >
      {hasFailed ? (
        <Sparkles className={`${iconSizes} text-emerald-400`} />
      ) : (
        <img
          src={currentSrc}
          alt={displayName}
          loading="lazy"
          onError={handleError}
          className="h-full w-full object-contain"
        />
      )}
    </div>
  );
}
