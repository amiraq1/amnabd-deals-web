// Optional QA: Playwright/Chromium are supplied by the QA environment, not the app.
// All catalogue/clipboard data is synthetic; third-party requests are blocked.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.AMN_PREVIEW_URL || 'http://127.0.0.1:4173';
const key = 'amnabd_saved_deals_v1';
const rows = [
  {
    id: 'a',
    slug: 'alpha',
    name_en: 'Cloud Alpha',
    name_ar: 'سحابة ألفا',
    category: { value: 'Cloud' },
    description_en: 'Synthetic acoustic research',
    description_ar: 'وصف تجريبي للصوت',
    benefits: [
      {
        type: 'feature_access',
        amount: { unit: 'videos', value: 5, currency: null },
        description: { en: 'Acoustic synthesis', ar: 'توليد صوتي' },
      },
    ],
    eligibility: { student_status: 'required', card_required: 'no' },
    official_sources: [{ url: 'https://example.org/alpha', title: 'Synthetic source' }],
    review: { reviewed_on: '2026-10-17' },
  },
  {
    id: 'b',
    slug: 'beta',
    name_en: 'Cloud Beta',
    name_ar: 'سحابة بيتا',
    category: { value: 'Cloud' },
    eligibility: { student_status: 'required', card_required: 'required' },
  },
  {
    id: 'c',
    slug: 'gamma',
    name_en: 'AI Gamma',
    name_ar: 'ذكاء غاما',
    category: { value: 'AI Models' },
  },
  {
    id: 'd',
    slug: 'delta',
    name_en: 'Unclassified Delta',
    name_ar: 'دلتا',
    category: { value: 'unknown' },
  },
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
        reducedMotion: opt.motion || 'reduce',
        hasTouch: !!opt.touch,
      });
      const errors = [],
        calls = { deals: 0, guides: 0, config: 0 };
      context.on('page', (p) => p.on('pageerror', (e) => errors.push(e.message)));
      await context.addInitScript(
        ({ english, raw, mode, key }) => {
          if (location.protocol !== 'http:') return;
          if (english) localStorage.setItem('amnabd-lang', 'en');
          if (raw !== undefined && localStorage.getItem(key) === null)
            localStorage.setItem(key, raw);
          window.__copied = [];
          Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: {
              writeText: async (x) => {
                window.__copied.push(x);
              },
            },
          });
          if (mode === 'getter')
            Object.defineProperty(window, 'localStorage', {
              get() {
                throw new DOMException('synthetic', 'SecurityError');
              },
            });
          if (mode === 'read') {
            const get = Storage.prototype.getItem;
            Storage.prototype.getItem = function (k) {
              if (k === key) throw new DOMException('synthetic', 'SecurityError');
              return get.call(this, k);
            };
          }
          if (mode === 'quota') {
            const set = Storage.prototype.setItem;
            window.__originalSetItem = set;
            Storage.prototype.setItem = function (k, v) {
              if (k === key) throw new DOMException('synthetic', 'QuotaExceededError');
              return set.call(this, k, v);
            };
          }
        },
        { english: opt.english !== false, raw: opt.raw, mode: opt.storage, key }
      );
      await context.route('**/*', async (route) => {
        const url = new URL(route.request().url());
        if (url.hostname === 'audit-fixture.supabase.co') {
          const resource = url.pathname.endsWith('/deals')
            ? 'deals'
            : url.pathname.endsWith('/usage_guides')
              ? 'guides'
              : 'config';
          calls[resource]++;
          if (opt.delay && resource === 'deals') await new Promise((r) => setTimeout(r, opt.delay));
          const data =
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
          return route.fulfill({ contentType: 'application/json', body: JSON.stringify(data) });
        }
        return url.hostname === '127.0.0.1' ? route.continue() : route.abort();
      });
      const page = await context.newPage();
      try {
        await page.goto(base + '/' + (opt.hash || '#/'));
        if (!opt.pending)
          await page
            .locator(opt.hash?.includes('/deal/') ? 'main h1' : 'input[type="search"]')
            .waitFor();
        await check(page, context, calls);
        assert.deepEqual(errors, [], name + ' page errors');
        results.push({ name, result: 'PASS' });
      } catch (e) {
        console.error('FAILED', name);
        throw e;
      } finally {
        await context.close();
      }
    }
    const articles = (p) => p.locator('article');
    const save = (p, i = 0) =>
      articles(p)
        .nth(i)
        .getByRole('button', { name: /^(Save |Remove )/ });
    const saved = (p) => p.getByRole('button', { name: /^Saved \(/ });
    const count = async (p, n) =>
      p.waitForFunction((n) => document.querySelectorAll('article').length === n, n);
    const pressed = async (locator, value) => {
      await locator.waitFor();
      await locator.evaluate(
        (el, value) =>
          new Promise((resolve, reject) => {
            let n = 0;
            const t = setInterval(() => {
              if (el.getAttribute('aria-pressed') === String(value)) {
                clearInterval(t);
                resolve();
              } else if (++n > 100) {
                clearInterval(t);
                reject(Error('aria-pressed timeout'));
              }
            }, 20);
          }),
        value
      );
    };
    const snap = async (p, name) => {
      if (process.env.AMN_PHASE3_SHOTS) {
        fs.mkdirSync(process.env.AMN_PHASE3_SHOTS, { recursive: true });
        await p.waitForTimeout(250);
        await p.screenshot({
          path: process.env.AMN_PHASE3_SHOTS + '/' + name + '.png',
          fullPage: name.startsWith('home-') || name.startsWith('saved-'),
        });
      }
    };

    await run(
      'save reload, stale IDs excluded from counter, no extra API calls',
      { raw: JSON.stringify(['obsolete']) },
      async (p, c, calls) => {
        assert.equal((await saved(p).innerText()).replace(/\s+/g, ' '), 'Saved (0)');
        const before = { ...calls };
        await save(p).click();
        await pressed(save(p), true);
        assert.equal((await saved(p).innerText()).replace(/\s+/g, ' '), 'Saved (1)');
        assert.deepEqual(calls, before);
        assert.deepEqual(await p.evaluate((k) => JSON.parse(localStorage.getItem(k)), key), [
          'obsolete',
          'alpha',
        ]);
        await p.reload();
        await count(p, 4);
        await pressed(save(p), true);
        assert.equal((await saved(p).innerText()).replace(/\s+/g, ' '), 'Saved (1)');
        await save(p).click();
        await pressed(save(p), false);
      }
    );
    await run('native keyboard and mouse save do not navigate or double-toggle', {}, async (p) => {
      const hash = await p.evaluate(() => location.hash);
      await save(p).focus();
      await p.keyboard.press('Enter');
      await pressed(save(p), true);
      await p.keyboard.press('Space');
      await pressed(save(p), false);
      await save(p).click();
      await pressed(save(p), true);
      assert.equal(await p.evaluate(() => location.hash), hash);
      assert.equal(await p.locator('a button, button button, button a').count(), 0);
      const box = await save(p).boundingBox();
      assert.ok(box.width >= 44 && box.height >= 44);
    });
    await run(
      'touch save stays on home; real detail links preserve native href',
      { touch: true, viewport: { width: 390, height: 844 } },
      async (p) => {
        const original = await p.evaluate(() => location.hash);
        await save(p).tap();
        await pressed(save(p), true);
        assert.equal(await p.evaluate(() => location.hash), original);
        const link = articles(p).first().getByRole('link', { name: 'Details', exact: true });
        assert.equal(await link.getAttribute('href'), '#/deal/alpha');
        assert.equal(await save(p).evaluate((el) => !!el.closest('a')), false);
        await link.focus();
        await p.keyboard.press('Enter');
        await p.waitForFunction(() => location.hash === '#/deal/alpha');
        await p
          .getByRole('button', { name: 'Remove Cloud Alpha from saved', exact: true })
          .first()
          .waitFor();
      }
    );
    await run(
      'saved-only AND category search applicant card and sort',
      { raw: '["alpha","beta","gamma","gone"]' },
      async (p) => {
        await saved(p).click();
        await count(p, 3);
        await p.getByRole('button', { name: 'Cloud (2)', exact: true }).click();
        await count(p, 2);
        await p.getByRole('button', { name: 'Filters', exact: true }).click();
        await p.locator('#applicant-select').selectOption('student');
        await p.locator('#card-select').selectOption('not_required');
        await count(p, 1);
        await p.getByRole('searchbox').fill('acoustic');
        await p.locator('#sort-select').selectOption('reviewed');
        await count(p, 1);
        assert.match(await articles(p).innerText(), /Cloud Alpha/);
        await p.getByRole('button', { name: 'Share search', exact: true }).click();
        await p.waitForFunction(() => window.__copied.length === 1);
        const url = await p.evaluate(() => window.__copied[0]);
        assert.doesNotMatch(url, /saved|obsolete|gone/);
        assert.match(await p.locator('#saved-deals-scope').innerText(), /not included/);
      }
    );
    await run('zero saves has guidance and explore resets all other filters', {}, async (p) => {
      await p.getByRole('searchbox').fill('no-result');
      await saved(p).click();
      await count(p, 0);
      await p.getByText('No saved deals yet.', { exact: false }).waitFor();
      await snap(p, 'saved-empty-en');
      await p.getByRole('button', { name: 'Explore all deals', exact: true }).click();
      await count(p, 4);
      assert.equal(await p.getByRole('searchbox').inputValue(), '');
    });
    await run(
      'saved no-match reset clears saved-only and other filters',
      { raw: '["alpha"]' },
      async (p) => {
        await saved(p).click();
        await p.getByRole('searchbox').fill('not-matched');
        await count(p, 0);
        await p.getByText('No saved deals match your current filters.', { exact: true }).waitFor();
        await p.getByRole('button', { name: 'Clear filters and search', exact: true }).click();
        await count(p, 4);
        await pressed(saved(p), false);
      }
    );
    await run(
      'same-origin real tabs synchronize save remove corrupt JSON and clear',
      {},
      async (p, context) => {
        const other = await context.newPage();
        await other.goto(base + '/#/');
        await count(other, 4);
        await save(p).click();
        await pressed(save(other), true);
        assert.equal((await saved(other).innerText()).replace(/\s+/g, ' '), 'Saved (1)');
        await save(other).click();
        await pressed(save(p), false);
        await save(p).click();
        await pressed(save(other), true);
        await other.evaluate((k) => localStorage.setItem(k, '{corrupt'), key);
        await pressed(save(p), false);
        await save(p).click();
        await pressed(save(other), true);
        await other.evaluate(() => localStorage.clear());
        await pressed(save(p), false);
        assert.equal((await saved(p).innerText()).replace(/\s+/g, ' '), 'Saved (0)');
        await other.close();
      }
    );
    for (const raw of ['{corrupt', '{"not":"array"}', '["alpha","alpha",null,7,"gone"]'])
      await run('initial storage sanitization ' + raw, { raw }, async (p) => {
        assert.equal(
          (await saved(p).innerText()).replace(/\s+/g, ' '),
          raw.startsWith('[') ? 'Saved (1)' : 'Saved (0)'
        );
      });
    for (const storage of ['getter', 'read', 'quota'])
      await run(
        'storage ' + storage + ' falls back consistently with visible session-only warning',
        { storage },
        async (p) => {
          // The getter-blocked fixture also blocks language persistence: the default is Arabic.
          const button = articles(p)
            .first()
            .getByRole('button', { name: /^(Save |Remove |حفظ |إزالة )/ });
          await button.click();
          await pressed(button, true);
          await p.getByText(/Saves are temporary|الحفظ مؤقت/, { exact: false }).waitFor();
          await button.click();
          await pressed(button, false);
          await button.click();
          await pressed(button, true);
          if (storage === 'quota') {
            await p.reload();
            await count(p, 4);
            await pressed(save(p), false);
          }
        }
      );
    await run(
      'quota fallback recovers on a later write and synchronizes to a real second tab',
      { storage: 'quota' },
      async (p, context) => {
        await save(p).click();
        await pressed(save(p), true);
        // Restore normal persistence in this tab only; initialization has not been rerun.
        await p.evaluate(() => {
          Storage.prototype.setItem = window.__originalSetItem;
        });
        await save(p, 1).click();
        await pressed(save(p, 1), true);
        assert.deepEqual(await p.evaluate((k) => JSON.parse(localStorage.getItem(k)), key), [
          'alpha',
          'beta',
        ]);
        assert.equal(await p.getByText(/Saves are temporary/, { exact: false }).count(), 0);
        const other = await context.newPage();
        await other.goto(base + '/#/');
        await count(other, 4);
        await pressed(save(other), true);
        await pressed(save(other, 1), true);
        await other.close();
      }
    );
    await run(
      'pending catalogue shows neither final saved count nor saved empty state',
      { raw: '["alpha"]', delay: 600, pending: true },
      async (p) => {
        assert.equal(await saved(p).count(), 0);
        assert.equal(await p.getByText('No saved deals yet.', { exact: false }).count(), 0);
        await count(p, 4);
        assert.equal((await saved(p).innerText()).replace(/\s+/g, ' '), 'Saved (1)');
      }
    );
    await run(
      '500 cap gives guidance and never removes an existing saved item',
      { raw: JSON.stringify(['alpha', ...Array.from({ length: 499 }, (_, i) => 'old-' + i)]) },
      async (p) => {
        await save(p, 1).click();
        await pressed(save(p, 1), false);
        await pressed(save(p), true);
        await p.getByText('500-save limit reached.', { exact: false }).waitFor();
        assert.equal(await p.evaluate((k) => JSON.parse(localStorage.getItem(k)).length, key), 500);
        await save(p).click();
        await save(p, 1).click();
        await pressed(save(p, 1), true);
        assert.equal(await p.getByText('500-save limit reached.', { exact: false }).count(), 1);
      }
    );
    await run(
      'removing last saved item keeps saved-only active until reset',
      { raw: '["alpha"]' },
      async (p) => {
        await saved(p).click();
        await count(p, 1);
        await save(p).click();
        await count(p, 0);
        await pressed(saved(p), true);
        await p.getByText('No saved deals yet.', { exact: false }).waitFor();
      }
    );
    await run(
      'back navigation resets local saved-only without changing shared URL contract',
      { raw: '["alpha"]' },
      async (p) => {
        await p.getByRole('button', { name: 'Cloud (2)', exact: true }).click();
        await saved(p).click();
        await count(p, 1);
        await p.goBack();
        await count(p, 4);
        await pressed(saved(p), false);
        await saved(p).click();
        await count(p, 1);
        await p.reload();
        await count(p, 4);
        await pressed(saved(p), false);
      }
    );
    await run(
      'detail header and mobile bar saved state agree, valid source matches header',
      { hash: '#/deal/alpha', viewport: { width: 390, height: 844 } },
      async (p) => {
        const bar = p.getByRole('complementary', { name: 'Quick deal actions' });
        const buttons = p.getByRole('button', { name: 'Save Cloud Alpha', exact: true });
        assert.equal(await buttons.count(), 2);
        await bar.getByRole('button', { name: 'Save Cloud Alpha', exact: true }).click();
        const selected = p.getByRole('button', {
          name: 'Remove Cloud Alpha from saved',
          exact: true,
        });
        assert.equal(await selected.count(), 2);
        for (const button of await selected.all()) await pressed(button, true);
        for (const link of await p
          .getByRole('link', { name: 'Official Source', exact: true })
          .all()) {
          assert.equal(await link.getAttribute('href'), 'https://example.org/alpha');
          assert.equal(await link.getAttribute('target'), '_blank');
          assert.equal(await link.getAttribute('rel'), 'noopener noreferrer');
        }
        await snap(p, 'detail-mobile-en');
      }
    );
    for (const url of [
      'javascript:alert(1)',
      'data:text/html,invalid',
      'not-a-url',
      'https://studentoffers.co/offer',
    ])
      await run(
        'invalid source disabled consistently: ' + url,
        {
          hash: '#/deal/alpha',
          rows: [{ ...rows[0], benefits: [], official_sources: [{ url }] }],
          viewport: { width: 320, height: 780 },
        },
        async (p) => {
          assert.equal(
            await p.getByRole('link', { name: 'Official Source', exact: true }).count(),
            0
          );
          const disabled = p
            .locator('[aria-disabled="true"]')
            .filter({ hasText: 'Official source unavailable' });
          assert.equal(await disabled.count(), 2);
          for (const b of await disabled.all())
            assert.equal(await b.getAttribute('aria-disabled'), 'true');
          const bar = p.getByRole('complementary', { name: 'Quick deal actions' });
          assert.doesNotMatch(await bar.innerText(), /Verified|free|price|USD/i);
          assert.match(await bar.innerText(), /Card:/);
        }
      );
    for (const english of [true, false])
      await run(
        'mobile geometry footer access logical side and reduced motion ' + (english ? 'en' : 'ar'),
        { english, hash: '#/deal/alpha', viewport: { width: 320, height: 780 } },
        async (p) => {
          await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
          const bar = p.getByRole('complementary', {
            name: english ? 'Quick deal actions' : 'إجراءات العرض السريعة',
          });
          const top = p.getByRole('button', {
            name: english ? 'Scroll to top' : 'العودة إلى أعلى الصفحة',
            exact: true,
          });
          await top.waitFor();
          const a = await top.boundingBox(),
            b = await bar.boundingBox();
          assert.ok(a.y + a.height + 8 <= b.y);
          assert.ok(english ? a.x > 160 : a.x < 160);
          const footerLink = p.locator('footer a');
          const f = await footerLink.boundingBox();
          assert.ok(f.y + f.height < b.y);
          assert.ok(
            await footerLink.evaluate((el) => {
              const r = el.getBoundingClientRect();
              const x = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
              return el === x || el.contains(x);
            })
          );
          assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
          await snap(p, 'footer-mobile-' + (english ? 'en' : 'ar'));
          await p.evaluate(() => {
            window.__scrollOptions = null;
            const original = window.scrollTo.bind(window);
            window.scrollTo = (options) => {
              window.__scrollOptions = options;
              original(options);
            };
          });
          await top.click();
          assert.equal(await p.evaluate(() => window.__scrollOptions.behavior), 'auto');
          await p
            .getByRole('button', { name: english ? 'All deals' : 'كل العروض', exact: true })
            .click();
          await count(p, 4);
          assert.equal(
            await p.evaluate(() =>
              document.documentElement.style.getPropertyValue('--amnabd-mobile-actions-height')
            ),
            ''
          );
          await snap(p, 'home-mobile-' + (english ? 'en' : 'ar'));
        }
      );
    await run(
      'bar remeasures enlarged text and keeps footer accessible',
      { hash: '#/deal/beta', viewport: { width: 320, height: 780 } },
      async (p) => {
        await p.evaluate(() => (document.documentElement.style.fontSize = '24px'));
        await p.waitForTimeout(150);
        const bar = p.getByRole('complementary', { name: 'Quick deal actions' });
        const b = await bar.boundingBox();
        assert.ok(b.height > 80);
        const measured = await p.evaluate(() =>
          parseFloat(
            document.documentElement.style.getPropertyValue('--amnabd-mobile-actions-height')
          )
        );
        assert.ok(Math.abs(measured - b.height) <= 1);
        assert.ok(
          await bar.evaluate((el) => {
            const outer = el.getBoundingClientRect();
            return [...el.querySelectorAll('button,a,[aria-disabled]')].every((child) => {
              const r = child.getBoundingClientRect();
              return (
                r.left >= outer.left &&
                r.right <= outer.right &&
                child.scrollWidth <= child.clientWidth
              );
            });
          }),
          'action labels must fit their bar, not only the clipped document width'
        );
        await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
        const f = await p.locator('footer a').boundingBox();
        assert.ok(f.y + f.height < b.y);
        assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        await snap(p, 'detail-large-text');
      }
    );
    await run(
      'desktop hides mobile bar and scroll uses smooth when motion allowed',
      { hash: '#/deal/alpha', motion: 'no-preference', viewport: { width: 1200, height: 600 } },
      async (p) => {
        assert.ok(
          await p
            .getByRole('complementary', { name: 'Quick deal actions', includeHidden: true })
            .isHidden()
        );
        await p.evaluate(() => {
          window.scrollTo({ top: 1000, behavior: 'instant' });
        });
        const top = p.getByRole('button', { name: 'Scroll to top', exact: true });
        await top.waitFor();
        await p.evaluate(() => {
          window.__scrollOptions = null;
          window.scrollTo = (options) => {
            window.__scrollOptions = options;
          };
        });
        await top.click();
        assert.equal(await p.evaluate(() => window.__scrollOptions.behavior), 'smooth');
        await snap(p, 'detail-desktop');
      }
    );
    await run(
      'scroll-to-top threshold is strictly greater than 400',
      { viewport: { width: 320, height: 780 } },
      async (p) => {
        const top = p.getByRole('button', { name: 'Scroll to top', exact: true });
        await p.evaluate(() => scrollTo(0, 400));
        await p.waitForTimeout(80);
        assert.equal(await top.count(), 0);
        await p.evaluate(() => scrollTo(0, 401));
        await top.waitFor();
      }
    );
    await run(
      'mobile bar is hidden at the sm breakpoint exactly',
      { hash: '#/deal/alpha', viewport: { width: 640, height: 780 } },
      async (p) => {
        assert.ok(
          await p
            .getByRole('complementary', { name: 'Quick deal actions', includeHidden: true })
            .isHidden()
        );
      }
    );
    await run(
      'bar/footer geometry follows extra simulated safe-area padding',
      { hash: '#/deal/alpha', viewport: { width: 390, height: 844 } },
      async (p) => {
        const bar = p.getByRole('complementary', { name: 'Quick deal actions' });
        const before = await bar.boundingBox();
        await bar.evaluate((el) => (el.style.paddingBottom = '46px'));
        await p.waitForFunction(() => {
          const bar = document.querySelector('aside[aria-label="Quick deal actions"]');
          return (
            bar &&
            Math.abs(
              parseFloat(
                document.documentElement.style.getPropertyValue('--amnabd-mobile-actions-height')
              ) - bar.getBoundingClientRect().height
            ) <= 1
          );
        });
        const after = await bar.boundingBox();
        assert.ok(after.height >= before.height + 33);
        assert.ok(
          Math.abs(
            (await p.evaluate(() =>
              parseFloat(
                document.documentElement.style.getPropertyValue('--amnabd-mobile-actions-height')
              )
            )) - after.height
          ) <= 1
        );
        await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
        const f = await p.locator('footer a').boundingBox();
        assert.ok(f.y + f.height < after.y);
        const top = await p
          .getByRole('button', { name: 'Scroll to top', exact: true })
          .boundingBox();
        assert.ok(top.y + top.height < after.y);
      }
    );
    await run('favicon is served and social metadata remains text-only', {}, async (p) => {
      const response = await p.request.get(base + '/favicon.svg');
      assert.equal(response.status(), 200);
      assert.match(await response.text(), /<svg/);
      assert.equal(
        await p.locator('meta[property="og:image"],meta[name="twitter:image"]').count(),
        0
      );
      assert.equal(await p.locator('meta[name="twitter:card"]').getAttribute('content'), 'summary');
    });
    if (process.env.AMN_PHASE3_REPORT)
      fs.writeFileSync(process.env.AMN_PHASE3_REPORT, JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results, null, 2));
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
