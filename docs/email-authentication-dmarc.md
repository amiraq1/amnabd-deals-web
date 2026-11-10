# مصادقة البريد وDMARC — دليل تشغيلي (AMN-03)

> **الحالة:** DNS مُتحقَّق منه، والتوثيق محدَّث. لا تغيير DNS في هذه المرحلة.
> **التاريخ:** 2026-11-10 · **الأساس:** `aad13a640c8e` · **الفرع:** `docs/amn-03-dmarc-operations`

## 1. الوضع الحالي (مُتحقَّق بأوامر فعلية)

```console
$ dig +short TXT _dmarc.amnabd.com
"v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:dmarc_rua@onsecureserver.net;"

$ dig +short TXT amnabd.com._report._dmarc.onsecureserver.net
"v=DMARC1"
```

- سياسة النطاق: `p=quarantine`، محاذاة مرنة (`adkim=r`, `aspf=r`).
- وجهة التقارير المجمّعة: `dmarc_rua@onsecureserver.net`.
- سجل تصريح الوجهة الخارجية موجود وصالح: `amnabd.com._report._dmarc.onsecureserver.net` يعيد `v=DMARC1`.

> **تنبيه منهجي:** الاستعلام `_report._dmarc.onsecureserver.net` وحده لا يكفي؛ السجل الصحيح يبدأ بنطاق السياسة: `amnabd.com._report._dmarc.onsecureserver.net`. هذا ما كان مصدر اللبس في التقرير الأولي.

## 2. المرجع المعياري

اعتمد RFCs المنشورة في مايو 2026 بدل المسودات القديمة:

| RFC | الموضوع |
|---|---|
| **RFC 9989** | DMARC Core — السياسة والتقييم والمحاذاة |
| **RFC 9990 §4** | Verifying External Destinations — سجل `_report._dmarc` لوجهات `rua`/`ruf` الخارجية |
| **RFC 9991** | Failure Reporting — صيغة تقارير الفشل |

أي إضافة وجهة `rua` خارجية جديدة **تتطلب** سجل `_report._dmarc.<policy-domain>` عند نطاق الوجهة، وإلا رفض المستقبل التقارير (RFC 9990 §4).

## 3. المراقبة (إجراء مالك)

1. تأكد من وصول تقارير XML المجمّعة إلى صندوق `dmarc_rua@onsecureserver.net` (أسبوعيًا على الأقل).
2. احفظ عينة منقّحة (بدون عناوين IP أو بريد مرسِلين) في سجل المراجعة، وأرفق تاريخ الاستلام.
3. راقب:
   - مرسِلين غير معروفين يستخدمون `amnabd.com`.
   - فشل DKIM/SPF المتكرر.
   - أي انخفاض في نسبة الرسائل المحاذية.
4. لا ترفع السياسة إلى `p=reject` ولا SPF من `~all` إلى `-all` قبل تدقيق **كل** المرسلين وسجلات DKIM.
5. إن تغيّرت وجهة `rua`: أضف سجل التصريح الخارجي أولًا، ثم غيّر السجل، ثم راقب أسبوعًا.

## 4. التحقق (قابل للنسخ)

```bash
dig +short TXT _dmarc.amnabd.com
dig +short TXT amnabd.com._report._dmarc.onsecureserver.net
dig +short TXT amnabd.com._report._dmarc.<new-destination-domain>   # عند إضافة وجهة
```

المتوقع: الأول يعيد السياسة المسجلة، والثاني يعيد `"v=DMARC1"`.

## 5. ما لم يُتحقق منه

- **لم** يُفحص وصول تقارير DMARC فعليًا: يتطلب الوصول إلى صندوق البريد (إجراء مالك).
- لم يُغيَّر أي سجل DNS.
- لا يمكن تأكيد أن كل المرسلين الشرعيين يمرّون DKIM/SPF من المستودع؛ يلزم تدقيق سجلات البريد وDNS.

## 6. التراجع

- لا يوجد تغيير DNS عاجل للتراجع عنه.
- إن أُضيف سجل تصريح خارجي ثم أُلغيت الوجهة: أزل السجل بعد التأكد من عدم استخدام الوجهة.
- لا تحذف `_dmarc` أو سجل التصريح كجزء من تراجع تغييرات أخرى.
