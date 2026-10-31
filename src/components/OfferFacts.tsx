import IsolatedText from '@/components/IsolatedText';
import { Wallet, CreditCard, Users, CalendarDays } from 'lucide-react';
import type { Deal, Lang } from '@/types';
import { recordedPrice, registrationDeadline } from '@/lib/cardFacts';
import { requirementLabel } from '@/lib/tristate';
import { eligibilitySummary } from '@/lib/offerPresentation';
export default function OfferFacts({ deal, lang }: { deal: Deal; lang: Lang }) {
  const facts = [
    { Icon: Wallet, text: recordedPrice(deal.pricing, lang) },
    {
      Icon: CreditCard,
      text: `${lang === 'ar' ? 'البطاقة' : 'Card'}: ${requirementLabel(deal.eligibility.card_required, lang)}`,
    },
    {
      Icon: Users,
      text: `${lang === 'ar' ? 'لمن' : 'Who'}: ${eligibilitySummary(deal, lang)}`,
    },
    {
      Icon: CalendarDays,
      text: registrationDeadline(deal.registration.deadline, lang),
    },
  ];
  return (
    <ul className="offer-facts space-y-2.5 text-sm leading-relaxed text-ink-secondary">
      {facts.map(({ Icon, text }, index) => (
        <li key={index} className="flex min-w-0 items-start gap-2.5">
          <Icon
            aria-hidden="true"
            className="mt-1 h-4 w-4 shrink-0 text-ink-muted"
          />
          <bdi className="min-w-0 [overflow-wrap:anywhere]">
            <IsolatedText text={text} />
          </bdi>
        </li>
      ))}
    </ul>
  );
}
