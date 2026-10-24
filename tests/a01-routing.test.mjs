// A01 (one source of truth for the URL) and A12 (metadata follows the route).
// These are the acceptance cases the audit asked for, at the pure-function
// level: the browser half is exercised by the manual checklist.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runInNewContext } from 'node:vm';

const load = (rel) =>
  import(pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, `src/lib/${rel}.js`)).href);

const {
  routeUrl,
  migrateLegacyHashLocation,
  resolveLocationChange,
  isHashOnlyLocationChange,
} = await load('routes');
const { buildDiscoverySearch, DEFAULT_FILTER_STATE } = await load('filterState');
const { parseLanguageFromSearch, readLanguage, withLanguageSearch, languageSearchForLocation } = await load('languageStorage');
const { routeMetadata } = await load('metadata');
const { buildDealSeo } = await load('seoFacts');
const { buildDealLink } = await load('share');

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

test('F-02: URL language overrides storage and invalid or repeated values are ignored', () => {
  const stored = (value) => () => ({ getItem: () => value, setItem: () => {} });
  assert.equal(parseLanguageFromSearch('?lang=en'), 'en');
  assert.equal(parseLanguageFromSearch('q=ai&lang=ar'), 'ar');
  assert.equal(parseLanguageFromSearch('?lang=fr'), null);
  assert.equal(parseLanguageFromSearch('?lang=en&lang=ar'), null);
  assert.equal(readLanguage(stored('ar'), '?lang=en'), 'en');
  assert.equal(readLanguage(stored('en'), '?lang=ar'), 'ar');
  assert.equal(readLanguage(stored('en'), '?lang=unknown'), 'en');
  assert.equal(readLanguage(() => { throw new Error('storage blocked'); }, ''), 'ar');
  assert.equal(readLanguage(() => { throw new Error('storage blocked'); }, '?lang=en'), 'en');
});

test('F-02: HTML bootstrap honors the URL before React even when storage is blocked', () => {
  const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
  const bootstrap = /<script>\s*([\s\S]*?)<\/script>/.exec(html)?.[1];
  assert.ok(bootstrap);
  const document = { documentElement: { lang: 'ar', dir: 'rtl' } };
  runInNewContext(bootstrap, {
    URLSearchParams,
    window: { location: { search: '?lang=en' } },
    document,
    localStorage: { getItem: () => { throw new Error('storage blocked'); } },
  });
  assert.equal(document.documentElement.lang, 'en');
  assert.equal(document.documentElement.dir, 'ltr');
});

test('F-02: localized search preserves filters and only emits Arabic when explicitly selected', () => {
  assert.equal(
    withLanguageSearch('?q=alpha&q=beta&lang=unknown&sort=deadline', 'en'),
    'q=alpha&q=beta&sort=deadline&lang=en'
  );
  assert.equal(withLanguageSearch('q=alpha', 'ar'), 'q=alpha');
  assert.equal(withLanguageSearch('q=alpha&lang=en', 'ar', true), 'q=alpha&lang=ar');
  assert.equal(languageSearchForLocation('q=alpha', 'ar', '?lang=en'), 'q=alpha&lang=en');
  assert.equal(languageSearchForLocation('q=alpha', 'en', '?lang=ar'), 'q=alpha&lang=ar');
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
  // A shared favourites list is not a filter: it must survive the migration.
  assert.equal(
    migrateLegacyHashLocation({ pathname: '/', search: '?list=alpha', hash: '#/?q=Alpha' }),
    '/?list=alpha&q=Alpha'
  );
  // Duplicates keep their order and their meaning: `parseFilterState` reads the
  // first value, so collapsing `q=Alpha&q=Beta` into one would change the query.
  assert.equal(
    migrateLegacyHashLocation({ pathname: '/', search: '?q=Alpha&q=Beta', hash: '#/' }),
    '/?q=Alpha&q=Beta'
  );
  assert.equal(
    migrateLegacyHashLocation({ pathname: '/', search: '?list=a&list=b', hash: '#/?q=Alpha' }),
    '/?list=a&list=b&q=Alpha'
  );
  assert.equal(
    migrateLegacyHashLocation({ pathname: '/', search: '', hash: '#/deal/alpha?lang=en' }),
    '/deal/alpha?lang=en'
  );
  assert.equal(
    migrateLegacyHashLocation({ pathname: '/', search: '?lang=ar', hash: '#/deal/alpha?lang=en' }),
    '/deal/alpha?lang=ar'
  );
});

test('A01: an in-page anchor is not a navigation', () => {
  // Chromium fires `popstate` for `#main-content`. Treating it as a navigation
  // cancelled a debounced filter write and reverted the search box.
  assert.equal(isHashOnlyLocationChange('/', '?q=Alpha', '/', 'q=Alpha'), true);
  assert.equal(isHashOnlyLocationChange('/', '?q=Alpha', '/', 'q=Beta'), false);
  assert.equal(isHashOnlyLocationChange('/deal/alpha', '', '/', ''), false);
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
  const englishDeal = routeMetadata({ name: 'deal', slug: 'alpha' }, 'en', dealSeo);
  // lang is a shareable UI preference, not a separately prerendered SEO page.
  assert.equal(englishDeal.canonicalUrl, onDeal.canonicalUrl);
  assert.equal(englishDeal.jsonLd.url, englishDeal.canonicalUrl);

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
  // Still loading: the page exists, so it keeps its own canonical.
  const loading = routeMetadata({ name: 'deal', slug: 'gone' }, 'ar', null, undefined, false);
  assert.equal(loading.canonicalUrl, 'https://amnabd.com/deal/gone');
  assert.doesNotMatch(loading.title, /404/);

  // Confirmed missing: 404 copy and a 404 canonical, not the home page's.
  const missing = routeMetadata({ name: 'deal', slug: 'gone' }, 'ar', null, undefined, true);
  assert.equal(missing.canonicalUrl, 'https://amnabd.com/404');
  assert.match(missing.title, /غير موجود/);
  assert.equal(missing.jsonLd['@type'], 'WebSite');
});

test('A12: the home title names the site once', () => {
  const home = routeMetadata({ name: 'home' }, 'en');
  assert.equal(home.canonicalUrl, 'https://amnabd.com/');
  const occurrences = home.title.split('AMNABD Deals').length - 1;
  assert.equal(occurrences, 1);
});

test('A01: a shared deal link is the page path, not a hash', () => {
  assert.equal(buildDealLink('https://amnabd.com/', 'alpha'), 'https://amnabd.com/deal/alpha');
  // Tracking queries are dropped, the host is preserved.
  assert.equal(
    buildDealLink('https://amnabd.com/?utm=x', 'alpha'),
    'https://amnabd.com/deal/alpha'
  );
  assert.equal(buildDealLink('https://amnabd.com/', 'not a slug!'), null);
  assert.equal(
    buildDealLink('https://amnabd.com/deal/alpha?lang=en&utm_source=x', 'alpha', 'en'),
    'https://amnabd.com/deal/alpha?lang=en'
  );
  assert.equal(
    buildDealLink('https://amnabd.com/deal/alpha', 'alpha', 'ar'),
    'https://amnabd.com/deal/alpha?lang=ar'
  );
});
