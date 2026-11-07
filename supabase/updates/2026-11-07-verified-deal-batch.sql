-- Amnabd verified-deal batch, 2026-11-07: 11 insert-only records.
-- Independent official-source review was completed 2026-11-07. Unsupported claim details
-- were removed or qualified in bilingual descriptions; country and card unknowns are preserved.
-- Pre-insert matching-row export: /workspace/amnabd-backups/amnabd-catches-2026-11-07-before.json
-- Preflight found no matching IDs, slugs, names, or official-source URLs. No UPDATE or DELETE.
-- Source URLs and claim evidence are stored on each record in official_sources.

SELECT id, slug
FROM public.deals
WHERE id IN ('mixedbread-5-credit', 'voyage-ai-200m-free', 'akashml-100-credit', 'mixroute-5-credit', 'reka-ai-10-monthly', 'hyperbrowser-free-5000', 'inference-net-1m-gateway', 'zcode-8m-trial', 'sarashina-free-beta', 'steel-30-credit', 'runloop-50-credit') OR slug IN ('mixedbread-5-credit', 'voyage-ai-200m-free', 'akashml-100-credit', 'mixroute-5-credit', 'reka-ai-10-monthly', 'hyperbrowser-free-5000', 'inference-net-1m-gateway', 'zcode-8m-trial', 'sarashina-free-beta', 'steel-30-credit', 'runloop-50-credit')
ORDER BY id
LIMIT 50;

BEGIN;
INSERT INTO public.deals
  (id, slug, name_ar, name_en, description_ar, description_en, category, benefits,
   eligibility, pricing, registration, official_sources, get_offer, review, status,
   ends_at, created_at)
SELECT candidate.id, candidate.slug, candidate.name_ar, candidate.name_en,
       candidate.description_ar, candidate.description_en, candidate.category,
       candidate.benefits, candidate.eligibility, candidate.pricing,
       candidate.registration, candidate.official_sources, candidate.get_offer,
       candidate.review, candidate.status, candidate.ends_at, now()
FROM jsonb_to_recordset($reviewed_batch$
[
  {
    "id": "mixedbread-5-credit",
    "slug": "mixedbread-5-credit",
    "name_ar": "Mixedbread — Starter مجانية: رصيد $5 لمرة واحدة (بلا بطاقة)",
    "name_en": "Mixedbread — Free Starter: $5 One-Time Credit (No Card)",
    "description_ar": "خطة Starter مجانية برصيد $5 لمرة واحدة، بلا بطاقة. تشمل 3 مستخدمي مساحة عمل و3 مخازن و100 استعلام/دقيقة و6,000 عملية رفع/دقيقة. بعد نفاد الرصيد، تذكر الصفحة الترقية إلى Scale للاستمرار؛ سعر Scale هو $20/شهر ويتضمن $20 رصيدًا شهريًا، ثم تُحاسب الاستخدامات الزائدة حسب الاستهلاك. الفهرسة والبحث الدلالي وإعادة الترتيب وToast 1 خدمات متاحة بتسعير استخدام منفصل وليست ضمن الرصيد المجاني. أهلية العراق غير مذكورة.",
    "description_en": "Free Starter plan with a one-time $5 credit and no card required. It includes 3 workspace users, 3 stores, 100 queries/minute, and 6,000 uploads/minute. When the credit is used up, the page says to upgrade to Scale to continue; Scale is $20/month and includes $20 in monthly credits, with additional usage billed pay-as-you-go. Indexing, semantic search, reranking, and Toast 1 are available services with separate usage pricing, not benefits included in the free credit. Iraq eligibility is not stated.",
    "category": {
      "value": "api",
      "review_status": "verified"
    },
    "benefits": [
      {
        "type": "free_quota",
        "amount": {
          "unit": "USD",
          "value": 5,
          "currency": "USD"
        },
        "description": {
          "ar": "$5 رصيد لمرة واحدة في خطة Starter المجانية.",
          "en": "$5 one-time credit in the free Starter plan."
        }
      }
    ],
    "eligibility": {
      "new_account": "unknown",
      "card_required": "not_required",
      "countries": {
        "status": "unknown",
        "values": []
      },
      "applicant_type": "unknown",
      "phone_required": "unknown",
      "student_status": "unknown",
      "conditions": {
        "ar": "البطاقة غير مطلوبة لخطة Starter؛ الرصيد لمرة واحدة ولا تنص الصفحة على صلاحيته. خدمات البحث والفهرسة وToast 1 لها تسعير استخدام منفصل؛ أهلية العراق غير مذكورة.",
        "en": "No card is required for Starter; the credit is one-time and its expiry is not stated. Search, indexing, and Toast 1 have separate usage pricing; Iraq eligibility is not stated."
      }
    },
    "pricing": {
      "currency": "USD",
      "offer_price": 0,
      "billing_cycle": "free",
      "original_price": null
    },
    "registration": {
      "deadline": {
        "date": null,
        "status": "ongoing"
      },
      "credit_validity": {
        "unit": null,
        "status": "unknown",
        "duration": null
      },
      "steps": {
        "ar": "راجع صفحة التسعير الرسمية ثم ابدأ بخطة Starter المجانية.",
        "en": "Review the official pricing page and start with the free Starter plan."
      }
    },
    "official_sources": [
      {
        "url": "https://www.mixedbread.com/pricing",
        "title": "Mixedbread — official pricing",
        "claims": [
          {
            "field": "benefits.0.amount.value",
            "value": 5,
            "evidence": "Official page: “Starter: Free”; “$5 in one-time credits. No card required.” It lists plan limits and separately priced usage for Index, Search, reranking, and Toast 1."
          }
        ]
      }
    ],
    "get_offer": {
      "url": "https://www.mixedbread.com/pricing",
      "type": "official",
      "label": {
        "ar": "المصدر الرسمي للعرض",
        "en": "Official offer source"
      }
    },
    "review": {
      "verdict": "verified",
      "verification_status": "supported",
      "reviewed_at": "2026-11-07",
      "reviewed_on": "2026-11-07",
      "verified_on": "2026-11-07",
      "offer_status": "active",
      "unknown_fields": [
        "Iraq_availability",
        "eligibility.new_account",
        "credit expiration"
      ],
      "notes": {
        "ar": "تأكدت صفحة التسعير من Starter المجانية ورصيد $5 لمرة واحدة بلا بطاقة. استُبعدت خدمات Index/Search/Toast من مزايا الرصيد لأن لها أسعار استخدام منفصلة؛ انتهاء الرصيد وأهلية العراق غير مذكورين.",
        "en": "The pricing page confirms free Starter, a one-time $5 credit, and no card. Index/Search/Toast were excluded as included benefits because they have separate usage pricing; credit expiry and Iraq eligibility are not stated."
      }
    },
    "status": "active",
    "ends_at": null
  },
  {
    "id": "voyage-ai-200m-free",
    "slug": "voyage-ai-200m-free",
    "name_ar": "Voyage AI (MongoDB) — طبقة مجانية: 200M لمعظم النماذج و50M لنماذج محددة",
    "name_en": "Voyage AI (MongoDB) — Free Tier: 200M Tokens for Most Models, 50M for Named Models",
    "description_ar": "توثيق MongoDB يذكر طبقة مجانية: 200 مليون توكن لمعظم النماذج، و50 مليونًا لنماذج التضمين المتخصصة المحددة voyage-finance-2 وvoyage-law-2 وvoyage-code-2. بعض نماذج الإصدارات الأقدم لا تقدم توكنات مجانية. وثائق الفوترة تقول إن المؤسسات التي لا تملك وسيلة دفع تكون افتراضيًا على Free Tier؛ ولا تثبت الصفحة حرفيًا سياسة «لا بطاقة مطلوبة» عند التسجيل. فترة إعادة ضبط/انتهاء الحصة وأهلية العراق غير مذكورتين.",
    "description_en": "MongoDB documentation lists a free tier: 200 million tokens for most models and 50 million for the specifically named specialized embedding models voyage-finance-2, voyage-law-2, and voyage-code-2. Some older model versions have no free tokens. Billing docs say organizations without a payment method default to the Free Tier; they do not literally establish a no-card signup policy. Quota reset/expiry and Iraq eligibility are not stated.",
    "category": {
      "value": "api",
      "review_status": "verified"
    },
    "benefits": [
      {
        "type": "free_quota",
        "amount": {
          "unit": "tokens",
          "value": 200000000,
          "currency": null
        },
        "description": {
          "ar": "200 مليون توكن مجانية لمعظم النماذج؛ 50 مليونًا للنماذج المتخصصة الثلاثة المسماة في التوثيق.",
          "en": "200 million free tokens for most models; 50 million for the three specialized models named in the docs."
        }
      }
    ],
    "eligibility": {
      "new_account": "unknown",
      "card_required": "unknown",
      "countries": {
        "status": "unknown",
        "values": []
      },
      "applicant_type": "unknown",
      "phone_required": "unknown",
      "student_status": "unknown",
      "conditions": {
        "ar": "وثائق الفوترة تقول إن المؤسسة بلا وسيلة دفع تُعيّن افتراضيًا إلى Free Tier، لكن اشتراط البطاقة عند إنشاء الحساب غير منصوص عليه حرفيًا. بعض النماذج القديمة بلا توكنات مجانية؛ التحديث/الانتهاء والعراق غير مذكورة.",
        "en": "Billing docs say an organization without a payment method defaults to Free Tier, but card requirements at signup are not stated literally. Some older models have no free tokens; reset/expiry and Iraq are not stated."
      }
    },
    "pricing": {
      "currency": "USD",
      "offer_price": 0,
      "billing_cycle": "free",
      "original_price": null
    },
    "registration": {
      "deadline": {
        "date": null,
        "status": "ongoing"
      },
      "credit_validity": {
        "unit": null,
        "status": "unknown",
        "duration": null
      },
      "steps": {
        "ar": "أنشئ حساب MongoDB Atlas وراجع توثيق النماذج والفوترة الرسمي قبل إنشاء مفتاح Voyage AI.",
        "en": "Create a MongoDB Atlas account and review the official model and billing docs before creating a Voyage AI key."
      }
    },
    "official_sources": [
      {
        "url": "https://www.mongodb.com/docs/voyageai/models/",
        "title": "MongoDB — Voyage AI models",
        "claims": [
          {
            "field": "benefits.0.amount.value",
            "value": 200000000,
            "evidence": "Official docs: “200 million free tokens for most models, or 50 million tokens for specialized models”; they name voyage-finance-2, voyage-law-2, and voyage-code-2, and note some older models have no free tokens."
          }
        ]
      },
      {
        "url": "https://www.mongodb.com/docs/voyageai/management/billing/",
        "title": "MongoDB — Voyage AI billing",
        "claims": [
          {
            "field": "eligibility.card_required",
            "value": "unknown",
            "evidence": "Official billing docs: organizations without a payment method default to Free Tier; higher usage tiers require a payment method."
          }
        ]
      }
    ],
    "get_offer": {
      "url": "https://www.mongodb.com/docs/voyageai/models/",
      "type": "official",
      "label": {
        "ar": "المصدر الرسمي للعرض",
        "en": "Official offer source"
      }
    },
    "review": {
      "verdict": "verified",
      "verification_status": "supported",
      "reviewed_at": "2026-11-07",
      "reviewed_on": "2026-11-07",
      "verified_on": "2026-11-07",
      "offer_status": "active",
      "unknown_fields": [
        "Iraq_availability",
        "eligibility.card_required",
        "benefits.0.amount",
        "token renewal and expiration",
        "other_signup_restrictions"
      ],
      "notes": {
        "ar": "دُقّق حد 200M لمعظم النماذج و50M لثلاثة نماذج متخصصة مسماة فقط؛ لم يُثبت وصف «دائم» أو زمن التجديد. وثائق الدفع لا تصرح حرفيًا بعدم الحاجة إلى بطاقة عند التسجيل؛ العراق غير مذكور.",
        "en": "The 200M limit is for most models and 50M for only three named specialized models; “permanent” and reset timing are not established. Billing docs do not literally say no card is needed at signup; Iraq is not mentioned."
      }
    },
    "status": "active",
    "ends_at": null
  },
  {
    "id": "akashml-100-credit",
    "slug": "akashml-100-credit",
    "name_ar": "AkashML — رصيد $100 لتوكنات الذكاء الاصطناعي للحسابات الجديدة",
    "name_en": "AkashML — $100 in AI Token Credits for New Accounts",
    "description_ar": "تقول مدونة Akash الرسمية إن الحسابات الجديدة تحصل على $100 من أرصدة توكنات الذكاء الاصطناعي، ويمكن استخدام الرصيد عبر النماذج المدعومة في Playground ومنصة API المتوافقة مع OpenAI. تسرد المدونة عند الإطلاق Llama 3.3-70B وDeepSeek V3 وQwen3-30B-A3B. لا تذكر سياسة البطاقة أو انتهاء/تجديد الرصيد أو أهلية العراق.",
    "description_en": "Akash’s official blog says new accounts receive $100 in AI token credits usable across supported models in the Playground and OpenAI-compatible API platform. The blog lists Llama 3.3-70B, DeepSeek V3, and Qwen3-30B-A3B as models available at launch. It does not state card policy, credit expiry/renewal, or Iraq eligibility.",
    "category": {
      "value": "api",
      "review_status": "verified"
    },
    "benefits": [
      {
        "type": "free_quota",
        "amount": {
          "unit": "USD",
          "value": 100,
          "currency": "USD"
        },
        "description": {
          "ar": "$100 أرصدة توكنات AI للحسابات الجديدة، للاستخدام عبر النماذج المدعومة.",
          "en": "$100 in AI token credits for new accounts, usable across supported models."
        }
      }
    ],
    "eligibility": {
      "new_account": "required",
      "card_required": "unknown",
      "countries": {
        "status": "unknown",
        "values": []
      },
      "applicant_type": "unknown",
      "phone_required": "unknown",
      "student_status": "unknown",
      "conditions": {
        "ar": "الحساب الجديد مؤهل للرصيد وفق المدونة؛ سياسة البطاقة وصلاحية/تجديد الرصيد وأهلية العراق غير مذكورة. أسماء النماذج المذكورة هي نماذج عند الإطلاق.",
        "en": "The blog states that new accounts receive the credit; card policy, credit expiry/renewal, and Iraq eligibility are not stated. The named models are listed as available at launch."
      }
    },
    "pricing": {
      "currency": "USD",
      "offer_price": 0,
      "billing_cycle": "promo",
      "original_price": null
    },
    "registration": {
      "deadline": {
        "date": null,
        "status": "ongoing"
      },
      "credit_validity": {
        "unit": null,
        "status": "unknown",
        "duration": null
      },
      "steps": {
        "ar": "راجع إعلان AkashML الرسمي واتبع رابط التسجيل أو الوصول إلى Playground/API منه.",
        "en": "Review AkashML’s official announcement and use its linked signup or Playground/API access path."
      }
    },
    "official_sources": [
      {
        "url": "https://akash.network/blog/akashml-managed-ai-inference-on-the-decentralized-supercloud/",
        "title": "Akash — official AkashML announcement",
        "claims": [
          {
            "field": "benefits.0.amount.value",
            "value": 100,
            "evidence": "Official blog: “New accounts receive $100 in AI token credits” usable across supported models in Playground and API; model examples are stated as available at launch. Published 2025-11-22."
          }
        ]
      }
    ],
    "get_offer": {
      "url": "https://akash.network/blog/akashml-managed-ai-inference-on-the-decentralized-supercloud/",
      "type": "official",
      "label": {
        "ar": "المصدر الرسمي للعرض",
        "en": "Official offer source"
      }
    },
    "review": {
      "verdict": "verified",
      "verification_status": "supported",
      "reviewed_at": "2026-11-07",
      "reviewed_on": "2026-11-07",
      "verified_on": "2026-11-07",
      "offer_status": "active",
      "unknown_fields": [
        "Iraq_availability",
        "eligibility.card_required",
        "credit expiration",
        "token renewal and expiration"
      ],
      "notes": {
        "ar": "المدونة الرسمية (2025-11-22) تدعم رصيد $100 للحسابات الجديدة عبر Playground/API. الأمثلة مذكورة عند الإطلاق فقط؛ البطاقة والانتهاء والتجديد والعراق غير مذكورة.",
        "en": "The official blog (2025-11-22) supports $100 for new accounts across Playground/API. Model examples are stated for launch; card policy, expiry, renewal, and Iraq are not stated."
      }
    },
    "status": "active",
    "ends_at": null
  },
  {
    "id": "mixroute-5-credit",
    "slug": "mixroute-5-credit",
    "name_ar": "MixRoute — $5 رصيد تسجيل للنماذج الشائعة (بلا بطاقة، لا ينتهي)",
    "name_en": "MixRoute — $5 Signup Credit on Popular Models (No Card; Never Expires)",
    "description_ar": "تمنح MixRoute رصيد تسجيل مجانيًا بقيمة $5 للنماذج الشائعة، ولا تحتاج بطاقة للتسجيل؛ وتقول الصفحة الرسمية إن الرصيد لا تنتهي صلاحيته. المنصة تعلن عن مفتاح موحد لأكثر من 250 نموذجًا بلا هامش سعر، لكن الصفحة تذكر أن تعبئة الرصيد تفتح جميع النماذج الـ250+؛ لذلك لا يُفهم أن رصيد التسجيل يشملها كلها. أهلية العراق غير مذكورة.",
    "description_en": "MixRoute offers a $5 signup credit for popular models, does not require a card for signup, and says the credit never expires. It advertises one unified key for 250+ models with no markup, but says topping up unlocks all 250+ models; the signup credit should not be read as covering every model. Iraq eligibility is not stated.",
    "category": {
      "value": "api",
      "review_status": "verified"
    },
    "benefits": [
      {
        "type": "free_quota",
        "amount": {
          "unit": "USD",
          "value": 5,
          "currency": "USD"
        },
        "description": {
          "ar": "$5 رصيد تسجيل للنماذج الشائعة؛ لا تنتهي صلاحيته.",
          "en": "$5 signup credit for popular models; it never expires."
        }
      }
    ],
    "eligibility": {
      "new_account": "required",
      "card_required": "not_required",
      "countries": {
        "status": "unknown",
        "values": []
      },
      "applicant_type": "unknown",
      "phone_required": "unknown",
      "student_status": "unknown",
      "conditions": {
        "ar": "التسجيل بلا بطاقة والرصيد لا ينتهي؛ الرصيد للنماذج الشائعة، وتستلزم النماذج الـ250+ تعبئة الرصيد وفق الصفحة. أهلية العراق غير مذكورة.",
        "en": "Signup requires no card and the credit never expires; the signup credit is for popular models, while accessing all 250+ requires a top-up. Iraq eligibility is not stated."
      }
    },
    "pricing": {
      "currency": "USD",
      "offer_price": 0,
      "billing_cycle": "free",
      "original_price": null
    },
    "registration": {
      "deadline": {
        "date": null,
        "status": "ongoing"
      },
      "credit_validity": {
        "unit": null,
        "status": "unknown",
        "duration": null
      },
      "steps": {
        "ar": "سجّل عبر موقع MixRoute الرسمي وتحقق من النماذج المشمولة برصيد التسجيل.",
        "en": "Sign up on MixRoute’s official site and check which models are covered by the signup credit."
      }
    },
    "official_sources": [
      {
        "url": "https://mixroute.ai/blog/pay-for-ai-apis-with-eth/",
        "title": "MixRoute — official blog",
        "claims": [
          {
            "field": "benefits.0.amount.value",
            "value": 5,
            "evidence": "Official blog: new users get $5 in free credits and signup needs no credit card."
          }
        ]
      },
      {
        "url": "https://mixroute.ai/",
        "title": "MixRoute — official homepage",
        "claims": [
          {
            "field": "benefits.0.description.en",
            "value": "$5 signup credit, never expires, popular models",
            "evidence": "Homepage: “Start free with $5 credit on popular models”; “Credits never expire”; all 250+ models are unlocked by topping up; provider prices pass through with 0% markup."
          }
        ]
      }
    ],
    "get_offer": {
      "url": "https://mixroute.ai/blog/pay-for-ai-apis-with-eth/",
      "type": "official",
      "label": {
        "ar": "المصدر الرسمي للعرض",
        "en": "Official offer source"
      }
    },
    "review": {
      "verdict": "verified",
      "verification_status": "supported",
      "reviewed_at": "2026-11-07",
      "reviewed_on": "2026-11-07",
      "verified_on": "2026-11-07",
      "offer_status": "active",
      "unknown_fields": [
        "Iraq_availability"
      ],
      "notes": {
        "ar": "المصدران الرسميان يؤكدان $5 للنماذج الشائعة، عدم الحاجة إلى بطاقة للتسجيل، وعدم انتهاء الرصيد. لم يُعمّم الرصيد على كل النماذج الـ250+. أهلية العراق غير مذكورة.",
        "en": "The official blog and homepage confirm $5 for popular models, no card for signup, and no credit expiry. The signup credit was not generalized to every one of the 250+ models. Iraq is not stated."
      }
    },
    "status": "active",
    "ends_at": null
  },
  {
    "id": "reka-ai-10-monthly",
    "slug": "reka-ai-10-monthly",
    "name_ar": "Reka AI — $10 رصيد API شهريًا + ساعتان لرفع الفيديو",
    "name_en": "Reka AI — $10 Monthly API Credit + 2 Video Upload Hours",
    "description_ar": "إعلان Reka الرسمي المؤرخ 4 سبتمبر 2025 يقول إن المستخدمين يحصلون تلقائيًا على $10 من رصيد API المجاني في بداية كل شهر، لأي ميزة API، إضافة إلى ساعتين مجانيتين لرفع الفيديو في Reka Vision مع بحث وأسئلة وأجوبة غير محدودة. الإعلان لا يذكر انتهاء الرصيد أو ترحيله ولا سياسة البطاقة أو أهلية العراق؛ استمرار العرض بعد تاريخ الإعلان غير مؤكد في مصدر أحدث.",
    "description_en": "Reka’s official announcement dated September 4, 2025 says users automatically receive $10 in free API credits at the start of each month for any API feature, plus 2 free hours of video upload in Reka Vision with unlimited search and Q&A. The announcement does not state credit expiry or rollover, card policy, or Iraq eligibility; continuation beyond the announcement has not been confirmed by a newer source.",
    "category": {
      "value": "api",
      "review_status": "verified"
    },
    "benefits": [
      {
        "type": "free_quota",
        "amount": {
          "unit": "USD",
          "value": 10,
          "currency": "USD"
        },
        "description": {
          "ar": "$10 رصيد API يتجدد في بداية كل شهر، إضافة إلى ساعتين لرفع الفيديو في Reka Vision.",
          "en": "$10 API credit refreshed at the start of each month, plus 2 hours of Reka Vision video upload."
        },
        "frequency": "monthly"
      }
    ],
    "eligibility": {
      "new_account": "unknown",
      "card_required": "unknown",
      "countries": {
        "status": "unknown",
        "values": []
      },
      "applicant_type": "unknown",
      "phone_required": "unknown",
      "student_status": "unknown",
      "conditions": {
        "ar": "المصدر إعلان بتاريخ 2025-09-04؛ لا يذكر ترحيل الرصيد أو انتهاءه أو سياسة البطاقة أو أهلية العراق، ولا يؤكد استمرار الشروط بعد تاريخ الإعلان.",
        "en": "Source is an announcement dated 2025-09-04; it does not state rollover, expiry, card policy, or Iraq eligibility, and does not confirm continuation after the announcement date."
      }
    },
    "pricing": {
      "currency": "USD",
      "offer_price": 0,
      "billing_cycle": "free",
      "original_price": null
    },
    "registration": {
      "deadline": {
        "date": null,
        "status": "ongoing"
      },
      "credit_validity": {
        "unit": null,
        "status": "unknown",
        "duration": null
      },
      "steps": {
        "ar": "راجع إعلان Reka الرسمي وتحقق من شروط الخدمة الحالية قبل استخدام أرصدة API أو رفع الفيديو.",
        "en": "Review Reka’s official announcement and confirm current terms before using API credits or video upload."
      }
    },
    "official_sources": [
      {
        "url": "https://reka.ai/news/end-of-summer-updates",
        "title": "Reka — official End of Summer Updates",
        "claims": [
          {
            "field": "benefits.0.amount.value",
            "value": 10,
            "evidence": "Official announcement dated 2025-09-04: $10 in free credits is automatically refreshed at the start of each month for any API feature; it also states 2 hours of free video upload and unlimited search/Q&A."
          }
        ]
      }
    ],
    "get_offer": {
      "url": "https://reka.ai/news/end-of-summer-updates",
      "type": "official",
      "label": {
        "ar": "المصدر الرسمي للعرض",
        "en": "Official offer source"
      }
    },
    "review": {
      "verdict": "verified",
      "verification_status": "supported",
      "reviewed_at": "2026-11-07",
      "reviewed_on": "2026-11-07",
      "verified_on": "2026-11-07",
      "offer_status": "unknown",
      "unknown_fields": [
        "Iraq_availability",
        "eligibility.card_required",
        "monthly_balance_carryover",
        "credit expiration",
        "offer_status"
      ],
      "notes": {
        "ar": "يدعم الإعلان الرسمي (2025-09-04) مبلغ $10 شهريًا وساعتين فيديو، لكنه لا يثبت استمرار الشروط بعد تاريخ النشر؛ سُجلت حالة العرض غير معلومة. البطاقة والعراق وترحيل الرصيد غير مذكورة.",
        "en": "The official announcement (2025-09-04) supports $10 monthly and 2 video hours, but does not establish that the terms continued after publication; offer status is recorded as unknown. Card, Iraq, and rollover are not stated."
      }
    },
    "status": "active",
    "ends_at": null
  },
  {
    "id": "hyperbrowser-free-5000",
    "slug": "hyperbrowser-free-5000",
    "name_ar": "Hyperbrowser — خطة Free: 5,000 رصيد (قيمة $5، بلا بطاقة)",
    "name_en": "Hyperbrowser — Free Plan: 5,000 Credits ($5 Value; No Card)",
    "description_ar": "خطة Hyperbrowser المجانية بسعر $0 تتضمن 5,000 رصيد؛ وبحسب سعر الصفحة 1,000 رصيد = $1، أي قيمة اسمية $5. جلسات المتصفح تستهلك 100 رصيد/ساعة، ما يعادل 50 ساعة عند استخدام الرصيد كله للجلسات فقط. الصفحة لا تثبت عدد صفحات الجلب أو ما إذا كان الرصيد ابتدائيًا أو يتجدد شهريًا، وتقول صراحة إن الخطة المجانية لا تتطلب بطاقة. أهلية العراق غير مذكورة.",
    "description_en": "Hyperbrowser’s $0 Free plan includes 5,000 credits; at the listed rate of 1,000 credits = $1, that is a nominal $5 value. Browser sessions use 100 credits/hour, so the balance could cover 50 browser hours if spent only on sessions. The page does not establish a fetched-page count or whether credits are a starting balance or renew monthly. It explicitly says the free plan requires no credit card. Iraq eligibility is not stated.",
    "category": {
      "value": "cloud",
      "review_status": "verified"
    },
    "benefits": [
      {
        "type": "free_quota",
        "amount": {
          "unit": "credits",
          "value": 5000,
          "currency": null
        },
        "description": {
          "ar": "5,000 رصيد مشمول في الخطة المجانية (قيمة اسمية $5).",
          "en": "5,000 credits included in the free plan (nominal $5 value)."
        }
      }
    ],
    "eligibility": {
      "new_account": "unknown",
      "card_required": "not_required",
      "countries": {
        "status": "unknown",
        "values": []
      },
      "applicant_type": "unknown",
      "phone_required": "unknown",
      "student_status": "unknown",
      "conditions": {
        "ar": "لا تتطلب الخطة المجانية بطاقة. قيمة الرصيد وتكلفة جلسة المتصفح موضحتان في التسعير؛ عدد الصفحات وتوقيت/تجديد/انتهاء الرصيد والعراق غير مذكورة.",
        "en": "The free plan requires no card. Credit value and browser-session cost are listed; page count, credit timing/renewal/expiry, and Iraq eligibility are not stated."
      }
    },
    "pricing": {
      "currency": "USD",
      "offer_price": 0,
      "billing_cycle": "free",
      "original_price": null
    },
    "registration": {
      "deadline": {
        "date": null,
        "status": "ongoing"
      },
      "credit_validity": {
        "unit": null,
        "status": "unknown",
        "duration": null
      },
      "steps": {
        "ar": "ابدأ بالخطة المجانية من صفحة التسعير الرسمية، وتحقق من تكلفة كل استخدام قبل تشغيل الجلسات.",
        "en": "Start with the Free plan on the official pricing page and check per-use costs before running sessions."
      }
    },
    "official_sources": [
      {
        "url": "https://hyperbrowser.ai/pricing",
        "title": "Hyperbrowser — official pricing",
        "claims": [
          {
            "field": "benefits.0.amount.value",
            "value": 5000,
            "evidence": "Official pricing: Free $0 plan includes 5,000 credits; 1 credit = $0.001; browser sessions use 100 credits/hour; “No credit card required for free plan.” No page-fetch count or renewal schedule is stated."
          }
        ]
      }
    ],
    "get_offer": {
      "url": "https://hyperbrowser.ai/pricing",
      "type": "official",
      "label": {
        "ar": "المصدر الرسمي للعرض",
        "en": "Official offer source"
      }
    },
    "review": {
      "verdict": "verified",
      "verification_status": "supported",
      "reviewed_at": "2026-11-07",
      "reviewed_on": "2026-11-07",
      "verified_on": "2026-11-07",
      "offer_status": "active",
      "unknown_fields": [
        "Iraq_availability",
        "benefits.0.frequency",
        "credit expiration",
        "registration.credit_validity"
      ],
      "notes": {
        "ar": "تأكدت 5,000 رصيد والخطة بلا بطاقة؛ حُذف ادعاء 5,000 صفحة لأنه غير منشور في الصفحة. لا يمكن استنتاج دورية الرصيد أو انتهاء صلاحيته؛ العراق غير مذكور.",
        "en": "Confirmed 5,000 credits and no card; removed the 5,000-page claim because it is not published on the page. Credit frequency/expiry cannot be inferred; Iraq is not stated."
      }
    },
    "status": "active",
    "ends_at": null
  },
  {
    "id": "inference-net-1m-gateway",
    "slug": "inference-net-1m-gateway",
    "name_ar": "Inference.net — 1M طلب Gateway + 1M وحدة تتبع شهريًا",
    "name_en": "Inference.net — 1M Gateway Requests + 1M Monthly Tracing Spans",
    "description_ar": "خطة Pay as you go تعرض السعر $0 + الاستخدام، وتشمل 1M طلب Gateway (دورية الحصة غير محددة في الجدول) و1M Tracing spans شهريًا. تتضمن أيضًا احتفاظًا 14 يومًا ومقعدًا واحدًا وحدًا 30 طلبًا/دقيقة. لا يثبت جدول التسعير أن استهلاك النماذج مشمول ضمن الحصة أو يحدد قيمته؛ لذلك لا تُعرض هذه الحصة كتوكنات نماذج مجانية. البطاقة وأهلية العراق غير مذكورتين للخطة المجانية.",
    "description_en": "The Pay as you go plan is listed at $0 + usage and includes 1M Gateway requests (the table does not specify the quota period) and 1M Tracing spans per month. It also lists 14-day retention, one seat, and a 30 requests/minute limit. The pricing table does not establish whether model consumption is included in the quota or state its cost; this is not presented as free model tokens. Card policy for the free plan and Iraq eligibility are not stated.",
    "category": {
      "value": "api",
      "review_status": "verified"
    },
    "benefits": [
      {
        "type": "free_quota",
        "amount": {
          "unit": "requests",
          "value": 1000000,
          "currency": null
        },
        "description": {
          "ar": "1M طلب Gateway (دورية الحصة غير محددة) + 1M Tracing spans شهريًا.",
          "en": "1M Gateway requests (period not specified) + 1M Tracing spans per month."
        }
      }
    ],
    "eligibility": {
      "new_account": "unknown",
      "card_required": "unknown",
      "countries": {
        "status": "unknown",
        "values": []
      },
      "applicant_type": "unknown",
      "phone_required": "unknown",
      "student_status": "unknown",
      "conditions": {
        "ar": "الخطة $0 + الاستخدام؛ الجدول لا يوضح هل استهلاك النماذج داخل الحصص أو منفصل عنها، ولا يحدد قيمة الأرصدة الشهرية الإضافية. لا يذكر اشتراط بطاقة للخطة المجانية أو أهلية العراق.",
        "en": "Plan is $0 + usage; the table does not say whether model consumption is inside or separate from the quotas, nor state the value of any additional monthly credits. It does not state a card requirement for the free plan or Iraq eligibility."
      }
    },
    "pricing": {
      "currency": "USD",
      "offer_price": 0,
      "billing_cycle": "free",
      "original_price": null
    },
    "registration": {
      "deadline": {
        "date": null,
        "status": "ongoing"
      },
      "credit_validity": {
        "unit": null,
        "status": "unknown",
        "duration": null
      },
      "steps": {
        "ar": "راجع صفحة التسعير الرسمية واختر Pay as you go المجانية؛ تحقق من رسوم استهلاك النماذج قبل التوجيه.",
        "en": "Review the official pricing page and choose the free Pay as you go plan; verify model-consumption charges before routing."
      }
    },
    "official_sources": [
      {
        "url": "https://inference.net/pricing",
        "title": "Inference.net — official pricing",
        "claims": [
          {
            "field": "benefits.0.amount.value",
            "value": 1000000,
            "evidence": "Official pricing lists “$0 + usage”, “1M included Gateway requests” without a period, and “1M / mo Tracing spans”; it does not give the Gateway reset period or model-consumption price."
          }
        ]
      }
    ],
    "get_offer": {
      "url": "https://inference.net/pricing",
      "type": "official",
      "label": {
        "ar": "المصدر الرسمي للعرض",
        "en": "Official offer source"
      }
    },
    "review": {
      "verdict": "verified",
      "verification_status": "supported",
      "reviewed_at": "2026-11-07",
      "reviewed_on": "2026-11-07",
      "verified_on": "2026-11-07",
      "offer_status": "active",
      "unknown_fields": [
        "Iraq_availability",
        "eligibility.card_required",
        "benefits.0.frequency",
        "token renewal and expiration",
        "other_signup_restrictions"
      ],
      "notes": {
        "ar": "صُحّح التوقيت: الصفحة تقول 1M Gateway requests بلا تحديد شهري، و1M Tracing شهريًا. لم يُثبت أن توكنات النماذج مشمولة أو أن البطاقة غير مطلوبة؛ العراق غير مذكور.",
        "en": "Corrected the timing: the page lists 1M Gateway requests with no monthly period and 1M monthly Tracing spans. It does not establish free model tokens or that a card is not required; Iraq is not stated."
      }
    },
    "status": "active",
    "ends_at": null
  },
  {
    "id": "zcode-8m-trial",
    "slug": "zcode-8m-trial",
    "name_ar": "ZCode — تجربة BigModel: ‏8M توكن/يوم لأول 5 أيام",
    "name_en": "ZCode — BigModel Trial: 8M Tokens/Day for the First 5 Days",
    "description_ar": "توثيق ZCode يقول إن ربط حساب BigModel يمنح المستخدمين الجدد تجربة بلا دفع لمدة 5 أيام: 3M توكن/يوم لـGLM-5.3 و5M/يوم لـGLM-5.3-Flash، مع تجديد الحصة يوميًا خلال التجربة. لا ينطبق رقم 8M على مسار Z.ai الخارجي؛ ذلك المسار يؤكد حصة يومية مجانية للنماذج الرائدة دون رقم. التوثيق لا يذكر صراحةً اشتراط بطاقة أو أهلية العراق.",
    "description_en": "ZCode docs say linking a BigModel account gives new users a no-payment 5-day trial: 3M tokens/day for GLM-5.3 and 5M/day for GLM-5.3-Flash, with daily quota refreshes during the trial. The 8M figure does not apply to the overseas Z.ai path; that path confirms a free daily quota for flagship models but gives no number. The docs do not explicitly state card policy or Iraq eligibility.",
    "category": {
      "value": "ai-tools",
      "review_status": "verified"
    },
    "benefits": [
      {
        "type": "free_quota",
        "amount": {
          "unit": "tokens",
          "value": 8000000,
          "currency": null
        },
        "description": {
          "ar": "8M توكن/يوم لأول 5 أيام في مسار BigModel فقط (3M GLM-5.3 + 5M Flash).",
          "en": "8M tokens/day for the first 5 days on the BigModel path only (3M GLM-5.3 + 5M Flash)."
        },
        "frequency": "daily"
      }
    ],
    "eligibility": {
      "new_account": "required",
      "card_required": "unknown",
      "countries": {
        "status": "unknown",
        "values": []
      },
      "applicant_type": "unknown",
      "phone_required": "unknown",
      "student_status": "unknown",
      "conditions": {
        "ar": "تجربة BigModel خمسة أيام بعد ربط الحساب؛ المصدر يقول لا يلزم الدفع لكنه لا يصرّح حرفيًا بسياسة البطاقة. مسار Z.ai الخارجي له حصة مجانية يومية دون رقم محدد؛ العراق غير مذكور.",
        "en": "Five-day BigModel trial after account linking; the source says no payment is required but does not literally state card policy. The overseas Z.ai path has a free daily quota without an exact number; Iraq is not stated."
      }
    },
    "pricing": {
      "currency": "USD",
      "offer_price": 0,
      "billing_cycle": "promo",
      "original_price": null
    },
    "registration": {
      "deadline": {
        "date": null,
        "status": "ongoing"
      },
      "credit_validity": {
        "unit": null,
        "status": "unknown",
        "duration": null
      },
      "steps": {
        "ar": "اربط حساب BigModel في ZCode للحصول على الحصة الموثقة؛ تحقق من المسار الذي تستخدمه لأن حصة Z.ai الخارجية بلا رقم محدد.",
        "en": "Link a BigModel account in ZCode for the documented quota; confirm which path you use because the overseas Z.ai quota has no stated number."
      }
    },
    "official_sources": [
      {
        "url": "https://zcode.z.ai/en/docs/configuration",
        "title": "ZCode — official configuration docs",
        "claims": [
          {
            "field": "benefits.0.amount.value",
            "value": 8000000,
            "evidence": "“No payment required, with 8 million tokens per day for the first 5 days” after linking BigModel; split as 3M/day GLM-5.3 and 5M/day GLM-5.3-Flash, refreshed daily. The Z.ai overseas path confirms a free daily quota but no exact amount."
          }
        ]
      }
    ],
    "get_offer": {
      "url": "https://zcode.z.ai/en/docs/configuration",
      "type": "official",
      "label": {
        "ar": "المصدر الرسمي للعرض",
        "en": "Official offer source"
      }
    },
    "review": {
      "verdict": "verified",
      "verification_status": "supported",
      "reviewed_at": "2026-11-07",
      "reviewed_on": "2026-11-07",
      "verified_on": "2026-11-07",
      "offer_status": "active",
      "unknown_fields": [
        "Iraq_availability",
        "eligibility.card_required",
        "other_signup_restrictions"
      ],
      "notes": {
        "ar": "رقم 8M مثبت لمسار BigModel فقط؛ التجربة خمسة أيام وتتجدد الحصة خلالها يوميًا. لم يُعمّم الرقم على Z.ai الخارجي، وسياسة البطاقة والعراق غير مذكورتين.",
        "en": "The 8M figure is supported only for BigModel; the trial lasts five days with daily refresh during that period. The number was not generalized to overseas Z.ai; card policy and Iraq are not stated."
      }
    },
    "status": "active",
    "ends_at": null
  },
  {
    "id": "sarashina-free-beta",
    "slug": "sarashina-free-beta",
    "name_ar": "Sarashina Service — بيتا مجانية: API لستة نماذج ومحادثة ويب",
    "name_en": "Sarashina Service — Free Beta: API for Six Models and Web Chat",
    "description_ar": "أعلنت SB Intuitions في 13 أكتوبر 2026 بيتا مجانية لخدمة Sarashina: API لستة نماذج Sarashina3 ومحادثة عبر الويب. التسجيل الاجتماعي بحساب Google متاح بلا طلب تقديم مسبق. الاستخدام خاضع لحدود معدل طلبات غير رقمية؛ وتقول الشركة إن تاريخ انتهاء البيتا المجانية لم يُحدد بعد. تصف الشركة قدرات قوية باللغة اليابانية ونموذج ترجمة ياباني-إنجليزي/إنجليزي-ياباني. البطاقة وأهلية العراق غير مذكورتين.",
    "description_en": "On October 13, 2026, SB Intuitions announced a free beta of Sarashina Service: API access to six Sarashina3 models and web chat. Google social login is available without an advance application. Usage is rate-limited, but numeric limits are not stated; the company says the free beta end date has not yet been determined. It describes strong Japanese-language capabilities and a Japanese-English/English-Japanese translation model. Card policy and Iraq eligibility are not stated.",
    "category": {
      "value": "api",
      "review_status": "verified"
    },
    "benefits": [
      {
        "type": "free_access",
        "description": {
          "ar": "بيتا مجانية: API لستة نماذج Sarashina3 ومحادثة عبر الويب.",
          "en": "Free beta: API access to six Sarashina3 models and web chat."
        }
      }
    ],
    "eligibility": {
      "new_account": "unknown",
      "card_required": "unknown",
      "countries": {
        "status": "unknown",
        "values": []
      },
      "applicant_type": "unknown",
      "phone_required": "unknown",
      "student_status": "unknown",
      "conditions": {
        "ar": "تسجيل بحساب Google بلا طلب مسبق؛ توجد حدود لمعدل الطلبات دون أرقام منشورة. البيتا مجانية ولا يوجد تاريخ انتهاء محدد حتى الآن؛ البطاقة والعراق غير مذكورين.",
        "en": "Google login without an advance application; rate limits apply but numeric limits are unpublished. The beta is free and has no end date determined so far; card policy and Iraq are not stated."
      }
    },
    "pricing": {
      "currency": "USD",
      "offer_price": 0,
      "billing_cycle": "promo",
      "original_price": null
    },
    "registration": {
      "deadline": {
        "date": null,
        "status": "ongoing"
      },
      "credit_validity": {
        "unit": null,
        "status": "unknown",
        "duration": null
      },
      "steps": {
        "ar": "افتح خدمة Sarashina وسجّل الدخول بحساب Google؛ راجع إشعار البيتا والحدود الحالية.",
        "en": "Open Sarashina Service and sign in with Google; review the current beta notice and usage limits."
      }
    },
    "official_sources": [
      {
        "url": "https://sbintuitions.co.jp/en/news/press/20261013_01",
        "title": "SB Intuitions — official press release",
        "claims": [
          {
            "field": "benefits.0.description.en",
            "value": "Free beta API for six Sarashina3 models plus web chat",
            "evidence": "Official press release dated 2026-10-13: Pricing Free; six API models; Google login without advance application; rate limits apply; beta end date not yet determined; strong Japanese-language capabilities."
          }
        ]
      }
    ],
    "get_offer": {
      "url": "https://sbintuitions.co.jp/en/news/press/20261013_01",
      "type": "official",
      "label": {
        "ar": "المصدر الرسمي للعرض",
        "en": "Official offer source"
      }
    },
    "review": {
      "verdict": "verified",
      "verification_status": "supported",
      "reviewed_at": "2026-11-07",
      "reviewed_on": "2026-11-07",
      "verified_on": "2026-11-07",
      "offer_status": "active",
      "unknown_fields": [
        "Iraq_availability",
        "eligibility.card_required",
        "registration.credit_validity",
        "other_signup_restrictions"
      ],
      "notes": {
        "ar": "البيان الصحفي يؤكد البيتا المجانية وستة نماذج ومحادثة الويب وتسجيل Google دون طلب؛ أرقام حدود الطلبات وسياسة البطاقة والعراق غير مذكورة.",
        "en": "The press release confirms the free beta, six models, web chat, and Google login without an application; numeric rate limits, card policy, and Iraq are not stated."
      }
    },
    "status": "active",
    "ends_at": null
  },
  {
    "id": "steel-30-credit",
    "slug": "steel-30-credit",
    "name_ar": "Steel Launch — رصيد استخدام $30 لمرة واحدة (بلا بطاقة)",
    "name_en": "Steel Launch — $30 One-Time Usage Credit (No Card)",
    "description_ar": "خطة Launch من Steel بسعر $0 شهريًا إضافة إلى الاستخدام، وتشمل رصيد استخدام مجانيًا بقيمة $30 لمرة واحدة. الصفحة تذكر 10 جلسات متصفح متزامنة وجلسات حتى 15 دقيقة، وتقول صراحةً إن بطاقة ائتمان غير مطلوبة. لا تذكر تاريخ انتهاء الرصيد أو أهلية العراق.",
    "description_en": "Steel’s Launch plan is $0/month plus usage and includes $30 in free usage credits one time. The page lists 10 concurrent browser sessions and sessions up to 15 minutes, and explicitly says no credit card is needed. Credit expiry and Iraq eligibility are not stated.",
    "category": {
      "value": "cloud",
      "review_status": "verified"
    },
    "benefits": [
      {
        "type": "free_quota",
        "amount": {
          "unit": "USD",
          "value": 30,
          "currency": "USD"
        },
        "description": {
          "ar": "$30 رصيد استخدام لمرة واحدة على خطة Launch.",
          "en": "$30 in one-time usage credits on Launch."
        }
      }
    ],
    "eligibility": {
      "new_account": "unknown",
      "card_required": "not_required",
      "countries": {
        "status": "unknown",
        "values": []
      },
      "applicant_type": "unknown",
      "phone_required": "unknown",
      "student_status": "unknown",
      "conditions": {
        "ar": "صفحة التسعير تقول إن البطاقة غير مطلوبة. الرصيد لمرة واحدة؛ انتهاء الرصيد وأهلية العراق غير مذكورين.",
        "en": "The pricing page says no card is needed. The credit is one-time; credit expiry and Iraq eligibility are not stated."
      }
    },
    "pricing": {
      "currency": "USD",
      "offer_price": 0,
      "billing_cycle": "free",
      "original_price": null
    },
    "registration": {
      "deadline": {
        "date": null,
        "status": "ongoing"
      },
      "credit_validity": {
        "unit": null,
        "status": "unknown",
        "duration": null
      },
      "steps": {
        "ar": "راجع صفحة تسعير Steel وابدأ بخطة Launch؛ تحقق من رسوم الاستخدام بعد رصيد $30.",
        "en": "Review Steel’s pricing page and start with Launch; check usage charges after the $30 credit."
      }
    },
    "official_sources": [
      {
        "url": "https://steel.dev/pricing",
        "title": "Steel — official pricing",
        "claims": [
          {
            "field": "benefits.0.amount.value",
            "value": 30,
            "evidence": "Official Launch pricing: $0/month + usage, “$30 of credits” and “Included usage: $30 of credits, one time”; “No credit card needed.”"
          }
        ]
      }
    ],
    "get_offer": {
      "url": "https://steel.dev/pricing",
      "type": "official",
      "label": {
        "ar": "المصدر الرسمي للعرض",
        "en": "Official offer source"
      }
    },
    "review": {
      "verdict": "verified",
      "verification_status": "supported",
      "reviewed_at": "2026-11-07",
      "reviewed_on": "2026-11-07",
      "verified_on": "2026-11-07",
      "offer_status": "active",
      "unknown_fields": [
        "Iraq_availability",
        "credit expiration"
      ],
      "notes": {
        "ar": "تؤكد صفحة التسعير $30 لمرة واحدة و«No credit card needed»، لذا عُدلت سياسة البطاقة إلى غير مطلوبة. انتهاء الرصيد وأهلية العراق غير مذكورين.",
        "en": "Pricing confirms $30 once and “No credit card needed”, so card status was corrected to not required. Credit expiry and Iraq are not stated."
      }
    },
    "status": "active",
    "ends_at": null
  },
  {
    "id": "runloop-50-credit",
    "slug": "runloop-50-credit",
    "name_ar": "Runloop Pro Trial — رصيد استخدام $50 (بلا بطاقة)",
    "name_en": "Runloop Pro Trial — $50 Usage Credit (No Card)",
    "description_ar": "تجربة Pro المجانية من Runloop تمنح الحسابات الجديدة $50 رصيد استخدام مع وصول لميزات Pro، ولا تتطلب بطاقة ائتمان. حدود التجربة: 3 Devboxes قيد التشغيل و5 blueprints و10 snapshots و3 objects. عند بلوغ حد الاستخدام لا توجد رسوم تلقائية؛ يختار المستخدم Basic المجانية مع فوترة الاستخدام أو خطة مدفوعة. مدة التجربة وصلاحية الرصيد وأهلية العراق غير مذكورة.",
    "description_en": "Runloop’s free Pro trial gives new accounts $50 in usage credit and Pro feature access, with no credit card required. Trial limits are 3 running Devboxes, 5 blueprints, 10 snapshots, and 3 objects. Reaching the usage limit does not trigger an automatic charge; users choose Basic (free subscription with usage billed) or a paid plan. Trial duration, credit expiry, and Iraq eligibility are not stated.",
    "category": {
      "value": "cloud",
      "review_status": "verified"
    },
    "benefits": [
      {
        "type": "free_quota",
        "amount": {
          "unit": "USD",
          "value": 50,
          "currency": "USD"
        },
        "description": {
          "ar": "$50 رصيد استخدام مع تجربة Pro المجانية.",
          "en": "$50 usage credit with the free Pro trial."
        }
      }
    ],
    "eligibility": {
      "new_account": "required",
      "card_required": "not_required",
      "countries": {
        "status": "unknown",
        "values": []
      },
      "applicant_type": "unknown",
      "phone_required": "unknown",
      "student_status": "unknown",
      "conditions": {
        "ar": "لا تتطلب التجربة بطاقة؛ عند بلوغ حد الاستخدام لا توجد رسوم تلقائية ويختار المستخدم خطة متابعة. مدة التجربة وصلاحية الرصيد وأهلية العراق غير مذكورة.",
        "en": "The trial requires no card; reaching the usage limit does not auto-charge and the user chooses a follow-on plan. Trial duration, credit expiry, and Iraq eligibility are not stated."
      }
    },
    "pricing": {
      "currency": "USD",
      "offer_price": 0,
      "billing_cycle": "promo",
      "original_price": null
    },
    "registration": {
      "deadline": {
        "date": null,
        "status": "ongoing"
      },
      "credit_validity": {
        "unit": null,
        "status": "unknown",
        "duration": null
      },
      "steps": {
        "ar": "أنشئ حساب Runloop وراجع حدود تجربة Pro المجانية قبل تشغيل Devboxes.",
        "en": "Create a Runloop account and review the free Pro trial limits before running Devboxes."
      }
    },
    "official_sources": [
      {
        "url": "https://runloop.ai/pricing",
        "title": "Runloop — official pricing",
        "claims": [
          {
            "field": "benefits.0.amount.value",
            "value": 50,
            "evidence": "Official pricing: new accounts start with $50 usage credits and full Pro feature access; “No Credit Card Required”; lists limits 3 running Devboxes, 5 blueprints, 10 snapshots, 3 objects; no automatic charge when trial limit is reached."
          }
        ]
      }
    ],
    "get_offer": {
      "url": "https://runloop.ai/pricing",
      "type": "official",
      "label": {
        "ar": "المصدر الرسمي للعرض",
        "en": "Official offer source"
      }
    },
    "review": {
      "verdict": "verified",
      "verification_status": "supported",
      "reviewed_at": "2026-11-07",
      "reviewed_on": "2026-11-07",
      "verified_on": "2026-11-07",
      "offer_status": "active",
      "unknown_fields": [
        "Iraq_availability",
        "registration.credit_validity",
        "credit expiration"
      ],
      "notes": {
        "ar": "تؤكد صفحة التسعير $50 وبلا بطاقة وحدود التجربة؛ عند بلوغ حد الاستخدام يختار المستخدم الخطة ولا تُفرض رسوم تلقائيًا. مدة التجربة وصلاحية الرصيد والعراق غير مذكورة.",
        "en": "Pricing confirms $50, no card, and trial limits; when the usage limit is reached the user chooses a plan and is not auto-charged. Trial duration, credit expiry, and Iraq are not stated."
      }
    },
    "status": "active",
    "ends_at": null
  }
]
$reviewed_batch$) AS candidate(
  id text, slug text, name_ar text, name_en text, description_ar text,
  description_en text, category jsonb, benefits jsonb, eligibility jsonb,
  pricing jsonb, registration jsonb, official_sources jsonb, get_offer jsonb,
  review jsonb, status text, ends_at timestamptz
)
LIMIT 11
ON CONFLICT (id) DO NOTHING;
COMMIT;
