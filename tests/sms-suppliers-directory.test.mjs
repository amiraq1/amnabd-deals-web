import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';

const built = (rel) => pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, rel));
const { SMS_SUPPLIERS } = await import(built('src/content/smsSuppliersDirectory.js'));
const { parseHash, routeHash, routePath } = await import(built('src/lib/routes.js'));
const { routeMetadata } = await import(built('src/lib/metadata.js'));

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
  assert.match(page, /safeUrl\(supplier\.url\)/);
  assert.match(page, /hostname\.endsWith\(`\.\$\{listedDomain\}`\)/);
  assert.match(page, /rel="noopener noreferrer nofollow"/);
  assert.match(footer, /localizedPath\('\/sms-suppliers-directory'\)/);
  assert.match(footer, /SMS Number Services Directory/);
});

test('SMS directory has a static SEO route and appears in the sitemap', () => {
  const seoFacts = source('src/lib/seoFacts.ts');
  const generator = source('scripts/generate-static-seo.mjs');
  const verifier = source('scripts/verify-dist.mjs');
  assert.match(seoFacts, /sms-suppliers-directory/);
  assert.match(generator, /sms-suppliers-directory/);
  assert.match(verifier, /sms-suppliers-directory\/index\.html/);
});
