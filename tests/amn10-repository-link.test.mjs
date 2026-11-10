import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const footer = readFileSync(join(process.cwd(), 'src/components/Footer.tsx'), 'utf8');

test('footer links to the public repository that exists', () => {
  assert.match(footer, /href="https:\/\/github\.com\/amiraq1\/amnabd-deals-web"/);
  assert.doesNotMatch(footer, /href="https:\/\/github\.com\/amiraq1\/amnabd-deals"/);
});
