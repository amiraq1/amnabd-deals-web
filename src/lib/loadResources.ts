import { getSupabase } from './supabase';
import { ResourceError } from './resource';
import { validateConfig, validateDeals, validateGuides } from './validate';

function diagnostic(rejectedRows: number, normalizedFields: number) {
  if (rejectedRows || normalizedFields)
    console.warn('[data] validation_summary', { rejectedRows, normalizedFields });
}

export async function loadDeals(signal: AbortSignal) {
  const response = await getSupabase().from('deals').select('*').order('id').abortSignal(signal);
  if (response.error) throw new ResourceError('network');
  const result = validateDeals(response.data);
  diagnostic(result.rejectedRows, result.normalizedFields);
  if (result.invalidCollection || (result.rejectedRows > 0 && result.values.length === 0))
    throw new ResourceError('invalid');
  return { value: result.values, omitted: result.rejectedRows };
}

export async function loadGuides(signal: AbortSignal) {
  const response = await getSupabase()
    .from('usage_guides')
    .select('*')
    .order('slug')
    .abortSignal(signal);
  if (response.error) throw new ResourceError('network');
  const result = validateGuides(response.data);
  diagnostic(result.rejectedRows, result.normalizedFields);
  if (result.invalidCollection || (result.rejectedRows > 0 && result.values.length === 0))
    throw new ResourceError('invalid');
  return { value: result.values, omitted: result.rejectedRows };
}

export async function loadConfig(signal: AbortSignal) {
  const response = await getSupabase()
    .from('site_config')
    .select('*')
    .eq('id', 'main')
    .abortSignal(signal)
    .maybeSingle();
  if (response.error) throw new ResourceError('network');
  const result = validateConfig(response.data);
  diagnostic(result.rejectedRows, result.normalizedFields);
  if (result.rejectedRows) throw new ResourceError('invalid');
  return { value: result.value, omitted: 0 };
}
