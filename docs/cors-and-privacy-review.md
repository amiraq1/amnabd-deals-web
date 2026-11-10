# مراجعة CORS والخصوصية — قرار وخطة (AMN-09)

> **الحالة:** القرار التقني موثّق. سياسة الخصوصية المنشورة تحتاج موافقة المالك وإضافة صفحة/مسار — لم تُنشأ في هذا التغيير.
> **التاريخ:** 2026-11-10 · **الأساس:** `aad13a640c8e` · **الفرع:** `docs/amn-09-cors-privacy`

## 1. الأدلة المقاسة

```console
$ curl -sS -I https://amnabd.com/ | grep -iE 'access-control|set-cookie'
access-control-allow-origin: *

$ curl -sS -I https://amnabd.com/sw.js | grep -i access-control
access-control-allow-origin: *

$ curl -sS -I https://amnabd.com/.well-known/security.txt | grep -i access-control
access-control-allow-origin: *
```

`Access-Control-Allow-Origin: *` يضيفه GitHub Pages لكل الأصول، ولا يوجد `Set-Cookie` ولا كوكيز.

## 2. قرار CORS

**القرار: إبقاء `Access-Control-Allow-Origin: *` على أصول الموقع العامة، وعدم استخدامه كحد أمني.**

الأسباب:

1. الأصول ثابتة وعامة بطبيعتها (HTML/JS/CSS/SW/security.txt)؛ لا تحتوي بيانات مستخدم ولا جلسات.
2. `ACAO` يمنع *القراءة* عبر JavaScript من أصل آخر فقط، ولا يمنع الطلبات المباشرة أو تحميل الصفحة. لا يوجد في الموقع ما يحتاج حماية من هذا النوع.
3. **الحد الحقيقي لبيانات Supabase هو RLS ومنح الأعمدة**، لا CORS. لا تغيّر CORS اعتمادًا على افتراض أنه يحمي الجدول.
4. إزالة `ACAO` قد تكسر أدوات/خدمات تقرأ `feed.xml` أو `sitemap.xml` أو `security.txt` آليًا، بلا مكسب أمني.

إذا قرر المالك تقييده رغم ذلك: استخدم Cloudflare Transform Rule لحذف الرأس على مسارات محددة فقط، وأعد اختبار تحميل الأصول. لا تفعل ذلك عبر تعديل الكود.

## 3. النطاقات الخارجية التي يراها المتصفح

| النطاق | الاستخدام | متى يُطلب |
|---|---|---|
| `<project>.supabase.co` | قراءة العروض/الأدلة/الإعدادات، وإرسال بلاغ | عند تحميل الصفحة/البلاغ |
| `www.google.com` | أيقونات `s2/favicons` للعروض | عند عرض أيقونة |
| `cdn.simpleicons.org` | أيقونة بديلة عند غياب أيقونة العرض | عند عرض أيقونة |
| `t.me` | روابط تنبيهات تيليغرام | فقط عند نقر المستخدم |
| `github.com` | رابط المشروع في التذييل | فقط عند نقر المستخدم |

لا توجد: خطوط خارجية، Google Analytics، سكربتات تتبع، Sentry، أو إعلانات.

## 4. التخزين المحلي (جرد فعلي)

| المفتاح | النوع | الغرض | المحتوى |
|---|---|---|---|
| `amnabd-lang` | localStorage | تذكّر اللغة | `ar` أو `en` |
| `amnabd-favorites` | localStorage | المفضلة | معرفات عروض فقط |
| `amnabd_saved_deals_v1` | localStorage | العروض المحفوظة | معرّفات فقط |
| `amnabd_reported_slugs_v1` | localStorage | منع تكرار البلاغ | معرفات slugs فقط |
| `amnabd:report-draft:<slug>` | sessionStorage | استعادة مسودة البلاغ بعد إعادة تحميل الكتالوج | **نص الملاحظة الذي يكتبه الزائر** — قد يحتوي بيانات شخصية إن أدخلها |

المسودة تُحذف بعد نجاح الإرسال (تم التحقق من الكود: `sessionStorage.removeItem(draftKey)` بعد النجاح)، وتنتهي بانتهاء جلسة التبويب. المخاطر المتبقية:

- لا يوجد تحذير في الواجهة يمنع إدخال بيانات شخصية في الملاحظة.
- لا توجد سياسة retention منشورة.

## 5. ما يحتاجه المالك

1. **قرار موافقة** على نص سياسة خصوصية ثنائي اللغة يغطي:
   - عدم استخدام كوكيز أو متتبعات.
   - مفاتيح التخزين المحلي أعلاه والغرض منها.
   - أن بلاغ العرض يُرسل إلى Supabase مع slug وسبب وملاحظة اختيارية، وأن مزوّد الاستضافة يرى عنوان IP ضمن سجلاته.
   - الأيقونات الخارجية (Google/SimpleIcons) وSupabase كجهات خارجية.
   - رابط التواصل لطلب الحذف/الاستفسار.
2. نشر الصفحة على مسار مثل `/privacy` مع ترجمة عربية/إنجليزية واحترام RTL.
3. (اختياري) إضافة تحذير قصير بجانب حقل الملاحظة: «لا تُدرج بيانات شخصية».
4. توثيق قرار عدم تقييد `ACAO` في سجل القرارات.

## 6. التحقق

```bash
curl -sS -I https://amnabd.com/ | grep -iE 'access-control|set-cookie'
curl -sS -I https://amnabd.com/sw.js | grep -i access-control
grep -rn "fonts.googleapis\|googletagmanager\|google-analytics\|plausible\|sentry" src/ public/ index.html || echo "no third-party trackers"
```

## 7. التراجع

- لا تغيير سلوكي في هذا المستند.
- إن أُضيفت سياسة خصوصية ثم سُحبت: أزل المسار والروابط فقط، ولا تحذف بيانات المستخدم المحلية.
- إن قُيّد `ACAO` لاحقًا وكسر أدوات: أعد الرأس عبر تعطيل قاعدة Transform، لا بتعديل الكود.
