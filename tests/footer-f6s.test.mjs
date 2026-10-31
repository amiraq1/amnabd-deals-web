import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

test('footer includes the requested F6S Follow button with its expected destination and image', () => {
  const footer = readFileSync(join(process.cwd(), 'src/components/Footer.tsx'), 'utf8');
  const button = footer.match(
    /<a\s+href="https:\/\/www\.f6s\.com\/member\/ammar-mohammed\?follow=1"[\s\S]*?<\/a>/
  )?.[0];

  assert.ok(button, 'F6S Follow anchor should be present in the footer');
  assert.match(button, /target="_blank"/);
  assert.match(button, /rel="noopener noreferrer"/);
  assert.match(button, /title="Follow Ammar Mohammed on F6S"/);
  assert.match(button, /src="https:\/\/www\.f6s\.com\/images\/f6s-follow-secondary\.png"/);
  assert.match(button, /width=\{78\}/);
  assert.match(button, /height=\{22\}/);
  assert.match(button, /alt="Follow Ammar Mohammed on F6S"/);
  assert.match(button, /border: 0, width: '78px', height: '22px', padding: 0, margin: 0/);
});
