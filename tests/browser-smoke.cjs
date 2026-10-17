// Optional QA: requires Playwright + Chromium in the QA environment. Not used by npm test.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('fs');
const row = (x = {}) => ({
  id: 'offer',
  slug: 'offer',
  name_ar: 'اسم العرض',
  name_en: 'Offer',
  ...x,
});
const config = {
  id: 'main',
  last_reviewed: '2026-10-17',
  overview: { ar: { distinction_title: 'التواريخ' }, en: { distinction_title: 'Dates' } },
  section_labels: {},
};
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
    args: ['--no-sandbox'],
  });
  const results = [];
  async function run(name, opt, check) {
    const c = await b.newContext();
    const p = await c.newPage();
    const errors = [],
      logs = [];
    p.on('pageerror', (e) => errors.push(e.message));
    p.on('console', (m) => logs.push(m.text()));
    await c.route('**/*', (r) => {
      const u = new URL(r.request().url());
      if (u.hostname === 'audit-fixture.supabase.co') {
        const data = u.pathname.endsWith('/deals')
          ? 'deals' in opt
            ? opt.deals
            : [row()]
          : u.pathname.endsWith('/usage_guides')
            ? 'guides' in opt
              ? opt.guides
              : []
            : 'config' in opt
              ? opt.config
              : config;
        return r.fulfill({ contentType: 'application/json', body: JSON.stringify(data) });
      }
      if (u.hostname !== '127.0.0.1') return r.abort();
      return r.continue();
    });
    await p.goto(
      (process.env.AMN_PREVIEW_URL || 'http://127.0.0.1:4173').replace(/\/$/, '') +
        '/' +
        (opt.hash || '')
    );
    await p.waitForTimeout(250);
    await check(p, logs);
    assert.deepEqual(errors, [], name + ' JS errors');
    assert.ok((await p.locator('#root').innerHTML()).length > 0);
    results.push({ name, result: 'PASS' });
    await c.close();
  }
  await run('AMN-002 valid review date in both languages', {}, async (p) => {
    let t = await p.locator('main').innerText();
    assert.match(t, /آخر مراجعة للمصادر: 2026-10-17/);
    assert.doesNotMatch(t, /موعد التسجيل:/);
    await p.getByRole('button', { name: 'Switch to English' }).click();
    await p.waitForTimeout(200);
    assert.match(await p.locator('main').innerText(), /Last reviewed: 2026-10-17/);
  });
  await run(
    'AMN-002 invalid date remains unknown',
    { config: { ...config, last_reviewed: '2026-02-30' } },
    async (p) => assert.match(await p.locator('main').innerText(), /آخر مراجعة للمصادر: غير معلوم/)
  );
  await run(
    'AMN-005 video count and duration retain Arabic units',
    {
      deals: [
        row({
          benefits: [
            {
              type: 'feature_access',
              amount: { value: 5, unit: 'videos', currency: null },
              duration: { value: 1, unit: 'months', status: 'known' },
            },
          ],
        }),
      ],
    },
    async (p) => {
      let t = await p.locator('main').innerText();
      assert.match(t, /٥ مقاطع فيديو/);
      assert.match(t, /شهر واحد/);
      assert.doesNotMatch(t, /١ شهرًا/);
    }
  );
  await run(
    'AMN-005 token quota retains unit',
    {
      deals: [row({ benefits: [{ amount: { value: 7000000, unit: 'tokens', currency: null } }] })],
    },
    async (p) => assert.match(await p.locator('article').innerText(), /رمز/)
  );
  await run(
    'AMN-007 SQL defaults do not crash detail',
    { deals: [row({ review: {}, eligibility: {}, benefits: [] })], hash: '#/deal/offer' },
    async (p) => {
      assert.match(await p.locator('h1').innerText(), /Offer/);
      assert.match(await p.locator('main').innerText(), /غير معلوم/);
    }
  );
  await run(
    'AMN-007 malformed nested sources and guides are safe',
    {
      deals: [
        row({
          review: { unknown_fields: {} },
          eligibility: { conditions: {} },
          official_sources: [{ url: 'https://example.com', claims: [{ evidence: {} }] }],
        }),
      ],
      guides: [{ slug: 'offer', sections: { eligibility: { ar: 'شرط', sources: {} } } }],
      hash: '#/deal/offer',
    },
    async (p) => assert.match(await p.locator('main').innerText(), /شرط/)
  );
  await run(
    'AMN-007 invalid identity quarantined with generic status',
    { deals: [{ id: 'PRIVATE-ROW', token: 'PRIVATE-TOKEN' }, row()] },
    async (p, logs) => {
      assert.equal(await p.locator('article').count(), 1);
      assert.match(await p.getByRole('status').innerText(), /استبعاد/);
      assert.doesNotMatch(logs.join(' '), /PRIVATE/);
    }
  );
  await run(
    'AMN-007 all invalid rows show explicit error, not 404',
    { deals: [{}], hash: '#/deal/offer' },
    async (p) => {
      assert.match(await p.getByRole('alert').innerText(), /غير صالحة/);
      assert.doesNotMatch(await p.locator('main').innerText(), /404/);
    }
  );
  await run(
    'AMN-007 wrong collection type shows explicit error',
    { deals: { unexpected: [] } },
    async (p) => assert.match(await p.getByRole('alert').innerText(), /غير صالحة/)
  );
  await run(
    'AMN-007 reserved slug cannot corrupt guide name map',
    {
      deals: [row({ slug: '__proto__' })],
      guides: [{ slug: '__proto__', sections: {} }],
      hash: '#/guide',
    },
    async (p) => assert.match(await p.locator('main').innerText(), /Offer/)
  );
  await run(
    'AMN-007 malformed optional config does not hide valid deals',
    { config: { id: 'wrong', overview: { ar: { title: {} } } } },
    async (p) => {
      assert.equal(await p.locator('article').count(), 1);
      assert.match(await p.getByRole('status').innerText(), /استبعاد/);
    }
  );
  await run(
    'AMN-007 empty valid collection is not an invalid-data error',
    { deals: [] },
    async (p) => {
      assert.equal(await p.getByRole('alert').count(), 0);
      assert.match(await p.locator('main').innerText(), /لا توجد عروض/);
    }
  );
  await b.close();
  if (process.env.AMN_SMOKE_REPORT)
    fs.writeFileSync(process.env.AMN_SMOKE_REPORT, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
