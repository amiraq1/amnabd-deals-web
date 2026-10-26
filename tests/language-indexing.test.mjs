// AMN-008 — the language-indexing decision, as a guard.
//
// docs/language-indexing.md decides that Arabic is the indexed version and
// English is the same page in another language. The mechanical consequence is
// that the canonical must be identical for both languages and must never carry
// the `?lang=` preference. This test fails if that stops being true.
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';

const { routeMetadata } = await import(
  pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, 'src/lib/metadata.js'))
);

const routes = [
  { name: 'home' },
  { name: 'guide' },
  { name: 'favorites' },
  { name: 'changelog' },
  { name: 'compare' },
  { name: 'notfound' },
];

test('AMN-008: both languages declare the same canonical', () => {
  for (const route of routes) {
    const ar = routeMetadata(route, 'ar');
    const en = routeMetadata(route, 'en');
    assert.equal(ar.canonicalUrl, en.canonicalUrl, route.name);
  }
});

test('AMN-008: no canonical carries a language query parameter', () => {
  for (const route of routes) {
    for (const lang of ['ar', 'en']) {
      const { canonicalUrl } = routeMetadata(route, lang);
      assert.doesNotMatch(canonicalUrl, /\?/, `${route.name}/${lang}`);
      assert.doesNotMatch(canonicalUrl, /lang=/, `${route.name}/${lang}`);
    }
  }
});

test('AMN-008: the canonical is absolute and points at the site origin', () => {
  for (const route of routes) {
    const { canonicalUrl } = routeMetadata(route, 'ar');
    assert.match(canonicalUrl, /^https:\/\/[^/]+\//, route.name);
  }
});
