// Comprehensive normalization preserving protected technical symbols and Arabic forms.

const PROTECTED_SYMBOLS = new Set(['c++', 'c#', '.net']);
const TOKEN_PATTERN = /c\+\+|c#|\.net|[\p{L}\p{N}]+(?:[-.][\p{L}\p{N}]+)*/giu;

export function normalizeArabic(text: string): string {
  if (typeof text !== 'string') return '';
  return text
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u0640\p{M}]/gu, '')
    .replace(/[\u0622\u0623\u0625\u0627]/g, '\u0627')
    .replace(/\u0649/g, '\u064A')
    .replace(/\u0629/g, '\u0647')
    .replace(/\u0624/g, '\u0648')
    .replace(/\u0626/g, '\u064A')
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
  const compacts: string[] = [];
  for (const tok of tokens) {
    if (!PROTECTED_SYMBOLS.has(tok) && /[\p{L}\p{N}][-.][\p{L}\p{N}]/u.test(tok)) {
      const compact = tok.replace(/[-.]/g, '');
      if (compact && compact !== tok) compacts.push(compact);
    }
  }
  return compacts.length > 0 ? `${normalized} ${compacts.join(' ')}` : normalized;
}

export function matchesQuery(haystack: string, query: string): boolean {
  if (!query || !query.trim()) return true;
  const tokens = extractTokens(query);
  if (tokens.length === 0) return true;
  const expandedHaystack = expandTextWithVariants(haystack);
  return tokens.every((tok) => {
    const variants = tokenVariants(tok);
    return variants.some((v) => expandedHaystack.includes(v));
  });
}
