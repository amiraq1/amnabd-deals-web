import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';

const guard = await import(pathToFileURL(join(process.cwd(), 'scripts/deal-deadline-guard.mjs')));
const staticSeo = await import(pathToFileURL(join(process.cwd(), 'scripts/generate-static-seo.mjs')));
const { verifyDist } = await import(pathToFileURL(join(process.cwd(), 'scripts/verify-dist.mjs')));

function inspect(deal) {
  return guard.inspectDealDeadlineCoverage([deal], {
    timestampInstant: staticSeo.sharedSeo.timestampInstant,
  });
}

test('F-04: explicit English and Arabic closing date/time without ends_at blocks the guard', () => {
  const cases = [
    {
      slug: 'english-deadline',
      description_en: 'The offer ends October 31, 2026 at 11:59 PM PT.',
    },
    {
      slug: 'arabic-deadline',
      description_ar: 'العرض صالح حتى ٣١ أكتوبر ٢٠٢٦ الساعة ١١:٥٩ مساءً بتوقيت PT.',
    },
    {
      slug: 'bolt-window',
      description_en:
        'GLM is free in Bolt from October 17 at 00:00 to October 18 at 23:59 Pacific Time.',
    },
  ];

  for (const deal of cases) {
    const result = inspect({ ...deal, ends_at: null });
    assert.equal(result.violations.length, 1, deal.slug);
    assert.equal(result.violations[0].slug, deal.slug);
    assert.equal(result.violations[0].expiryEligible, false);
    assert.equal(result.violations[0].reason, 'timed-deadline-missing-valid-ends-at');
    assert.deepEqual(result.warnings, []);
  }
});

test('F-04: an existing valid timestamp or schema-valid date-only ends_at satisfies coverage', () => {
  const copy = 'The offer ends October 31, 2026.';
  for (const ends_at of ['2026-10-31T23:59:00-07:00', '2026-10-31']) {
    const result = inspect({ slug: 'covered', description_en: copy, ends_at });
    assert.deepEqual(result, {
      violations: [],
      warnings: [],
      covered: [{ slug: 'covered', paths: ['description_en'] }],
    });
  }
});

test('F-04: an explicit timed deadline rejects a missing, malformed, or timezone-less ends_at', () => {
  const description_en = 'The offer ends October 31, 2026 at 11:59 PM PT.';
  for (const ends_at of [null, '2026-10-31T16:00:00', '2026-02-30T16:00:00Z']) {
    const result = inspect({ slug: 'invalid-end', description_en, ends_at });
    assert.equal(result.violations.length, 1, String(ends_at));
  }
});

test('F-04: Google-style date-only redemption cutoff is flagged but never given an invented time', () => {
  const result = inspect({
    slug: 'google-ai-plus-students',
    description_ar: 'الاسترداد حتى ٣١ ديسمبر ٢٠٢٦ والتحقق عبر SheerID.',
    description_en: "Redeem by December 31, 2026; verification via SheerID.",
    ends_at: null,
  });

  assert.deepEqual(result.violations, []);
  assert.equal(result.warnings.length, 1);
  assert.deepEqual(result.warnings[0], {
    slug: 'google-ai-plus-students',
    paths: ['description_ar', 'description_en'],
    expiryEligible: false,
    reason: 'date-only-deadline-missing-valid-ends-at',
  });
  assert.equal('ends_at' in result.warnings[0], false);
});

test('F-04: release, publication, announcement, review, registration-only, and negated dates are ignored', () => {
  const cases = [
    {
      slug: 'announced',
      description_en:
        'The offer was announced on August 19, 2026 and its SDK release was published October 31, 2026.',
    },
    {
      slug: 'reviewed',
      review: { notes: { en: 'Reviewed on October 31, 2026.' } },
    },
    {
      slug: 'registration-only',
      description_en: 'Registration deadline: October 31, 2026.',
    },
    {
      slug: 'nexconn-negated-en',
      description_en:
        'No official deadline was found, so the claimed 2026-12-31 date is omitted.',
    },
    {
      slug: 'nexconn-negated-ar',
      description_ar: 'لم يُعثر على موعد نهائي رسمي، لذا لا ندرج تاريخ ٣١ ديسمبر ٢٠٢٦.',
    },
  ];

  for (const deal of cases) {
  assert.deepEqual(
    inspect({ ...deal, ends_at: null }),
    { violations: [], warnings: [], covered: [] },
    deal.slug
  );
  }
});

test('F-04: public row loader paginates a bounded field projection and rejects private keys', async () => {
  const anonKey = `eyJhbGciOiJub25lIn0.${Buffer.from(JSON.stringify({ role: 'anon' })).toString('base64url')}.sig`;
  const requests = [];
  const records = await staticSeo.loadPublicDealRecords({
    publicUrl: 'https://project.supabase.co',
    publicKey: anonKey,
    pageSize: 2,
    fetchImpl: async (input, init) => {
      const url = new URL(input);
      requests.push({ url, init });
      const rows = url.searchParams.get('offset') === '0'
        ? [{ slug: 'first', ends_at: null }, { slug: 'second', ends_at: null }]
        : [{ slug: 'third', ends_at: null }];
      return new Response(JSON.stringify(rows), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  });

  assert.deepEqual(records.map((record) => record.slug), ['first', 'second', 'third']);
  assert.equal(requests.length, 2);
  assert.match(requests[0].url.searchParams.get('select'), /ends_at/);
  assert.match(requests[0].url.searchParams.get('select'), /description_ar,description_en/);
  assert.match(requests[0].url.searchParams.get('select'), /official_sources,review/);
  assert.equal(requests[0].url.searchParams.get('select').includes('*'), false);
  assert.equal(requests[0].init.headers.apikey, anonKey);
  assert.equal(requests[0].init.headers.Authorization, `Bearer ${anonKey}`);

  await assert.rejects(
    staticSeo.loadPublicDealRecords({
      publicUrl: 'https://project.supabase.co',
      publicKey: 'sb_secret_not-a-public-key',
      fetchImpl: async () => {
        throw new Error('The request must not be sent with a private key');
      },
    }),
    /anon\/publishable/i
  );
});

test('F-04: verify-dist fails timed live copy and warns on Google-style date-only copy', () => {
  const distDir = mkdtempSync(join(tmpdir(), 'amnabd-deadline-dist-'));
  try {
    const timed = verifyDist({
      distDir,
      liveDeals: [
        {
          slug: 'timed-live-deal',
          description_en: 'The offer ends October 31, 2026 at 11:59 PM PT.',
          ends_at: null,
        },
      ],
    });
    assert.match(timed.violations.join('\n'), /F-04: deal\/timed-live-deal/);

    const dateOnly = verifyDist({
      distDir,
      liveDeals: [
        {
          slug: 'google-ai-plus-students',
          description_en: 'Redeem by December 31, 2026.',
          ends_at: null,
        },
      ],
    });
    assert.deepEqual(dateOnly.violations, []);
    assert.equal(dateOnly.deadlineWarnings[0]?.slug, 'google-ai-plus-students');
  } finally {
    rmSync(distDir, { recursive: true, force: true });
  }
});
