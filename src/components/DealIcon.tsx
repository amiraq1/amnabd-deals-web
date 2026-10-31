import { useState } from 'react';
import type { Deal } from '@/types';
import { getDealDisplayName } from '@/lib/dealMetadata';
import { offerInitial, offerTone } from '@/lib/offerPresentation';
import { selfHostedIconUrl } from '@/lib/selfHostedIcon';

interface DealIconProps {
  deal: Deal;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function DealIcon({
  deal,
  size = 'md',
  className = '',
}: DealIconProps) {
  const name = getDealDisplayName(deal);
  const safeIcon = selfHostedIconUrl(deal.icon_url, window.location.origin);
  const [failedIcon, setFailedIcon] = useState<string | null>(null);
  const sizes = {
    sm: 'h-9 w-9 text-base',
    md: 'h-12 w-12 text-xl',
    lg: 'h-14 w-14 text-2xl sm:h-16 sm:w-16',
  };
  if (safeIcon && failedIcon !== safeIcon) {
    return (
      <img
        key={safeIcon}
        src={safeIcon}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailedIcon(safeIcon)}
        className={`offer-icon shrink-0 rounded-xl border border-line object-contain bg-surface-raised ${sizes[size]} ${className}`}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`offer-monogram offer-tone-${offerTone(name)} flex shrink-0 items-center justify-center rounded-xl border font-bold ${sizes[size]} ${className}`}
    >
      <bdi>{offerInitial(name)}</bdi>
    </span>
  );
}
