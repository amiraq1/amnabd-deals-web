// Tests for mobile-native and touch accessibility enhancements.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const cssSource = readFileSync(join(process.cwd(), 'src/index.css'), 'utf8');
const notFoundSource = readFileSync(join(process.cwd(), 'src/pages/NotFoundPage.tsx'), 'utf8');
const favoritesSource = readFileSync(join(process.cwd(), 'src/pages/FavoritesPage.tsx'), 'utf8');
const changelogSource = readFileSync(join(process.cwd(), 'src/pages/ChangelogPage.tsx'), 'utf8');
const collectionSource = readFileSync(join(process.cwd(), 'src/pages/CollectionPage.tsx'), 'utf8');

test('mobile-native: global CSS removes tap highlight and adds manipulation touch-action', () => {
  assert.match(
    cssSource,
    /-webkit-tap-highlight-color:\s*transparent;/,
    'must eliminate mobile tap highlight flash'
  );
  assert.match(
    cssSource,
    /touch-action:\s*manipulation;/,
    'must remove 300ms double-tap delay on interactive controls'
  );
  assert.match(
    cssSource,
    /user-select:\s*none;/,
    'must prevent accidental text selection on button presses'
  );
});

test('navigation: secondary pages back buttons have min-h-11 and visible focus styles', () => {
  assert.match(favoritesSource, /onClick=\{onBackToHome\}[\s\S]*?min-h-11/);
  assert.match(changelogSource, /onClick=\{onBackToHome\}[\s\S]*?min-h-11/);
  assert.match(collectionSource, /onClick=\{onBackToHome\}[\s\S]*?min-h-11/);
});

test('NotFoundPage: button declares type, min-h-11 and icon is hidden from screen readers', () => {
  assert.match(notFoundSource, /<Compass\s+aria-hidden="true"/);
  assert.match(notFoundSource, /<button\s+type="button"/);
  assert.match(notFoundSource, /min-h-11/);
});
