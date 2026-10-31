import { isSafeUrl } from './safeUrl.js';

// Presentation-only policy: stored local paths or same-origin HTTPS URLs.
// URL safety alone does not establish that an external provider is trusted.
export function selfHostedIconUrl(
  input: string | undefined,
  origin: string,
): string | null {
  const value = input?.trim();
  if (
    !value ||
    [...value].some(
      (character) =>
        character === '\\' ||
        character.charCodeAt(0) <= 0x20 ||
        character.charCodeAt(0) === 0x7f,
    ) ||
    value.startsWith('//') ||
    value.startsWith('?') ||
    value.startsWith('#')
  )
    return null;

  try {
    const site = new URL(origin);
    if (!['https:', 'http:'].includes(site.protocol)) return null;
    const absolute = /^[a-z][a-z\d+.-]*:/i.test(value);
    if (absolute && !isSafeUrl(value)) return null;
    const icon = new URL(value, `${site.origin}/`);
    if (icon.origin !== site.origin || icon.username || icon.password)
      return null;
    // Relative paths stay local, including HTTP localhost during development.
    // Absolute HTTP URLs are never accepted, even on the same host.
    return icon.href;
  } catch {
    return null;
  }
}
