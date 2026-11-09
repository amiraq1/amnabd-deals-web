import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';

const built = (rel) => pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, rel));
const { SMS_SUPPLIERS } = await import(built('src/content/smsSuppliersDirectory.js'));
const { parseHash, routeHash, routePath } = await import(built('src/lib/routes.js'));
const { routeMetadata } = await import(built('src/lib/metadata.js'));
const { getListedSourceUrl, LINK_REASON_MESSAGES, isListedAsOfficial } = await import(built('src/lib/smsSuppliers.js'));

const source = (rel) => readFileSync(join(process.cwd(), rel), 'utf8');

test('SMS directory preserves all 75 submitted records and separates source statuses', () => {
  assert.equal(SMS_SUPPLIERS.length, 75);
  assert.equal(new Set(SMS_SUPPLIERS.map((entry) => entry.id)).size, 75);
  assert.equal(SMS_SUPPLIERS.filter((entry) => entry.verificationStatus === 'official').length, 39);
  assert.equal(SMS_SUPPLIERS.filter((entry) => entry.verificationStatus === 'needsReview').length, 36);
  for (const entry of SMS_SUPPLIERS) {
    assert.ok(entry.name);
    assert.ok(entry.domain);
    assert.ok(entry.url);
    assert.ok(entry.serviceTypes.length > 0);
    assert.ok(['private', 'mixed', 'public', 'unknown'].includes(entry.privacy));
    assert.ok(['yes', 'unknown'].includes(entry.apiSupport));
  }
});

test('SMS directory route has a stable path, legacy hash, and bilingual collection metadata', () => {
  const route = { name: 'smsSuppliersDirectory' };
  assert.deepEqual(parseHash('/sms-suppliers-directory'), route);
  assert.equal(routePath(route), '/sms-suppliers-directory');
  assert.equal(routeHash(route), '#/sms-suppliers-directory');
  assert.match(routeMetadata(route, 'ar').title, /دليل خدمات وأدلة أرقام SMS/);
  assert.match(routeMetadata(route, 'en').title, /SMS Number Services & Directories/);
  assert.equal(routeMetadata(route, 'en').canonicalUrl, 'https://amnabd.com/sms-suppliers-directory');
  assert.equal(routeMetadata(route, 'en').jsonLd['@type'], 'CollectionPage');
});

test('SMS directory is bilingual, discloses unverified source labels and public-inbox privacy risks', () => {
  const page = source('src/pages/SmsSuppliersDirectoryPage.tsx');
  const footer = source('src/components/Footer.tsx');
  for (const phrase of ['Search by name or domain', 'Service type', 'Privacy indicator', 'Record status', 'Needs review']) {
    assert.ok(page.includes(phrase), `missing English page text: ${phrase}`);
  }
  for (const phrase of ['ابحث بالاسم أو النطاق', 'نوع الخدمة', 'مؤشر الخصوصية', 'حالة السجل', 'بحاجة إلى مراجعة']) {
    assert.ok(page.includes(phrase), `missing Arabic page text: ${phrase}`);
  }
  assert.match(page, /not independently re-checked for this page/);
  assert.match(page, /لم نُعِد التحقق من هذه التصنيفات لهذه الصفحة/);
  assert.match(page, /do not use public inboxes for login codes/);
  assert.match(page, /لا تستخدم صناديق الوارد العامة لاستقبال رموز دخول/);
  assert.match(page, /rel="noopener noreferrer nofollow"/);
  assert.match(footer, /localizedPath\('\/sms-suppliers-directory'\)/);
  assert.match(footer, /SMS Number Services Directory/);
});

test('Task 2: getListedSourceUrl directly validates protocol, domain match, and status with explicit reasons', () => {
  // 1. Exact match success
  const exact = getListedSourceUrl({
    verificationStatus: 'official',
    url: 'https://example.com/login',
    domain: 'example.com',
  });
  assert.deepEqual(exact, { ok: true, url: 'https://example.com/login' });

  // 2. Legitimate subdomain success
  const sub = getListedSourceUrl({
    verificationStatus: 'official',
    url: 'https://api.auth.example.com/',
    domain: 'example.com',
  });
  assert.deepEqual(sub, { ok: true, url: 'https://api.auth.example.com/' });

  // 3. Case-insensitive matching success
  const mixedCase = getListedSourceUrl({
    verificationStatus: 'official',
    url: 'HTTPS://Sub.Example.COM/Path',
    domain: 'EXAMPLE.COM',
  });
  assert.deepEqual(mixedCase, { ok: true, url: 'HTTPS://Sub.Example.COM/Path' });

  // 4. Failure: needsReview status is withheld before URL checks
  const unreviewed = getListedSourceUrl({
    verificationStatus: 'needsReview',
    url: 'https://example.com/',
    domain: 'example.com',
  });
  assert.deepEqual(unreviewed, { ok: false, reason: 'needsReview' });

  // 5. Failure: plain HTTP is withheld with notHttps reason
  const http = getListedSourceUrl({
    verificationStatus: 'official',
    url: 'http://example.com/',
    domain: 'example.com',
  });
  assert.deepEqual(http, { ok: false, reason: 'notHttps' });

  // 6. Failure: totally different domain
  const diffDomain = getListedSourceUrl({
    verificationStatus: 'official',
    url: 'https://another-site.org/',
    domain: 'example.com',
  });
  assert.deepEqual(diffDomain, { ok: false, reason: 'domainMismatch' });

  // 7. Failure: looks like domain suffix without a leading dot (evilexample.com vs example.com)
  const evilSuffix = getListedSourceUrl({
    verificationStatus: 'official',
    url: 'https://evilexample.com/',
    domain: 'example.com',
  });
  assert.deepEqual(evilSuffix, { ok: false, reason: 'domainMismatch' });

  // 8. Failure: malformed URL
  const malformed = getListedSourceUrl({
    verificationStatus: 'official',
    url: 'not-a-valid-url',
    domain: 'example.com',
  });
  assert.deepEqual(malformed, { ok: false, reason: 'invalidUrl' });

  // Reason messages exist for both languages
  for (const reason of ['needsReview', 'notHttps', 'domainMismatch', 'invalidUrl']) {
    assert.ok(LINK_REASON_MESSAGES[reason].ar.length > 0);
    assert.ok(LINK_REASON_MESSAGES[reason].en.length > 0);
  }
});

test('Task 2: dataset source link policy strictly preserves the exact 38 enabled suppliers', () => {
  const EXPECTED_ENABLED_IDS = [
    'hero-sms',
    '5sim',
    'sms-man',
    'tiger-sms',
    'pingme',
    'smssir',
    'onlinesim',
    'globalsms',
    'smspool',
    'textverified',
    'quackr',
    'sms24',
    'sms-online',
    'getfreesmsnumber',
    '7sim',
    'hs3x',
    'receivefreesms-net',
    'receivesmsonline-in',
    'groovl',
    'sellaite',
    'sendsmsnow',
    'proovl',
    'anon-sms',
    'pinger',
    '1s2u',
    'virtty',
    'textanywhere',
    'smspinverify',
    'anonymsms',
    'foxsims',
    'buru',
    'pvacodes',
    'freeje',
    'pvapins',
    'sms7',
    'receiveasms',
    'us-phone-number',
    'sms-verification-number',
  ];

  const enabled = SMS_SUPPLIERS.filter((s) => getListedSourceUrl(s).ok);
  const enabledIds = enabled.map((s) => s.id);
  assert.deepEqual(enabledIds, EXPECTED_ENABLED_IDS);
  assert.equal(enabled.length, 38);

  // Every enabled supplier must have official status, HTTPS URL, and matching domain
  for (const s of enabled) {
    assert.equal(s.verificationStatus, 'official');
    assert.ok(s.url.startsWith('https://'));
    const hostname = new URL(s.url).hostname.toLowerCase().replace(/^www\./, '');
    const domain = s.domain.toLowerCase().replace(/^www\./, '');
    assert.ok(hostname === domain || hostname.endsWith(`.${domain}`));
  }

  // The one official supplier that fails due to plain HTTP
  const httpSupplier = SMS_SUPPLIERS.find((s) => s.id === 'sms-receive-net');
  assert.ok(httpSupplier);
  assert.equal(httpSupplier.verificationStatus, 'official');
  assert.deepEqual(getListedSourceUrl(httpSupplier), { ok: false, reason: 'notHttps' });

  // All 36 needsReview suppliers get needsReview reason
  const reviewSuppliers = SMS_SUPPLIERS.filter((s) => s.verificationStatus === 'needsReview');
  assert.equal(reviewSuppliers.length, 36);
  for (const s of reviewSuppliers) {
    assert.deepEqual(getListedSourceUrl(s), { ok: false, reason: 'needsReview' });
  }
});

test('SMS directory has a static SEO route and appears in the sitemap', () => {
  const seoFacts = source('src/lib/seoFacts.ts');
  const generator = source('scripts/generate-static-seo.mjs');
  const verifier = source('scripts/verify-dist.mjs');
  assert.match(seoFacts, /sms-suppliers-directory/);
  assert.match(generator, /sms-suppliers-directory/);
  assert.match(verifier, /sms-suppliers-directory\/index\.html/);
});
