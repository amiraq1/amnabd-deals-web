import assert from 'node:assert/strict';
import { test } from 'node:test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const { countryAvailability } = await import(
  pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, 'src/lib/countryAvailability.js'))
);

function deal(overrides = {}) {
  return {
    id: 'country-test',
    slug: 'country-test',
    eligibility: {
      countries: { status: 'unknown', values: [] },
    },
    official_sources: [],
    review: {
      reviewed_on: '2026-10-24',
      verification_status: 'supported',
      unknown_fields: [],
    },
    ...overrides,
  };
}

function sourceClaim(field, value, evidence, url = 'https://official.example.test/terms') {
  return { url, title: 'Official eligibility rules', claims: [{ field, value, evidence }] };
}

test('explicit reviewed eligible-country field and official source support exact country names', () => {
  const row = deal({
    eligibility: { countries: { status: 'specified', values: ['Iraq'] } },
    official_sources: [
      sourceClaim(
        'eligibility.countries.values',
        ['Iraq'],
        'The official eligible-country list explicitly includes Iraq.'
      ),
    ],
  });
  assert.equal(countryAvailability(row, 'Iraq'), 'supported');
  assert.equal(countryAvailability(row, 'العراق'), 'supported');
  assert.equal(countryAvailability(row, 'Jordan'), 'unknown');
});

test('explicit global evidence is required; a missing restriction is never global support', () => {
  const global = deal({
    eligibility: { countries: { status: 'stated_global', values: [] } },
    official_sources: [
      sourceClaim(
        'eligibility.countries.status',
        'stated_global',
        'The program is open to students from any school, any country, and any major.'
      ),
    ],
  });
  assert.equal(countryAvailability(global, 'Iraq'), 'supported');

  const absentRestrictions = deal({
    eligibility: { countries: { status: 'unknown', values: [] } },
    official_sources: [
      { url: 'https://provider.example.test/pricing', title: 'Provider pricing', claims: [] },
    ],
  });
  assert.equal(countryAvailability(absentRestrictions, 'Iraq'), 'unknown');
});

test('explicit country exclusion requires the country in a reviewed restricted list and source claim', () => {
  const restricted = deal({
    eligibility: { countries: { status: 'restricted', values: ['Mainland China'] } },
    official_sources: [
      sourceClaim(
        'eligibility.countries',
        'One app per eligible organization, outside Mainland China',
        'Campaign eligibility text restricts the offer to one app per eligible organization and excludes Mainland China.'
      ),
    ],
  });
  assert.equal(countryAvailability(restricted, 'Mainland China'), 'excluded');
  assert.equal(countryAvailability(restricted, 'الصين القارية'), 'excluded');
  assert.equal(countryAvailability(restricted, 'Iraq'), 'unknown');
});

test('existing country unknown markers override apparent field values and claims', () => {
  const explicit = deal({
    eligibility: { countries: { status: 'specified', values: ['Iraq'] } },
    official_sources: [
      sourceClaim(
        'eligibility.countries.values',
        ['Iraq'],
        'The official eligible-country list explicitly includes Iraq.'
      ),
    ],
  });
  for (const marker of ['eligibility.countries', 'eligibility.countries.values', 'Iraq_availability']) {
    const withUnknown = { ...explicit, review: { ...explicit.review, unknown_fields: [marker] } };
    assert.equal(countryAvailability(withUnknown, 'Iraq'), 'unknown', marker);
  }
});

test('prose, provider domains, unreviewed records, and unsafe source URLs cannot establish a country state', () => {
  const proseOnly = deal({
    eligibility: { countries: { status: 'specified', values: ['Iraq'] } },
    official_sources: [
      { url: 'https://provider.example.test', title: 'Official provider', claims: [
        { field: 'description_en', value: 'Iraq is available', evidence: 'Promotional page wording.' },
      ] },
    ],
  });
  assert.equal(countryAvailability(proseOnly, 'Iraq'), 'unknown');

  const unreviewed = deal({
    eligibility: { countries: { status: 'specified', values: ['Iraq'] } },
    official_sources: [sourceClaim('eligibility.countries.values', ['Iraq'], 'Iraq is eligible.')],
    review: { reviewed_on: '2026-10-24', verification_status: 'needs_review', unknown_fields: [] },
  });
  assert.equal(countryAvailability(unreviewed, 'Iraq'), 'unknown');

  const unsafe = deal({
    eligibility: { countries: { status: 'specified', values: ['Iraq'] } },
    official_sources: [
      sourceClaim(
        'eligibility.countries.values',
        ['Iraq'],
        'The official eligible-country list explicitly includes Iraq.',
        'http://official.example.test/terms'
      ),
    ],
  });
  assert.equal(countryAvailability(unsafe, 'Iraq'), 'unknown');
});
