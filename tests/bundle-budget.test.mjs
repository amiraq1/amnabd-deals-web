import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { test } from 'node:test';

const root = process.cwd();
const kb = (bytes) => Math.round((bytes / 1024) * 100) / 100;

test('bundle budget measures entry-linked assets and excludes lazy route chunks', () => {
  const dist = mkdtempSync(join(tmpdir(), 'amnabd-bundle-budget-'));
  try {
    mkdirSync(join(dist, 'assets'), { recursive: true });
    const html = '<!doctype html><html><head><link rel="stylesheet" href="/assets/app.css"></head><body><script type="module" src="/assets/main.js"></script></body></html>';
    const main = 'export const main = true;';
    const css = 'body { color: white; }';
    writeFileSync(join(dist, 'index.html'), html);
    writeFileSync(join(dist, 'assets', 'main.js'), main);
    writeFileSync(join(dist, 'assets', 'app.css'), css);
    writeFileSync(join(dist, 'assets', 'lazy-route.js'), 'unused lazy route payload '.repeat(10000));

    const result = spawnSync(process.execPath, [join(root, 'scripts/check-bundle-budget.mjs'), '--json'], {
      encoding: 'utf8',
      env: { ...process.env, AMN_DIST_DIR: dist },
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const report = JSON.parse(result.stdout);
    assert.equal(report.measured.js, kb(gzipSync(main).length));
    assert.equal(report.measured.css, kb(gzipSync(css).length));
    assert.equal(report.measured.html, kb(gzipSync(html).length));
    assert.equal(report.over.length, 0);
  } finally {
    rmSync(dist, { recursive: true, force: true });
  }
});
