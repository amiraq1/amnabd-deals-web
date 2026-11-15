import { FREE_AI_MODEL_PROVIDERS, type AiModelAccessType, type AiModelCapability, type AiModelModality } from '../content/freeAiModelsDirectory.js';
import { cleanQuery } from './filterState.js';

export type ModelCategoryFilter = 'all' | AiModelCapability | 'no-card' | 'long-context';
export type ModelSortOrder = 'recent' | 'context';
export interface ModelFilters {
  query: string; providerFilter: string; accessFilter: 'all' | AiModelAccessType;
  usageFilter: 'all' | AiModelCapability; modalityFilter: 'all' | AiModelModality;
  categoryFilter: ModelCategoryFilter; noCardOnly: boolean; noPhoneOnly: boolean;
  longContextOnly: boolean; verifiedOnly: boolean; sortOrder: ModelSortOrder;
}
export const DEFAULT_MODEL_FILTERS: Readonly<ModelFilters> = Object.freeze({
  query: '', providerFilter: 'all', accessFilter: 'all', usageFilter: 'all',
  modalityFilter: 'all', categoryFilter: 'all', noCardOnly: false, noPhoneOnly: false,
  longContextOnly: false, verifiedOnly: false, sortOrder: 'recent',
});
const ACCESS = ['all', 'direct', 'gateway'] as const;
const USAGE = ['all', 'chat', 'coding', 'reasoning', 'vision', 'tool-calling'] as const;
const MODALITY = ['all', 'text', 'image', 'video', 'audio', 'pdf'] as const;
const CATEGORIES = ['all', 'coding', 'reasoning', 'vision', 'video', 'no-card', 'long-context'] as const;
const KEYS = ['q', 'provider', 'access', 'usage', 'modality', 'category', 'no_card', 'no_phone', 'long_context', 'verified', 'sort'];
function choice<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? value as T : fallback;
}
export function parseModelFilters(search: string): ModelFilters {
  const p = new URLSearchParams(search.replace(/^\?/, ''));
  const providers = ['all', ...FREE_AI_MODEL_PROVIDERS.map((provider) => provider.id)];
  return {
    query: cleanQuery(p.get('q') ?? ''),
    providerFilter: choice(p.get('provider'), providers, 'all'),
    accessFilter: choice(p.get('access'), ACCESS, 'all'),
    usageFilter: choice(p.get('usage'), USAGE, 'all'),
    modalityFilter: choice(p.get('modality'), MODALITY, 'all'),
    categoryFilter: choice(p.get('category'), CATEGORIES, 'all'),
    noCardOnly: p.get('no_card') === '1', noPhoneOnly: p.get('no_phone') === '1',
    longContextOnly: p.get('long_context') === '1', verifiedOnly: p.get('verified') === '1',
    sortOrder: choice(p.get('sort'), ['recent', 'context'] as const, 'recent'),
  };
}
// Preserve language and non-model parameters; model filters have a fixed order.
export function serializeModelFilters(filters: ModelFilters, search = ''): string {
  const p = new URLSearchParams(search.replace(/^\?/, ''));
  for (const key of KEYS) p.delete(key);
  const values: [string, string | boolean][] = [
    ['q', cleanQuery(filters.query)], ['provider', filters.providerFilter === 'all' ? '' : filters.providerFilter],
    ['access', filters.accessFilter === 'all' ? '' : filters.accessFilter], ['usage', filters.usageFilter === 'all' ? '' : filters.usageFilter],
    ['modality', filters.modalityFilter === 'all' ? '' : filters.modalityFilter], ['category', filters.categoryFilter === 'all' ? '' : filters.categoryFilter],
    ['no_card', filters.noCardOnly], ['no_phone', filters.noPhoneOnly], ['long_context', filters.longContextOnly],
    ['verified', filters.verifiedOnly], ['sort', filters.sortOrder === 'recent' ? '' : filters.sortOrder],
  ];
  for (const [key, value] of values) if (value) p.set(key, value === true ? '1' : String(value));
  return p.toString();
}
