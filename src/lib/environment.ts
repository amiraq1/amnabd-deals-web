export type PublicConfigResult =
  | { ok: true; url: string; key: string }
  | {
      ok: false;
      reason: 'missing_url' | 'invalid_url' | 'missing_key' | 'private_key' | 'invalid_public_key';
    };

// Shape/role validation only. This does not verify JWT signatures or access to
// the project. Diagnostics must use reason only, never include url/key values.
export function publicSupabaseConfig(
  rawUrl: unknown,
  rawKey: unknown,
  allowLocalHttp = false
): PublicConfigResult {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) return { ok: false, reason: 'missing_url' };
  const url = rawUrl.trim();
  try {
    const parsed = new URL(url);
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
    if (
      (parsed.protocol !== 'https:' && !(allowLocalHttp && local && parsed.protocol === 'http:')) ||
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash ||
      url.includes('?') ||
      url.includes('#')
    )
      return { ok: false, reason: 'invalid_url' };
  } catch {
    return { ok: false, reason: 'invalid_url' };
  }
  if (typeof rawKey !== 'string' || !rawKey.trim()) return { ok: false, reason: 'missing_key' };
  const key = rawKey.trim();
  if (key.startsWith('sb_secret_')) return { ok: false, reason: 'private_key' };
  if (/^sb_publishable_[A-Za-z0-9_-]{16,}$/.test(key)) return { ok: true, url, key };
  const parts = key.split('.');
  if (parts.length === 3 && parts.every((part) => /^[A-Za-z0-9_-]+$/.test(part))) {
    try {
      const encoded = parts[1]?.replace(/-/g, '+').replace(/_/g, '/') ?? '';
      const payload: unknown = JSON.parse(
        atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '='))
      );
      if (payload !== null && typeof payload === 'object' && 'role' in payload) {
        if (payload.role === 'service_role') return { ok: false, reason: 'private_key' };
        if (payload.role === 'anon') return { ok: true, url, key };
      }
    } catch {
      /* Unparseable keys are not treated as public keys. */
    }
  }
  return { ok: false, reason: 'invalid_public_key' };
}
