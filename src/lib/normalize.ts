export function normalizeArabic(text: string): string {
  return text
    .replace(/[\u0640\p{M}]/gu, '')
    .replace(/[\u0622\u0623\u0625\u0627]/g, '\u0627')
    .replace(/\u0649/g, '\u064A')
    .replace(/\u0629/g, '\u0647')
    .replace(/\u0624/g, '\u0648')
    .replace(/\u0626/g, '\u064A')
    .toLowerCase();
}

export function matchesQuery(haystack: string, query: string): boolean {
  return normalizeArabic(haystack).includes(normalizeArabic(query));
}
