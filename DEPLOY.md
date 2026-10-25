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

4. افتح [Actions](https://github.com/amiraq1/amnabd-deals-web/actions) وانتظر انتهاء سير العمل **Verify & Deploy**؛ يمر عبر وظائف `verify` و`build` ثم `deploy`.
   - الرابط العام الحالي: [https://amnabd.com/](https://amnabd.com/).
   - رابط GitHub Pages للمشروع `https://amiraq1.github.io/amnabd-deals-web/` يعيد التوجيه حاليًا إلى النطاق العام أعلاه.

## تعديلات لاحقة

أي تحديث جديد على فرع `main` سيعيد البناء والنشر تلقائيًا.

## مزود النشر المتتبع

هذا المستودع يتتبع النشر عبر GitHub Actions إلى GitHub Pages. لا توثق هذه الصفحة إعدادًا بديلًا لدى مزود آخر، ولا تستنتج منها إعدادات DNS أو الرؤوس في طبقة الاستضافة.

## حواجز البناء العام

يُرفض build إذا غاب URL أو المفتاح العام أو كان الشكل غير صالح، أو استُخدم مفتاح
خاص بدلاً من anon/publishable. لا تُطبع قيم المفاتيح. `npm run test:build-env`
يفحص ذلك محلياً ببيانات صناعية دون نشر أو تعديل سياسات قاعدة البيانات.

موقع الدليل يستعمل PostgREST للقراءة العامة فقط؛ استبدل عميل Supabase الشامل
بعميل PostgREST الذي كان ضمن شجرته، لتجنب اعتماد Auth على localStorage عند الاستيراد.
سياسات RLS والمنح الفعلية هي حد الصلاحيات، وليس كون الواجهة تستعمل SELECT فقط.
