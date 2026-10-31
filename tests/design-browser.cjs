const { chromium } = require('playwright');
const fs = require('fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const sample = JSON.parse(fs.readFileSync(root + '/sample-deal.json'));
const rows = Array.from({ length: 8 }, (_, i) => ({
  ...structuredClone(sample),
  id: 'qa-' + i,
  slug: 'qa-' + i,
  name: undefined,
  name_ar: i === 2 ? 'اسم عربي طويل جداً '.repeat(12) : 'منصة تجريبية ' + i,
  name_en:
    i === 3
      ? 'Very long English offer name '.repeat(12)
      : 'Example Platform ' + i,
  headline_value: i === 0 ? 'Literal recorded headline' : null,
  key_condition: i === 0 ? 'Literal recorded condition' : null,
  use_cases: i === 0 ? ['coding'] : [],
  description_ar: 'وصف مسجل للمنفعة وشروط الاستفادة دون وعود إضافية. '.repeat(
    5,
  ),
  description_en:
    'A recorded benefit and its terms, without additional claims. '.repeat(5),
  category: {
    value:
      i === 1
        ? null
        : i === 2
          ? 'Unfamiliar category with a very long literal label'
          : 'Cloud',
  },
  benefits:
    i === 1
      ? sample.benefits
      : i === 4
        ? []
        : Array.from({ length: i === 0 ? 7 : 1 }, () => ({
            type: 'usage_credits',
            amount: { value: 200, unit: 'credits', currency: 'USD' },
            description: {
              ar: 'رصيد استخدام مسجّل',
              en: 'Recorded usage credits',
            },
            frequency: 'one_time',
            duration: { value: null, unit: null, status: 'unknown' },
          })),
  pricing: {
    offer_price: [25, null, 0, 12][i % 4],
    currency: 'USD',
    billing_cycle: ['monthly', 'unknown', 'yearly', 'one_time'][i % 4],
  },
  eligibility: {
    ...sample.eligibility,
    applicant_type: i === 0 ? 'student' : 'unknown',
    card_required: ['required', 'not_required', 'unknown'][i % 3],
  },
  registration: {
    ...sample.registration,
    deadline: {
      status: i === 1 ? 'unknown' : 'known',
      date: i === 1 ? null : i % 2 ? '2020-01-01' : '2028-12-31',
    },
  },
  review: {
    ...sample.review,
    reviewed_on: i === 1 ? null : '2026-10-20',
    verification_status: ['supported', 'partial', 'unsupported', 'unknown'][
      i % 4
    ],
  },
}));
// Fully populated, synthetic decision record; never written to Supabase.
Object.assign(rows[0].eligibility, {
  countries: { status: 'worldwide', values: [] },
  student_status: 'required',
  new_account: 'required',
  phone_required: 'not_required',
  open_to_all: 'no',
  conditions: {
    ar: 'للطلبة مع حساب جديد حسب شروط سجل QA.',
    en: 'Students with a new account, per the QA terms.',
  },
});
Object.assign(rows[0].review, {
  verified_on: '2026-10-20',
  offer_status: 'active',
  verdict: 'verified',
  notes: {
    ar: 'مراجعة صناعية لاختبار الواجهة فقط.',
    en: 'Synthetic review for UI testing only.',
  },
});
rows[0].pricing.original_price = 40;
rows[0].registration.credit_validity = {
  duration: 12,
  unit: 'months',
  status: 'known',
};
for (const benefit of rows[0].benefits)
  benefit.duration = { value: 12, unit: 'months', status: 'known' };
rows[0].official_sources[0].claims = [
  {
    field: 'pricing.offer_price',
    value: 25,
    evidence: 'Synthetic QA terms record USD 25 per month.',
  },
];
rows[2].name = rows[2].name_ar;
rows.push({
  ...structuredClone(sample),
  id: 'qa-unknown',
  slug: 'qa-unknown',
  name_ar: 'عرض مجهول',
  name_en: 'Unknown offer',
});
(async () => {
  const phase = process.argv[2] || 'after';
  const base = process.env.AMN_PREVIEW_URL || 'http://127.0.0.1:4173';
  const dir =
    process.env.AMN_DESIGN_SCREENSHOT_DIR ||
    path.join(require('node:os').tmpdir(), 'amnabd-design-qa', phase);
  fs.mkdirSync(dir, { recursive: true });
  fs.rmSync(path.join(dir, 'report.json'), { force: true });
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/usr/local/bin/chromium',
    args: ['--no-sandbox'],
  });
  const report = [];
  try {
    const jobs = [];
    for (const lang of ['ar', 'en'])
      for (const width of [320, 375, 768, 1280])
        for (const state of ['home', 'detail', 'loading', 'empty', 'error'])
          jobs.push({ lang, width, state });
    for (const lang of ['ar', 'en'])
      for (const slug of [
        'qa-1',
        'qa-2',
        'qa-3',
        'qa-4',
        'qa-5',
        'qa-6',
        'qa-7',
        'qa-unknown',
      ])
        jobs.push({ lang, width: 320, state: 'detail', slug });
    async function worker() {
      while (jobs.length) {
        const { lang, width, state, slug } = jobs.shift();
        const fileTag = slug ? state + '-' + slug : state;
        const context = await browser.newContext({
          viewport: { width, height: 900 },
          reducedMotion: 'reduce',
          serviceWorkers: 'block',
        });
        const p = await context.newPage();
        const external = [];
        const errors = [];
        p.on('pageerror', (e) => errors.push(e.message));
        await p.addInitScript(() =>
          localStorage.setItem(
            'amnabd_saved_deals_v1',
            JSON.stringify(['qa-0']),
          ),
        );
        await context.route('**/*', async (route) => {
          const u = new URL(route.request().url());
          if (u.hostname === 'audit-fixture.supabase.co') {
            if (u.pathname.endsWith('/deals')) {
              if (state === 'loading')
                await new Promise((r) => setTimeout(r, 4000));
              if (state === 'error')
                return route.fulfill({ status: 500, body: '{}' });
              return route.fulfill({ json: state === 'empty' ? [] : rows });
            }
            return route.fulfill({
              json: u.pathname.endsWith('/usage_guides')
                ? []
                : {
                    id: 'main',
                    overview: { ar: {}, en: {} },
                    section_labels: { ar: {}, en: {} },
                    last_reviewed: '2026-10-20',
                  },
            });
          }
          if (u.hostname === '127.0.0.1') return route.continue();
          external.push(u.hostname);
          return route.abort();
        });
        await p.goto(
          base +
            (state === 'detail' ? '/deal/' + (slug || 'qa-0') : '/') +
            '?lang=' +
            lang,
          { waitUntil: 'domcontentloaded' },
        );
        if (['home', 'detail'].includes(state))
          await p
            .locator(state === 'home' ? 'article' : 'h1')
            .first()
            .waitFor();
        if (state === 'empty')
          await p
            .getByText(
              phase === 'before'
                ? lang === 'ar'
                  ? 'لا توجد عروض تطابق الفلاتر المحددة حالياً'
                  : 'No deals match your current filters.'
                : lang === 'ar'
                  ? 'لا توجد عروض لعرضها حالياً'
                  : 'No offers to display yet.',
              { exact: true },
            )
            .waitFor();
        if (state === 'error')
          await p.locator('[role="alert"]').first().waitFor();
        await p.waitForTimeout(state === 'loading' ? 150 : 400);
        await p.screenshot({
          path: `${dir}/${lang}-${width}-${fileTag}.png`,
          fullPage: true,
        });
        if (state === 'home') {
          await p
            .locator('article')
            .first()
            .screenshot({ path: `${dir}/${lang}-${width}-card.png` });
          if (width === 320)
            for (let i = 0; i < rows.length; i++)
              await p
                .locator('article')
                .nth(i)
                .screenshot({
                  path: `${dir}/${lang}-${width}-case-${rows[i].slug}.png`,
                });
          await p
            .getByRole('group', {
              name: lang === 'ar' ? 'فئات العروض' : 'Deal categories',
            })
            .screenshot({ path: `${dir}/${lang}-${width}-categories.png` });
        }
        if (state === 'detail' && width < 640)
          await p.locator('aside[aria-label]').screenshot({
            path: `${dir}/${lang}-${width}-${fileTag}-mobile-actions.png`,
          });
        if (state === 'home') {
          await p
            .getByRole('button', {
              name: lang === 'ar' ? 'تصفية وترتيب' : 'Filters & Sort',
              exact: true,
            })
            .click();
          await p.evaluate(() => window.scrollTo(0, 0));
          await p
            .getByRole('searchbox')
            .locator('xpath=ancestor::section')
            .screenshot({ path: `${dir}/${lang}-${width}-filters-panel.png` });
          await p.evaluate(() => window.scrollTo(0, 0));
          await p.screenshot({
            path: `${dir}/${lang}-${width}-filters.png`,
            fullPage: true,
          });
          await p
            .getByRole('button', {
              name: lang === 'ar' ? 'تصفية وترتيب' : 'Filters & Sort',
              exact: true,
            })
            .click();
          if (phase !== 'before') {
            assert.equal(await p.locator('article').count(), rows.length);
            const first = p.locator('article').first();
            const heart = first.getByRole('button', {
              name: 'Remove from favorites',
              exact: true,
            });
            if (lang === 'en') {
              await heart.click();
              assert.equal(
                await first
                  .getByRole('button', {
                    name: 'Add to favorites',
                    exact: true,
                  })
                  .getAttribute('aria-pressed'),
                'false',
              );
            }
            const link = first.getByRole('link', {
              name: new RegExp(lang === 'ar' ? 'تفاصيل العرض' : 'View details'),
            });
            await link.focus();
            await p.keyboard.press('Tab');
            await p.keyboard.press('Shift+Tab');
            assert.equal(
              await link.evaluate((el) => el === document.activeElement),
              true,
            );
            assert.equal(
              await link.evaluate((el) => getComputedStyle(el).outlineStyle),
              'solid',
            );
            assert.ok(
              parseFloat(
                await link.evaluate((el) => getComputedStyle(el).outlineWidth),
              ) >= 2,
            );
          }
        }
        let mobileChecks = null;
        if (state === 'detail' && width < 640) {
          await p.evaluate(() =>
            window.scrollTo(0, document.body.scrollHeight),
          );
          const top = p.getByRole('button', {
            name: lang === 'ar' ? 'العودة إلى أعلى الصفحة' : 'Scroll to top',
            exact: true,
          });
          await top.waitFor();
          const bar = p.locator('aside[aria-label]');
          const barBox = await bar.boundingBox(),
            topBox = await top.boundingBox();
          mobileChecks = {
            overlap: topBox.y + topBox.height > barBox.y,
            barZ: await bar.evaluate((el) => getComputedStyle(el).zIndex),
            topZ: await top.evaluate((el) => getComputedStyle(el).zIndex),
            measured: await p.evaluate(() =>
              parseFloat(
                document.documentElement.style.getPropertyValue(
                  '--amnabd-mobile-actions-height',
                ),
              ),
            ),
            height: barBox.height,
          };
          if (phase !== 'before') {
            assert.equal(mobileChecks.overlap, false);
            assert.equal(mobileChecks.barZ, '40');
            assert.equal(mobileChecks.topZ, '30');
            assert.ok(
              Math.abs(mobileChecks.measured - mobileChecks.height) <= 1,
            );
          }
        }
        const metrics = await p.evaluate(() => ({
          width: innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          nested: document.querySelectorAll(
            'a button,button a,a a,button button',
          ).length,
          shortTargets: [
            ...document.querySelectorAll(
              'main button, main a, main input:not([type="checkbox"]), main select, footer a, header button, header nav a',
            ),
          ]
            .filter((el) => {
              const r = el.getBoundingClientRect();
              return r.width > 0 && r.height > 0 && r.height < 43.9;
            })
            .map((el) => ({
              text: el.textContent.slice(0, 80),
              height: el.getBoundingClientRect().height,
            })),
          bar: document.querySelector('aside[aria-label]')
            ? getComputedStyle(document.querySelector('aside[aria-label]'))
                .zIndex
            : null,
        }));
        report.push({
          lang,
          width,
          state,
          slug,
          mobileChecks,
          ...metrics,
          external: [...new Set(external)],
          errors,
        });
        if (phase !== 'before' && state === 'home') {
          await p
            .locator('article')
            .first()
            .getByRole('link', {
              name: new RegExp(lang === 'ar' ? 'تفاصيل العرض' : 'View details'),
            })
            .click();
          await p.waitForURL((url) => url.pathname === '/deal/qa-0');
          await p.getByRole('heading', { level: 1 }).waitFor();
        }
        if (
          phase !== 'before' &&
          state === 'detail' &&
          !slug &&
          width === 320
        ) {
          await p.evaluate(() => {
            document.documentElement.style.fontSize = '32px';
            window.scrollTo(0, document.body.scrollHeight);
          });
          await p.waitForFunction(
            () =>
              Math.abs(
                parseFloat(
                  document.documentElement.style.getPropertyValue(
                    '--amnabd-mobile-actions-height',
                  ),
                ) -
                  document
                    .querySelector('aside[aria-label]')
                    .getBoundingClientRect().height,
              ) <= 1,
            null,
            { timeout: 5000 },
          );
          const resized = await p.evaluate(() => ({
            width: innerWidth,
            scrollWidth: document.documentElement.scrollWidth,
            measured: parseFloat(
              document.documentElement.style.getPropertyValue(
                '--amnabd-mobile-actions-height',
              ),
            ),
            height: document
              .querySelector('aside[aria-label]')
              .getBoundingClientRect().height,
          }));
          assert.equal(resized.width, resized.scrollWidth);
          assert.ok(
            Math.abs(resized.measured - resized.height) <= 1,
            JSON.stringify(resized),
          );
          await p.screenshot({
            path: `${dir}/${lang}-320-text-200.png`,
            fullPage: true,
          });
          await p.evaluate(
            () => (document.documentElement.style.fontSize = ''),
          );
          await p
            .getByRole('button', {
              name: lang === 'ar' ? 'كل العروض' : 'All deals',
              exact: true,
            })
            .click();
          await p.locator('article').first().waitFor();
          assert.equal(
            await p.evaluate(() =>
              document.documentElement.style.getPropertyValue(
                '--amnabd-mobile-actions-height',
              ),
            ),
            '',
          );
        }
        await context.close();
      }
    }
    await Promise.all(Array.from({ length: 1 }, worker));
    assert.equal(report.length, 56);
    if (phase !== 'before') {
      for (const r of report) {
        assert.equal(r.scrollWidth, r.width, JSON.stringify(r));
        assert.equal(r.nested, 0);
        assert.deepEqual(r.shortTargets, [], JSON.stringify(r));
        assert.deepEqual(r.external, []);
        assert.deepEqual(r.errors, []);
      }
    }
    fs.writeFileSync(dir + '/report.json', JSON.stringify(report, null, 2));
    console.log(
      JSON.stringify(
        {
          captures: report.length,
          overflow: report.filter((r) => r.scrollWidth > r.width),
          external: [...new Set(report.flatMap((r) => r.external))],
          errors: report.flatMap((r) => r.errors),
        },
        null,
        2,
      ),
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
