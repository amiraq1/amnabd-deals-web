import { getSupabase } from './supabase';
import { ResourceError } from './resource';
import { validateConfig, validateDeals, validateGuides } from './validate';

const DEAL_COLUMNS = [
  'id',
  'slug',
  'name_ar',
  'name_en',
  'description_ar',
  'description_en',
  'category',
  'benefits',
  'eligibility',
  'pricing',
  'registration',
  'official_sources',
  'get_offer',
  'review',
  'created_at',
  'icon_url',
  'status',
  'ends_at',
].join(',');
const GUIDE_COLUMNS = ['slug', 'sections'].join(',');
const CONFIG_COLUMNS = ['id', 'overview', 'section_labels', 'last_reviewed'].join(',');

function diagnostic(rejectedRows: number, normalizedFields: number) {
  if (rejectedRows || normalizedFields)
    console.warn('[data] validation_summary', { rejectedRows, normalizedFields });
}

export async function loadDeals(signal: AbortSignal) {
  const response = await getSupabase()
    .from('deals')
    .select(DEAL_COLUMNS)
    .order('created_at', { ascending: false, nullsFirst: false })
    .order('id', { ascending: true })
    .abortSignal(signal);
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
    .select(GUIDE_COLUMNS)
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
    .select(CONFIG_COLUMNS)
    .eq('id', 'main')
    .abortSignal(signal)
    .maybeSingle();
  if (response.error) throw new ResourceError('network');
  const result = validateConfig(response.data);
  diagnostic(result.rejectedRows, result.normalizedFields);
  if (result.rejectedRows) throw new ResourceError('invalid');
  return { value: result.value, omitted: 0 };
}
