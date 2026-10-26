# تدقيق معماري شامل — AMNABD Deals (أكتوبر 2026)

> **النطاق:** المستودع `amiraq1/amnabd-deals-web` — 10 محاور، 30 ملاحظة (`REC-01`…`REC-30`).
> **الطبيعة:** مراجعة قراءة فقط. لا تغييرات على الشيفرة أو البيانات أو الإنتاج.
> **حالة الأساس:** التحقق في الملحق (أ) أدناه أُجري على `6952185` (فرع `fix/audit-batch-2-3`)؛ ما كان مغلقًا قبل هذا التقرير موسوم هناك.

---

## 1. ملخص التقييم حسب المحاور

| # | المحور | التقييم | السبب المختصر |
| --- | --- | --- | --- |
| 1 | **البنية وجودة الكود** | **7 / 10** | دوال نقية مختبرة ونطاق TypeScript صارم، لكن `App.tsx` (472 سطراً) يحمل آلة حالة التوجيه كاملة. |
| 2 | **طبقة البيانات** | **6.5 / 10** | مهلة وإلغاء وتحقق ممتاز، لكن `select('*')` بلا ترقيم، والأنواع مكتوبة يدوياً، والتخزين المؤقت معطّل كلياً (`no-store`). |
| 3 | **الأمان** | **7 / 10** | RLS سليم للقراءة و`https:` فقط في الروابط، لكن لا يوجد CSP، والإدراج المجهول في `deal_reports` بلا حدّ، وGitHub Actions غير مثبتة بـ SHA. |
| 4 | **SEO والاكتشاف** | **6 / 10** | صفحات `/deal/*` وصور OG و`sitemap` و`RSS` تولَّد عند البناء، لكن المصدر لقطة ثابتة، ولا `hreflang`، والعروض الجديدة بعد البناء تُخدم بحالة `404`. |
| 5 | **اللغة والوصول (A11y)** | **6 / 10** | تبديل `dir`/`lang` وخصائص منطقية و`PluralRules` عربية، لكن التركيز لا يُدار عند تغيّر الصفحة، والأرقام والتواريخ غير متسقة، وفي نموذج الإبلاغ نواقص. |
| 6 | **المنتج** | **6.5 / 10** | قسم «ما نعرفه وما لا نعرفه» ومقارنة وإبلاغ وسجل مراجعات، لكن لا ملخص قرار مختصراً بأعلى الصفحة، وزر التسجيل هو نفسه رابط المصدر، ولا دعم لـ Web Share. |
| 7 | **الاختبارات وCI** | **7 / 10** | بوابة `verify` ثم `build` ثم `deploy` مع `verify-dist`، لكن اختبارات المتصفح خارج CI ولا يوجد `axe` ولا `Dependabot`. |
| 8 | **النشر والأداء** | **5.5 / 10** | GitHub Pages لا يسمح برؤوس HTTP مخصصة، وGoogle Fonts تحجب العرض، ولا code-splitting، ولا `preconnect` إلى نطاق Supabase. |
| 9 | **عمليات البيانات** | **5 / 10** | `review:queue` ممتاز لكنه يدوي، ولا تحقق مخطط قبل الإدخال، وقالب `sample-deal.json` يتعارض مع مفردات المحرّك. |
| 10 | **التوثيق** | **4 / 10** | `README.md` يعمل كسجل إصدارات بحجم 30KB وفيه تناقضات داخلية، ولا يوجد `LICENSE` ولا `CONTRIBUTING` ولا قالب PR. |

---

## 2. مطابقة بنود README «غير المنجزة» مع الواقع الفعلي

| البند في الوثائق | الحالة الفعلية | الدليل في الكود |
| --- | --- | --- |
| **SEO / SSG** | **منجز جزئياً** (الوثيقة متقادمة) | `package.json › postbuild` و`generate-static-seo.mjs › runStaticSeoGeneration` يولّدان صفحة HTML لكل عرض، وصور OG بصيغة PNG، و`sitemap`، و`RSS`، و`llms.txt`، و`404.html`. |
| **بوابات CI** | **منجز** | `.github/workflows/deploy.yml › job verify` شغّال فعلياً. |
| **ملخص القرار في صفحة العرض** | **جزئي** | `DealDetailPage.tsx › deal-truth-heading` يعرض قسم الحقائق، لكنه ليس بطاقة قرار مختصرة في أعلى الصفحة. |
| **فصل زر التسجيل عن المصدر** | **غير منجز** | `safeUrl.ts › resolveDealOfficialUrl` يفضّل `official_sources[0]` على `get_offer.url`، فيصبح زر «رابط المصدر» هو زر الإجراء الوحيد. |
| **مشاركة Web Share** | **غير منجز** | `share.ts` و`CopyDealLink.tsx` يستعملان Clipboard API فقط. |
| **تعميم إصلاحات الوصول** | **جزئي** | التفاصيل موثّقة في البنود `REC-16` و`REC-17` و`REC-19`. |

---

## 3. سجل النتائج التام (30 ملاحظة)

| الرمز | المحور | الخطورة | الدليل | المشكلة | الاقتراح | الجهد | الأثر |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **REC-01** | بيانات / SEO | **عالية** | `index.html › JSON-LD`؛ `generate-static-seo.mjs › loadDealsCatalog` | تعدد مصادر الحقيقة (DB، الكتالوج، `index.html` بـ 27 عرضاً مكتوبة يدوياً، و`DEALS.md`). انتهاء عرض في DB لا يحدّث `index.html` تلقائياً. | حذف `ItemList` اليدوي من `index.html` وحقنه وقت البناء مباشرةً من `loadPublicDealRecords`. | M | عالٍ |
| **REC-02** | المبدأ / توثيق | **متوسطة** | `DEALS.md` | ادعاء شامل بالتوثيق والمجانية يخالف صياغة `llms.txt` المحايدة، مع روابط `#/deal/` بالصيغة القديمة. | توليد `DEALS.md` برمجياً من نفس منطق `generateLlmsTxt` أو حذفه. | S | متوسط |
| **REC-03** | المبدأ / بيانات | **عالية** | `20261020150000_phase0…sql` | خلط المخطط (Schema) ببيانات العروض (`status='active'`، `review_status='verified'`) وعبارات مطلقة مثل «مجاني 100%» تدخل في `<title>` وOG دون ربط بدليل. | فصل البيانات في `seed.sql` أو أداة إدخال، وإضافة حارس في `verify-dist` يرفض `headline_value` غير المسندة لـ claim. | M | عالٍ |
| **REC-04** | عمليات البيانات | **عالية** | `sample-deal.json` | القالب يحوي قيماً تبدو مختلقة (`original_price: 2400`) ومفردات لا يعرفها المحرّك (`tier_access`, `recurring`) فتظهر «غير معلوم». | تصفير القالب إلى `null`/`unknown` افتراضياً، ومطابقة المفردات مع `format.ts`، واختباره عبر `validateDeals`. | S | عالٍ |
| **REC-05** | CI / النشر | **عالية** | `deploy.yml` (الأسطر 13–15) | `concurrency: group: pages` مع `cancel-in-progress: true` على مستوى الـ workflow يسمح لأي `pull_request` بإلغاء نشر جاري على `main`. | فصل مجموعة التزامن حسب الـ ref وتعطيل الإلغاء التلقائي لفرع `main`. | S | عالٍ |
| **REC-06** | CI / أمان | **متوسطة** | `deploy.yml › job build` | استخدام `secrets.VITE_SUPABASE_URL \|\| 'https://audit-fixture…'` في كل الأحداث بدلاً من الفشل الصريح على `main` عند غياب السر. | قصر القيمة الصناعية على `pull_request` فقط، وإفشال البناء صراحةً على `main` إن غاب السر. | S | متوسط |
| **REC-07** | سلسلة التوريد | **متوسطة** | `deploy.yml`؛ غياب `dependabot.yml` | تثبيت GitHub Actions بالوسم (`@v4`) القابل للنقل بدل SHA الكامل، وغياب التحديث الآلي للاعتماديات. | التثبيت بـ Commit SHA كامل وإضافة `.github/dependabot.yml` لـ `npm` و`github-actions`. | S | متوسط |
| **REC-08** | أمان / منتج | **عالية** | `deal_reports.sql`؛ `dealReports.ts`؛ `operational-review-queue.md` | (1) جدول البلاغات غير مطبّق في الإنتاج بحسب الوثيقة. (2) سياسة الإدراج لـ `anon` بلا حدّ معدل خادمي. (3) الإرسال يقرأ `env` مباشرة وبلا مهلة (`timeout`). | إخفاء الميزة خلف علَم بيئة حتى يُطبّق الجدول مع Trigger يحدّ المعدل، وتمرير الطلب عبر العميل الموحّد بمهلة 8 ثوانٍ. | M | عالٍ |
| **REC-09** | أمان / خصوصية | **متوسطة** | `index.html`؛ `dealMetadata.ts` | غياب `Content-Security-Policy`، وإرسال عنوان IP لكل زائر إلى 3 أطراف خارجية (`fonts.googleapis.com`، `google.com/s2/favicons`، `cdn.simpleicons.org`). | إضافة CSP عبر `<meta http-equiv>` (أو عبر Cloudflare)، واستضافة الخطوط والأيقونات محلياً وقت البناء. | M | متوسط |
| **REC-10** | أمان | **منخفضة** | `DealIcon.tsx` | تمرير `icon_url` القادم من قاعدة البيانات إلى `<img src>` مباشرةً دون تمريره عبر `safeUrl`. | فلترة `icon_url` عبر `safeUrl` مع قائمة نطاقات مسموحة. | S | منخفض |
| **REC-11** | أمان / وصول | **منخفضة** | `DealDetailPage.tsx` | عرض المصادر غير الآمنة كرابط `<a href="#">` مع `preventDefault`، ما يربك قارئات الشاشة. | استبدالها بـ `<span>` نصي يوضح «رابط غير متاح». | S | منخفض |
| **REC-12** | SEO / صحة | **عالية** | `generate-static-seo.mjs` | صفحات العروض تُولَّد وقت البناء فقط؛ أي عرض يُضاف في DB بعد البناء يُخدم بصفحة `404.html` (`HTTP 404` + `noindex`). | ربط Supabase Webhook بـ `repository_dispatch` في GitHub Actions مع `schedule` يومي احتياطي. | S–M | عالٍ |
| **REC-13** | SEO | **متوسطة** | `injectSeoIntoHtml` | حقن `<head>` فقط مع بقاء `<div id="root">` فارغاً، ما يحرم الزواحف التي لا تنفّذ JS من نص الصفحة. | حقن ملخص الحقائق المثبتة داخل `#root` (أو `<noscript>`) من كائن `dealFacts` نفسه. | M | متوسط |
| **REC-14** | SEO / لغة | **متوسطة** | `index.html` | النسخة الإنجليزية تعمل عبر `?lang=en` فقط مع `canonical` ثابت للعربية وغياب `hreflang`. | توثيق قرار الفهرسة العربية الحصرية رسمياً، أو توليد مسارات `/en/deal/*` مع `hreflang` متبادل. | M | متوسط |
| **REC-15** | SEO / صور OG | **متوسطة** | `buildDealOgSvg` | الاعتماد على `font-family="Cairo, Tajawal"` في `Resvg` دون تمرير ملفات خط محلية على `ubuntu-latest`. | تضمين ملف خط عربي في المستودع وتمريره إلى `Resvg` مع `loadSystemFonts: false`. | S | متوسط |
| **REC-16** | وصول (A11y) | **عالية** | `App.tsx › navigate` | التنقل بين الصفحات ينفّذ `window.scrollTo` فقط دون نقل التركيز (Focus) أو إعلان تغيّر الصفحة لقارئات الشاشة. | نقل التركيز برمجياً إلى `<h1>` أو `#main-content` مع منطقة `aria-live="polite"`. | S | عالٍ |
| **REC-17** | وصول (A11y) | **متوسطة** | `ReportDealBox.tsx` | غياب `<label>` لحقل الملاحظة، وغياب `role="alert"` لرسالة الخطأ، وغياب `fieldset/legend` لأسباب البلاغ. | استكمال سمات الوصول القياسية وتحديد `type="button"` لأزرار الإغلاق. | S | متوسط |
| **REC-18** | لغة وتنسيق | **متوسطة** | `DealDetailPage.tsx`؛ `CountBadge` | تضارب الأرقام الهندية (`ar-EG`) مع الغربية في نفس الصفحة، وعرض التواريخ خاماً (`2026-10-18`). | توحيد التنسيق في وحدة `i18n/format.ts` باستخدام `Intl.NumberFormat` و`Intl.DateTimeFormat` بتوقيت `UTC`. | S | متوسط |
| **REC-19** | وصول (تباين) | **متوسطة** | أنماط Tailwind في الصفحات | استخدام `text-slate-500` مع `text-xs` على خلفية `bg-slate-900` يعطي تبايناً (~3.7:1) أقل من معيار WCAG AA (4.5:1). | رفع لون النصوص الفرعية الصغيرة إلى `text-slate-400` كحد أدنى. | S | متوسط |
| **REC-20** | جودة الكود | **منخفضة** | `DealDetailPage › FactRow` | تلوين حالة القيمة يعتمد على مقارنة النص المترجم (`value === 'Unknown'`) بدلاً من رمز الحالة البرمجي. | تمرير حالة الحقل (`status: 'unknown' \| 'known'`) كـ prop صريح للمكوّن. | S | منخفض |
| **REC-21** | منتج | **منخفضة** | `share.ts`؛ `CopyDealLink.tsx` | غياب دعم قائمة المشاركة الأصلية في الهواتف (`navigator.share`). | تفعيل `navigator.share` عند توفره مع الإبقاء على النسخ للحافظة كاحتياط. | S | متوسط |
| **REC-22** | منتج / مبدأ | **متوسطة** | `safeUrl.ts › resolveDealOfficialUrl` | دمج «رابط المصدر» و«صفحة التسجيل» في زر واحد يتجاهل `get_offer.url` عند وجود `official_sources[0]`. | فصل الزرين: «المصدر الرسمي للشروط» و«صفحة الحصول على العرض» متى كانا مختلفين وآمنين. | M | متوسط |
| **REC-23** | منتج | **متوسطة** | `DealDetailPage.tsx` | غياب ملخص قرار سريع في أعلى صفحة العرض قبل التفاصيل الطويلة. | إضافة «بطاقة قرار» من 4 أسطر (المنفعة، الأهلية، البطاقة البنكية، الصلاحية + تاريخ المراجعة). | M | عالٍ |
| **REC-24** | أداء | **متوسطة** | `App.tsx`؛ `index.html` | استيراد كل الصفحات ثابتاً في الحزمة الأولى، وتحميل حاجب لخطوط Google، وغياب `preconnect` لنطاق Supabase. | `React.lazy` للصفحات الثانوية، واستضافة الخطوط محلياً، وحقن `<link rel="preconnect">` لـ Supabase. | S–M | متوسط |
| **REC-25** | بيانات | **منخفضة** | `loadResources.ts`؛ `network.ts` | `select('*')` يجلب كل الأعمدة والأدلة دفعةً واحدة بلا ترقيم، مع تعطيل الكاش كلياً. | تحديد أعمدة البطاقات للصفحة الرئيسية، وتوليد الأنواع آلياً عبر `supabase gen types`. | M | منخفض حالياً |
| **REC-26** | بنية | **منخفضة** | `App.tsx`؛ `LanguageContext`؛ `DealDetailPage` | تضخم `App.tsx`، وعدم تغليف قيمة `LanguageContext` بـ `useMemo`، وحقن `<style>` عام لتعديل الـ footer. | استخراج `useAppRouter()`، وإضافة `useMemo` للسياق، واستخدام متغير CSS أو prop للـ footer. | M | متوسط |
| **REC-27** | اختبارات | **متوسطة** | `tests/*.cjs`؛ `deploy.yml` | اختبارات المتصفح (Playwright) خارج أنبوب CI، وغياب فحص الوصول الآلي (`@axe-core/playwright`). | إضافة وظيفة CI لتشغيل اختبارات المتصفح و`axe` على `vite preview`. | M | متوسط |
| **REC-28** | عمليات البيانات | **متوسطة** | `review-queue.mjs` | أداة فحص الروابط والتقادم ممتازة لكنها تُشغَّل يدوياً فقط، ولا توجد أداة فحص صارم قبل إدخال العروض. | جدولة workflow أسبوعي يحدّث Issue المراجعة، وإضافة سكريبت `validate-deal.mjs` الصارم. | S–M | متوسط |
| **REC-29** | توثيق | **متوسطة** | `README.md`؛ شجرة المستودع | تضارب المعلومات داخل `README.md` بسبب تراكم سجل التعديلات، وغياب `LICENSE` و`CONTRIBUTING.md`. | تقسيم `README.md` إلى دليل مختصر + `CHANGELOG.md` + `docs/adr/`، وإضافة قالب PR. | S–M | متوسط |
| **REC-30** | تنظيف وهوية | **منخفضة** | `public/vite.svg`؛ `og-image.svg`؛ `Navbar` | ملفات مكررة أو غير مستخدمة، وmigration فارغة مكررة، وتباين اسم الهوية بين «نبض» و«AMNABD». | حذف الملفات الميتة، وتوثيق الـ migration المكررة، وتوحيد الاسم الرسمي للمنصة. | S | منخفض |

---

## 4. تدقيق تقني على الكود المقترح (4 تصويبات ضرورية)

قبل تطبيق المقتطفات البرمجية الواردة في القسم الخامس، انتبه إلى هذه الهفوات الأربع فيها:

1. **خطأ ترتيب ونطاق المتغيرات في `deploy.yml` (الأولوية 2):**
   * **المشكلة:** المُراجِع وضع خطوة الفحص `if: github.event_name != 'pull_request' && env.VITE_SUPABASE_URL == ''` **بعد** خطوة `npm run build`، كما أن `env` التي عرّفها كانت محصورة داخل خطوة البناء نفسها ولن تكون مرئية في تعبير `if:` للخطوة التي تليها.
   * **التصويب:** فحص الأسرار **قبل** خطوة `npm run build` مباشرةً، وتمرير السر إلى `env` داخل خطوة الفحص ليتم التحقق منه بأمان قبل بدء البناء.

2. **خلط اللغة في `buildHomeItemList` داخل `generate-static-seo.mjs` (الأولوية 1):**
   * **المشكلة:** المقتطف المقترح يكتب `explicitText(r.description_en)` داخل `ItemList` الخاص بالصفحة الرئيسية (`index.html`)، بينما الصفحة الرئيسية عربية أصلاً (`lang="ar" dir="rtl"` و`og:locale="ar_AR"`).
   * **التصويب:** استخدام الوصف العربي الصريح (`r.description_ar` أو الحقل العربي المعتمد في المخطط) مع التراجع إلى الإنجليزي فقط عند غيابه، أو تمرير لغة الصفحة كمعامل للدالة.

3. **تعارض RLS وPostgREST في `deal_reports` (الأولوية 3):**
   * **المشكلة:**
     1. بما أن المستخدم المجهول (`anon`) يملك صلاحية `INSERT` فقط ولا يملك صلاحية `SELECT` على جدول `deal_reports` (لحماية البلاغات من القراءة العلنية)، فإن أي طلب `POST` إلى PostgREST يحاول إرجاع الصف المُدرج (`Prefer: return=representation`) سيفشل بخطأ RLS حتى لو نجح الإدراج.
     2. الدالة `deal_reports_throttle()` المعرّفة بـ `SECURITY DEFINER` تحتاج إلى **فهرس (Index)** على `(deal_slug, created_at DESC)`، وإلا سيتحول كل هجوم إغراق إلى مسح متسلسل (Sequential Scan) يرهق قاعدة البيانات، كما يجب سحب صلاحية تنفيذ الدالة مباشرة عبر RPC (`REVOKE ALL ON FUNCTION ... FROM PUBLIC, anon, authenticated`).
   * **التصويب:** مُدرَج في القسم 5/ب أدناه.

4. **تشكيل الحروف العربية (Arabic Shaping) في `Resvg` لصور OG (الأولوية 4 / REC-15):**
   * **تنبيه هندسي:** تمرير ملف خط `.ttf` (مثل Cairo أو Tajawal) إلى `@resvg/resvg-js` مع `loadSystemFonts: false` خطوة صحيحة وضرورية، لكن تأكد من استخدام خط ثابت الأوزان (Static TTF مثل `Cairo-Bold.ttf` و`Cairo-Regular.ttf`) وليس خطاً متغيراً (Variable Font)، لأن محرك `resvg` المبني بـ Rust قد يُسقط أوزان الخطوط المتغيرة في بعض الإصدارات، وتأكد من ضبط خاصية `direction="rtl"` على عنصر `<text>` في الـ SVG لضمان ربط الحروف العربية وعلامات الترقيم بشكل سليم.

---

## 5. الكود المصحَّح والجاهز للتنفيذ (الدفعة الأولى)

### أ. تصحيح `.github/workflows/deploy.yml` (معالجة REC-05 وREC-06)

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.event_name == 'pull_request' && github.head_ref || github.ref }}
  # لا تلغِ نشراً جارياً على الفرع الرئيسي؛ ألغِ فقط التشغيلات المتقادمة لنفس الـ PR
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}

```

وداخل وظيفة `build` (قبل خطوة `npm run build` مباشرةً):

```yaml
      - name: Validate production secrets on non-PR builds
        if: github.event_name != 'pull_request'
        env:
          SUPABASE_URL_CHECK: ${{ secrets.VITE_SUPABASE_URL }}
          SUPABASE_KEY_CHECK: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
        run: |
          if [ -z "$SUPABASE_URL_CHECK" ] || [ -z "$SUPABASE_KEY_CHECK" ]; then
            echo "::error::Missing required production Supabase secrets on ${{ github.ref }}."
            exit 1
          fi

      - name: Build application
        env:
          VITE_SUPABASE_URL: ${{ github.event_name == 'pull_request' && 'https://audit-fixture.supabase.co' || secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ github.event_name == 'pull_request' && 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.audit-fixture' || secrets.VITE_SUPABASE_ANON_KEY }}
        run: npm run build

```

### ب. تأمين جدول `deal_reports` ومعدل الإرسال (معالجة REC-08)

ملف الهجرة المقترح `supabase/migrations/20261026120000_deal_reports_hardening.sql`:

```sql
-- 1. فهرس لتسريع فحص الحدّ الزمني ومنع المسح المتسلسل أثناء الإغراق
create index if not exists idx_deal_reports_slug_created_at
  on public.deal_reports (deal_slug, created_at desc);

create index if not exists idx_deal_reports_created_at
  on public.deal_reports (created_at desc);

-- 2. دالة فحص المعدل بصلاحية المالك لأن anon لا يملك صلاحية SELECT على الجدول
create or replace function public.deal_reports_throttle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- التحقق من طول الملاحظة وصحة الحقول على مستوى قاعدة البيانات أيضاً
  if char_length(coalesce(new.note, '')) > 1000 then
    raise exception 'note_too_long' using errcode = '22001';
  end if;

  if (
    select count(*)
    from public.deal_reports
    where deal_slug = new.deal_slug
      and created_at > now() - interval '10 minutes'
  ) >= 5
  or (
    select count(*)
    from public.deal_reports
    where created_at > now() - interval '1 hour'
  ) >= 300 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

-- منع استدعاء الدالة مباشرة عبر واجهة RPC العلنية
revoke all on function public.deal_reports_throttle() from public, anon, authenticated;

drop trigger if exists trg_deal_reports_throttle on public.deal_reports;
create trigger trg_deal_reports_throttle
  before insert on public.deal_reports
  for each row
  execute function public.deal_reports_throttle();

```

وفي عميل الإرسال (`src/lib/dealReports.ts`)، تأكد من إرسال الترويسة `Prefer: return=minimal` (أو عدم استدعاء `.select()` في عميل PostgREST المخصص) مع تمرير `AbortSignal.timeout(8000)` حتى لا يرفض RLS عملية الإدراج بسبب محاولة قراءة الصف بعد كتابته.

### ج. توليد `ItemList` للصفحة الرئيسية من قاعدة البيانات (معالجة REC-01)

```javascript
// scripts/generate-static-seo.mjs
export function buildHomeItemList(records, baseUrl = DEFAULT_SITE_URL, lang = 'ar') {
  const base = baseUrl.replace(/\/+$/, '');
  const live = records.filter(
    (r) => isStaticDealSlug(r?.slug) && r.status !== 'expired'
  );

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    numberOfItems: live.length,
    itemListElement: live.map((r, i) => {
      const rawDesc =
        lang === 'ar'
          ? explicitText(r.description_ar) || explicitText(r.description)
          : explicitText(r.description_en) || explicitText(r.description);

      return {
        '@type': 'ListItem',
        position: i + 1,
        name: dealDisplayName(r, r.slug, lang),
        url: `${base}/deal/${encodeURIComponent(r.slug)}`,
        ...(rawDesc ? { description: rawDesc } : {}),
      };
    }),
  };
}

```

### د. إدارة التركيز وإعلان التنقل لقارئات الشاشة (معالجة REC-16)

```tsx
// داخل App.tsx
const mainRef = useRef<HTMLElement>(null);
const navigatedByUser = useRef(false);
const [routeAnnouncement, setRouteAnnouncement] = useState('');

useEffect(() => {
  if (!navigatedByUser.current) return;
  navigatedByUser.current = false;

  requestAnimationFrame(() => {
    const heading = mainRef.current?.querySelector('h1') as HTMLElement | null;
    if (heading) {
      if (!heading.hasAttribute('tabindex')) {
        heading.setAttribute('tabindex', '-1');
      }
      heading.focus({ preventScroll: true });
      setRouteAnnouncement(heading.textContent?.trim() ?? document.title);
    } else {
      mainRef.current?.focus({ preventScroll: true });
      setRouteAnnouncement(document.title);
    }
  });
}, [route]);

```

ومع إضافة منطقة إعلان مخفية بصرياً في أعلى الهيكل:

```tsx
<div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
  {routeAnnouncement}
</div>

```

---

## 6. حزمة أوامر الفحص المحلي

```powershell
# 1. التحقق من نظافة التثبيت والأنواع والاختبارات وبوابة البيئة
npm ci
npm run typecheck
npx tsc -p tsconfig.node.json --noEmit
npm test
npm run lint
npm run test:build-env

# 2. فحص الثغرات الأمنية في الاعتماديات (الإنتاج فقط ثم الشجرة كاملة)
npm audit --omit=dev
npm audit

# 3. البناء الكامل والتحقق من مخرجات dist ومطابقة SEO
npm run build
npm run verify:dist

# 4. فحص تاريخ Git بالكامل بحثاً عن أي أسرار قديمة مسربة
npx --yes gitleaks detect --source . --verbose
```

---

## 7. قرارات معمارية تحتاج إلى حسم قبل التنفيذ

1. **ميزة الإبلاغ (`deal_reports`):** هل نطبّق جدول البلاغات مع Trigger الحدّ من الإغراق الآن، أم نضع المكوّن خلف `VITE_REPORTS_ENABLED=false` مؤقتاً؟
2. **الفهرسة الإنجليزية (`hreflang`):** هل الهدف SEO باللغة العربية فقط (مع بقاء الإنجليزية خيار واجهة للمستخدم)، أم تريد توليد مسارات `/en/deal/*` مستقلة لمحركات البحث؟
3. **الهوية البصرية:** ما الاسم الرسمي المعتمد لتوحيده في الشعار وJSON-LD وملفات التوثيق («نبض» أم «AMNABD Deals»)؟

### القرارات المحسومة (26 أكتوبر 2026)

| # | القرار | ما نُفِّذ |
| --- | --- | --- |
| 1 | **تطبيق جدول البلاغات مع Trigger الآن** | `supabase/migrations/20261026120000_deal_reports_hardening.sql` (فهرس النافذة الزمنية، دالة الحدّ بـ`SECURITY DEFINER`، سحب صلاحية RPC، Trigger قبل الإدراج) + `AbortSignal.timeout(8000)` في عميل الإرسال. **الهجرة لم تُطبَّق على قاعدة الإنتاج** — تنفيذها إجراء مشغّل. |
| 2 | **العربية وحدها** | يبقى `docs/language-indexing.md` كما هو؛ لا مسارات `/en/*` ولا `hreflang`. |
| 3 | **الاسم الرسمي: نبض** | «نبض» في كل سطح عربي (العنوان، `og:site_name`، JSON-LD `name`، PWA، صورة OG، `DEALS.md`)، و«AMNABD Deals» بديلاً إنجليزياً (`alternateName`، وعناوين النسخة الإنجليزية). |

**تصحيحان على مقتطفات التقرير نُفِّذا بدلاً منها:** حدّ الملاحظة بقي **280** حرفاً (لا 1000) مطابقةً لقيود الجدول القائمة وللعميل؛ والفهرس `(deal_slug, created_at desc)` لم يُضَف لأن `idx_deal_reports_slug_created` موجود من هجرة `20261020210000`.

---

## ملحق (أ) — تحقق الحالة على `6952185`

فُحصت ادعاءات التقرير على الشجرة الحالية. ما يلي يفصل ما لا يزال قائماً عمّا تغيّر قبل هذا التقرير، حتى لا يُعاد العمل المنجز.

| البند | الحالة على الشجرة | التفصيل |
| --- | --- | --- |
| **REC-05** | **قائم** | `deploy.yml:13-15` ما زال `group: pages` مع `cancel-in-progress: true` على مستوى الـ workflow. |
| **REC-06** | **قائم** | القيمة الصناعية موجودة كاحتياط في موضعين (`deploy.yml:58`, `:68`) لكل الأحداث. |
| **REC-07** | **قائم** | كل `uses:` بالوسم (`@v4`/`@v3`)، ولا يوجد `.github/dependabot.yml`. |
| **REC-02** | **قائم** | `DEALS.md` يحوي 27 رابطاً بصيغة `#/deal/`. |
| **REC-04** | **قائم** | `sample-deal.json` يستخدم `type: tier_access`، أي مفردات خارج ما يعرفه `format.ts`. |
| **REC-19** | **قائم** | 19 موضعاً يستخدم `text-slate-500` في `src/**/*.tsx`. |
| **REC-29** | **قائم** | `README.md` = 30,476 بايت، ولا `LICENSE` ولا `CONTRIBUTING.md`. |
| **REC-30** | **قائم** | `public/vite.svg` موجود. |
| **REC-01** | **جزئي — تغيّر** | مسارات `ItemList` في `index.html` صُححت من `#/deal/` إلى `/deal/<slug>` (في `adffd15`)، فلم يبقَ خطأ المسار؛ لكن القائمة نفسها ما زالت مكتوبة يدوياً (27 مدخلاً) لا مولّدة، فجوهر «تعدد مصادر الحقيقة» قائم. |
| **REC-14** | **مغلق بقرار موثّق** | `docs/language-indexing.md` يحسم: العربية نسخة الفهرسة، لا `hreflang`، و`canonical` بلا استعلام لغة — ومحروس بـ`tests/language-indexing.test.mjs`. ما بقي هو الخيار الثاني (مسارات `/en/*`) إن تغيّر القرار. |
| **REC-28** | **جزئي — تغيّر** | `docs/operational-review-queue.md` يوثّق الآن أن المالك والدورية **غير معيَّنين** بدل تركهما ضمنياً؛ الجدولة نفسها لم تُضَف (قرار بشري). |
| **REC-27** | **جزئي — تغيّر** | ميزانية حزمة gzip أُضيفت إلى CI (`npm run test:bundle`)، لكن اختبارات المتصفح و`axe` ما زالت خارج الأنبوب. |
| **REC-15** | **قائم، وله سابقة موثّقة** | مسألة خطوط `Resvg` ليست نظرية: عند إعادة توليد `og-image.png` محلياً أنتج `system-ui` مربّعات بدل الحروف العربية، بينما نجح التوليد في بيئة البناء. هذا يرجّح تشخيص التقرير: النتيجة تعتمد على خطوط المضيف لا على الـ SVG. |
| **REC-12** | **قائم** | المسارات غير المولّدة تُخدم من `404.html` بحالة 404 و`noindex` — وهو السلوك المقصود أمنياً، لكنه يعني أن عرضاً جديداً لا يُفهرس قبل إعادة بناء. |

**ملاحظة على القسم 6:** الأمر `npm run verify:dist` غير معرَّف في `package.json`؛ الفحص يُشغَّل عبر `node scripts/verify-dist.mjs` (أو بوسيط `--dist`)، و`verify-dist` يعمل داخل `postbuild` في CI لا كسكربت مستقل.

---

*حُفظ في 26 أكتوبر 2026. مراجعة قراءة فقط — لا تغييرات على الشيفرة أو البيانات أو الإنتاج.*
