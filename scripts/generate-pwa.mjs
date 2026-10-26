import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const HASHED_ASSET = /-[a-z0-9_-]{8,}\.(?:js|css|woff2?|ttf|otf|png|jpe?g|webp|avif|svg)$/i;

function sha256(value) {
  return createHash('sha256').update(value).digest('hex').slice(0, 12);
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? listFiles(path) : [path];
    }),
  );
  return nested.flat();
}

export function isImmutableHashedAsset(path) {
  return HASHED_ASSET.test(path.split(/[\\/]/).pop() ?? '');
}

export function renderServiceWorker(template, { cacheName, precacheUrls, versionedAssets, offlineUrl }) {
  return template
    .replace('__CACHE_NAME__', JSON.stringify(cacheName))
    .replace('__PRECACHE_URLS__', JSON.stringify(precacheUrls))
    .replace('__VERSIONED_ASSETS__', JSON.stringify(versionedAssets))
    .replace('__OFFLINE_URL__', JSON.stringify(offlineUrl));
}

export async function generatePwaArtifacts({
  root = ROOT,
  distDir = join(root, 'dist'),
  publicDir = join(root, 'public'),
} = {}) {
  const indexPath = join(distDir, 'index.html');
  const originalIndex = await readFile(indexPath, 'utf8');
  const assetDirectory = join(distDir, 'assets');
  const hashedAssets = (await listFiles(assetDirectory))
    .filter(isImmutableHashedAsset)
    .map((path) => `/${relative(distDir, path).split('\\').join('/')}`)
    .sort();
  if (!hashedAssets.some((path) => path.endsWith('.js')) || !hashedAssets.some((path) => path.endsWith('.css')))
    throw new Error('PWA build requires hashed JavaScript and CSS assets in dist/assets.');

  const iconSvg = await readFile(join(publicDir, 'favicon.svg'), 'utf8');
  const offlineTemplate = await readFile(join(publicDir, 'offline.html'), 'utf8');
  const workerTemplate = await readFile(join(publicDir, 'sw.js'), 'utf8');
  const generatorSource = await readFile(fileURLToPath(import.meta.url), 'utf8');
  const fingerprint = sha256(
    [originalIndex, iconSvg, offlineTemplate, workerTemplate, generatorSource, ...hashedAssets].join('\n'),
  );
  const offlineFilename = `offline-${fingerprint}.html`;
  const offlineUrl = `/${offlineFilename}`;
  const icon192Filename = `amnabd-icon-${fingerprint}-192.png`;
  const icon512Filename = `amnabd-icon-${fingerprint}-512.png`;
  const maskable512Filename = `amnabd-icon-${fingerprint}-maskable-512.png`;

  await writeFile(join(distDir, offlineFilename), offlineTemplate);
  for (const size of [192, 512]) {
    const renderer = new Resvg(iconSvg, { fitTo: { mode: 'width', value: size } });
    const filename = size === 192 ? icon192Filename : icon512Filename;
    await writeFile(join(distDir, filename), renderer.render().asPng());
  }
  const maskableSvg = iconSvg.replace('rx="7"', 'rx="0"');
  const maskableRenderer = new Resvg(maskableSvg, { fitTo: { mode: 'width', value: 512 } });
  await writeFile(join(distDir, maskable512Filename), maskableRenderer.render().asPng());

  const icon192Url = `/${icon192Filename}`;
  const icon512Url = `/${icon512Filename}`;
  const maskable512Url = `/${maskable512Filename}`;
  const manifest = {
    id: '/',
    name: 'نبض',
    short_name: 'نبض',
    description: 'A bilingual, source-linked guide to AI and cloud offers.',
    lang: 'ar',
    dir: 'rtl',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#020617',
    icons: [
      { src: icon192Url, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: icon512Url, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: maskable512Url, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
  await writeFile(join(distDir, 'manifest.webmanifest'), `${JSON.stringify(manifest, null, 2)}\n`);

  const versionedAssets = [...hashedAssets, offlineUrl, icon192Url, icon512Url, maskable512Url];
  const cacheName = `amnabd-static-${fingerprint}`;
  const worker = renderServiceWorker(workerTemplate, {
    cacheName,
    precacheUrls: versionedAssets,
    versionedAssets,
    offlineUrl,
  });
  await writeFile(join(distDir, 'sw.js'), worker);

  const appleIconLink = /<link\s+rel="apple-touch-icon"\s+href="[^"]+"\s+data-pwa-icon\s*\/>/;
  if (!appleIconLink.test(originalIndex))
    throw new Error('index.html must include the data-pwa-icon Apple touch icon placeholder.');
  const htmlFiles = (await listFiles(distDir)).filter((path) => path.endsWith('.html'));
  for (const htmlPath of htmlFiles) {
    const html = await readFile(htmlPath, 'utf8');
    if (!appleIconLink.test(html)) continue;
    await writeFile(
      htmlPath,
      html.replace(appleIconLink, `<link rel="apple-touch-icon" href="${icon192Url}" />`),
    );
  }

  return { fingerprint, cacheName, hashedAssets, offlineUrl, icon192Url, icon512Url, maskable512Url, versionedAssets };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const result = await generatePwaArtifacts();
  console.log(
    `[pwa] generated ${result.cacheName} with ${result.hashedAssets.length} immutable build assets and an offline-only fallback.`,
  );
}
