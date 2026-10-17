# نشر الموقع على GitHub Pages

هذا الموقع يُبنى ويُنشر تلقائيًا إلى GitHub Pages عند كل تحديث لفرع `main`.

## خطوات التشغيل (مرة واحدة فقط)

1. افتح المستودع: https://github.com/amiraq1/amnabd-deals-web

2. أضف مفتاحي Supabase كأسرار للمستودع:
   - Settings ← Secrets and variables ← Actions ← New repository secret
   - أضف سرًّا باسم `VITE_SUPABASE_URL` وقيمته رابط مشروع Supabase
   - أضف سرًّا آخر باسم `VITE_SUPABASE_ANON_KEY` وقيمته المفتاح العام (anon key)
   - هذه المفاتيح عامة بطبيعتها (تظهر في المتصفح لأي زائر)، لكن لا تضع فيها مفتاح service_role أبدًا.

3. فعّل النشر من Actions:
   - Settings ← Pages ← Source ← اختر **GitHub Actions**

4. افتح تبويب Actions وانتظر انتهاء سير العمل "Deploy to GitHub Pages".
   - عند النجاح سيظهر رابط الموقع بالشكل:
     `https://amiraq1.github.io/amnabd-deals-web/`

## تعديلات لاحقة

أي تحديث جديد على فرع `main` سيعيد البناء والنشر تلقائيًا.

## بديل: Cloudflare Pages

يمكن النشر على Cloudflare Pages بدلًا من ذلك:
1. أنشئ حسابًا في Cloudflare واربطه بمستودع GitHub.
2. إعداد البناء:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Build output directory: `dist`
3. أضف المتغيرين `VITE_SUPABASE_URL` و `VITE_SUPABASE_ANON_KEY` في إعدادات Environment variables.
4. Cloudflare سينشر الموقع على نطاق مجاني مثل `amnabd-deals.pages.dev` مع دعم HTTPS تلقائيًا.

## حواجز البناء العام

يُرفض build إذا غاب URL أو المفتاح العام أو كان الشكل غير صالح، أو استُخدم مفتاح
خاص بدلاً من anon/publishable. لا تُطبع قيم المفاتيح. `npm run test:build-env`
يفحص ذلك محلياً ببيانات صناعية دون نشر أو تعديل سياسات قاعدة البيانات.

موقع الدليل يستعمل PostgREST للقراءة العامة فقط؛ استبدل عميل Supabase الشامل
بعميل PostgREST الذي كان ضمن شجرته، لتجنب اعتماد Auth على localStorage عند الاستيراد.
سياسات RLS والمنح الفعلية هي حد الصلاحيات، وليس كون الواجهة تستعمل SELECT فقط.
