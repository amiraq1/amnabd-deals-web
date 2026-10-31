import type { Deal } from '@/types';
import { getDealDisplayName } from '@/lib/dealMetadata';
import { offerInitial, offerTone } from '@/lib/offerPresentation';

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
  const sizes = {
    sm: 'h-9 w-9 text-base',
    md: 'h-12 w-12 text-xl',
    lg: 'h-14 w-14 text-2xl sm:h-16 sm:w-16',
  };
  return (
    <span
      aria-hidden="true"
      className={`offer-monogram offer-tone-${offerTone(name)} flex shrink-0 items-center justify-center rounded-xl border font-bold ${sizes[size]} ${className}`}
    >
      <bdi>{offerInitial(name)}</bdi>
    </span>
  );
}
