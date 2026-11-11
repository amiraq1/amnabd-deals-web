// AMN-023 and AMN-024: class-level checks only. Chromium is not available in
// batch 1, so these tests do not prove rendered contrast or layout in a browser.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

// Tailwind v3 palette values. WCAG 2.x relative luminance and contrast ratio.
const PALETTE = { 'slate-950': '#020617', 'slate-400': '#94a3b8' };

function channel(value) {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  return (
    0.2126 * channel((n >> 16) & 255) +
    0.7152 * channel((n >> 8) & 255) +
    0.0722 * channel(n & 255)
  );
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function tsxFilesUnder(dir) {
  return readdirSync(join(root, dir), { recursive: true })
    .filter((name) => name.endsWith('.tsx'))
    .map((name) => join(dir, name));
}

test('AMN-023: no paragraph in the SMS directory uses text-slate-500', () => {
  const source = read('src/pages/SmsSuppliersDirectoryPage.tsx');
  const hits = [...source.matchAll(/<p\s[^>]*className="[^"]*\btext-slate-500\b[^"]*"/g)].map(
    (match) => match[0],
  );
  assert.deepEqual(hits, []);
});

test('AMN-023: text-slate-400 meets WCAG AA normal-text contrast on slate-950', () => {
  assert.ok(contrast(PALETTE['slate-400'], PALETTE['slate-950']) >= 4.5);
});

test('AMN-024: no control uses min-h-9 or min-h-10 (36px or 40px, below 44px)', () => {
  const offenders = [];
  for (const file of tsxFilesUnder('src')) {
    read(file)
      .split('\n')
      .forEach((line, index) => {
        if (/(?<![\w-])min-h-(9|10)(?![\w.[])/.test(line)) offenders.push(`${file}:${index + 1}`);
      });
  }
  assert.deepEqual(offenders, []);
});
