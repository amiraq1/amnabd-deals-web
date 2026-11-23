import IsolatedText from '@/components/IsolatedText';
import type { Deal, Lang } from '@/types';
import { recordedPrice, registrationDeadline } from '@/lib/cardFacts';
import { requirementLabel } from '@/lib/tristate';
import { eligibilitySummary } from '@/lib/offerPresentation';

export default function OfferFacts({ deal, lang }: { deal: Deal; lang: Lang }) {
  const isAr = lang === 'ar';
  const price = recordedPrice(deal.pricing, lang);
  const cardRequirement = `${isAr ? 'البطاقة' : 'Card'}: ${requirementLabel(deal.eligibility.card_required, lang)}`;
  const eligibility = `${isAr ? 'لمن' : 'Who'}: ${eligibilitySummary(deal, lang)}`;
  const deadline = registrationDeadline(deal.registration.deadline, lang);

  const facts = [
    { label: isAr ? 'السعر' : 'Price', text: price },
    { label: isAr ? 'البطاقة' : 'Card', text: cardRequirement },
    { label: isAr ? 'الأهلية' : 'Eligibility', text: eligibility },
    { label: isAr ? 'الموعد' : 'Deadline', text: deadline },
  ];

  return (
    <ul className="offer-facts grid grid-cols-1 gap-1.5 text-xs text-ink-secondary sm:grid-cols-2">
      {facts.map(({ text }, index) => (
        <li
          key={index}
          className="flex min-w-0 items-center gap-1.5 rounded-md border border-[#1E1E1C] bg-[#0E0E0D]/60 px-2.5 py-1.5 tabular-nums"
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-stone-500" aria-hidden="true" />
          <bdi className="min-w-0 truncate [overflow-wrap:anywhere]">
            <IsolatedText text={text} />
          </bdi>
        </li>
      ))}
    </ul>
  );
}
