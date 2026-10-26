// Real-browser reflow check for AMN-005 (audit Phase 1).
//
// The audit could only simulate 200% text size and a 160px viewport, and
// explicitly refused to call the result a WCAG failure. This script measures
// the same conditions in an actual browser engine, without Playwright: it
// drives headless Chrome over the DevTools protocol using Node's built-in
// WebSocket, so it adds no dependency to the project.
//
//   node tests/reflow-browser.cjs
//
// Env:
//   AMN_PREVIEW_URL   page to measure (default http://127.0.0.1:4173/)
//   CHROME_PATH       browser binary; otherwise a known install is looked up
//   AMN_REFLOW_REPORT path for the JSON report (default: stdout only)
//   AMN_REFLOW_STRICT set to 1 to exit non-zero when horizontal overflow is found
//
// What the cases mean:
//   - 320 CSS px is the reflow floor (WCAG 1.4.10).
//   - "text 200%" doubles the root font size, which is WCAG 1.4.4 resize text.
//   - 160 CSS px approximates a 320px window at 200% browser zoom: zoom halves
//     the CSS pixel budget, it does not merely narrow the window.

const { spawn } = require('node:child_process');
const { existsSync, mkdtempSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

const PREVIEW_URL = process.env.AMN_PREVIEW_URL || 'http://127.0.0.1:4173/';
const PORT = Number(process.env.AMN_REFLOW_PORT || 9333);
const STRICT = process.env.AMN_REFLOW_STRICT === '1';

const CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

const CASES = [
  { id: '320px', width: 320, rootFontPx: 16 },
  { id: '320px-text-200', width: 320, rootFontPx: 32 },
  { id: '160px-zoom-200', width: 160, rootFontPx: 16 },
];

function findBrowser() {
  const found = CANDIDATES.find((path) => existsSync(path));
  if (!found) throw new Error(`no browser found; set CHROME_PATH. Tried: ${CANDIDATES.join(', ')}`);
  return found;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForDevTools(timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      if (response.ok) {
        const targets = await response.json();
        // The browser-level endpoint cannot speak Page/Runtime; attach to the page target.
        const page = targets.find((target) => target.type === 'page');
        if (page?.webSocketDebuggerUrl) return page;
      }
    } catch {
      /* not up yet */
    }
    await sleep(200);
  }
  throw new Error('DevTools page target did not come up');
}

function createClient(ws) {
  let nextId = 1;
  const pending = new Map();
  const listeners = new Map();

  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
      return;
    }
    const waiters = listeners.get(message.method);
    if (waiters) {
      listeners.delete(message.method);
      for (const resolve of waiters) resolve(message.params);
    }
  });

  return {
    send(method, params = {}) {
      const id = nextId++;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    },
    once(method) {
      return new Promise((resolve) => {
        const waiters = listeners.get(method) ?? [];
        waiters.push(resolve);
        listeners.set(method, waiters);
      });
    },
  };
}

const MEASURE = `(() => {
  const doc = document.documentElement;
  const width = doc.clientWidth;
  const offenders = [];
  for (const node of document.querySelectorAll('body *')) {
    const rect = node.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;
    if (rect.right > width + 1 || rect.left < -1) {
      offenders.push({
        tag: node.tagName.toLowerCase(),
        cls: (node.getAttribute('class') || '').slice(0, 80),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
      });
      if (offenders.length >= 8) break;
    }
  }
  return JSON.stringify({
    clientWidth: width,
    scrollWidth: doc.scrollWidth,
    overflow: doc.scrollWidth > width + 1,
    offenders,
  });
})()`;

// Measure repeatedly until three consecutive samples agree. Returns the last
// sample even if the layout never settles, so a genuinely unstable page still
// produces a number rather than a timeout.
async function measureStable(client, attempts = 40) {
  let last = null;
  let agreed = 0;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const measured = await client.send('Runtime.evaluate', { expression: MEASURE, returnByValue: true });
    const data = JSON.parse(measured.result.value);
    if (last && data.scrollWidth === last.scrollWidth && data.overflow === last.overflow) agreed += 1;
    else agreed = 0;
    last = data;
    if (agreed >= 3) return data;
    await sleep(100);
  }
  return last;
}

async function main() {
  const browser = findBrowser();
  const profile = mkdtempSync(join(tmpdir(), 'amn-reflow-'));
  const child = spawn(
    browser,
    [
      '--headless=new',
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${profile}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      '--hide-scrollbars',
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  try {
    const version = await waitForDevTools();
    const ws = new WebSocket(version.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', reject, { once: true });
    });
    const client = createClient(ws);
    await client.send('Page.enable');
    await client.send('Runtime.enable');

    const results = [];
    for (const testCase of CASES) {
      await client.send('Emulation.setDeviceMetricsOverride', {
        width: testCase.width,
        height: 800,
        deviceScaleFactor: 1,
        mobile: false,
      });

      const loaded = client.once('Page.loadEventFired');
      await client.send('Page.navigate', { url: PREVIEW_URL });
      await loaded;
      // Fonts change metrics after load, and the list re-renders once the
      // catalog request settles. Measuring on a fixed timer made the first run
      // of a session disagree with the second, so wait for the layout to stop
      // changing instead: three identical samples in a row.
      await client.send('Runtime.evaluate', {
        expression: 'document.fonts && document.fonts.ready ? document.fonts.ready.then(() => true) : true',
        awaitPromise: true,
      });

      await client.send('Runtime.evaluate', {
        expression: `document.documentElement.style.fontSize = '${testCase.rootFontPx}px'`,
      });

      const data = await measureStable(client);
      results.push({ case: testCase.id, width: testCase.width, rootFontPx: testCase.rootFontPx, ...data });
    }

    const report = { url: PREVIEW_URL, browser, cases: results };
    const json = JSON.stringify(report, null, 2);
    if (process.env.AMN_REFLOW_REPORT) writeFileSync(process.env.AMN_REFLOW_REPORT, json);
    console.log(json);

    const overflowing = results.filter((entry) => entry.overflow);
    if (overflowing.length && STRICT) {
      console.error(`reflow: ${overflowing.length} case(s) overflow horizontally`);
      process.exitCode = 1;
    }
    ws.close();
  } finally {
    child.kill();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
