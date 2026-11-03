import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';

const built = (rel) => pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, rel));
const { FREE_API_KEY_ENTRIES, FREE_API_DIRECTORY_LAST_VERIFIED } = await import(
  built('src/content/freeApiKeysDirectory.js')
);
const { parseHash, routeHash, routePath } = await import(built('src/lib/routes.js'));
const { routeMetadata } = await import(built('src/lib/metadata.js'));

const names = FREE_API_KEY_ENTRIES.map((entry) => entry.name);

test('API directory has exactly the 11 eligible free platforms grouped gateways before providers', () => {
  assert.equal(FREE_API_KEY_ENTRIES.length, 11);
  assert.deepEqual(
    FREE_API_KEY_ENTRIES.filter((entry) => entry.type === 'gateway').map((entry) => entry.name),
    ['OpenRouter', 'AnyAPI', 'LLM7.io', 'Free.ai', 'BazaarLink']
  );
  assert.deepEqual(
    FREE_API_KEY_ENTRIES.filter((entry) => entry.type === 'provider').map((entry) => entry.name),
    ['Google AI Studio', 'Groq', 'Novita AI', 'Fireworks AI', 'Mistral', 'Cohere']
  );
  assert.deepEqual(names.filter((name) => ['Together AI', 'DeepInfra', 'Cerebras'].includes(name)), []);
});

test('API directory entries preserve official-source fields and unknown states', () => {
  assert.equal(FREE_API_DIRECTORY_LAST_VERIFIED, '2026-11-04');
  for (const entry of FREE_API_KEY_ENTRIES) {
    assert.ok(entry.name);
    assert.ok(entry.type === 'gateway' || entry.type === 'provider');
    assert.ok(entry.benefit.ar && entry.benefit.en);
    assert.ok(entry.limits === null || (entry.limits.ar && entry.limits.en));
    assert.ok(entry.cardPolicy === 'not_required' || entry.cardPolicy === 'unknown');
    assert.ok(entry.iraq === 'ok' || entry.iraq === 'unknown');
    assert.equal(new URL(entry.officialUrl).protocol, 'https:');
    assert.match(entry.verified, /^2026-11-0[234]$/);
  }
  assert.equal(FREE_API_KEY_ENTRIES.filter((entry) => entry.cardPolicy === 'unknown').length, 4);
  assert.equal(FREE_API_KEY_ENTRIES.filter((entry) => entry.iraq === 'ok').length, 1);
});

test('API directory preserves corrected AnyAPI, BazaarLink, and Fireworks qualifications', () => {
  const byName = Object.fromEntries(FREE_API_KEY_ENTRIES.map((entry) => [entry.name, entry]));
  assert.match(byName.AnyAPI.benefit.en, /100K ANY Tokens per calendar day/);
  assert.match(byName.AnyAPI.limits.en, /one free account per person\/entity/);
  assert.match(byName.BazaarLink.limits.en, /two concurrent free requests/);
  assert.match(byName['Fireworks AI'].limits.en, /zero training GPUs with no payment method/);
});

test('API directory route has stable path, legacy hash route, and localized metadata', () => {
  const route = { name: 'apiDirectory' };
  assert.deepEqual(parseHash('/free-api-keys-directory'), route);
  assert.equal(routePath(route), '/free-api-keys-directory');
  assert.equal(routeHash(route), '#/free-api-keys-directory');
  assert.match(routeMetadata(route, 'ar').title, /دليل مفاتيح API المجانية/);
  assert.match(routeMetadata(route, 'en').title, /Free API Keys Directory/);
  assert.equal(routeMetadata(route, 'en').canonicalUrl, 'https://amnabd.com/free-api-keys-directory');
});

test('API directory page exposes bilingual verification note and each required field', () => {
  const page = readFileSync(join(process.cwd(), 'src/pages/FreeApiKeysDirectoryPage.tsx'), 'utf8');
  const footer = readFileSync(join(process.cwd(), 'src/components/Footer.tsx'), 'utf8');
  assert.match(page, /All entries were verified at their official sources/);
  assert.match(page, /تم التحقق من جميع الإدخالات في مصادرها الرسمية/);
  for (const phrase of ['Benefit', 'Limits and conditions', 'Card policy', 'Iraq status', 'Official source', 'Verified date']) {
    assert.ok(page.includes(phrase), `missing English field label: ${phrase}`);
  }
  for (const phrase of ['الفائدة', 'الحدود والشروط', 'سياسة البطاقة', 'حالة العراق', 'المصدر الرسمي', 'تاريخ التحقق']) {
    assert.ok(page.includes(phrase), `missing Arabic field label: ${phrase}`);
  }
  assert.match(page, /target="_blank"/);
  assert.match(page, /time dateTime=\{entry\.verified\}/);
  assert.match(footer, /localizedPath\('\/free-api-keys-directory'\)/);
  assert.match(footer, /Free API Keys Directory/);
});
