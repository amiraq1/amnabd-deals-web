// Comprehensive normalization preserving protected technical symbols and Arabic forms.

const PROTECTED_SYMBOLS = new Set(['c++', 'c#', '.net']);
const TOKEN_PATTERN = /c\+\+|c#|\.net|[\p{L}\p{N}]+(?:[-.][\p{L}\p{N}]+)*/giu;

export function normalizeArabic(text: string): string {
  if (typeof text !== 'string') return '';
  return text
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    // Persian (Extended Arabic-Indic) digits ۰-۹, same treatment as ٠-٩.
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[\u0640\p{M}]/gu, '')
    .replace(/[\u0622\u0623\u0625\u0627]/g, '\u0627')
    .replace(/\u0649/g, '\u064A')
    .replace(/\u0629/g, '\u0647')
    .replace(/\u0624/g, '\u0648')
    .replace(/\u0626/g, '\u064A')
    // Persian letterforms produced by some keyboards: ک (U+06A9), ی (U+06CC).
    .replace(/\u06A9/g, '\u0643')
    .replace(/\u06CC/g, '\u064A')
    .toLowerCase()
    .replace(/\s+/gu, ' ')
    .trim();
}

export function extractTokens(query: string): string[] {
  if (typeof query !== 'string') return [];
  const normalized = normalizeArabic(query);
  const matches = normalized.match(TOKEN_PATTERN);
  if (!matches) return [];
  return matches.map((m) => m.trim()).filter(Boolean);
}

export function tokenVariants(token: string): string[] {
  const t = token.toLowerCase().trim();
  if (!t) return [];
  if (PROTECTED_SYMBOLS.has(t)) return [t];
  const variants = [t];
  if (/[\p{L}\p{N}][-.][\p{L}\p{N}]/u.test(t)) {
    const compact = t.replace(/[-.]/g, '');
    if (compact && compact !== t) variants.push(compact);
  }
  return variants;
}

export function expandTextWithVariants(text: string): string {
  if (typeof text !== 'string' || !text.trim()) return '';
  const normalized = normalizeArabic(text);
  const tokens = extractTokens(normalized);
  const variants = tokens.flatMap(tokenVariants);
  return `${normalized} ${variants.join(' ')}`;
}

export function compileQuery(query: string): string[][] {
  return extractTokens(query).map(tokenVariants);
}

/**
 * AMN-007 — matching policy C from `docs/search-matching-policy.md`.
 *
 * A token matches when it starts a word: at a boundary (`^` or a non-word
 * character) or as the prefix of a longer word. Substring matching let the
 * query `ai` match inside `paid`; starting-at-a-word keeps prefix search, which
 * Arabic users rely on, and drops the accidental mid-word hits.
 *
 * Deliberate consequences, both asserted in `tests/search-matching.test.mjs`:
 *   - `ai` no longer matches `openai` (not a boundary, not a prefix)
 *   - `ai` still matches `ai`, `aim`, `airtable`
 *
 * Arabic proclitics are allowed in front of the token, so `ذكاء` still finds
 * `الذكاء`, `بالذكاء`, `والذكاء` and `للذكاء`. Only the definite-article family
 * is stripped; bare single-letter prefixes are not, because `ب` + `رمجة` would
 * invent a stem that is not in the language.
 */
const ARABIC_CLITIC = '(?:(?:[وفبكل])?ال|لل)?';
const matcherCache = new Map<string, RegExp>();

function wordStartMatcher(token: string): RegExp {
  const cached = matcherCache.get(token);
  if (cached) return cached;
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(?:^|[^\\p{L}\\p{N}])${ARABIC_CLITIC}${escaped}`, 'u');
  if (matcherCache.size > 200) matcherCache.clear();
  matcherCache.set(token, pattern);
  return pattern;
}

export function matchesToken(corpus: string, token: string): boolean {
  if (!corpus || !token) return false;
  return wordStartMatcher(token).test(corpus);
}

export function matchesQuery(haystack: string, query: string): boolean {
  if (!query || !query.trim()) return true;
  const groups = compileQuery(query);
  const expandedHaystack = expandTextWithVariants(haystack);
  return groups.every((variants) => variants.some((v) => matchesToken(expandedHaystack, v)));
}
