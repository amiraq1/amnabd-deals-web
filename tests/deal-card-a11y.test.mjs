// Tests for DealCard & FavoriteButton accessibility and focus indicators (better-interface review).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const dealCardSource = readFileSync(join(process.cwd(), 'src/components/DealCard.tsx'), 'utf8');
const favoriteButtonSource = readFileSync(join(process.cwd(), 'src/components/FavoriteButton.tsx'), 'utf8');

test('FavoriteButton: accessibleLabel includes dealName when provided for screen readers', () => {
  assert.match(
    favoriteButtonSource,
    /const accessibleLabel = dealName \? `\$\{label\}: \$\{dealName\}` : label;/,
    'accessibleLabel must contextualize the action with dealName'
  );
  assert.match(
    favoriteButtonSource,
    /aria-label=\{accessibleLabel\}/,
    'button must use accessibleLabel for aria-label'
  );
});

test('DealCard: interactive controls have visible focus rings', () => {
  assert.match(
    dealCardSource,
    /focus-visible:outline-brand/,
    'comparison and link controls must have brand focus ring'
  );
  assert.match(
    dealCardSource,
    /after:rounded-card/,
    'stretched link pseudo-element must reuse the rounded-card design token'
  );
});
