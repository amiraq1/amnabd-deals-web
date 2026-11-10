# رؤوس أمان HTTP — دليل تنفيذ للمالك (AMN-02)

> **الحالة:** يحتاج إجراءً من المالك خارج المستودع. لم يُنفَّذ أي تغيير على Cloudflare أو GitHub في هذه المراجعة.
> **التاريخ:** 2026-11-10 · **الأساس:** `aad13a640c8e` · **الفرع:** `docs/amn-02-security-headers`

## 1. المشكلة المؤكدة

GitHub Pages لا يسمح بتعريف رؤوس استجابة مخصصة من المستودع. القياس الفعلي على الإنتاج:

```console
$ curl -sS -I https://amnabd.com/ | grep -iE 'strict-transport|content-security|x-content-type|x-frame|permissions-policy|referrer-policy'
(لا مخرجات — لا يوجد أي من هذه الرؤوس)
$ curl -sS -I https://amnabd.com/ | grep -i access-control-allow-origin
access-control-allow-origin: *
```

`Referrer-Policy` موجود كـ`<meta name="referrer" content="strict-origin-when-cross-origin">` فقط.

### حدود `meta http-equiv`

لا يمكن تعويض غياب الرؤوس عبر HTML:

| الرأس | ممكن عبر `<meta http-equiv>`؟ | السبب |
|---|---|---|
| `Content-Security-Policy` | جزئيًا | يعمل لبعض التوجيهات، لكن `frame-ancestors` و`report-uri` و`sandbox` تُتجاهل في meta |
| `Strict-Transport-Security` | **لا** | يجب أن يصل قبل أي طلب HTTP؛ المتصفح يتجاهل HSTS في meta |
| `X-Frame-Options` | لا (يُتجاهل) | يحتاج رأس HTTP؛ استخدم `frame-ancestors` في CSP |
| `X-Content-Type-Options` | لا | رأس HTTP فقط |
| `Permissions-Policy` | لا | رأس HTTP فقط |

لذلك الحل الوحيد داخل GitHub Pages + Cloudflare هو **تمرير النطاق عبر Proxy** ثم إضافة Transform Rules.

## 2. القرار المطلوب من المالك

اختر واحدًا ووثّقه قبل التنفيذ:

- **الخيار A (موصى به):** إبقاء GitHub Pages مع تفعيل Cloudflare Proxy (سحابة برتقالية) وإضافة Transform Rule لرؤوس الاستجابة.
- **الخيار B:** الانتقال إلى Cloudflare Pages مع ملف `_headers`.
- **الخيار C:** البقاء DNS-only والاكتفاء بـ`meta` — **لا يلبي اختبارات قبول AMN-02** (لا HSTS ولا `frame-ancestors`).

## 3. الخيار A — خطوات Cloudflare (لا تُنفَّذ من المستودع)

### 3.1 تفعيل Proxy دون تغيير A/CNAME

1. سجّل الحالة قبل التغيير:
   ```bash
   dig +short CNAME www.amnabd.com
   dig +short A amnabd.com
   curl -sS -I https://amnabd.com/ | head -20
   ```
2. في Cloudflare → DNS: اجعل سجل `www` (CNAME إلى `amiraq1.github.io`) **Proxied**، وسجل الجذر (A إلى عناوين GitHub Pages) **Proxied**. **لا تغيّر القيم.**
3. SSL/TLS → Overview: اختر **Full (strict)**. شهادة GitHub Pages صالحة للنطاق المخصص، لذا يجب ألا تفشل.
4. تحقق من عدم وجود Redirect loop:
   ```bash
   curl -sS -o /dev/null -w '%{http_code} %{redirect_url}\n' https://amnabd.com/
   curl -sS -o /dev/null -w '%{http_code} %{redirect_url}\n' https://www.amnabd.com/
   curl -sS -I https://amnabd.com/ | grep -i '^server:'
   ```
   بعد Proxy يظهر `server: cloudflare` بدل `GitHub.com`.

### 3.2 Rule 1 — رؤوس أساسية (فرض)

Cloudflare → Rules → Transform Rules → **Modify Response Header** → Create rule.

- الاسم: `AMN-02 baseline security headers`
- العبارة (When incoming requests match): `true` (أو `(http.host eq "amnabd.com" or http.host eq "www.amnabd.com")`)
- ثم **Set static** لكل رأس:

| Header name | Value |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()` |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `Cross-Origin-Resource-Policy` | `same-origin` |

> `Cross-Origin-Resource-Policy: same-origin` مقصود: الموقع لا يجلب أصولًا من نطاقاته الخاصة عبر مواقع أخرى. إن ظهر كسر في تحميل الأصول، احذف هذا الرأس وحده وأعد الاختبار.

### 3.3 Rule 2 — CSP بوضع Report-Only أولًا

أضف رأسًا ثانيًا في قاعدة منفصلة (أو نفس القاعدة):

`Content-Security-Policy-Report-Only` =

```
default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://www.google.com https://cdn.simpleicons.org https://*.supabase.co; font-src 'self'; connect-src 'self' https://*.supabase.co; manifest-src 'self'; worker-src 'self'; upgrade-insecure-requests
```

ملاحظات مبنية على فحص الكود:

- `img-src` يشمل `www.google.com` (أيقونات `s2/favicons`) و`cdn.simpleicons.org` (الأيقونات البديلة) و`data:`.
- `connect-src` يشمل `https://*.supabase.co`. **استبدلها بنطاق مشروعك الفعلي** إن كان مخصصًا.
- `style-src 'unsafe-inline'` مطلوب لسمات `style` التي تولّدها React/Tailwind؛ لا توجد ملفات CSS خارجية.
- `script-src 'self'` يغطي `/init-language.js` والحزمة. ملفات `application/ld+json` كتل بيانات وليست سكربتات تنفيذية؛ راقب تقارير CSP للتأكد.
- لا تستخدم `frame-ancestors` في meta؛ هي هنا في رأس HTTP فقط.

اجمع التقارير **7 أيام** (أو استخدم `report-to` مع خدمة تجميع). لا تفرض CSP قبل أسبوع بلا مخالفات حاجبة.

### 3.4 Rule 3 — HSTS تدريجيًا

لا تضف HSTS في نفس القاعدة أعلاه قبل التأكد من apex وwww وكل النطاقات الفرعية.

المرحلة 1 (أسبوع):

```
Strict-Transport-Security: max-age=300
```

المرحلة 2 بعد التأكد:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

`preload` **فقط** بعد التأكد من كل النطاقات الفرعية، لأنه يصعب التراجع عنه.

### 3.5 الفرض النهائي

بعد أسبوع من Report-Only:

1. أعد تسمية الرأس إلى `Content-Security-Policy` (أو غيّر اسم الرأس إلى `Content-Security-Policy` واحتفظ بـReport-Only لفترة).
2. أعد اختبار: البحث، الفلاتر، المفضلة، البلاغ، Service Worker، JSON-LD، الأيقونات، تحميل العروض من Supabase، وروابط `/deal/...`.

## 4. التحقق (قبل/بعد)

```bash
for p in / /sw.js /.well-known/security.txt /this-does-not-exist-xyz; do
  echo "== $p"
  curl -sS -I "https://amnabd.com$p" | grep -iE 'strict-transport|content-security|x-content-type|x-frame|permissions-policy|referrer-policy|cross-origin'
done
```

المتوقع بعد الفرض: كل مسار يعرض الرؤوس المتفق عليها، بما فيها 404 و`/sw.js`.

## 5. التراجع

1. عطّل قاعدة Transform Rule أو احذفها (تعود GitHub Pages بلا رؤوس).
2. إن فُرض HSTS: لا يمكن سحب القيمة من متصفحات زارت الموقع؛ لذلك ابدأ بـ`max-age=300`. بعد الحذف، المتصفحات التي زارت الموقع خلال المدة فقط تفرض HTTPS.
3. إن فشل Proxy: أعد السجلات إلى **DNS only** بعد التأكد من TLS. لا تغيّر A/CNAME.
4. لا تحذف سجل التحقق TXT الخاص بـAMN-01 كجزء من هذا التراجع.

## 6. ما لا يغطيه هذا المستند

- لم تُنفَّذ أي خطوة Cloudflare هنا، ولا توجد لقطات قبل/بعد.
- تقارير CSP الفعلية لم تُجمع بعد.
- اختبار الوظائف بعد الفرض (Service Worker، البلاغات، Supabase) يجب أن يُسجَّل في الـPR/التقرير قبل إغلاق AMN-02.
