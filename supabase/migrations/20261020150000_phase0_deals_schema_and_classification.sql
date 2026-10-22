/*
# Migration: Phase 0 Schema Enhancement & Deals Classification
# AMNABD Deals v1.0 — October 2026
#
# 1. New Columns on `deals`:
#    - `name` (text): Short service/tool name (e.g. Bolt, Vercel Beam)
#    - `headline_value` (text): Prominent bold value proposition (e.g. "200$ رصيد", "مجاني لمدة محدودة")
#    - `key_condition` (text): Primary eligibility/requirement condition (e.g. "بدون بطاقة", "للطلاب")
#    - `use_cases` (text[]): Array of use case tags (e.g. coding, search, voice, video_design, hosting)
#    - `status` (text): Lifecycle status ('active', 'ending_soon', 'expired', 'verifying')
#    - `ends_at` (timestamptz): Exact end timestamp when applicable
#
# 2. Complete classification of all 27 deals into fixed Arabic categories:
#    - برمجة وتطوير
#    - بحث وتطوير
#    - صوت وذكاء اصطناعي
#    - فيديو وصور
#    - استضافة وسحابيات
#    - استضافة وبوابات AI
#    - تصميم وواجهات
#
# 3. Status updates:
#    - Expired deals (e.g. Bolt Builders Week) marked 'expired'
#    - Ending soon deals (e.g. Beam Vercel Gateway) marked 'ending_soon'
#    - Unverified deals (e.g. Qwen Cloud campaign without formal terms) marked 'verifying'
#    - Active deals marked 'active'
*/

ALTER TABLE deals ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS headline_value text;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS key_condition text;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS use_cases text[] DEFAULT '{}'::text[];
-- A new row must not claim availability before anyone reviewed it. The default
-- is `verifying`, not `active`: `getAvailabilitySchema('active')` emits
-- schema.org/InStock, and that is a public claim search engines may cache.
ALTER TABLE deals ADD COLUMN IF NOT EXISTS status text DEFAULT 'verifying';
ALTER TABLE deals ADD COLUMN IF NOT EXISTS ends_at timestamptz;

-- 1. Google Antigravity
UPDATE deals SET
  name = 'Google Antigravity',
  headline_value = 'وصول مجاني لـ10,000 باحث',
  key_condition = 'للعلماء والباحثين',
  use_cases = ARRAY['بحث', 'برمجة'],
  status = 'active',
  category = jsonb_build_object('value', 'بحث وتطوير', 'review_status', 'verified')
WHERE slug = 'antigravity-ultra-scientists';

-- 2. AssemblyAI
UPDATE deals SET
  name = 'AssemblyAI',
  headline_value = 'رصيد مجاني لمدة 12 شهرًا',
  key_condition = 'للشركات الناشئة في مجال الصوت',
  use_cases = ARRAY['صوت', 'برمجة'],
  status = 'active',
  category = jsonb_build_object('value', 'صوت وذكاء اصطناعي', 'review_status', 'verified')
WHERE slug = 'assemblyai';

-- 3. Beam (Vercel)
UPDATE deals SET
  name = 'Vercel Beam',
  headline_value = 'مجاني لفترة إطلاق محدودة',
  key_condition = 'بدون تكلفة إضافية عبر Vercel AI Gateway',
  use_cases = ARRAY['برمجة', 'استضافة'],
  status = 'ending_soon',
  category = jsonb_build_object('value', 'استضافة وبوابات AI', 'review_status', 'verified')
WHERE slug = 'beam-vercel-gateway';

-- 4. blitz.cloud
UPDATE deals SET
  name = 'blitz.cloud',
  headline_value = 'استضافة مجانية لـ5 تطبيقات',
  key_condition = 'بدون بطاقة ائتمان',
  use_cases = ARRAY['استضافة', 'برمجة'],
  status = 'active',
  category = jsonb_build_object('value', 'استضافة وسحابيات', 'review_status', 'verified')
WHERE slug = 'blitz-cloud';

-- 5. Bolt
UPDATE deals SET
  name = 'Bolt',
  headline_value = 'GLM 5.3 Flash مجانًا ومسابقة بناء',
  key_condition = 'حصص كل 6 ساعات',
  use_cases = ARRAY['برمجة'],
  status = 'expired',
  ends_at = '2026-10-18T23:59:00-07:00'::timestamptz,
  category = jsonb_build_object('value', 'برمجة وتطوير', 'review_status', 'verified')
WHERE slug = 'bolt-builders-week';

-- 6. Deepgram
UPDATE deals SET
  name = 'Deepgram',
  headline_value = '200$ رصيد مجاني',
  key_condition = 'بدون بطاقة ائتمان',
  use_cases = ARRAY['صوت', 'برمجة'],
  status = 'active',
  category = jsonb_build_object('value', 'صوت وذكاء اصطناعي', 'review_status', 'verified')
WHERE slug = 'deepgram';

-- 7. DeepSeek (Search & Fetch)
UPDATE deals SET
  name = 'DeepSeek',
  headline_value = 'بحث واستدعاء مجاني عبر أدوات الخادم',
  key_condition = 'لمستخدمي DeepSeek API',
  use_cases = ARRAY['بحث', 'برمجة'],
  status = 'active',
  category = jsonb_build_object('value', 'بحث وتطوير', 'review_status', 'verified')
WHERE slug = 'deepseek-flash-1017-free';

-- 8. DeepSeek V4.1 Flash Free (OpenCode)
UPDATE deals SET
  name = 'DeepSeek V4.1',
  headline_value = 'مجاني مؤقتًا بسياق 200K',
  key_condition = 'بدون تكلفة إدخال أو إخراج في OpenCode',
  use_cases = ARRAY['برمجة'],
  status = 'active',
  category = jsonb_build_object('value', 'برمجة وتطوير', 'review_status', 'verified')
WHERE slug = 'deepseek-v41-flash-opencode';

-- 9. Docker
UPDATE deals SET
  name = 'Docker',
  headline_value = '250$ رصيد حوسبة Sandbox',
  key_condition = 'بطاقة مطلوبة (لحساب جديد)',
  use_cases = ARRAY['استضافة', 'برمجة'],
  status = 'active',
  category = jsonb_build_object('value', 'استضافة وسحابيات', 'review_status', 'verified')
WHERE slug = 'docker-cloud-sandbox-250';

-- 10. Dolphin
UPDATE deals SET
  name = 'Dolphin',
  headline_value = '10$ رصيد API برمز API10',
  key_condition = 'توثيق محفظة وتيليغرام',
  use_cases = ARRAY['برمجة'],
  status = 'active',
  category = jsonb_build_object('value', 'برمجة وتطوير', 'review_status', 'verified')
WHERE slug = 'dolphin-api10-credit';

-- 11. Exa AI
UPDATE deals SET
  name = 'Exa AI',
  headline_value = '10$ شهريًا + 10$ مكافأة',
  key_condition = 'حساب جديد',
  use_cases = ARRAY['بحث', 'برمجة'],
  status = 'active',
  category = jsonb_build_object('value', 'بحث وتطوير', 'review_status', 'verified')
WHERE slug = 'exa-ai';

-- 12. Figma
UPDATE deals SET
  name = 'Figma',
  headline_value = 'سنة كاملة مجانًا (Professional)',
  key_condition = 'للطلاب والجامعيين',
  use_cases = ARRAY['فيديو وصور'],
  status = 'active',
  category = jsonb_build_object('value', 'تصميم وواجهات', 'review_status', 'verified')
WHERE slug = 'figma';

-- 13. Freebuff
UPDATE deals SET
  name = 'Freebuff',
  headline_value = 'وكيل برمجة مجاني 100%',
  key_condition = 'بدون بطاقة ائتمان (مدعوم بإعلانات)',
  use_cases = ARRAY['برمجة'],
  status = 'active',
  category = jsonb_build_object('value', 'برمجة وتطوير', 'review_status', 'verified')
WHERE slug = 'freebuff';

-- 14. General Compute
UPDATE deals SET
  name = 'General Compute',
  headline_value = '100$ رصيد مجاني',
  key_condition = 'حساب جديد',
  use_cases = ARRAY['برمجة', 'استضافة'],
  status = 'active',
  category = jsonb_build_object('value', 'برمجة وتطوير', 'review_status', 'verified')
WHERE slug = 'general-compute';

-- 15. GitHub Copilot
UPDATE deals SET
  name = 'GitHub Copilot',
  headline_value = 'وصول مجاني للطلاب',
  key_condition = 'توثيق GitHub Education',
  use_cases = ARRAY['برمجة'],
  status = 'active',
  category = jsonb_build_object('value', 'برمجة وتطوير', 'review_status', 'verified')
WHERE slug = 'github-copilot';

-- 16. Indra OCR
UPDATE deals SET
  name = 'Indra OCR',
  headline_value = 'نموذج OCR محلي مجاني',
  key_condition = 'استخدام شخصي أو أبحاث',
  use_cases = ARRAY['فيديو وصور', 'برمجة'],
  status = 'active',
  category = jsonb_build_object('value', 'بحث وتطوير', 'review_status', 'verified')
WHERE slug = 'indra-ocr';

-- 17. MiniMax
UPDATE deals SET
  name = 'MiniMax',
  headline_value = '5 فيديوهات مجانية يوميًا',
  key_condition = 'تسجيل دخول fal فقط',
  use_cases = ARRAY['فيديو وصور'],
  status = 'active',
  category = jsonb_build_object('value', 'فيديو وصور', 'review_status', 'verified')
WHERE slug = 'minimax-h3-max';

-- 18. NaraRouter
UPDATE deals SET
  name = 'NaraRouter',
  headline_value = '7 ملايين توكن يوميًا مجانًا',
  key_condition = 'بدون بطاقة ائتمان',
  use_cases = ARRAY['برمجة'],
  status = 'active',
  category = jsonb_build_object('value', 'استضافة وبوابات AI', 'review_status', 'verified')
WHERE slug = 'nararouter';

-- 19. OpenAI Codex
UPDATE deals SET
  name = 'OpenAI Codex',
  headline_value = '6 أشهر ChatGPT Pro مجانًا',
  key_condition = 'لمشرفي المصادر المفتوحة',
  use_cases = ARRAY['برمجة'],
  status = 'active',
  category = jsonb_build_object('value', 'برمجة وتطوير', 'review_status', 'verified')
WHERE slug = 'openai-codex-oss';

-- 20. Qwen Cloud
UPDATE deals SET
  name = 'Qwen Cloud',
  headline_value = 'أرصدة تجريبية وحصص نماذج',
  key_condition = 'شروط العرض قيد المراجعة',
  use_cases = ARRAY['برمجة'],
  status = 'verifying',
  category = jsonb_build_object('value', 'برمجة وتطوير', 'review_status', 'verifying')
WHERE slug = 'qwen-cloud';

-- 21. IteraCompute (Qwen3.8-27B)
UPDATE deals SET
  name = 'IteraCompute',
  headline_value = '30 مليون توكن شهريًا مجانًا',
  key_condition = 'بدون بطاقة ائتمان',
  use_cases = ARRAY['برمجة'],
  status = 'active',
  category = jsonb_build_object('value', 'برمجة وتطوير', 'review_status', 'verified')
WHERE slug = 'qwen38-27b-itera';

-- 22. Retriever AI
UPDATE deals SET
  name = 'Retriever AI',
  headline_value = 'وكيل متصفح مجاني',
  key_condition = 'بدون بطاقة أو مفتاح API',
  use_cases = ARRAY['بحث', 'برمجة'],
  status = 'active',
  category = jsonb_build_object('value', 'بحث وتطوير', 'review_status', 'verified')
WHERE slug = 'retriever-ai';

-- 23. TinyFish
UPDATE deals SET
  name = 'TinyFish',
  headline_value = '35$ رصيد محفظة فوري',
  key_condition = 'بريد جامعي أكاديمي',
  use_cases = ARRAY['برمجة'],
  status = 'active',
  category = jsonb_build_object('value', 'برمجة وتطوير', 'review_status', 'verified')
WHERE slug = 'tinyfish';

-- 24. TokenRouter
UPDATE deals SET
  name = 'TokenRouter',
  headline_value = 'نموذج مجاني بالكامل (0$ لكل 1M)',
  key_condition = 'واجهة متوافقة مع OpenAI',
  use_cases = ARRAY['برمجة'],
  status = 'active',
  category = jsonb_build_object('value', 'استضافة وبوابات AI', 'review_status', 'verified')
WHERE slug = 'tokenrouter';

-- 25. You.com
UPDATE deals SET
  name = 'You.com',
  headline_value = '100$ رصيد بحث مجاني',
  key_condition = 'بدون بطاقة ائتمان',
  use_cases = ARRAY['بحث', 'برمجة'],
  status = 'active',
  category = jsonb_build_object('value', 'بحث وتطوير', 'review_status', 'verified')
WHERE slug = 'you-com';

-- 26. Zed
UPDATE deals SET
  name = 'Zed',
  headline_value = 'سنة كاملة Zed Pro + 10$ شهريًا',
  key_condition = 'للطلاب الجامعيين المؤهلين',
  use_cases = ARRAY['برمجة'],
  status = 'active',
  category = jsonb_build_object('value', 'برمجة وتطوير', 'review_status', 'verified')
WHERE slug = 'zed';

-- 27. ZenMux
UPDATE deals SET
  name = 'ZenMux',
  headline_value = 'اشتراك Max مجانًا (بقيمة 100$/شهر)',
  key_condition = 'لسفراء الجامعات المقبولين',
  use_cases = ARRAY['استضافة', 'برمجة'],
  status = 'active',
  category = jsonb_build_object('value', 'استضافة وبوابات AI', 'review_status', 'verified')
WHERE slug = 'zenmux';
