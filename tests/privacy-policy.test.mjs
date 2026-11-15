import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';

const built = (rel) => pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, rel));
const { parseHash, routeHash, routePath, routeUrl } = await import(built('src/lib/routes.js'));
const { routeMetadata } = await import(built('src/lib/metadata.js'));

const route = { name: 'privacyPolicy' };

test('privacy policy has a stable direct route and bilingual metadata', () => {
  assert.deepEqual(parseHash('/privacy-policy'), route);
  assert.deepEqual(parseHash('#/privacy-policy'), route);
  assert.equal(routePath(route), '/privacy-policy');
  assert.equal(routeHash(route), '#/privacy-policy');
  assert.equal(routeUrl(route, 'lang=en'), '/privacy-policy?lang=en');

  const arabic = routeMetadata(route, 'ar');
  const english = routeMetadata(route, 'en');
  assert.match(arabic.title, /سياسة الخصوصية/);
  assert.match(english.title, /Privacy Policy/);
  assert.equal(arabic.canonicalUrl, 'https://amnabd.com/privacy-policy');
  assert.equal(english.canonicalUrl, arabic.canonicalUrl);
  assert.equal(arabic.jsonLd['@type'], 'WebPage');
});

test('privacy policy copy documents verified app data flows in Arabic and English', () => {
  const page = readFileSync(join(process.cwd(), 'src/pages/PrivacyPolicyPage.tsx'), 'utf8');
  for (const phrase of [
    'سياسة الخصوصية',
    'Supabase',
    'Google Favicons',
    'SimpleIcons',
    'Cloudflare',
    'Google Fonts',
    'الملاحظة الاختيارية',
    'تفضيل اللغة',
    'لا تتضمن الشيفرة الحالية للموقع نصوص تحليلات أو أدوات تتبّع',
    'Privacy Policy',
    'the Supabase database',
    'Google Favicons',
    'SimpleIcons',
    'Cloudflare',
    'the current app does not load fonts from Google Fonts',
    'your language preference and saved-offer list',
    'contains no analytics or tracking scripts',
  ]) {
    assert.ok(page.includes(phrase), `privacy policy is missing: ${phrase}`);
  }
  assert.match(page, /'amnabd|browser storage/);
});

test('footer adds a localized policy link without changing the current repository target', () => {
  const footer = readFileSync(join(process.cwd(), 'src/components/Footer.tsx'), 'utf8');
  assert.match(footer, /localizedPath\('\/privacy-policy'\)/);
  assert.match(footer, /سياسة الخصوصية/);
  assert.match(footer, /Privacy Policy/);
  assert.match(footer, /href="https:\/\/github\.com\/amiraq1\/amnabd-deals"/);
});
