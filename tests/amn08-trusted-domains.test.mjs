import assert from 'node:assert/strict';
import { test } from 'node:test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const { isTrustedDealUrl, safeDealUrl, resolveDealOfficialUrl } = await import(
  pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, 'src/lib/safeUrl.js'))
);

const accepted = [
  'https://docs.github.com/en/copilot/get-started/plans',
  'https://www.figma.com/pricing',
  'https://forms.gle/abc123',
  'https://kiroween.devpost.com/',
  'https://sbintuitions.co.jp/news',
  'https://router.bynara.id/v1',
];

const rejected = [
  ['lookalike suffix', 'https://github.com.evil.example/deal'],
  ['lookalike prefix', 'https://evilgithub.com/deal'],
  ['user content host', 'https://user.github.io/deal'],
  ['unrelated devpost project', 'https://foo.devpost.com/'],
  ['lookalike after exact host', 'https://nic.eu.org.evil.example/'],
  ['unknown provider', 'https://evil.example/deal'],
  ['plain example domain', 'https://example.com/deal'],
  ['plain HTTP', 'http://figma.com/pricing'],
  ['credentials', 'https://user:pass@figma.com/pricing'],
  ['non-443 port', 'https://figma.com:8443/pricing'],
];

for (const url of accepted) {
  test(`accepts trusted provider URL: ${url}`, () => {
    assert.equal(isTrustedDealUrl(url), true);
    assert.equal(safeDealUrl(url), url);
  });
}

for (const [label, url] of rejected) {
  test(`rejects ${label}: ${url}`, () => {
    assert.equal(isTrustedDealUrl(url), false);
    assert.equal(safeDealUrl(url), null);
  });
}

test('deal official URL falls back to a trusted offer link', () => {
  const deal = {
    official_sources: [{ url: 'https://www.figma.com.evil.example/clone' }],
    get_offer: { url: 'https://www.figma.com/pricing' },
  };
  assert.equal(resolveDealOfficialUrl(deal), 'https://www.figma.com/pricing');
  assert.equal(
    resolveDealOfficialUrl({
      official_sources: [{ url: 'https://www.figma.com.evil.example/clone' }],
      get_offer: { url: 'https://evil.example/offer' },
    }),
    null
  );
});
