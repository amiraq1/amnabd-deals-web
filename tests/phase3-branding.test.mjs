import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
const html = readFileSync(resolve('index.html'), 'utf8');
test('branding references a real self-contained favicon, not Vite or third-party artwork', () => {
  assert.match(html, /rel="icon"[^>]*href="\/favicon\.svg"/);
  assert.ok(existsSync(resolve('public/favicon.svg')));
  const svg = readFileSync(resolve('public/favicon.svg'), 'utf8');
  assert.match(svg, /viewBox="0 0 32 32"/);
  assert.doesNotMatch(svg, /<script|<foreignObject|(?:href|src)=|onload=/i);
  assert.doesNotMatch(html, /vite\.svg|bolt\.new|og-image\.svg/);
});
test('text-only social metadata makes no unsupported SVG image promise', () => {
  assert.match(html, /name="twitter:card" content="summary"/);
  assert.match(html, /property="og:title"/);
  assert.match(html, /property="og:description"/);
  assert.doesNotMatch(html, /(?:property="og:image|name="twitter:image|rel="apple-touch-icon)/);
});
test('safe-area viewport and dark theme are explicit', () => {
  assert.match(html, /viewport-fit=cover/);
  assert.match(html, /name="theme-color" content="#020617"/);
});
