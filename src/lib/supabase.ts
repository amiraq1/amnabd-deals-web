import { PostgrestClient } from '@supabase/postgrest-js';
import { publicSupabaseConfig } from './environment';
import { ResourceError } from './resource';
import { networkOnlyFetch } from './network.js';

let client: PostgrestClient | null = null;

// Public, read-only directory: use the PostgREST client already present in the
// Supabase dependency tree, not Auth/Realtime. The full SDK's Auth module reads
// localStorage at import time, even when auth persistence is disabled.
export function getSupabase() {
  if (client) return client;
  const config = publicSupabaseConfig(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    import.meta.env.DEV
  );
  if (!config.ok) throw new ResourceError('configuration');
  const headers: Record<string, string> = { apikey: config.key };
  // Legacy anon JWTs also act as the anonymous bearer. Publishable API keys are
  // not JWTs; the gateway supplies anonymous access when no user bearer exists.
  if (!config.key.startsWith('sb_publishable_')) headers.Authorization = `Bearer ${config.key}`;
  client = new PostgrestClient(`${config.url.replace(/\/$/, '')}/rest/v1`, {
    headers,
    fetch: networkOnlyFetch,
  });
  return client;
}
