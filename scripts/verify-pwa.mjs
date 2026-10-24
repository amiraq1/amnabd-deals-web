import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isImmutableHashedAsset } from './generate-pwa.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  }))).flat();
}

export async function verifyPwaArtifacts(distDir = join(ROOT, 'dist')) {
  const manifest = JSON.parse(await readFile(join(distDir, 'manifest.webmanifest'), 'utf8'));
  assert.equal(manifest.start_url, '/');
  assert.equal(manifest.scope, '/');
  assert.equal(manifest.display, 'standalone');
  assert.ok(manifest.name && manifest.short_name);
  for (const size of ['192x192', '512x512']) {
    const icon = manifest.icons.find((entry) => entry.sizes === size && entry.purpose === 'any');
    assert.ok(icon, `Manifest is missing a ${size} any-purpose icon`);
    assert.match(icon.src, /^\/amnabd-icon-[a-f0-9]{12}-(192|512)\.png$/);
    const png = await readFile(join(distDir, icon.src.slice(1)));
    const expected = Number(size.split('x')[0]);
    assert.equal(png.readUInt32BE(16), expected);
    assert.equal(png.readUInt32BE(20), expected);
  }
  assert.ok(manifest.icons.some((entry) => entry.purpose === 'maskable' && entry.sizes === '512x512'));

  const worker = await readFile(join(distDir, 'sw.js'), 'utf8');
  assert.ok(!/__[A-Z_]+__/.test(worker), 'Worker contains unresolved build placeholders');
  const precacheMatch = worker.match(/^const PRECACHE_URLS = (.+);$/m);
  assert.ok(precacheMatch, 'Worker must include an explicit immutable-asset allowlist');
  const precacheUrls = JSON.parse(precacheMatch[1]);
  const versionedMatch = worker.match(/^const VERSIONED_ASSETS = new Set\((.+)\);$/m);
  assert.ok(versionedMatch, 'Worker must use the same explicit list for fetch handling');
  assert.deepEqual(JSON.parse(versionedMatch[1]), precacheUrls);
  assert.ok(precacheUrls.length >= 5);
  for (const url of precacheUrls) {
    const isAsset = url.startsWith('/assets/') && isImmutableHashedAsset(url);
    const isOffline = /^\/offline-[a-f0-9]{12}\.html$/.test(url);
    const isIcon = /^\/amnabd-icon-[a-f0-9]{12}-(?:192|512|maskable-512)\.png$/.test(url);
    assert.ok(isAsset || isOffline || isIcon, `Unsafe PWA cache URL: ${url}`);
    await readFile(join(distDir, url.slice(1)));
  }
  assert.ok(!precacheUrls.includes('/') && !precacheUrls.includes('/index.html'));
  assert.equal(precacheUrls.filter((url) => url.endsWith('.html')).length, 1);
  assert.match(worker, /request\.mode === 'navigate'/);
  assert.match(worker, /cache: 'no-store'/);
  assert.match(worker, /url\.origin !== self\.location\.origin/);

  const htmlFiles = (await listFiles(distDir)).filter((path) => path.endsWith('.html'));
  let appPages = 0;
  for (const path of htmlFiles) {
    const name = relative(distDir, path);
    if (/^offline(?:-[a-f0-9]{12})?\.html$/.test(name)) continue;
    const html = await readFile(path, 'utf8');
    assert.ok(html.includes('/manifest.webmanifest'), `${name} lost the manifest link`);
    assert.ok(!html.includes('data-pwa-icon'), `${name} has an unprocessed icon placeholder`);
    assert.match(html, /rel="apple-touch-icon" href="\/amnabd-icon-[a-f0-9]{12}-192\.png"/);
    appPages += 1;
  }
  return { appPages, precachedAssets: precacheUrls.length, manifest };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const result = await verifyPwaArtifacts();
  console.log(`[pwa-verify] ${result.appPages} app HTML pages retain PWA metadata; ${result.precachedAssets} versioned static files only.`);
}
