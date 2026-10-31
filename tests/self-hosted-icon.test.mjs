import assert from 'node:assert/strict';
import { test } from 'node:test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const { selfHostedIconUrl } = await import(
  pathToFileURL(
    join(process.env.AMN_TEST_BUILD_DIR, 'src/lib/selfHostedIcon.js'),
  )
);
const origin = 'https://amnabd.com';

test('absent or empty icons remain monograms', () => {
  for (const value of [undefined, '', '   '])
    assert.equal(selfHostedIconUrl(value, origin), null);
});
test('local paths resolve from site root, never a deal detail route', () => {
  for (const path of ['/icons/tool.svg', 'icons/tool.svg', './icons/tool.svg'])
    assert.equal(selfHostedIconUrl(path, origin), origin + '/icons/tool.svg');
  assert.equal(
    selfHostedIconUrl(' /icons/tool.svg?v=2 ', origin),
    origin + '/icons/tool.svg?v=2',
  );
});
test('only same-origin HTTPS absolute icons are accepted', () => {
  assert.equal(
    selfHostedIconUrl(origin + '/icons/tool.svg', origin),
    origin + '/icons/tool.svg',
  );
  for (const value of [
    'https://example.com/icon.svg',
    'https://cdn.amnabd.com/icon.svg',
    'https://amnabd.com.evil/icon.svg',
    'https://amnabd.com:444/icon.svg',
    'http://amnabd.com/icon.svg',
  ])
    assert.equal(selfHostedIconUrl(value, origin), null);
});
test('never synthesizes or accepts external favicon/CDN discovery URLs', () => {
  for (const value of [
    'https://www.google.com/s2/favicons?domain=amnabd.com',
    'https://cdn.simpleicons.org/github',
    'https://studentoffers.co/icon.svg',
    '//amnabd.com/icon.svg',
    '//evil.example/icon.svg',
  ])
    assert.equal(selfHostedIconUrl(value, origin), null);
});
test('unsafe schemes, credentials, backslashes and control characters are rejected', () => {
  for (const value of [
    'javascript:alert(1)',
    'data:image/svg+xml,svg',
    'blob:https://amnabd.com/id',
    'file:///icons/icon.svg',
    'https://user:pass@amnabd.com/icon.svg',
    '/\\evil.example/icon.svg',
    '/icons/\nicon.svg',
    '#icon',
    '?icon=1',
  ])
    assert.equal(selfHostedIconUrl(value, origin), null);
});
test('HTTP development permits local paths but not absolute HTTP or external URLs', () => {
  const dev = 'http://127.0.0.1:4175';
  assert.equal(
    selfHostedIconUrl('/icons/tool.svg', dev),
    dev + '/icons/tool.svg',
  );
  assert.equal(selfHostedIconUrl(dev + '/icons/tool.svg', dev), null);
  assert.equal(
    selfHostedIconUrl('https://127.0.0.1:4175/icons/tool.svg', dev),
    null,
  );
});
test('invalid origins fail closed', () => {
  for (const site of ['', 'not a URL', 'file:///tmp/', 'data:text/plain,hi'])
    assert.equal(selfHostedIconUrl('/icons/tool.svg', site), null);
});
