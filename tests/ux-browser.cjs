// Optional local QA: Playwright and Chromium supplied by the QA environment.
// All API rows and clipboard operations are synthetic; no production access.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.AMN_PREVIEW_URL || 'http://127.0.0.1:4173';
const row = (slug, category, changes = {}) => ({
  id: slug,
  slug,
  name_en: slug,
  name_ar: slug,
  description_ar: 'وصف تجريبي',
  description_en: 'Synthetic description',
  category: { value: category },
  ...changes,
});
const benefits = [1, 2, 3].map((i) => ({
  type: 'feature_access',
  amount: { unit: 'videos', value: i, currency: null },
  description: { ar: 'منفعة', en: 'Benefit' },
}));
const eligibility = (card = 'no') => ({ student_status: 'required', card_required: card });
const deals = [
  row('Cloud One', 'Cloud', {
    benefits,
    eligibility: eligibility(),
    pricing: { offer_price: 0, currency: 'USD', billing_cycle: 'monthly', original_price: 20 },
    registration: { deadline: { status: 'known', date: '2026-10-31T19:00:00+03:00' } },
  }),
  row('Cloud Two', 'cloud', { eligibility: eligibility('unknown') }),
  row('AI Tool', 'AI Models'),
  row('Unclassified', 'unknown'),
  row('All Tool', 'all'),
].map((item, i) => ({ ...item, slug: 'offer-' + i }));
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
    args: ['--no-sandbox'],
  });
  const results = [];
  try {
    async function run(name, opt, check) {
      const context = await browser.newContext({
        viewport: opt.viewport || { width: 1280, height: 900 },
        ...(opt.reducedMotion ? { reducedMotion: opt.reducedMotion } : {}),
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.addInitScript(
        ({ mode, english }) => {
          if (english) localStorage.setItem('amnabd-lang', 'en');
          window.__written = [];
          if (mode === 'getter')
            Object.defineProperty(navigator, 'clipboard', {
              get() {
                throw new DOMException('Denied', 'SecurityError');
              },
            });
          else
            Object.defineProperty(navigator, 'clipboard', {
              value:
                mode === 'unsupported'
                  ? undefined
                  : {
                      writeText: async (text) => {
                        if (mode === 'rejected')
                          throw new DOMException('Denied', 'NotAllowedError');
                        if (mode === 'never') await new Promise(() => {});
                        if (mode === 'delayed') await new Promise((r) => setTimeout(r, 800));
                        window.__written.push(text);
                      },
                    },
              configurable: true,
            });
        },
        { mode: opt.clipboard || 'success', english: !!opt.english }
      );
      await context.route('**/*', (route) => {
        const u = new URL(route.request().url());
        if (u.hostname === 'audit-fixture.supabase.co') {
          const data = u.pathname.endsWith('/deals')
            ? opt.deals || deals
            : u.pathname.endsWith('/usage_guides')
              ? []
              : {
                  id: 'main',
                  overview: { ar: {}, en: {} },
                  section_labels: {},
                  last_reviewed: '2026-10-17',
                };
          return route.fulfill({ contentType: 'application/json', body: JSON.stringify(data) });
        }
        return u.hostname === '127.0.0.1' ? route.continue() : route.abort();
      });
      try {
        await page.goto(base + '/' + (opt.hash || ''));
        if (opt.hash)
          await page
            .getByRole('button', {
              name: opt.english ? 'Copy deal link' : 'نسخ رابط العرض',
              exact: true,
            })
            .waitFor();
        else await page.locator('article').first().waitFor();
        if (opt.english && (await page.getByRole('button', { name: 'Switch to English' }).count()))
          await page.getByRole('button', { name: 'Switch to English' }).click();
        await check(page);
        if (process.env.AMN_UX_SCREENSHOT_DIR && name.startsWith('UX mobile')) {
          await page.evaluate(() => window.scrollTo(0, 0));
          await page.waitForTimeout(800);
          await page.screenshot({
            path:
              process.env.AMN_UX_SCREENSHOT_DIR +
              '/' +
              (opt.english ? 'home-en.png' : 'home-ar.png'),
            fullPage: true,
          });
        }
        assert.deepEqual(errors, [], name + ' console errors');
        results.push({ name, result: 'PASS' });
      } catch (e) {
        console.error('FAILED:', name);
        e.message = name + ': ' + e.message;
        throw e;
      } finally {
        await context.close();
      }
    }
    await run('UX category pills compose with search and existing eligibility', {}, async (p) => {
      const group = p.getByRole('group', { name: 'فئات العروض' });
      await group.getByRole('button', { name: 'Cloud (٢)', exact: true }).click();
      assert.equal(await p.locator('article').count(), 2);
      assert.equal(
        await group
          .getByRole('button', { name: 'Cloud (٢)', exact: true })
          .getAttribute('aria-pressed'),
        'true'
      );
      await p.getByRole('searchbox').fill('Two');
      await p.waitForFunction(() => document.querySelectorAll('article').length === 1);
      assert.equal(await p.locator('article').count(), 1);
      await p.getByRole('button', { name: 'تصفية وترتيب', exact: true }).click();
      assert.equal(
        await p.getByRole('button', { name: 'تصفية وترتيب', exact: true }).getAttribute('aria-expanded'),
        'true'
      );
      await p.locator('#card-select').selectOption('not_required');
      await p.getByRole('button', { name: 'مسح كل الفلاتر', exact: true }).waitFor();
      assert.equal(await p.locator('article').count(), 0);
      await p.getByRole('button', { name: 'مسح كل الفلاتر', exact: true }).click();
      assert.equal(await p.locator('article').count(), 5);
      assert.equal(await p.getByRole('searchbox').inputValue(), '');
      assert.equal(
        await group
          .getByRole('button', { name: 'كل الفئات (٥)', exact: true })
          .getAttribute('aria-pressed'),
        'true'
      );
    });
    await run('UX uncategorized and literal all category remain distinct', {}, async (p) => {
      const group = p.getByRole('group', { name: 'فئات العروض' });
      await group.getByRole('button', { name: 'غير مصنّف (١)', exact: true }).click();
      assert.equal(await p.locator('article').count(), 1);
      assert.match(await p.locator('article').innerText(), /Unclassified/);
      await group.getByRole('button', { name: 'all (١)', exact: true }).click();
      assert.equal(await p.locator('article').count(), 1);
      assert.match(await p.locator('article').innerText(), /All Tool/);
    });
    await run(
      'UX card shows recorded zero, extra benefits and exact zoned deadline',
      {},
      async (p) => {
        const text = await p.locator('article').first().innerText();
        assert.match(text, /منفعتان إضافيتان/);
        assert.match(text, /السعر المسجّل: ٠ USD · شهريًا/);
        assert.match(text, /موعد التسجيل: 2026-10-31T19:00:00\+03:00/);
        assert.doesNotMatch(text, /وفر|100%|١٠٠٪|مجاني دائم/);
        assert.equal(
          await p.locator('article').first().locator('bdi[dir="ltr"]').innerText(),
          '2026-10-31T19:00:00+03:00'
        );
      }
    );
    await run('UX missing card facts remain explicitly unknown', {}, async (p) => {
      const text = await p.locator('article').nth(1).innerText();
      assert.match(text, /السعر المسجّل: غير معلوم/);
      assert.match(text, /موعد التسجيل: غير معلوم/);
      assert.doesNotMatch(text, /منفعة إضافية|دائم|ينتهي خلال/);
    });
    for (const english of [false, true])
      await run(
        'UX clipboard success announcement ' + (english ? 'en' : 'ar'),
        { hash: '?tracking=synthetic#/deal/offer-0', english },
        async (p) => {
          await p
            .getByRole('button', {
              name: english ? 'Copy deal link' : 'نسخ رابط العرض',
              exact: true,
            })
            .click();
          await p
            .getByRole('status')
            .filter({ hasText: english ? 'Deal link copied.' : 'تم نسخ رابط العرض.' })
            .waitFor();
          assert.deepEqual(await p.evaluate(() => window.__written), [base + '/#/deal/offer-0']);
          assert.equal(await p.getByRole('textbox').count(), 0);
        }
      );
    for (const clipboard of ['rejected', 'unsupported', 'getter'])
      await run(
        'UX clipboard manual fallback ' + clipboard,
        { clipboard, hash: '#/deal/offer-0' },
        async (p) => {
          await p.getByRole('button', { name: 'نسخ رابط العرض', exact: true }).click();
          const input = p.getByRole('textbox', { name: 'رابط العرض للنسخ اليدوي' });
          await input.waitFor();
          assert.equal(await input.inputValue(), base + '/#/deal/offer-0');
          assert.equal(await input.getAttribute('readonly'), '');
          await input.focus();
          assert.equal(
            await input.evaluate((x) => x.selectionEnd - x.selectionStart),
            (await input.inputValue()).length
          );
          assert.deepEqual(await p.evaluate(() => window.__written), []);
        }
      );
    await run(
      'UX late clipboard result cannot leak into another deal',
      { clipboard: 'delayed', hash: '#/deal/offer-0' },
      async (p) => {
        await p.getByRole('button', { name: 'نسخ رابط العرض', exact: true }).click();
        await p.evaluate(() => (window.location.hash = '#/deal/offer-1'));
        await p.getByRole('heading', { name: 'Cloud Two', exact: true }).waitFor();
        await p.waitForTimeout(1000);
        assert.equal(
          await p.getByRole('status').filter({ hasText: 'تم نسخ رابط العرض.' }).count(),
          0
        );
      }
    );
    for (const english of [false, true])
      await run(
        'UX mobile category and card layout ' + (english ? 'en' : 'ar'),
        { english, viewport: { width: 320, height: 780 } },
        async (p) => {
          assert.ok(
            await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
            'horizontal page overflow'
          );
          const group = p.getByRole('group', { name: english ? 'Deal categories' : 'فئات العروض' });
          await group
            .getByRole('button', { name: english ? 'Cloud (2)' : 'Cloud (٢)', exact: true })
            .click();
          assert.equal(await p.locator('article').count(), 2);
          assert.ok(
            await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
            'filtered page overflow'
          );
        }
      );
    await run(
      'UX manual copying can be retried successfully',
      { clipboard: 'rejected', hash: '#/deal/offer-0' },
      async (p) => {
        await p.getByRole('button', { name: 'نسخ رابط العرض', exact: true }).click();
        await p.getByRole('textbox', { name: 'رابط العرض للنسخ اليدوي' }).waitFor();
        await p.evaluate(() => {
          navigator.clipboard.writeText = async (text) => {
            window.__written.push(text);
          };
        });
        await p.getByRole('button', { name: 'نسخ رابط العرض', exact: true }).click();
        await p.getByRole('status').filter({ hasText: 'تم نسخ رابط العرض.' }).waitFor();
        assert.equal(await p.getByRole('textbox').count(), 0);
        assert.deepEqual(await p.evaluate(() => window.__written), [base + '/#/deal/offer-0']);
        await p.waitForTimeout(4200);
        assert.equal(
          await p.getByRole('status').filter({ hasText: 'تم نسخ رابط العرض.' }).count(),
          0
        );
      }
    );
    await run(
      'UX stalled clipboard permission offers manual recovery',
      { clipboard: 'never', hash: '#/deal/offer-0', english: true },
      async (p) => {
        await p.getByRole('button', { name: 'Copy deal link', exact: true }).click();
        const input = p.getByRole('textbox', { name: 'Deal link for manual copying' });
        await input.waitFor({ timeout: 7000 });
        assert.equal(await input.inputValue(), base + '/#/deal/offer-0');
      }
    );
    await run('UX category keyboard focus remains visible', {}, async (p) => {
      const first = p.getByRole('group', { name: 'فئات العروض' }).getByRole('button').first();
      await first.focus();
      await p.keyboard.press('Tab');
      const focused = p.locator(':focus');
      assert.equal(
        await focused.evaluate((x) => x.closest('[role="group"]')?.getAttribute('aria-label')),
        'فئات العروض'
      );
      assert.notEqual(await focused.evaluate((x) => getComputedStyle(x).outlineStyle), 'none');
      await p.keyboard.press('Enter');
      assert.equal(await focused.getAttribute('aria-pressed'), 'true');
    });
    await run(
      'UX long stored category wraps on a narrow screen',
      {
        viewport: { width: 320, height: 780 },
        deals: [row('Long Name', 'Category'.repeat(25), { slug: 'long-name' })],
      },
      async (p) => {
        assert.ok(
          await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          'long category overflow'
        );
      }
    );
    await run('UX reduced motion disables skeleton shimmer', { reducedMotion: 'reduce' }, async (p) => {
      const styles = await p.evaluate(() => {
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton';
        document.body.append(skeleton);
        const computed = getComputedStyle(skeleton);
        return { animationName: computed.animationName, backgroundImage: computed.backgroundImage };
      });
      assert.equal(styles.animationName, 'none');
      assert.equal(styles.backgroundImage, 'none');
    });
    if (process.env.AMN_UX_REPORT)
      fs.writeFileSync(process.env.AMN_UX_REPORT, JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results, null, 2));
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
