// Real HTTP smoke test after Pages deployment. A build-time fixture cannot prove
// the CDN's status codes or that the newly deployed files are actually served.
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';

const base = process.env.DEPLOY_URL?.replace(/\/+$/, '');
if (!base || new URL(base).protocol !== 'https:') throw new Error('DEPLOY_URL must be the deployed HTTPS Pages URL');
const paths = ['/', '/guide', '/favorites', '/compare', '/changelog', '/for-students', '/no-credit-card', '/coding', '/ending-soon', '/free-api-keys-directory', '/free-ai-models-directory', '/sms-suppliers-directory', '/privacy-policy'];

async function check() {
  for (const path of paths) {
    const response = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(15000), cache: 'no-store', redirect: path === '/guide' || path === '/favorites' ? 'manual' : 'follow' });
    assert.equal(response.status, 200, `${path}: HTTP ${response.status}`);
    if (path !== '/guide' && path !== '/favorites') continue;
    const html = await response.text();
    assert.match(html, new RegExp(`<link\\s+rel=["']canonical["']\\s+href=["'][^"']*/${path.slice(1)}["']`, 'i'), `${path}: canonical`);
    assert.doesNotMatch(html, /href=["'][^"']*\/404["']/i, `${path}: inherited 404 canonical`);
    const noindex = /<meta\s+name=["']robots["'][^>]*noindex/i.test(html);
    assert.equal(noindex, path === '/favorites', `${path}: robots`);
  }
  const missing = await fetch(`${base}/__amnabd_missing_route_smoke_test__`, { signal: AbortSignal.timeout(15000), cache: 'no-store' });
  assert.equal(missing.status, 404, `missing path: HTTP ${missing.status}`);
}

let error;
for (let attempt = 1; attempt <= 5; attempt++) {
  try { await check(); console.log('Deployed route smoke test passed.'); error = undefined; break; }
  catch (err) { error = err; console.warn(`Attempt ${attempt}: ${err.message}`); if (attempt < 5) await delay(15000); }
}
if (error) { console.error(error); process.exitCode = 1; }
