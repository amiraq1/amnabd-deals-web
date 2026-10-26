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

  // The PNG is generated on the Linux runner, and resvg rasterizes text with
  // whatever font the platform resolves. A byte-for-byte comparison therefore
  // only holds there: on Windows the same SVG renders to 155,965 bytes against
  // the committed 167,236, for an image that is visually correct. CI keeps the
  // strict check; other platforms assert the raster contract instead, so a
  // local run reports a real regression rather than a font difference.
  const png = readFileSync(resolve('public/og-image.png'));
  if (process.platform === 'win32') {
    assert.deepEqual([...png.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    assert.equal(png.subarray(12, 16).toString('latin1'), 'IHDR');
    assert.equal(png.readUInt32BE(16), 1200, 'OG image width');
    assert.equal(png.readUInt32BE(20), 630, 'OG image height');
  } else {
    const rendered = new Resvg(svg, {
      font: { defaultFontFamily: 'DejaVu Sans', sansSerifFamily: 'DejaVu Sans' },
    }).render().asPng();
    assert.deepEqual(png, Buffer.from(rendered));
  }
});
test('safe-area viewport and dark theme are explicit', () => {
  assert.match(html, /viewport-fit=cover/);
  assert.match(html, /name="theme-color" content="#020617"/);
});
