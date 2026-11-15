import assert from 'node:assert/strict';
import { test } from 'node:test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const load = (name) => import(pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, `src/lib/${name}.js`)).href);
const { DEFAULT_FILTER_STATE, parseFilterState, serializeFilterState } = await load('filterState');
const { isHashOnlyLocationChange, migrateLegacyHashLocation } = await load('routes');
const { parseModelFilters, serializeModelFilters, DEFAULT_MODEL_FILTERS } = await load('modelFilterState');
const { importFavorites, exportFavorites } = await load('favoritesTransfer');
const { buildComparisonRows } = await load('comparison');

test('discovery filters round trip, repeated Arabic use cases, legacy links and anchors', () => {
  const state = { ...DEFAULT_FILTER_STATE, q: 'GPT', savedOnly: true, endingSoon: true, useCases: ['برمجة', 'coding'] };
  const serialized = serializeFilterState(state);
  const parsed = parseFilterState(serialized);
  assert.equal(parsed.q, 'GPT'); assert.equal(parsed.savedOnly, true); assert.equal(parsed.endingSoon, true);
  assert.deepEqual(parsed.useCases, ['برمجة', 'coding']);
  assert.equal(serializeFilterState(parsed), serialized);
  assert.deepEqual(parseFilterState('use_case=coding&use_case=coding').useCases, ['coding']);
  assert.equal(parseFilterState('saved=bad&ending=0').savedOnly, false);
  assert.equal(isHashOnlyLocationChange('/', `?${serialized}`, '/', serialized), true);
  assert.match(migrateLegacyHashLocation({ pathname: '/', search: '', hash: '#/?ending=1&use_case=coding' }), /ending=1&use_case=coding/);
});

test('model filters round trip all controls while preserving language', () => {
  const state = { ...DEFAULT_MODEL_FILTERS, query: 'نموذج', providerFilter: 'nvidia-nim', accessFilter: 'direct', usageFilter: 'coding', modalityFilter: 'image', categoryFilter: 'long-context', noCardOnly: true, noPhoneOnly: true, longContextOnly: true, verifiedOnly: true, sortOrder: 'context' };
  const search = serializeModelFilters(state, '?lang=en');
  assert.deepEqual(parseModelFilters(search), state);
  assert.equal(new URLSearchParams(search).get('lang'), 'en');
  assert.deepEqual(parseModelFilters('provider=bad&usage=bad&verified=0'), DEFAULT_MODEL_FILTERS);
});

test('favorites import is bounded, non-destructive and validates before merging', () => {
  const json = exportFavorites(['old', 'new', 'new']);
  assert.deepEqual(importFavorites(json, ['old', 'existing']), { slugs: ['old', 'existing', 'new'], added: 1, skipped: 0 });
  assert.throws(() => importFavorites('{"version":1,"slugs":["bad/slug"]}', ['safe']));
  assert.throws(() => importFavorites('x'.repeat(100001), []));
  const full = Array.from({length: 500}, (_, i) => `slug-${i}`);
  assert.deepEqual(importFavorites(exportFavorites(['new']), full), { slugs: full, added: 0, skipped: 1 });
});

test('comparison preserves prices, units and explicit unknowns without ranking', () => {
  const a = { benefits: [{ amount: { value: 100, unit: 'credits', currency: 'USD' }, description: { ar: 'رصيد API', en: 'API credit' }, frequency: 'one_time' }], pricing: { offer_price: 0, currency: 'USD', billing_cycle: 'monthly' }, ends_at: '2026-12-30T12:00:00Z', eligibility: {}, official_sources: [], review: { unknown_fields: [] } };
  const b = { ...a, benefits: [{ amount: { value: 500, unit: 'tokens', currency: null }, description: { ar: 'رموز', en: 'tokens' }, frequency: 'monthly' }], review: { unknown_fields: ['pricing.offer_price', 'ends_at', 'benefits.0.amount'] } };
  const rows = buildComparisonRows([a, b], 'en');
  const row = (key, i) => rows.find((r) => r.key === key).values[i].text;
  assert.match(row('benefit', 0), /USD 100 usage credits; API credit; One-time/);
  assert.equal(row('benefit', 1), 'tokens; Monthly');
  assert.match(row('price', 0), /0 USD.*monthly/);
  assert.equal(row('price', 1), 'Unknown');
  assert.equal(row('expiry', 0), '2026-12-30T12:00:00Z');
  assert.equal(row('expiry', 1), 'Unknown');
  const flagged = { ...a, review: { unknown_fields: ['pricing.currency', 'benefits.0.amount.unit'] } };
  const flaggedRows = buildComparisonRows([flagged, a], 'en');
  assert.equal(flaggedRows.find(r => r.key === 'price').values[0].text, 'Unknown');
  assert.doesNotMatch(flaggedRows.find(r => r.key === 'benefit').values[0].text, /100/);
});
