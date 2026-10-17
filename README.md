# amnabd-deals-web

منصة **أم ن عبد** للعروض التوفيرية — موقع ثنائي اللغة (عربي / إنجليزي) يعرض العروض من Supabase.

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS + lucide-react
- Supabase (data + auth-ready)

## Scripts

```bash
npm run dev        # dev server
npm run typecheck  # TS strict check (app config)
npm run lint       # eslint
npm run build      # production build
```

## Env

`.env` (ignored) needs `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.

## اختبارات إصلاحات الإصدار (AMN-002 / AMN-005 / AMN-007)

```bash
npm ci
npm test
npm run typecheck
npm run lint
```

`npm test` يعمل على Node 20+ باستخدام TypeScript الموجود و`node:test`، دون
إضافة حزم. يترجم وحدات التنسيق والتحقق إلى مجلد مؤقت، يشغّل الاختبارات ثم
يحذف المجلد. لا يحتاج Supabase أو متغيرات إنتاج أو اتصالاً بقاعدة بيانات.

- التحقق من ردود API في `src/lib/validate.ts`: عزل الهوية غير الصالحة والتكرارات،
  وتطبيع حقول JSON الاختيارية إلى قيم مجهولة آمنة، وعدم اختلاق السعر أو الأهلية.
- يجب وجود id وslug واسم حقيقي بلغة واحدة على الأقل. الاسم الموجود يُستخدم
  كما هو إذا غابت الترجمة، ولا تُنشأ هوية من slug أو فهرس الصف.
- تحذيرات التطبيق للتشخيص تحتوي أعداداً/رموزاً ثابتة فقط، لا حمولة الصفوف.
- إذا رُفضت بعض الصفوف يظهر تنبيه عام، وإذا كانت مجموعة العروض غير صالحة
  بالكامل يظهر خطأ صريح. Error Boundary أخير يحتوى خطأ عرض غير متوقع.

اختبار واجهة اختياري في بيئة QA فيها Playwright وChromium مثبتان مسبقاً
(ليسا اعتماداً جديداً للمشروع):

```bash
# ابنِ فقط بقيم اختبار صناعية، لا بمفاتيح إنتاج.
VITE_SUPABASE_URL=https://audit-fixture.supabase.co \
VITE_SUPABASE_ANON_KEY=public-audit-fixture npm run build
npm run preview -- --host 127.0.0.1 --port 4173
# في طرفية ثانية؛ CHROMIUM_PATH اختياري إذا كانت نسخة Playwright مثبتة:
CHROMIUM_PATH=/path/to/chromium node tests/browser-smoke.cjs
```

اختبار الواجهة يعترض API محلياً ويمنع موارد الطرف الثالث. يمكن ضبط
`AMN_PREVIEW_URL` لعنوان preview آخر و`AMN_SMOKE_REPORT` لحفظ نتيجة JSON.
لا يقرأ بيانات إنتاج ولا يختبر صلاحيات Supabase الحقيقية.

هذه الدفعة لا تغيّر سياسات RLS أو schema، ولا تنفذ بقية مهام release:
دلالات الأهلية/الفلاتر، فصل أخطاء الشبكة، التوثيق، وحماية التخزين والتوجيه
والبيئة تبقى مهام مستقلة. لا يوجد نشر من فرع الإصلاح في workflow الحالي.
