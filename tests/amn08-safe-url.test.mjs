import assert from 'node:assert/strict';
import { test } from 'node:test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const { isSafeUrl, safeUrl } = await import(
  pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, 'src/lib/safeUrl.js'))
);

const accepted = [
  'https://example.com/deal',
  'https://sub.example.co.uk/path?q=1#section',
  'https://example.com:443/deal',
];

const rejected = [
  ['plain HTTP', 'http://example.com/deal'],
  ['javascript scheme', 'javascript:alert(1)'],
  ['data scheme', 'data:text/html,<script>alert(1)</script>'],
  ['credentials', 'https://user:pass@example.com/deal'],
  ['username only', 'https://user@example.com/deal'],
  ['localhost', 'https://localhost/deal'],
  ['localhost subdomain', 'https://app.localhost/deal'],
  ['loopback IPv4', 'https://127.0.0.1/deal'],
  ['loopback IPv4 shorthand', 'https://127.1/deal'],
  ['private 10/8', 'https://10.0.0.5/deal'],
  ['private 172.16/12', 'https://172.20.1.1/deal'],
  ['private 192.168/16', 'https://192.168.1.1/deal'],
  ['link-local IPv4', 'https://169.254.169.254/latest/meta-data'],
  ['CGNAT IPv4', 'https://100.64.0.1/deal'],
  ['IPv6 loopback', 'https://[::1]/deal'],
  ['IPv6 unique-local', 'https://[fd00::1]/deal'],
  ['IPv6 link-local', 'https://[fe80::1]/deal'],
  ['non-443 port', 'https://example.com:8443/deal'],
  ['plain HTTP with port', 'http://example.com:443/deal'],
  ['blocked host', 'https://studentoffers.co/deal'],
  ['blocked www host', 'https://www.studentoffers.co/deal'],
  ['malformed', 'not a url'],
];

for (const url of accepted) {
  test(`accepts public HTTPS URL: ${url}`, () => {
    assert.equal(isSafeUrl(url), true);
    assert.equal(safeUrl(url), url);
  });
}

for (const [label, url] of rejected) {
  test(`rejects ${label}: ${url}`, () => {
    assert.equal(isSafeUrl(url), false);
    assert.equal(safeUrl(url), null);
  });
}
