import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';

const built = (rel) => pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, rel));
const { FREE_AI_MODEL_ENTRIES, FREE_AI_MODEL_PROVIDERS, FREE_AI_MODELS_DIRECTORY_LAST_VERIFIED } = await import(
  built('src/content/freeAiModelsDirectory.js')
);
const { parseHash, routeHash, routePath } = await import(built('src/lib/routes.js'));
const { routeMetadata } = await import(built('src/lib/metadata.js'));

const model = FREE_AI_MODEL_ENTRIES[0];

test('AI models directory includes only official-source-verified free or trial records and explicit unknowns', () => {
  assert.equal(FREE_AI_MODELS_DIRECTORY_LAST_VERIFIED, '2026-11-05');
  assert.equal(FREE_AI_MODEL_ENTRIES.length, 5);
  assert.equal(FREE_AI_MODEL_PROVIDERS.length, 2);
  assert.equal(model.name, 'GLM-5.3-Flash');
  assert.equal(model.modelId, 'z-ai/glm-5.3-flash');
  assert.equal(model.providerId, 'nvidia-nim');
  assert.equal(model.developer, 'Z.ai');
  assert.equal(model.tierType, 'trial');
  assert.equal(model.evidenceStatus, 'partial');
  assert.equal(model.contextTokens, 1_048_576);
  assert.deepEqual(model.modalities, ['text', 'image']);
  assert.deepEqual(model.outputModalities, ['text']);
  assert.equal(model.cardPolicy, 'unknown');
  assert.equal(model.phonePolicy, 'unknown');
  assert.match(model.trialLimits.en, /limited trial/);
  assert.match(model.trialLimits.en, /not production/);
  assert.doesNotMatch(model.trialLimits.en, /40 requests per minute|no credit card|free forever/i);
  assert.equal(new URL(model.officialUrl).hostname, 'build.nvidia.com');
  assert.equal(new URL(model.termsUrl).hostname, 'assets.ngc.nvidia.com');
  assert.deepEqual(FREE_AI_MODEL_ENTRIES.map((entry) => entry.modelId), [
    'z-ai/glm-5.3-flash',
    'deepseek-ai/deepseek-v4.1-flash',
    'minimaxai/minimax-m3.1-flash',
    'stepfun-ai/step-5-preview',
    'gemini-3.8-flash',
  ]);
  assert.ok(FREE_AI_MODEL_ENTRIES.every((entry) => entry.cardPolicy === 'unknown' && entry.phonePolicy === 'unknown'));
  const gemini = FREE_AI_MODEL_ENTRIES.find((entry) => entry.providerId === 'google-gemini');
  assert.equal(gemini?.tierType, 'quota');
  assert.match(gemini?.trialLimits.en ?? '', /\$0 Free Tier/);
});

test('AI models directory route has canonical path, legacy hash, and localized metadata', () => {
  const route = { name: 'aiModelsDirectory' };
  assert.deepEqual(parseHash('/free-ai-models-directory'), route);
  assert.equal(routePath(route), '/free-ai-models-directory');
  assert.equal(routeHash(route), '#/free-ai-models-directory');
  assert.match(routeMetadata(route, 'ar').title, /دليل نماذج الذكاء الاصطناعي المجانية/);
  assert.match(routeMetadata(route, 'en').title, /Free AI Models Directory/);
  assert.equal(routeMetadata(route, 'en').canonicalUrl, 'https://amnabd.com/free-ai-models-directory');
  assert.equal(routeMetadata(route, 'en').jsonLd['@type'], 'CollectionPage');
});

test('AI models page is bilingual, discloses trial/unknown fields, and links official sources and API directory', () => {
  const page = readFileSync(join(process.cwd(), 'src/pages/FreeAiModelsDirectoryPage.tsx'), 'utf8');
  const apiPage = readFileSync(join(process.cwd(), 'src/pages/FreeApiKeysDirectoryPage.tsx'), 'utf8');
  const navbar = readFileSync(join(process.cwd(), 'src/components/Navbar.tsx'), 'utf8');
  const footer = readFileSync(join(process.cwd(), 'src/components/Footer.tsx'), 'utf8');
  assert.match(page, /Free AI Models Directory/);
  assert.match(page, /دليل نماذج الذكاء الاصطناعي المجانية/);
  for (const phrase of ['Enter a model or provider name...', 'Credit card', 'Phone', 'Context window', 'Official model page', 'Access terms and pricing']) {
    assert.ok(page.includes(phrase), `missing English field/feature: ${phrase}`);
  }
  for (const phrase of ['اكتب اسم النموذج أو المزوّد...', 'البطاقة', 'الهاتف', 'حجم السياق', 'صفحة النموذج الرسمية', 'شروط الوصول والأسعار']) {
    assert.ok(page.includes(phrase), `missing Arabic field/feature: ${phrase}`);
  }
  assert.match(page, /target="_blank"/);
  assert.match(page, /time dateTime=\{entry\.verifiedDate\}/);
  assert.match(page, /href="\/free-api-keys-directory"/);
  assert.match(apiPage, /href="\/free-ai-models-directory"/);
  assert.match(navbar, /key: 'aiModels'/);
  assert.match(navbar, /path: '\/free-ai-models-directory'/);
  assert.match(footer, /localizedPath\('\/free-ai-models-directory'\)/);
  assert.match(footer, /Free AI Models Directory/);
});

test('AI models directory first-phase UX has expandable cards, quick-use choices, honest no-phone filtering, and mobile controls', () => {
  const page = readFileSync(join(process.cwd(), 'src/pages/FreeAiModelsDirectoryPage.tsx'), 'utf8');
  for (const phrase of [
    'Show details and limits', 'عرض التفاصيل والحدود',
    'I need a model for coding', 'I need image analysis', 'I want long context',
    'I want a trial without a card (officially confirmed)',
    'أحتاج نموذجًا للبرمجة', 'أحتاج تحليل الصور', 'أريد سياقًا طويلًا',
    'أريد تجربة دون بطاقة (مؤكد رسميًا)',
    'Officially confirmed no phone number required', 'مؤكد رسميًا أنه لا يتطلب رقم هاتف',
    'Access via', 'طريقة الوصول', 'overflow-x-auto',
  ]) {
    assert.ok(page.includes(phrase), `missing first-phase UX: ${phrase}`);
  }
  assert.match(page, /if \(noPhoneOnly && entry\.phonePolicy !== 'not_required'\) return false;/);
  assert.match(page, /if \(noCardOnly && entry\.cardPolicy !== 'not_required'\) return false;/);
  assert.match(page, /href=\{entry\.officialUrl\}/);
  assert.match(page, /setUsageFilter\('coding'\)/);
  assert.match(page, /setUsageFilter\('vision'\)/);
  assert.match(page, /setCategoryFilter\('long-context'\)/);
  assert.match(page, /setNoCardOnly\(true\)/);
  assert.match(page, /<details className="group border-t/);
});

test('AI models directory is included in the generated sitemap and has an indexable static route check', () => {
  const seoFacts = readFileSync(join(process.cwd(), 'src/lib/seoFacts.ts'), 'utf8');
  const generator = readFileSync(join(process.cwd(), 'scripts/generate-static-seo.mjs'), 'utf8');
  const verifier = readFileSync(join(process.cwd(), 'scripts/verify-dist.mjs'), 'utf8');
  assert.match(seoFacts, /free-ai-models-directory/);
  assert.match(generator, /free-ai-models-directory/);
  assert.match(verifier, /free-ai-models-directory\/index\.html/);
});
