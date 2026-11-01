// FIX-01 (AUD-01, AUD-02): ended offers must not read as available on the
// detail page, and must leave the sitemap and feed while keeping their pages.
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { after, before, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const root = process.cwd();
// Fixed reference time after both recorded end dates below.
const NOW = new Date('2026-11-01T06:00:00Z');

let vite;
let DealDetailPage;
let LanguageProvider;

before(async () => {
  vite = await createServer({
    configFile: resolve(root, 'vite.config.ts'),
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'error',
  });
  ({ default: DealDetailPage } = await vite.ssrLoadModule('/src/pages/DealDetailPage.tsx'));
  ({ LanguageProvider } = await vite.ssrLoadModule('/src/context/LanguageContext.tsx'));
});

after(async () => {
  await vite?.close();
});

// Exact labels from src/lib/evidence.ts (offerTimingLabel / offerStatusLabel).
const LABELS = {
  ar: {
    endedByStatus: 'منتهٍ وفق المراجعة',
    endedByDate: 'انتهى حسب تاريخ الانتهاء المسجّل',
    available: 'متاح وفق المراجعة',
  },
  en: {
    endedByStatus: 'Ended as reviewed',
    endedByDate: 'Ended per the recorded end date',
    available: 'Available as reviewed',
  },
};

function makeDeal(overrides) {
  return {
    id: 'fix-01-test',
    slug: 'fix-01-test',
    name_ar: 'عرض اختبار',
    name_en: 'Test offer',
    description_ar: 'وصف عرض الاختبار',
    description_en: 'Test offer description',
    category: { value: 'developer-tools' },
    benefits: [],
    eligibility: {
      countries: { status: 'unknown', values: [] },
      conditions: { ar: 'شروط يثبتها المصدر.', en: 'Conditions the source states.' },
      new_account: 'not_required',
      card_required: 'unknown',
      applicant_type: 'unknown',
      phone_required: 'unknown',
      student_status: 'unknown',
    },
    pricing: { currency: null, offer_price: null, billing_cycle: 'unknown', original_price: null },
    registration: {
      deadline: { date: null, status: 'unknown' },
      credit_validity: { unit: null, status: 'unknown', duration: null },
    },
    official_sources: [{ url: 'https://official.example.test/terms', title: 'Terms', claims: [] }],
    get_offer: { url: 'https://official.example.test/offer', type: 'official', label: { ar: 'العرض', en: 'Offer' } },
    review: {
      notes: { ar: 'ملاحظة.', en: 'Note.' },
      reviewed_on: '2026-10-24',
      verified_on: null,
      offer_status: 'active',
      unknown_fields: [],
      verification_status: 'verified',
    },
    ...overrides,
  };
}

// Mirrors the live Bolt row: status expired while review.offer_status still says active.
const expiredByStatus = makeDeal({ slug: 'expired-by-status', status: 'expired', ends_at: null });
// Mirrors the live DeepSeek row: status active, recorded end date already passed.
const endedByDate = makeDeal({
  slug: 'ended-by-date',
  status: 'active',
  ends_at: '2026-10-31T16:00:00+00:00',
});
// Control: no end date and no expired status must keep the available label.
const activeControl = makeDeal({ slug: 'active-control', status: 'active', ends_at: null });

function renderDetail(deal, lang) {
  const values = new Map();
  globalThis.window = {
    location: { search: `?lang=${lang}`, hash: '' },
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
      removeItem: (key) => values.delete(key),
    },
  };
  try {
    return renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        null,
        React.createElement(DealDetailPage, {
          deal,
          guide: null,
          sectionLabels: {},
          onBack: () => {},
          onToggleComparison: () => {},
          comparisonSelected: false,
          comparisonDisabled: false,
        })
      )
    );
  } finally {
    delete globalThis.window;
  }
}

for (const lang of ['ar', 'en']) {
  const labels = LABELS[lang];

  test(`detail page shows the ended label for an expired offer (${lang})`, () => {
    const html = renderDetail(expiredByStatus, lang);
    assert.ok(html.includes(labels.endedByStatus), 'ended label is rendered');
    assert.ok(!html.includes(labels.available), 'available label is not rendered');
  });

  test(`detail page shows the ended label for an offer past its recorded end (${lang})`, () => {
    const html = renderDetail(endedByDate, lang);
    assert.ok(html.includes(labels.endedByDate), 'ended-by-date label is rendered');
    assert.ok(!html.includes(labels.available), 'available label is not rendered');
  });

  test(`detail page keeps the available label for an offer that has not ended (${lang})`, () => {
    const html = renderDetail(activeControl, lang);
    assert.ok(html.includes(labels.available), 'available label is rendered');
    assert.ok(!html.includes(labels.endedByStatus) && !html.includes(labels.endedByDate));
  });
}

// ---- Sitemap and feed --------------------------------------------------------

const ENDED = ['bolt-builders-week', 'deepseek-flash-1017-free'];
const ACTIVE = 'exa-ai';

test('generated sitemap and feed exclude ended offers, keep the active one, and keep ended deal pages', async () => {
  const { runStaticSeoGeneration, loadDealsCatalog } = await import(
    pathToFileURL(join(root, 'scripts/generate-static-seo.mjs')).href
  );
  const slugs = loadDealsCatalog(root).map((deal) => deal.slug);
  for (const slug of [...ENDED, ACTIVE]) assert.ok(slugs.includes(slug), `${slug} is in the catalog`);

  // Every catalog slug is live; only the two ended ones carry non-active state.
  const records = slugs.map((slug) => {
    if (slug === 'bolt-builders-week') return { slug, status: 'expired', ends_at: '2026-10-19T06:59:00+00:00' };
    if (slug === 'deepseek-flash-1017-free') return { slug, status: 'active', ends_at: '2026-10-31T16:00:00+00:00' };
    return { slug, status: 'active', ends_at: null };
  });

  const dist = mkdtempSync(join(tmpdir(), 'amnabd-fix01-'));
  try {
    writeFileSync(
      join(dist, 'index.html'),
      `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="UTF-8" /><title>نبض</title></head><body><div id="root"></div></body></html>`
    );
    await runStaticSeoGeneration({
      distDir: dist,
      baseUrl: 'https://amnabd.example',
      databaseSlugs: slugs,
      databaseDealStates: records,
      referenceNow: NOW,
    });

    const sitemap = readFileSync(join(dist, 'sitemap.xml'), 'utf8');
    const feed = readFileSync(join(dist, 'feed.xml'), 'utf8');
    for (const slug of ENDED) {
      assert.ok(!sitemap.includes(`/deal/${slug}<`), `sitemap omits ${slug}`);
      assert.ok(!feed.includes(`/deal/${slug}`), `feed omits ${slug}`);
      assert.ok(existsSync(join(dist, 'deal', `${slug}.html`)), `deal page for ${slug} is kept`);
    }
    assert.ok(sitemap.includes(`/deal/${ACTIVE}<`), 'sitemap includes the active offer');
    assert.ok(feed.includes(`/deal/${ACTIVE}`), 'feed includes the active offer');
  } finally {
    rmSync(dist, { recursive: true, force: true });
  }
});
