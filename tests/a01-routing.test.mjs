// A01 (one source of truth for the URL) and A12 (metadata follows the route).
// These are the acceptance cases the audit asked for, at the pure-function
// level: the browser half is exercised by the manual checklist.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const load = (rel) =>
  import(pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, `src/lib/${rel}.js`)).href);

const { routeUrl, migrateLegacyHashLocation, resolveLocationChange } = await load('routes');
const { buildDiscoverySearch, DEFAULT_FILTER_STATE } = await load('filterState');
const { routeMetadata } = await load('metadata');
const { buildDealSeo } = await load('seoFacts');

const at = (overrides) => ({
  pathname: '/',
  search: '',
  lastAppliedPath: '/',
  lastAppliedSearch: '',
  hadPending: false,
  ...overrides,
});

// --- A01: the address describes the page ---------------------------------
test('A01: a route and its filters produce one path-based URL', () => {
  assert.equal(routeUrl({ name: 'home' }), '/');
  assert.equal(routeUrl({ name: 'deal', slug: 'alpha' }), '/deal/alpha');
  assert.equal(routeUrl({ name: 'guide' }), '/guide');
  assert.equal(routeUrl({ name: 'collection', collectionKey: 'coding' }), '/coding');
  assert.equal(routeUrl({ name: 'home' }, '?q=alpha&sort=deadline'), '/?q=alpha&sort=deadline');
  // A stray leading "?" is not doubled.
  assert.equal(routeUrl({ name: 'home' }, 'q=alpha'), '/?q=alpha');
});

test('A01: a legacy hash link becomes a path URL exactly once', () => {
  assert.equal(
    migrateLegacyHashLocation({ pathname: '/', search: '', hash: '#/deal/alpha' }),
    '/deal/alpha'
  );
  assert.equal(
    migrateLegacyHashLocation({ pathname: '/', search: '', hash: '#/?q=alpha&sort=deadline' }),
    '/?q=alpha&sort=deadline'
  );
  // A modern location has nothing to migrate, so no history entry is written.
  assert.equal(migrateLegacyHashLocation({ pathname: '/deal/alpha', search: '', hash: '' }), null);
  assert.equal(migrateLegacyHashLocation({ pathname: '/', search: '?q=alpha', hash: '' }), null);
  // An explicit modern query wins over the legacy one.
  assert.equal(
    migrateLegacyHashLocation({ pathname: '/', search: '?q=modern', hash: '#/?q=old' }),
    '/?q=modern'
  );
});

test('A01: navigating home from a deal page is a real location change', () => {
  // The old bug: the hash was already `#/`, so the write was skipped and the
  // address kept pointing at the deal while the home page rendered.
  const decision = resolveLocationChange(
    at({ pathname: '/', search: '', lastAppliedPath: '/deal/alpha', lastAppliedSearch: '' })
  );
  assert.equal(decision.apply, true);
  assert.deepEqual(decision.route, { name: 'home' });
});

test('A01: reload and back/forward restore route and filters together', () => {
  // Back from `/deal/alpha` to `/?q=alpha`.
  const back = resolveLocationChange(
    at({ pathname: '/', search: '?q=alpha', lastAppliedPath: '/deal/alpha', lastAppliedSearch: '' })
  );
  assert.equal(back.apply, true);
  assert.equal(back.route.name, 'home');
  assert.equal(back.filterSearch, 'q=alpha');

  // Forward again.
  const forward = resolveLocationChange(
    at({ pathname: '/deal/alpha', search: '', lastAppliedPath: '/', lastAppliedSearch: 'q=alpha' })
  );
  assert.equal(forward.apply, true);
  assert.deepEqual(forward.route, { name: 'deal', slug: 'alpha' });
  assert.equal(forward.filterSearch, '');

  // A popstate that changes nothing is inert.
  const idle = resolveLocationChange(at({}));
  assert.equal(idle.apply, false);
});

test('A01: the filter query is built for the address bar, not the hash', () => {
  assert.equal(buildDiscoverySearch(DEFAULT_FILTER_STATE), '');
  const search = buildDiscoverySearch({ ...DEFAULT_FILTER_STATE, q: 'alpha', sort: 'deadline' });
  assert.equal(search.startsWith('?'), true);
  assert.equal(search.includes('#'), false);
  assert.match(search, /q=alpha/);
  assert.match(search, /sort=deadline/);
});

// --- A12: metadata follows the route -------------------------------------
test('A12: leaving a deal page restores the destination metadata', () => {
  const deal = { slug: 'alpha', name: 'Alpha' };
  const dealSeo = buildDealSeo(deal, 'https://amnabd.com');
  const onDeal = routeMetadata({ name: 'deal', slug: 'alpha' }, 'ar', dealSeo);
  assert.equal(onDeal.canonicalUrl, 'https://amnabd.com/deal/alpha');
  assert.equal(onDeal.jsonLd['@type'], 'Offer');

  const home = routeMetadata({ name: 'home' }, 'ar');
  assert.equal(home.canonicalUrl, 'https://amnabd.com/');
  assert.notEqual(home.canonicalUrl, onDeal.canonicalUrl);
  // The deal's Offer must not survive the navigation.
  assert.equal(home.jsonLd['@type'], 'WebSite');
  assert.notEqual(home.jsonLd['@type'], 'Offer');
  assert.match(home.title, /AMNABD Deals/);
  assert.ok(home.description.length > 0);
});

test('A12: every route carries its own canonical', () => {
  const paths = {
    guide: 'https://amnabd.com/guide',
    favorites: 'https://amnabd.com/favorites',
    changelog: 'https://amnabd.com/changelog',
  };
  for (const [name, canonical] of Object.entries(paths)) {
    const meta = routeMetadata({ name }, 'en');
    assert.equal(meta.canonicalUrl, canonical, name);
    assert.equal(meta.ogImageUrl, 'https://amnabd.com/og-image.png', name);
    assert.ok(meta.title.length > 0, name);
  }
});

test('A12: an unknown deal does not claim the previous deal canonical', () => {
  const missing = routeMetadata({ name: 'deal', slug: 'gone' }, 'ar', null);
  assert.equal(missing.canonicalUrl, 'https://amnabd.com/404');
  assert.equal(missing.jsonLd['@type'], 'WebSite');
});
