// REC-02 — DEALS.md is a published mirror of the catalog, so its links have to
// be canonical paths and its opening has to describe what the catalog actually
// establishes. It previously carried 27 `#/deal/` URLs and a blanket "Every deal
// is verified" claim that contradicted llms.txt.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const read = (name) => readFileSync(join(process.cwd(), name), 'utf8');

test('REC-02: DEALS.md links to canonical deal paths, never hash routes', () => {
  const md = read('DEALS.md');
  assert.doesNotMatch(md, /#\/deal\//);

  const links = [...md.matchAll(/\]\((https:\/\/amnabd\.com\/[^)]*)\)/g)].map((match) => match[1]);
  assert.ok(links.length >= 20, `expected the full catalog, found ${links.length} links`);
  for (const url of links) {
    assert.match(url, /^https:\/\/amnabd\.com\/deal\/[a-z0-9-]+$/, url);
  }
});

test('REC-02: DEALS.md makes no blanket verification claim', () => {
  const intro = read('DEALS.md').split('## Deals')[0];
  assert.doesNotMatch(intro, /every deal is verified/i);
  assert.doesNotMatch(intro, /all deals are verified/i);
  assert.match(intro, /unknown/, 'the intro must say unsupported values stay unknown');
});

test('REC-02: README carries no hash-route deal links either', () => {
  assert.doesNotMatch(read('README.md'), /#\/deal\//);
});
