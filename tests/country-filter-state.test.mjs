import assert from 'node:assert/strict';
import { test } from 'node:test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const { parseFilterState, serializeFilterState } = await import(
  pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, 'src/lib/filterState.js'))
);

test('selected country and evidence state round-trip in stable shareable URL parameters', () => {
  const parsed = parseFilterState('?q=API&country=Iraq&country_status=unknown&sort=deadline');
  assert.equal(parsed.country, 'Iraq');
  assert.equal(parsed.countryStatus, 'unknown');
  assert.equal(
    serializeFilterState(parsed),
    'q=API&country=Iraq&country_status=unknown&sort=deadline'
  );
});

test('country input is trimmed, control characters are removed, and long values are bounded', () => {
  const parsed = parseFilterState(`country=%20Iraq%0A&country_status=excluded`);
  assert.equal(parsed.country, 'Iraq');
  assert.equal(parsed.countryStatus, 'excluded');

  const long = parseFilterState(`country=${'x'.repeat(100)}`);
  assert.equal(Array.from(long.country).length, 80);
});

test('country status is ignored without a selected country or when unrecognized', () => {
  const noCountry = parseFilterState('?country_status=excluded');
  assert.equal(noCountry.country, '');
  assert.equal(noCountry.countryStatus, 'all');
  assert.equal(serializeFilterState(noCountry), '');

  const invalid = parseFilterState('?country=Iraq&country_status=worldwide');
  assert.equal(invalid.countryStatus, 'all');
  assert.equal(serializeFilterState(invalid), 'country=Iraq');
});
