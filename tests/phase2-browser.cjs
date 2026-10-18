// Local optional QA: synthetic API/clipboard fixtures, no production requests.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.AMN_PREVIEW_URL || 'http://127.0.0.1:4173';
const rows = [
  {
    id: 'a',
    slug: 'alpha',
    name_en: 'Alpha GPT-4',
    name_ar: 'ألفا',
    category: { value: 'Cloud' },
    description_en: 'Research',
    eligibility: { student_status: 'required', card_required: 'no' },
    benefits: [
      {
        type: 'feature_access',
        amount: { unit: 'videos', value: 5, currency: null },
        description: { ar: 'توليد صوتي', en: 'Acoustic synthesis' },
      },
    ],
    review: { reviewed_on: '2026-10-17' },
  },
  {
    id: 'b',
    slug: 'beta',
    name_en: 'Beta Node.js',
    name_ar: 'بيتا',
    category: { value: 'Cloud' },
    eligibility: { student_status: 'required', card_required: 'required' },
    review: { reviewed_on: '2026-10-16' },
  },
  { id: 'c', slug: 'literal-all', name_en: 'Literal all', category: { value: 'all' } },
  { id: 'd', slug: 'uncategorized', name_en: 'Unclassified', category: { value: 'unknown' } },
];
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
    args: ['--no-sandbox'],
  });
  const results = [];
  try {
    async function run(name, opt, check) {
      const context = await browser.newContext({
        viewport: opt.viewport || { width: 1200, height: 900 },
        timezoneId: opt.timezone || 'UTC',
      });
      const page = await context.newPage();
      if (opt.referenceTime) await page.clock.setFixedTime(new Date(opt.referenceTime));
      const errors = [];
      const calls = { deals: 0, guides: 0, config: 0 };
      page.on('pageerror', (e) => errors.push(e.message));
      await context.addInitScript(
        ({ mode, english }) => {
          if (english) localStorage.setItem('amnabd-lang', 'en');
          window.__copied = [];
          window.__history = [];
          for (const method of ['pushState', 'replaceState']) {
            const original = history[method].bind(history);
            history[method] = function (...args) {
              window.__history.push({ method, url: String(args[2]) });
              return original(...args);
            };
          }
          Object.defineProperty(navigator, 'clipboard', {
            value: {
              writeText: async (text) => {
                if (mode === 'reject') throw Error('synthetic denial');
                window.__copied.push(text);
              },
            },
            configurable: true,
          });
        },
        { mode: opt.clipboard, english: !!opt.english }
      );
      await context.route('**/*', async (route) => {
        const u = new URL(route.request().url());
        if (u.hostname === 'audit-fixture.supabase.co') {
          const resource = u.pathname.endsWith('/deals')
            ? 'deals'
            : u.pathname.endsWith('/usage_guides')
              ? 'guides'
              : 'config';
          calls[resource]++;
          if (opt.delay && resource === 'deals') await new Promise((r) => setTimeout(r, opt.delay));
          const value =
            resource === 'deals'
              ? opt.rows || rows
              : resource === 'guides'
                ? []
                : {
                    id: 'main',
                    overview: { ar: {}, en: {} },
                    section_labels: {},
                    last_reviewed: '2026-10-17',
                  };
          return route.fulfill({ contentType: 'application/json', body: JSON.stringify(value) });
        }
        return u.hostname === '127.0.0.1' ? route.continue() : route.abort();
      });
      try {
        await page.goto(base + '/' + (opt.hash || ''));
        if (!opt.pending) await page.getByRole('searchbox').waitFor();
        await check(page, calls);
        assert.deepEqual(errors, [], name + ' JavaScript errors');
        results.push({ name, result: 'PASS' });
      } catch (e) {
        console.error('FAILED:', name);
        throw e;
      } finally {
        await context.close();
      }
    }
    const search = (p) => p.getByRole('searchbox');
    const categories = (p) => p.getByRole('group', { name: 'فئات العروض' });
    const cloud = (p) => categories(p).getByRole('button', { name: 'Cloud (٢)', exact: true });
    const filter = (p) => p.getByRole('button', { name: 'تصفية', exact: true });
    const hash = (p) => p.evaluate(() => location.hash);
    async function count(p, n) {
      await p.waitForFunction((n) => document.querySelectorAll('article').length === n, n);
    }
    await run(
      'state direct full link, bilingual benefit search and reload',
      {
        hash: '#/?q=cloud+acoustic&category=cloud&applicant=student&card=not_required&sort=reviewed',
      },
      async (p) => {
        await count(p, 1);
        assert.equal(await search(p).inputValue(), 'cloud acoustic');
        assert.match(await p.locator('article').innerText(), /Alpha/);
        await p.reload();
        await search(p).waitFor();
        await count(p, 1);
        assert.equal(await search(p).inputValue(), 'cloud acoustic');
      }
    );
    await run('state literal all and uncategorized are independent', {}, async (p) => {
      await categories(p).getByRole('button', { name: 'all (١)', exact: true }).click();
      await count(p, 1);
      assert.match(await p.locator('article').innerText(), /Literal all/);
      assert.match(await hash(p), /category=all/);
      await categories(p).getByRole('button', { name: 'غير مصنّف (١)', exact: true }).click();
      await count(p, 1);
      assert.match(await hash(p), /uncategorized=1/);
      assert.match(await p.locator('article').innerText(), /Unclassified/);
    });
    for (const value of ['category=missing', 'category=cloud&uncategorized=1', 'uncategorized=2'])
      await run(
        'state invalid category diagnostic ' + value,
        { hash: '#/?' + value },
        async (p) => {
          await p.getByRole('alert').waitFor();
          await count(p, 4);
          await p.getByRole('button', { name: 'مسح الفئة', exact: true }).click();
          assert.equal(await hash(p), '#/');
          assert.equal(await p.getByRole('alert').count(), 0);
        }
      );
    await run(
      'state pending category is not rejected before data, even empty success',
      { hash: '#/?category=missing', delay: 800, pending: true, rows: [] },
      async (p) => {
        assert.equal(await p.getByRole('alert').count(), 0);
        assert.equal(await p.locator('article').count(), 0);
        await p.getByRole('alert').waitFor();
        assert.match(await p.getByRole('alert').innerText(), /missing/);
      }
    );
    await run(
      'state delayed valid category validates after ready',
      { hash: '#/?category=cloud', delay: 800, pending: true },
      async (p) => {
        assert.equal(await p.getByRole('alert').count(), 0);
        await search(p).waitFor();
        await count(p, 2);
        assert.equal(await p.getByRole('alert').count(), 0);
      }
    );
    await run('state typing preserves spaces and writes replace only', {}, async (p) => {
      const before = await p.evaluate(() => history.length);
      await search(p).pressSequentially('cloud acoustic', { delay: 30 });
      await count(p, 1);
      await p.waitForTimeout(350);
      assert.equal(await search(p).inputValue(), 'cloud acoustic');
      assert.equal(await p.evaluate(() => history.length), before);
      const entries = await p.evaluate(() => window.__history);
      assert.ok(entries.length > 0);
      assert.ok(entries.every((x) => x.method === 'replaceState'));
      assert.match(await hash(p), /q=cloud\+acoustic/);
    });
    await run('state category and sort are two reversible history entries', {}, async (p) => {
      const length = await p.evaluate(() => history.length);
      await cloud(p).click();
      await count(p, 2);
      await filter(p).click();
      await p.getByRole('combobox').selectOption('reviewed');
      assert.equal(await p.evaluate(() => history.length), length + 2);
      await p.goBack();
      await p.waitForFunction(() => !location.hash.includes('sort='));
      assert.match(await hash(p), /category=cloud/);
      await p.goBack();
      await count(p, 4);
      await p.goForward();
      await count(p, 2);
      await p.goForward();
      await p.waitForFunction(() => location.hash.includes('sort=reviewed'));
    });
    await run(
      'state immediate deal navigation flushes latest query and cancels stale timer',
      {},
      async (p) => {
        await search(p).fill('acoustic');
        await p.getByRole('button', { name: 'التفاصيل', exact: true }).click();
        await p.waitForFunction(() => location.hash.startsWith('#/deal/'));
        await p.waitForTimeout(400);
        assert.equal(await hash(p), '#/deal/alpha');
        await p.getByRole('button', { name: 'كل العروض', exact: true }).click();
        await search(p).waitFor();
        assert.equal(await search(p).inputValue(), 'acoustic');
        await count(p, 1);
      }
    );
    await run(
      'state browser back cancels pending draft without rewriting destination',
      { hash: '#/' },
      async (p) => {
        await cloud(p).click();
        await search(p).fill('acoustic');
        await p.goBack();
        await p.waitForTimeout(450);
        assert.equal(await search(p).inputValue(), '');
        await count(p, 4);
        assert.equal(await hash(p), '#/');
      }
    );
    await run('state external hash returns to an app-written hash', {}, async (p) => {
      await cloud(p).click();
      await p.evaluate(() => (location.hash = '#/?q=beta'));
      await count(p, 1);
      await p.evaluate(() => (location.hash = '#/?category=cloud'));
      await count(p, 2);
      assert.equal(await search(p).inputValue(), '');
    });
    await run(
      'state copy search flushes latest query, strips page query, keeps detail copying separate',
      { hash: '?tracking=synthetic#/' },
      async (p) => {
        await search(p).fill('acoustic');
        await p.getByRole('button', { name: 'مشاركة البحث', exact: true }).click();
        await p.getByRole('status').filter({ hasText: 'تم نسخ رابط البحث.' }).waitFor();
        const copied = await p.evaluate(() => window.__copied[0]);
        assert.equal(copied, base + '/#/?q=acoustic');
        await p.goto(copied);
        await search(p).waitFor();
        await count(p, 1);
        await p.getByRole('button', { name: 'التفاصيل', exact: true }).click();
        await p.getByRole('button', { name: 'نسخ رابط العرض', exact: true }).click();
        await p.getByRole('status').filter({ hasText: 'تم نسخ رابط العرض.' }).waitFor();
        assert.equal(await p.evaluate(() => window.__copied.at(-1)), base + '/#/deal/alpha');
      }
    );
    await run(
      'state manual copy offers current filtered URL',
      { clipboard: 'reject' },
      async (p) => {
        await search(p).fill('nodejs');
        await p.getByRole('button', { name: 'مشاركة البحث', exact: true }).click();
        const input = p.getByRole('textbox');
        await input.waitFor();
        assert.equal(await input.inputValue(), base + '/#/?q=nodejs');
        await input.focus();
        assert.equal(
          await input.evaluate((x) => x.selectionEnd - x.selectionStart),
          (await input.inputValue()).length
        );
      }
    );
    await run('state controls and language add no Supabase requests', {}, async (p, calls) => {
      const before = { ...calls };
      await cloud(p).click();
      await search(p).fill('gpt4');
      await filter(p).click();
      await p.getByRole('combobox').selectOption('deadline');
      await p.getByRole('button', { name: 'Switch to English' }).click();
      await p.waitForTimeout(450);
      assert.deepEqual(calls, before);
      await count(p, 1);
    });
    for (const english of [false, true])
      await run(
        'state narrow viewport ' + (english ? 'en' : 'ar'),
        { english, viewport: { width: 320, height: 780 } },
        async (p) => {
          await p.getByRole('button', { name: english ? 'Filters' : 'تصفية', exact: true }).click();
          assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
          await p.getByRole('combobox').focus();
          await p.keyboard.press('ArrowDown');
          await p.keyboard.press('Enter');
        }
      );
    const sortRows = [
      ['unknown', null, '2026-02-30'],
      ['calendar', '2026-10-18', '2026-10-17'],
      ['past-calendar', '2026-10-16', null],
      ['exact', '2026-10-19T14:00:00+03:00', '2026-10-17'],
      ['past-exact', '2026-10-17T10:00:00Z', '2026-10-18'],
      ['invalid', '2026-02-30', '2026-10-16'],
    ].map(([slug, value, reviewed_on]) => ({
      id: slug,
      slug,
      name_en: slug,
      name_ar: slug,
      registration: { deadline: { status: 'known', date: value } },
      review: { reviewed_on },
    }));
    for (const timezone of ['Asia/Baghdad', 'America/Los_Angeles']) {
      await run(
        'sort UTC grouping and reviewed order in ' + timezone,
        {
          english: true,
          rows: sortRows,
          timezone,
          referenceTime: '2026-10-17T12:00:00Z',
          hash: '#/?sort=deadline',
        },
        async (p) => {
          await count(p, 6);
          const names = () => p.locator('article h3').allTextContents();
          assert.deepEqual(await names(), [
            'exact',
            'calendar',
            'past-exact',
            'past-calendar',
            'unknown',
            'invalid',
          ]);
          for (const name of [
            'Upcoming exact times',
            'Calendar dates without hours',
            'Past recorded dates or times',
            'Unknown deadlines',
          ])
            await p.getByRole('heading', { name, exact: true }).waitFor();
          await p.getByText('UTC reference.', { exact: false }).waitFor();
          await p.getByRole('button', { name: 'Filters', exact: true }).click();
          await p.getByRole('combobox').selectOption('reviewed');
          await p.waitForFunction(
            () => document.querySelector('article h3')?.textContent === 'past-exact'
          );
          assert.deepEqual(await names(), [
            'past-exact',
            'calendar',
            'exact',
            'invalid',
            'unknown',
            'past-calendar',
          ]);
        }
      );
    }
    if (process.env.AMN_PHASE2_REPORT)
      fs.writeFileSync(process.env.AMN_PHASE2_REPORT, JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results, null, 2));
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
