import { isValidSlug } from './routes.js';
import { MAX_SAVED_DEALS } from './savedDeals.js';

export const FAVORITES_TRANSFER_MAX_BYTES = 100_000;
export function exportFavorites(slugs: readonly string[]): string {
  const unique = [...new Set(slugs)];
  // Never silently truncate legacy data or create a file this importer rejects.
  if (unique.length > MAX_SAVED_DEALS || !unique.every(isValidSlug)) throw new Error('invalid_list');
  const json = JSON.stringify({ version: 1, slugs: unique }, null, 2);
  if (new TextEncoder().encode(json).length > FAVORITES_TRANSFER_MAX_BYTES) throw new Error('file_too_large');
  return json;
}
// Validate the entire import before writing. Merge rather than overwrite, and
// keep unrecognized-but-valid slugs so a temporarily unavailable deal survives.
export function importFavorites(text: string, current: readonly string[]): { slugs: string[]; added: number; skipped: number } {
  if (new TextEncoder().encode(text).length > FAVORITES_TRANSFER_MAX_BYTES) throw new Error('file_too_large');
  const parsed: unknown = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('invalid_file');
  const obj = parsed as { version?: unknown; slugs?: unknown };
  if (obj.version !== 1 || !Array.isArray(obj.slugs) || obj.slugs.length > MAX_SAVED_DEALS ||
      !obj.slugs.every((slug: unknown) => typeof slug === 'string' && isValidSlug(slug))) throw new Error('invalid_file');
  const existing = [...new Set(current)];
  const additions = [...new Set(obj.slugs as string[])].filter((slug) => !existing.includes(slug));
  const accepted = additions.slice(0, Math.max(0, MAX_SAVED_DEALS - existing.length));
  return { slugs: [...existing, ...accepted], added: accepted.length, skipped: additions.length - accepted.length };
}
