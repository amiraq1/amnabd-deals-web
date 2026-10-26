// Renders public/og-image.png from public/og-image.svg.
//
// The PNG is committed, so this is a deliberate step rather than part of the
// build: run it after editing the SVG and commit both files.
//
//   npm run build:og
//
// Byte-for-byte reproducibility across machines is not achievable here — resvg
// rasterizes text with whatever font the host resolves, so the same SVG yields
// different bytes on Linux and Windows. That is why the test asserts the raster
// contract (valid PNG, 1200x630) instead of comparing bytes.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const svgPath = join(ROOT, 'public', 'og-image.svg');
const pngPath = join(ROOT, 'public', 'og-image.png');

const svg = readFileSync(svgPath, 'utf8');
const rendered = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1200 },
  font: { loadSystemFonts: true },
}).render();

const png = rendered.asPng();
writeFileSync(pngPath, png);
console.log(`og-image: ${pngPath} — ${rendered.width}x${rendered.height}, ${png.length} bytes`);
