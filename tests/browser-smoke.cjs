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
  try {
    async function run(name, opt, check) {
      const c = await b.newContext();
      const p = await c.newPage();
      const errors = [],
        logs = [];
      const calls = { deals: 0, guides: 0, config: 0 };
      if (opt.storageFailure)
        await p.addInitScript((mode) => {
          if (mode === 'getter')
            Object.defineProperty(window, 'localStorage', {
              get() {
                throw new DOMException('Denied', 'SecurityError');
              },
            });
          else
            Storage.prototype[mode] = () => {
              throw new DOMException('Denied', 'SecurityError');
            };
        }, opt.storageFailure);
      p.on('pageerror', (e) => errors.push(e.message));
      p.on('console', (m) => logs.push(m.text()));
      await c.route('**/*', async (r) => {
        const u = new URL(r.request().url());
        if (u.hostname === 'audit-fixture.supabase.co') {
          const resource = u.pathname.endsWith('/deals')
            ? 'deals'
            : u.pathname.endsWith('/usage_guides')
              ? 'guides'
              : 'config';
          calls[resource] += 1;
          if (opt.hang?.includes(resource)) return;
          if (opt.failures?.[resource] >= calls[resource])
            return r.fulfill({
              status: 400,
              contentType: 'application/json',
              body: JSON.stringify({ message: 'PRIVATE_UPSTREAM_ERROR' }),
            });
          if (opt.delay?.[resource])
            await new Promise((resolve) => setTimeout(resolve, opt.delay[resource]));
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
        (opt.url || process.env.AMN_PREVIEW_URL || 'http://127.0.0.1:4173').replace(/\/$/, '') +
          '/' +
          (opt.hash || '')
      );
      await p.waitForTimeout(250);
      const expected = 'deals' in opt ? opt.deals : [row()];
      if (
        !opt.hash &&
        Array.isArray(expected) &&
        expected.some(
          (r) =>
            r &&
            typeof r.id === 'string' &&
            typeof r.slug === 'string' &&
            (typeof r.name_en === 'string' || typeof r.name_ar === 'string')
        ) &&
        !opt.failures?.deals &&
        !opt.missingConfig
      ) {
        await p.locator('article').first().waitFor({ timeout: 5000 });
      }
      try {
        await check(p, logs, calls);
      } catch (error) {
        error.message = name + ': ' + error.message;
        throw error;
      }
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
      async (p) =>
        assert.match(await p.locator('main').innerText(), /آخر مراجعة للمصادر: غير معلوم/)
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
        deals: [
          row({ benefits: [{ amount: { value: 7000000, unit: 'tokens', currency: null } }] }),
        ],
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
        assert.match(await p.getByRole('alert').innerText(), /غير صالحة/);
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

    const eligibility = (extra = {}) => ({
      countries: { status: 'worldwide', values: [] },
      conditions: { ar: 'شروط عامة مثبتة', en: 'Established general eligibility' },
      applicant_type: 'any',
      open_to_all: 'yes',
      student_status: 'not_required',
      new_account: 'not_required',
      card_required: 'not_required',
      phone_required: 'unknown',
      ...extra,
    });
    const offer = (id, e) =>
      row({ id, slug: id.replace(/\s+/g, '-'), name_en: id, eligibility: eligibility(e) });
    await run(
      'AMN-003/001 applicant and card filters use canonical proof',
      {
        deals: [
          offer('Open proof'),
          offer('Student only', {
            student_status: 'yes',
            applicant_type: 'student',
            card_required: 'no',
          }),
          offer('Startup only', { applicant_type: 'startup' }),
          offer('Unknown', { open_to_all: 'unknown' }),
          offer('Restricted region', { countries: { status: 'listed', values: ['IQ'] } }),
        ],
      },
      async (p) => {
        await p.getByRole('button', { name: 'تصفية', exact: true }).click();
        await p.getByRole('button', { name: 'مفتوحة للجميع', exact: true }).click();
        assert.equal(await p.locator('article').count(), 1);
        assert.match(await p.locator('article').innerText(), /Open proof/);
        await p.getByRole('button', { name: 'الطلاب', exact: true }).click();
        await p.getByRole('button', { name: 'بدون بطاقة', exact: true }).click();
        assert.equal(await p.locator('article').count(), 1);
        assert.match(await p.locator('article').innerText(), /Student only/);
        await p.getByRole('button', { name: 'مسح الكل', exact: true }).click();
        assert.equal(await p.locator('article').count(), 5);
      }
    );
    await run(
      'AMN-001 absence of student requirement is not universal eligibility',
      { deals: [row({ eligibility: eligibility({ open_to_all: undefined }) })] },
      async (p) => {
        await p.getByRole('button', { name: 'تصفية', exact: true }).click();
        await p.getByRole('button', { name: 'مفتوحة للجميع', exact: true }).click();
        assert.equal(await p.locator('article').count(), 0);
        assert.match(await p.locator('main').innerText(), /المجهول لا يُعد/);
      }
    );
    await run(
      'AMN-003 detail preserves not-required student and no-card facts',
      {
        deals: [row({ eligibility: eligibility({ student_status: 'no', card_required: 'no' }) })],
        hash: '#/deal/offer',
      },
      async (p) => {
        const fact = (label) =>
          p.locator('dt').filter({ hasText: label }).locator('..').locator('dd');
        assert.equal(await fact('حالة الطالب').innerText(), 'غير مطلوب');
        assert.equal(await fact('بطاقة ائتمان').innerText(), 'غير مطلوب');
      }
    );
    await run(
      'AMN-004 optional guide failure does not block cards; retry is scoped',
      {
        failures: { guides: 1 },
        guides: [
          {
            slug: 'offer',
            sections: { eligibility: { ar: 'دليل مستعاد', en: 'Recovered guide', sources: [] } },
          },
        ],
      },
      async (p, logs, calls) => {
        assert.equal(await p.locator('article').count(), 1);
        assert.match(await p.getByRole('alert').innerText(), /دليل الاستخدام/);
        assert.doesNotMatch(logs.join(' '), /PRIVATE_UPSTREAM/);
        const guideResponse = p.waitForResponse(
          (r) => r.url().includes('/usage_guides') && r.status() === 200
        );
        await p
          .getByRole('button', { name: 'إعادة محاولة تحميل دليل الاستخدام', exact: true })
          .click();
        await guideResponse;
        await p.getByRole('button', { name: 'الدليل', exact: true }).click();
        await p.getByText('دليل مستعاد', { exact: true }).waitFor();
        assert.deepEqual(calls, { deals: 1, guides: 2, config: 1 });
      }
    );
    await run(
      'AMN-004 optional settings failure uses fallback and isolated retry',
      { failures: { config: 1 } },
      async (p, _logs, calls) => {
        assert.equal(await p.locator('article').count(), 1);
        const configResponse = p.waitForResponse(
          (r) => r.url().includes('/site_config') && r.status() === 200
        );
        await p
          .getByRole('button', { name: 'إعادة محاولة تحميل إعدادات الموقع', exact: true })
          .click();
        await configResponse;
        await p.getByText('2026-10-17', { exact: true }).waitFor();
        assert.deepEqual(calls, { deals: 1, guides: 1, config: 2 });
      }
    );
    await run(
      'AMN-004 deal network error is not 404 and retry recovers',
      { failures: { deals: 1 }, hash: '#/deal/offer' },
      async (p, _logs, calls) => {
        assert.match(await p.locator('main').innerText(), /تعذر تحميل العروض/);
        assert.doesNotMatch(await p.locator('main').innerText(), /404/);
        await p.getByRole('button', { name: 'إعادة محاولة تحميل العروض', exact: true }).click();
        await p.getByRole('heading', { level: 1, name: 'Offer', exact: true }).waitFor();
        assert.deepEqual(calls, { deals: 2, guides: 1, config: 1 });
      }
    );
    await run(
      'AMN-004 guide route shows an error instead of empty success',
      { failures: { guides: 999 }, hash: '#/guide' },
      async (p) => assert.match(await p.locator('main').innerText(), /تعذر تحميل دليل الاستخدام/)
    );
    await run(
      'AMN-004 valid missing offer is a genuine not-found route',
      { deals: [], hash: '#/deal/missing' },
      async (p) => assert.match(await p.locator('main').innerText(), /404/)
    );
    await run(
      'AMN-004 slow optional request does not hold cards',
      { delay: { guides: 700 } },
      async (p) => {
        assert.equal(await p.locator('article').count(), 1);
        await p.waitForTimeout(800);
      }
    );
    await run(
      'AMN-004 timeout is bounded and leaves independent offers visible',
      { hang: ['guides'] },
      async (p) => {
        assert.equal(await p.locator('article').count(), 1);
        await p
          .getByRole('alert')
          .filter({ hasText: 'انتهت مهلة تحميل دليل الاستخدام' })
          .waitFor({ timeout: 15000 });
        assert.equal(await p.locator('article').count(), 1);
      }
    );
    await run(
      'AMN-011 language toggle does not refetch bilingual data',
      {},
      async (p, _logs, calls) => {
        const before = { ...calls };
        await p.getByRole('button', { name: 'Switch to English' }).click();
        await p.waitForTimeout(200);
        assert.deepEqual(calls, before);
        assert.equal(await p.locator('html').getAttribute('lang'), 'en');
      }
    );
    for (const mode of ['getter', 'getItem', 'setItem']) {
      await run('AMN-008 storage denial: ' + mode, { storageFailure: mode }, async (p) => {
        assert.equal(await p.locator('article').count(), 1);
        await p.getByRole('button', { name: 'Switch to English' }).click();
        await p.waitForFunction(() => document.documentElement.lang === 'en');
        await p.getByRole('button', { name: 'التبديل إلى العربية' }).click();
        await p.waitForFunction(() => document.documentElement.lang === 'ar');
      });
    }
    for (const status of ['supported', 'partial', 'unsupported', 'unknown', 'future-state']) {
      await run(
        'AMN-009 badge state: ' + status,
        {
          deals: [
            row({
              review: {
                verification_status: status,
                reviewed_on: '2026-10-17',
                offer_status: 'unknown',
              },
            }),
          ],
          hash: '#/deal/offer',
        },
        async (p) => {
          const text = await p.locator('main').innerText();
          assert.doesNotMatch(text, /موثق رسميًا/);
          const expected =
            status === 'supported'
              ? 'مدعوم بمصدر رسمي'
              : status === 'partial'
                ? 'مدعوم جزئيًا'
                : status === 'unsupported'
                  ? 'غير مدعوم بالأدلة'
                  : 'الدعم بالأدلة غير معلوم';
          assert.ok(text.includes(expected));
          if (status === 'unknown' || status === 'future-state')
            assert.ok(!text.includes('مدعوم جزئيًا'));
          assert.match(text, /عددها لا يثبت اكتمال المعلومات/);
        }
      );
    }
    for (const hash of ['#/deal/%E0%A4%A', '#/deal/%', '#/deal/a/b', '#/deal/%2F']) {
      await run('AMN-019 malformed initial route: ' + hash, { hash }, async (p) =>
        assert.match(await p.locator('main').innerText(), /404/)
      );
    }
    await run('AMN-019 hash change recovers without refetch', {}, async (p, _logs, calls) => {
      const before = { ...calls };
      await p.evaluate(() => {
        location.hash = '#/deal/%';
      });
      await p.getByRole('button', { name: 'العودة إلى العروض', exact: true }).waitFor();
      await p.getByRole('button', { name: 'العودة إلى العروض', exact: true }).click();
      await p.locator('article').first().waitFor();
      assert.equal(await p.locator('article').count(), 1);
      assert.deepEqual(calls, before);
    });

    if (process.env.AMN_DEV_PREVIEW_URL) {
      await run(
        'AMN-018 development without configuration has a recoverable UI',
        { url: process.env.AMN_DEV_PREVIEW_URL, missingConfig: true },
        async (p, _logs, calls) => {
          await p
            .getByRole('alert')
            .filter({ hasText: 'إعدادات الاتصال غير مكتملة أو غير صالحة' })
            .first()
            .waitFor();
          assert.ok((await p.locator('#root').innerHTML()).length > 0);
          assert.deepEqual(calls, { deals: 0, guides: 0, config: 0 });
          await p.getByRole('button', { name: 'Switch to English' }).click();
          await p
            .getByRole('alert')
            .filter({ hasText: 'Connection settings are missing or invalid' })
            .first()
            .waitFor();
          assert.deepEqual(calls, { deals: 0, guides: 0, config: 0 });
        }
      );
    }

    if (process.env.AMN_SMOKE_REPORT)
      fs.writeFileSync(process.env.AMN_SMOKE_REPORT, JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results, null, 2));
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
