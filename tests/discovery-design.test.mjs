import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const home = read('src/pages/HomePage.tsx');
const css = read('src/index.css');
const card = read('src/components/DealCard.tsx');

test('discovery paths reuse the existing filters exactly once, with accessible toggle states', () => {
  assert.equal((home.match(/quickFilterOptions\.map/g) ?? []).length, 1);
  assert.match(home, /aria-label=\{lang === 'ar' \? 'فلاتر سريعة' : 'Quick filters'\}/);
  assert.match(home, /aria-pressed=\{qf\.isActive\}/);
  assert.match(home, /disabled=\{qf\.count === 0 && !qf\.isActive\}/);
  assert.match(home, /onClick=\{qf\.onToggle\}/);
  assert.match(home, /ابدأ بما يناسبك/);
  assert.match(home, /Find your starting point/);
  assert.match(home, /lg:grid-cols-\[minmax\(0,1fr\)_19rem\]/);
});

test('spotlight is CSS-only, non-intercepting and keyboard/touch aware', () => {
  assert.match(card, /className=\{`deal-spotlight group/);
  assert.match(css, /\.deal-spotlight::before\s*\{[^}]*pointer-events: none/s);
  assert.match(css, /\.deal-spotlight:focus-within::before/);
  assert.match(css, /@media \(hover: hover\) and \(pointer: fine\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(card, /onPointerMove|onMouseMove|requestAnimationFrame/);
  assert.match(card, /after:absolute after:inset-0/);
  assert.match(card, /relative z-10/);
});

test('reduced motion disables infinite animation instead of accelerating it', () => {
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?animation: none !important/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.skeleton\s*\{\s*background-image: none;/);
});

test('visual enhancement preserves chronological spotlight and root deployment base', () => {
  assert.match(home, /hasAnyActiveFilter \? \[\] : sorted\.slice\(0, 3\)/);
  assert.match(home, /sorted\.filter\(\(d\) => !newSlugs\.has\(d\.slug\)\)/);
  assert.match(read('vite.config.ts'), /base: '\/'/);
  const deps = Object.keys(JSON.parse(read('package.json')).dependencies).sort();
  assert.deepEqual(deps, ['@supabase/postgrest-js', 'lucide-react', 'react', 'react-dom']);
});
