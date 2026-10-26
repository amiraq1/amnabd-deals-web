// REC-16 — route changes move focus and announce the new page.
//
// The trap is over-triggering: `?lang=en` and filter edits update the URL
// without changing the view, and moving focus to the heading there would pull
// it away from the control the visitor just used. The effect therefore keys on
// `routeIdentity`, which is derived from the route alone.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';

const { routeIdentity } = await import(
  pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, 'src/lib/routes.js')).href
);

test('REC-16: identity changes with the entity, not with the URL', () => {
  assert.equal(routeIdentity({ name: 'home' }), 'home');
  assert.equal(routeIdentity({ name: 'guide' }), 'guide');
  assert.equal(routeIdentity({ name: 'deal', slug: 'bolt' }), 'deal:bolt');
  assert.equal(routeIdentity({ name: 'collection', collectionKey: 'coding' }), 'collection:coding');

  // Same slug is the same page; a different slug is a different page.
  assert.equal(
    routeIdentity({ name: 'deal', slug: 'bolt' }),
    routeIdentity({ name: 'deal', slug: 'bolt' })
  );
  assert.notEqual(
    routeIdentity({ name: 'deal', slug: 'bolt' }),
    routeIdentity({ name: 'deal', slug: 'zed' })
  );
  assert.notEqual(
    routeIdentity({ name: 'collection', collectionKey: 'coding' }),
    routeIdentity({ name: 'collection', collectionKey: 'students' })
  );
});

test('REC-16: query state cannot masquerade as a page change', () => {
  // The identity takes the route object only; language and filter state live in
  // the search string, so they never reach it.
  assert.equal(routeIdentity({ name: 'home', search: '?lang=en' }), 'home');
  assert.equal(routeIdentity({ name: 'home', search: '?q=ai&cat=coding' }), 'home');
  assert.equal(routeIdentity(null), 'unknown');
});

test('REC-16: the app focuses the new heading only when the identity changes', () => {
  const app = readFileSync(join(process.cwd(), 'src/App.tsx'), 'utf8');

  // Guard against re-firing on every render or on same-view URL updates.
  assert.match(app, /if \(lastViewIdentity\.current === viewIdentity\) return;/);
  assert.match(app, /const viewIdentity = useMemo\(\(\) => routeIdentity\(route\), \[route\]\)/);
  assert.match(app, /\}, \[viewIdentity\]\);/);

  // Focus lands on the page heading, with the main container as the immediate
  // fallback while an async page is still rendering.
  assert.match(app, /document\.getElementById\('main-content'\)/);
  assert.match(app, /container\.focus\(\{ preventScroll: true \}\)/);
  assert.match(app, /container\.querySelector\('h1'\)/);
  assert.match(app, /heading\.focus\(\{ preventScroll: true \}\)/);

  // The announcement region is polite and atomic, so a reader hears one message.
  assert.match(app, /role="status" aria-live="polite" aria-atomic="true"/);
});
