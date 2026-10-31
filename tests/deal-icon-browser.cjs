// Optional local QA: use environment-supplied Playwright/Chromium, no project dependency.
// Runs the real DealIcon in a temporary Vite harness; no production API or artwork.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const port = Number(process.env.AMN_ICON_QA_PORT || 4181);
const base = `http://127.0.0.1:${port}`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  const temp = fs.mkdtempSync(path.join(root, '.qa-icon-'));
  const out =
    process.env.AMN_ICON_QA_OUTPUT ||
    fs.mkdtempSync(path.join(os.tmpdir(), 'amnabd-icons-'));
  fs.mkdirSync(out, { recursive: true });
  let server, browser;
  try {
    fs.writeFileSync(
      path.join(temp, 'index.html'),
      `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/${path.basename(temp)}/main.tsx"></script></body></html>`,
    );
    fs.writeFileSync(
      path.join(temp, 'main.tsx'),
      `
import {useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import DealIcon from '../src/components/DealIcon';
import type {Deal} from '../src/types';
import '../src/index.css';
function Harness() {
  const [changing,setChanging] = useState('/icons/qa-broken.svg');
  useEffect(() => {Object.assign(window,{__setIcon:setChanging});},[]);
  const cases = [
    ['absent',undefined,'md'],
    ['local','/icons/qa-good.svg','md'],
    ['external','https://cdn.example/icon.svg','md'],
    ['broken','/icons/qa-broken.svg','md'],
    ['changing',changing,'md'],
    ['small','/icons/qa-good.svg','sm'],
    ['large','/icons/qa-good.svg','lg'],
  ] as const;
  return <main style={{padding:16,display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:16}}>
    {cases.map(([id,icon_url,size])=><section key={id} data-case={id} style={{padding:16,border:'1px solid #334155',borderRadius:16,minWidth:0}}>
      <p style={{fontSize:14,marginBottom:16}}>{id}</p>
      <DealIcon deal={{name:'QA Example',icon_url} as Deal} size={size}/>
    </section>)}
  </main>;
}
createRoot(document.getElementById('root')!).render(<Harness/>);
`,
    );
    server = spawn(
      process.execPath,
      [
        path.join(root, 'node_modules/vite/bin/vite.js'),
        '--host',
        '127.0.0.1',
        '--port',
        String(port),
        '--strictPort',
      ],
      { cwd: root, stdio: 'ignore' },
    );
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try {
        const r = await fetch(base);
        if (r.ok) {
          ready = true;
          break;
        }
      } catch {
        // The local QA server may still be starting.
      }
      await sleep(100);
    }
    assert.ok(ready, 'local Vite QA server did not start');
    browser = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH || '/usr/local/bin/chromium',
      args: ['--no-sandbox'],
    });
    const context = await browser.newContext({
      viewport: { width: 320, height: 800 },
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    });
    const external = [],
      errors = [],
      iconRequests = [];
    await context.route('**/*', async (route) => {
      const u = new URL(route.request().url());
      if (u.origin !== base) {
        external.push(u.href);
        return route.abort();
      }
      if (u.pathname.startsWith('/icons/')) {
        iconRequests.push(u.pathname);
        if (u.pathname.includes('broken'))
          return route.fulfill({ status: 404, body: '' });
        return route.fulfill({
          contentType: 'image/svg+xml',
          body: '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect x="6" y="6" width="36" height="36" rx="8" fill="#10b981"/></svg>',
        });
      }
      return route.continue();
    });
    const p = await context.newPage();
    p.on('pageerror', (e) => errors.push(e.message));
    await p.goto(`${base}/${path.basename(temp)}/index.html`);
    const cell = (id) => p.locator(`[data-case="${id}"]`);
    for (const id of ['absent', 'external', 'broken', 'changing']) {
      await cell(id).locator('.offer-monogram').waitFor();
      assert.equal(await cell(id).locator('img').count(), 0, id);
      assert.equal(await cell(id).locator('bdi').innerText(), 'Q');
    }
    const image = cell('local').locator('img');
    await image.waitFor();
    await p.waitForFunction(
      () =>
        document.querySelector('[data-case="local"] img')?.naturalWidth === 48,
    );
    for (const [attribute, value] of [
      ['loading', 'lazy'],
      ['decoding', 'async'],
      ['referrerpolicy', 'no-referrer'],
      ['alt', ''],
      ['aria-hidden', 'true'],
    ])
      assert.equal(await image.getAttribute(attribute), value);
    const before = await cell('changing')
      .locator('.offer-monogram')
      .boundingBox();
    await p.evaluate(() => window.__setIcon('/icons/qa-good-2.svg'));
    await p.waitForFunction(
      () =>
        document.querySelector('[data-case="changing"] img')?.naturalWidth ===
        48,
    );
    const after = await cell('changing').locator('img').boundingBox();
    assert.deepEqual(
      { width: before.width, height: before.height, x: before.x, y: before.y },
      { width: after.width, height: after.height, x: after.x, y: after.y },
    );
    await p.evaluate(() =>
      window.__setIcon('https://www.google.com/s2/favicons?domain=example.com'),
    );
    await cell('changing').locator('.offer-monogram').waitFor();
    assert.equal(await cell('changing').locator('img').count(), 0);
    // A second failed URL must not block a later successful image either.
    await Promise.all([
      p.waitForResponse((response) =>
        response.url().endsWith('/icons/qa-broken-2.svg'),
      ),
      p.evaluate(() => window.__setIcon('/icons/qa-broken-2.svg')),
    ]);
    await cell('changing').locator('.offer-monogram').waitFor();
    await p.evaluate(() => window.__setIcon('/icons/qa-good-3.svg'));
    await p.waitForFunction(
      () =>
        document.querySelector('[data-case="changing"] img')?.naturalWidth ===
        48,
    );
    const sizes = [];
    for (const width of [320, 1280]) {
      await p.setViewportSize({ width, height: 800 });
      for (const [id, expected] of [
        ['small', 36],
        ['local', 48],
        ['broken', 48],
        ['large', width < 640 ? 56 : 64],
      ]) {
        const box = await cell(id)
          .locator('.offer-icon,.offer-monogram')
          .boundingBox();
        assert.equal(box.width, expected, id);
        assert.equal(box.height, expected, id);
        sizes.push({
          viewport: width,
          id,
          width: box.width,
          height: box.height,
        });
      }
      assert.equal(
        await p.evaluate(() => document.documentElement.scrollWidth),
        width,
      );
      await p.screenshot({
        path: path.join(out, `icons-${width}.png`),
        fullPage: true,
      });
    }
    assert.deepEqual(external, []);
    assert.deepEqual(errors, []);
    const report = {
      passed: true,
      checks: [
        'absent fallback',
        'external rejected without request',
        'local image attributes and loaded pixels',
        '404 fallback',
        'new source recovers after failure',
        'second failure recovers',
        'unchanged image/fallback dimensions',
        'sm/md/lg dimensions',
        '320/1280 no overflow',
        'no third-party requests',
        'no JS exceptions',
      ],
      sizes,
      iconRequests,
      external,
      errors,
    };
    fs.writeFileSync(
      path.join(out, 'report.json'),
      JSON.stringify(report, null, 2),
    );
    console.log(JSON.stringify(report, null, 2));
  } finally {
    if (browser) await browser.close();
    if (server) {
      server.kill();
      await new Promise((resolve) => {
        server.once('exit', resolve);
        setTimeout(resolve, 2000);
      });
    }
    fs.rmSync(temp, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
