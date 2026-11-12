// AMN-027 and AMN-028: README must describe the matching rule and the FilterState
// values that the code actually accepts. The code sets are read from filterState.ts.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { test } from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const load = (rel) =>
  import(pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, `src/lib/${rel}.js`)).href);
const readme = readFileSync(join(root, 'README.md'), 'utf8');
const filterSource = readFileSync(join(root, 'src/lib/filterState.ts'), 'utf8');

function codeSet(name) {
  const match = filterSource.match(new RegExp(`const ${name} = new Set<[^>]+>\\(\\[([\\s\\S]*?)\\]\\)`));
  assert.ok(match, `${name} is not found in src/lib/filterState.ts`);
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function documentedRow(key) {
  const line = readme.split('\n').find((row) => row.startsWith(`| ${key} |`));
  assert.ok(line, `README FilterState row for "${key}" is missing`);
  return line;
}

// The value list is the cell text before the first `;` or Arabic `؛`.
function documentedValues(key) {
  const cell = documentedRow(key).split('|')[2];
  return cell
    .split(/[;؛]/)[0]
    .split('/')
    .map((value) => value.trim());
}

const sameValues = (a, b) => assert.deepEqual([...a].sort(), [...b].sort());

test('AMN-027: README no longer describes token matching as plain substring', () => {
  assert.doesNotMatch(readme, /المطابقة substring/);
});

test('AMN-027: README states the word-start rule and the gpt4/gpt40 consequence', () => {
  assert.match(readme, /بداية الكلمة/);
  assert.match(readme, /ولا يطابق `openai`/);
  assert.match(readme, /`gpt4`[^\n]*`gpt40`/);
});

test('AMN-028: documented sort values equal the values the parser accepts', () => {
  sameValues(documentedValues('sort'), codeSet('SORTS'));
});

test('AMN-028: documented applicant values equal the values the parser accepts', () => {
  sameValues(documentedValues('applicant'), codeSet('APPLICANTS'));
});

test('AMN-028: documented card values equal the values the parser accepts', () => {
  sameValues(documentedValues('card'), codeSet('CARDS'));
});

test('AMN-028: documented country_status values equal the values the parser accepts', () => {
  sameValues(documentedValues('country_status'), codeSet('COUNTRY_STATUSES'));
});

test('AMN-028: README does not say expired offers sort last for every sort value', () => {
  assert.doesNotMatch(documentedRow('sort'), /العروض المنتهية دائماً في الآخر/);
});

test('AMN-028: README country cap equals the length the parser keeps for a long country value', async () => {
  const { parseFilterState } = await load('filterState');
  const kept = Array.from(parseFilterState(`?country=${'x'.repeat(250)}`).country).length;
  assert.ok(kept > 0 && kept < 250, `parser kept ${kept} characters`);
  assert.match(documentedRow('country'), new RegExp(`${kept} محرفاً`));
});
