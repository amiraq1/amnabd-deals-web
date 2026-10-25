import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
const html = readFileSync(resolve('index.html'), 'utf8');
test('branding references a real self-contained favicon, not Vite or third-party artwork', () => {
  assert.match(html, /rel="icon"[^>]*href="\/favicon\.svg"/);
  assert.ok(existsSync(resolve('public/favicon.svg')));
  const svg = readFileSync(resolve('public/favicon.svg'), 'utf8');
  assert.match(svg, /viewBox="0 0 32 32"/);
  assert.doesNotMatch(svg, /<script|<foreignObject|(?:href|src)=|onload=/i);
  assert.doesNotMatch(html, /vite\.svg|bolt\.new|og-image\.svg/);
});
test('social metadata references rasterized PNG image and not unsupported SVG', () => {
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  assert.match(html, /property="og:title"/);
  assert.match(html, /property="og:description"/);
  assert.match(html, /property="og:image"[^>]*og-image\.png/);
  assert.match(html, /name="twitter:image"[^>]*og-image\.png/);
  assert.doesNotMatch(html, /og-image\.svg/);
  assert.ok(existsSync(resolve('public/og-image.png')));
});
test('social image wording does not claim that every offer is verified', () => {
  const svg = readFileSync(resolve('public/og-image.svg'), 'utf8');
  const visibleText = [...svg.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)]
    .map(([, text]) => text.replaceAll('&amp;', '&'))
    .join(' ');
  assert.match(visibleText, /عروض ومنافع أدوات الذكاء الاصطناعي/);
  assert.doesNotMatch(visibleText, /verified|موثّق|موثق|موثقة/i);

  const rendered = new Resvg(svg, {
    font: { defaultFontFamily: 'DejaVu Sans', sansSerifFamily: 'DejaVu Sans' },
  }).render().asPng();
  assert.deepEqual(readFileSync(resolve('public/og-image.png')), Buffer.from(rendered));
});
test('safe-area viewport and dark theme are explicit', () => {
  assert.match(html, /viewport-fit=cover/);
  assert.match(html, /name="theme-color" content="#020617"/);
});
