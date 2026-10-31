import { Cloud, Code2, Palette, BookOpen, Cpu, Tag } from 'lucide-react';
import type { Lang } from '@/types';
import { categoryLabel } from '@/lib/discovery';
import { categoryDecoration } from '@/lib/offerPresentation';
const icons = {
  cloud: Cloud,
  code: Code2,
  design: Palette,
  education: BookOpen,
  ai: Cpu,
  neutral: Tag,
};
export default function CategoryBadge({
  value,
  lang,
}: {
  value: string;
  lang: Lang;
}) {
  const decoration = categoryDecoration(value);
  const Icon = icons[decoration];
  return (
    <span
      className={`category-badge category-${decoration} inline-flex min-w-0 max-w-full items-start gap-1.5 text-sm leading-relaxed`}
    >
      <Icon aria-hidden="true" className="mt-1 h-3.5 w-3.5 shrink-0" />
      <bdi className="line-clamp-2 [overflow-wrap:anywhere]">
        {categoryLabel(value, lang)}
      </bdi>
    </span>
  );
}
