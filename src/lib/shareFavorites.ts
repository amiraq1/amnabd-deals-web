import type { Deal } from '@/types';
import { getDealDisplayName } from './dealMetadata.js';

const DEFAULT_ORIGIN =
  typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'https://amnabd.com';

export function buildSharedFavoritesUrl(
  slugs: Iterable<string>,
  baseOrigin = DEFAULT_ORIGIN
): string {
  const cleanSlugs = Array.from(slugs)
    .map((s) => s.trim())
    .filter((s) => /^[a-zA-Z0-9_\-\u0600-\u06FF]+$/i.test(s));

  const origin = baseOrigin.replace(/\/+$/, '');
  if (cleanSlugs.length === 0) return `${origin}/`;
  return `${origin}/?list=${encodeURIComponent(cleanSlugs.join(','))}`;
}

export function parseSharedListParam(search: string): string[] {
  if (!search) return [];
  const cleanSearch = search.startsWith('?') ? search.slice(1) : search;
  const params = new URLSearchParams(cleanSearch);
  const raw = params.get('list');
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => /^[a-zA-Z0-9_\-\u0600-\u06FF]+$/i.test(s));
}

export function formatFavoritesAsText(
  deals: Deal[],
  savedSlugs: Set<string> | string[],
  baseOrigin = DEFAULT_ORIGIN
): string {
  const set = savedSlugs instanceof Set ? savedSlugs : new Set(savedSlugs);
  const selected = deals.filter((d) => set.has(d.slug));
  if (selected.length === 0) return '';

  const origin = baseOrigin.replace(/\/+$/, '');
  const lines = selected.map((d, idx) => {
    const name = getDealDisplayName(d);
    const val = d.headline_value ? ` (${d.headline_value})` : '';
    return `${idx + 1}. ${name}${val}\n   ${origin}/deal/${encodeURIComponent(d.slug)}`;
  });

  const shareUrl = buildSharedFavoritesUrl(set, origin);
  return `قائمتي المختارة لعروض وأرصدة الذكاء الاصطناعي المجانية الموثّقة:\n\n${lines.join(
    '\n\n'
  )}\n\nرابط القائمة الكاملة:\n${shareUrl}`;
}
