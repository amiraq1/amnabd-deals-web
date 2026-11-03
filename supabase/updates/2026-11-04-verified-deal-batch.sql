-- Owner-authorized insert-only batch; primary-source checks completed 2026-11-04.
-- Applied to production 2026-11-04; post-insert SELECT verified all 13 new rows.
-- Pre-change export: /workspace/amnabd-backups/amnabd-catches-2026-11-04-before.json (zero matching rows).
-- 13 new records only; no UPDATE or DELETE. Existing ID/slug collisions are skipped.
-- Preflight query returned zero rows before insertion; post-insert SELECT returned 13/13 active, verified rows.
-- Excluded from new deal records: Google Vids (claimed bundle unsupported); Fireworks (free access/payment-method quota conflict).
-- AnyAPI and BazaarLink are omitted as duplicate products already represented in the free-API directory.

SELECT id, slug
FROM public.deals
WHERE id IN ('context-dev-1000-api', 'runway-free-125-credits', 'cartesia-free-tts-stt', 'tavily-student-4-months', 'speechmatics-signup-bonus', 'aiven-free-tier-managed-db', 'layerbase-free-db', 'apple-pcc-free-foundation-models', 'inferall-open-models-free', 'geekflare-api-500-credits', 'hetzner-experiments-inference-api', 'orcarouter-free-models', 'requesty-free-200-day') OR slug IN ('context-dev-1000-api', 'runway-free-125-credits', 'cartesia-free-tts-stt', 'tavily-student-4-months', 'speechmatics-signup-bonus', 'aiven-free-tier-managed-db', 'layerbase-free-db', 'apple-pcc-free-foundation-models', 'inferall-open-models-free', 'geekflare-api-500-credits', 'hetzner-experiments-inference-api', 'orcarouter-free-models', 'requesty-free-200-day')
ORDER BY id
LIMIT 100;

BEGIN;
INSERT INTO public.deals
  (id, slug, name_ar, name_en, description_ar, description_en, category, benefits, eligibility, pricing, registration, official_sources, get_offer, review, status, ends_at, created_at)
SELECT candidate.id, candidate.slug, candidate.name_ar, candidate.name_en, candidate.description_ar, candidate.description_en, candidate.category, candidate.benefits, candidate.eligibility, candidate.pricing, candidate.registration, candidate.official_sources, candidate.get_offer, candidate.review, candidate.status, candidate.ends_at, now()
FROM jsonb_to_recordset($reviewed_batch$
[
  {
    "id": "context-dev-1000-api",
    "slug": "context-dev-1000-api",
    "name_ar": "Context.dev — 1,000 رصيد API شهريًا مجانًا (بلا بطاقة)",
    "name_en": "Context.dev — 1,000 Free API Credits/Month (No Card)",
    "description_ar": "واجهة استخراج صفحات الويب لوكلاء الذكاء الاصطناعي: 1,000 رصيد API شهريًا + 10,000 طلب Logo Link لمرة واحدة، بلا بطاقة. معظم الطلبات الفاشلة لا تُحتسب، لكن ردود 404 وبعض حالات الاستخراج الجزئي قد تُحتسب؛ حصة Logo Link منفصلة ولا تستهلك أرصدة API. أهلية العراق غير مذكورة رسميًا.",
    "description_en": "Web-scraping API for AI agents: 1,000 API credits per month plus 10,000 one-time Logo Link requests, with no credit card required. Most failed requests are not billed, but 404 responses and some partial-success scrape cases can be billed; Logo Link is a separate quota and does not consume API credits. Iraq eligibility is not stated officially.",
    "category": {
      "value": "api",
      "review_status": "verified"
    },
    "benefits": [
      {
        "type": "free_quota",
        "amount": {
          "unit": "credits",
          "value": 1000,
          "currency": null
        },
        "description": {
          "ar": "1,000 رصيد API شهريًا + 10,000 طلب Logo Link لمرة واحدة، بلا بطاقة؛ حصة Logo Link منفصلة.",
          "en": "1,000 API credits/month + 10,000 one-time Logo Link requests, no card; Logo Link quota is separate."
        },
        "frequency": "monthly"
      }
    ],
    "eligibility": {
      "new_account": "unknown",
      "card_required": "no",
      "countries": {
        "status": "unknown",
        "values": []
      },
      "conditions": {
        "ar": "معظم الإخفاقات لا تُحتسب؛ 404 وبعض حالات نجاح جزئي قد تُحتسب. لا تستهلك طلبات Logo Link أرصدة API. أهلية العراق غير مذكورة.",
        "en": "Most failures are not billed; 404 responses and some partial-success cases may be billed. Logo Link requests do not consume API credits. Iraq eligibility is not stated."
      },
      "applicant_type": "unknown",
      "phone_required": "unknown",
      "student_status": "unknown"
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
      "steps": {
        "ar": "سجل في context.dev وأنشئ مفتاح API.",
        "en": "Sign up at context.dev and create an API key."
      }
    },
    "official_sources": [
      {
        "url": "https://www.context.dev/pricing",
        "title": "Context.dev official pricing",
        "claims": [
          {
            "field": "description_en",
            "value": "1,000 free API credits/month",
            "evidence": "1,000 free API credits/month; 10K one-time Logo Link quota; no card; most failures not billed, but 404 and some partial-success cases may be billed; Logo Link is separate from API credits Verified 2026-11-04."
          }
        ]
      }
    ],
    "get_offer": {
      "url": "https://www.context.dev/pricing",
      "type": "official",
      "label": {
        "ar": "صفحة تسعير Context.dev الرسمية",
        "en": "Official Context.dev pricing page"
      }
    },
    "review": {
      "verdict": "verified",
      "verification_status": "supported",
      "reviewed_on": "2026-11-04",
      "verified_on": "2026-11-04",
      "reviewed_at": "2026-11-04",
      "offer_status": "active",
      "unknown_fields": [
        "Iraq eligibility",
        "applicant type",
        "open-to-all eligibility",
        "phone requirement",
        "new-account requirement",
        "student eligibility"
      ],
      "notes": {
        "ar": "تم تصحيح عبارة عدم احتساب كل الطلبات الفاشلة؛ المصدر يستثني 404 وبعض حالات النجاح الجزئي.",
        "en": "Corrected the overbroad statement that all failed requests are unbilled; the official source identifies 404 and some partial-success cases that may be billed."
      }
    },
    "status": "active",
    "ends_at": null
  },
  {
    "id": "runway-free-125-credits",
    "slug": "runway-free-125-credits",
    "name_ar": "Runway Free — 125 رصيد مجاني لمرة واحدة (لا تنتهي)",
    "name_en": "Runway Free — 125 One-Time Free Credits (No Expiry)",
    "description_ar": "الخطة الفردية المجانية من Runway: 125 رصيدًا لمرة واحدة لا تنتهي + 5GB لتخزين الأصول، بسعر $0 شهريًا. سياسة البطاقة وأهلية العراق غير مذكورتين رسميًا. تتطلب الخدمة الامتثال لشروط العمر والقانون والتصدير؛ لا تُشترى أرصدة إضافية على الخطة المجانية.",
    "description_en": "Runway’s individual Free plan is $0/month and includes 125 one-time credits that do not expire plus 5GB asset storage. Card policy and Iraq eligibility are not stated officially. Use remains subject to age, local-law and export-control terms; Free users cannot purchase additional credits.",
    "category": {
      "value": "ai-tools",
      "review_status": "verified"
    },
    "benefits": [
      {
        "type": "free_quota",
        "amount": {
          "unit": "credits",
          "value": 125,
          "currency": null
        },
        "description": {
          "ar": "125 رصيدًا لمرة واحدة لا تنتهي + 5GB تخزين أصول؛ الخطة مجانية.",
          "en": "125 one-time, non-expiring credits plus 5GB asset storage; the plan is free."
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
      "conditions": {
        "ar": "شروط العمر والقانون والتصدير تنطبق؛ مستخدمو الخطة المجانية لا يشترون أرصدة إضافية. لا تتضمن الصفحات الرسمية حكمًا خاصًا بالعراق أو اشتراط بطاقة لبدء الخطة.",
        "en": "Age, local-law and export-control terms apply; Free users cannot buy additional credits. Official pages do not state an Iraq-specific rule or whether a card is required to start Free."
      },
      "applicant_type": "unknown",
      "phone_required": "unknown",
      "student_status": "unknown"
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
      "steps": {
        "ar": "أنشئ حساب Runway مجانيًا وستودَع الأرصدة في حسابك.",
        "en": "Create a free Runway account; the credits are deposited into your account."
      }
    },
    "official_sources": [
      {
        "url": "https://runwayml.com/pricing",
        "title": "Runway official pricing",
        "claims": [
          {
            "field": "description_en",
            "value": "Free plan $0/month",
            "evidence": "Free plan $0/month; 125 one-time credits; 5GB asset storage Verified 2026-11-04."
          }
        ]
      },
      {
        "url": "https://help.runwayml.com/hc/en-us/articles/15124877443219-How-do-credits-work",
        "title": "Runway official credits FAQ",
        "claims": [
          {
            "field": "description_en",
            "value": "125-credit one-time Free-plan deposit does not expire",
            "evidence": "125-credit one-time Free-plan deposit does not expire; free users cannot purchase additional credits Verified 2026-11-04."
          }
        ]
      },
      {
        "url": "https://runwayml.com/terms-of-use",
        "title": "Runway Terms of Use",
        "claims": [
          {
            "field": "description_en",
            "value": "No Iraq-specific eligibility statement",
            "evidence": "No Iraq-specific eligibility statement; users remain subject to applicable local and export-control laws Verified 2026-11-04."
          }
        ]
      }
    ],
    "get_offer": {
      "url": "https://runwayml.com/pricing",
      "type": "official",
      "label": {
        "ar": "صفحة تسعير Runway الرسمية",
        "en": "Official Runway pricing page"
      }
    },
    "review": {
      "verdict": "verified",
      "verification_status": "supported",
      "reviewed_on": "2026-11-04",
      "verified_on": "2026-11-04",
      "reviewed_at": "2026-11-04",
      "offer_status": "active",
      "unknown_fields": [
        "Iraq eligibility",
        "applicant type",
        "open-to-all eligibility",
        "phone requirement",
        "card policy",
        "new-account requirement",
        "student eligibility"
      ],
      "notes": {
        "ar": "تأكيد عدم انتهاء الرصيد و5GB؛ البطاقة والعراق يظلان غير معلومين رسميًا.",
        "en": "Confirmed non-expiring credits and 5GB; card and Iraq eligibility remain officially unknown."
      }
    },
    "status": "active",
    "ends_at": null
  },
  {
    "id": "cartesia-free-tts-stt",
    "slug": "cartesia-free-tts-stt",
    "name_ar": "Cartesia Free — صوت مجاني شهريًا: ~27 دقيقة TTS + ~1h51m STT",
    "name_en": "Cartesia Free — Free Monthly Voice: ~27 Min TTS + ~1h51m STT",
    "description_ar": "خطة Cartesia المجانية: 20,000 رصيد شهريًا لنماذج الكلام، أي نحو 27 دقيقة Sonic-3.6 TTS ونحو ساعة و51 دقيقة Ink-2 STT، إضافة إلى $1 شهريًا كدولارات مسبقة الدفع لوكيل الصوت (نحو 33 دقيقة بسعر الدقيقة القياسي؛ لا تشمل الاتصالات الهاتفية أو LLM). سياسة البطاقة وأهلية العراق غير مذكورتين رسميًا.",
    "description_en": "Cartesia’s Free plan includes 20,000 monthly speech-model credits, shown as about 27 minutes of Sonic-3.6 TTS and 1 hour 51 minutes of Ink-2 STT, plus $1/month in prepaid voice-agent dollars (about 33 minutes at the standard per-minute rate; excludes telephony and LLM usage). Card policy and Iraq eligibility are not stated officially.",
    "category": {
      "value": "ai-tools",
      "review_status": "verified"
    },
    "benefits": [
      {
        "type": "free_quota",
        "amount": {
          "unit": "credits",
          "value": 20000,
          "currency": null
        },
        "description": {
          "ar": "20,000 رصيد كلام شهريًا (~27 دقيقة TTS و~1h51m STT) + $1 مسبق الدفع لوكيل الصوت، دون الاتصالات الهاتفية أو LLM.",
          "en": "20K monthly speech credits (~27 min TTS and ~1h51m STT) plus $1 prepaid voice-agent balance, excluding telephony and LLM."
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
      "conditions": {
        "ar": "الأرقام تقديرية حسب الاستهلاك؛ رصيد الوكيل مسبق الدفع لا يشمل telephony أو LLM. سياسة البطاقة وأهلية العراق غير مذكورتين.",
        "en": "Minute equivalents are estimates based on usage; agent dollars exclude telephony and LLM. Card policy and Iraq eligibility are not stated."
      },
      "applicant_type": "unknown",
      "phone_required": "unknown",
      "student_status": "unknown"
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
      "steps": {
        "ar": "أنشئ حساب Cartesia مجانيًا وابدأ بالخطة المجانية.",
        "en": "Create a free Cartesia account and start with the free plan."
      }
    },
    "official_sources": [
      {
        "url": "https://cartesia.ai/pricing",
        "title": "Cartesia official pricing",
        "claims": [
          {
            "field": "description_en",
            "value": "Free plan: 20K monthly speech credits",
            "evidence": "Free plan: 20K monthly speech credits; ~27 min Sonic TTS and ~1h51m Ink STT; $1 prepaid agent dollars/month Verified 2026-11-04."
          }
        ]
      },
      {
        "url": "https://docs.cartesia.ai",
        "title": "Cartesia official docs",
        "claims": [
          {
            "field": "description_en",
            "value": "$1 agent balance is about 33 minutes at the standard rate and excludes telephony and LLM usage",
            "evidence": "$1 agent balance is about 33 minutes at the standard rate and excludes telephony and LLM usage Verified 2026-11-04."
          }
        ]
      }
    ],
    "get_offer": {
      "url": "https://cartesia.ai/pricing",
      "type": "official",
      "label": {
        "ar": "صفحة تسعير Cartesia الرسمية",
        "en": "Official Cartesia pricing page"
      }
    },
    "review": {
      "verdict": "verified",
      "verification_status": "supported",
      "reviewed_on": "2026-11-04",
      "verified_on": "2026-11-04",
      "reviewed_at": "2026-11-04",
      "offer_status": "active",
      "unknown_fields": [
        "Iraq eligibility",
        "applicant type",
        "open-to-all eligibility",
        "phone requirement",
        "card policy",
        "new-account requirement",
        "student eligibility"
      ],
      "notes": {
        "ar": "أضيف حد 20,000 رصيد شهريًا ووُصف $1 بأنه رصيد دولارات مسبق الدفع مع استثناء الاتصالات وLLM.",
        "en": "Added the 20,000 monthly credit allocation and clarified the $1 as prepaid agent dollars excluding telephony and LLM."
      }
    },
    "status": "active",
    "ends_at": null
  },
  {
    "id": "tavily-student-4-months",
    "slug": "tavily-student-4-months",
    "name_ar": "Tavily — حساب طلابي: 4 أشهر مجانية من خطة Project (4,000 رصيد API شهريًا)",
    "name_en": "Tavily — Student Account: 4 Months Free of the Project Plan (4,000 API Credits/Month)",
    "description_ar": "مسار Tavily للطلاب يمنح أربعة أشهر من خطة Project (سعرها المدرج $30 شهريًا) مع 4,000 رصيد API شهريًا. التحقق عبر بريد جامعي رسمي أو بطاقة طالب ثم استرداد كوبون من صفحة الفوترة. سياسة البطاقة الخاصة بعرض الطالب وأهلية العراق غير مذكورتين؛ عبارة عدم الحاجة إلى بطاقة تخص الخطة المجانية العامة Researcher ولا تُعمّم على عرض Project. المقالة الطلابية قديمة، لكن صفحة التسعير الحالية ما زالت تربط بها.",
    "description_en": "Tavily’s student track offers four months of the Project plan (listed at $30/month) with 4,000 API credits/month. Verify using an official student email or student ID, then redeem a coupon from Billing. Card policy for the student Project offer and Iraq eligibility are not stated; the no-card wording applies to the general free Researcher plan and is not extended to this offer. The student article is old, though the current pricing page still links to it.",
    "category": {
      "value": "api",
      "review_status": "verified"
    },
    "benefits": [
      {
        "type": "free_quota",
        "amount": {
          "unit": "credits",
          "value": 4000,
          "currency": null
        },
        "description": {
          "ar": "أربعة أشهر من Project (مدرجة بـ$30/شهر): 4,000 رصيد API شهريًا للطلاب المؤهلين.",
          "en": "Four months of Project (listed at $30/month): 4,000 API credits/month for verified students."
        },
        "frequency": "monthly"
      }
    ],
    "eligibility": {
      "new_account": "unknown",
      "student_status": "yes",
      "card_required": "unknown",
      "countries": {
        "status": "unknown",
        "values": []
      },
      "conditions": {
        "ar": "تحقق ببريد جامعي رسمي أو بطاقة طالب ثم استرداد الكوبون في Project. عدم الحاجة إلى بطاقة موثق للخطة العامة Researcher فقط، وليس لعرض الطالب. أهلية العراق غير مذكورة.",
        "en": "Verify with an official student email or student ID and redeem the coupon under Project. No-card terms are stated for the general Researcher plan only, not for the student offer. Iraq eligibility is not stated."
      },
      "applicant_type": "unknown",
      "phone_required": "unknown"
    },
    "pricing": {
      "currency": "USD",
      "offer_price": 0,
      "billing_cycle": "free",
      "original_price": 30
    },
    "registration": {
      "deadline": {
        "date": null,
        "status": "ongoing"
      },
      "steps": {
        "ar": "أرسل بريدك الجامعي الرسمي أو نسخة بطاقة الطالب إلى support@tavily.com ثم أدخل الكوبون في صفحة الفوترة تحت خطة Project.",
        "en": "Send your official student email or a copy of your student ID to support@tavily.com, then enter the coupon on the Billing page under the Project plan."
      }
    },
    "official_sources": [
      {
        "url": "https://help.tavily.com/articles/6606514713-student-account",
        "title": "Tavily official Student Account article",
        "claims": [
          {
            "field": "description_en",
            "value": "Four months of Project access with 4,000 monthly credits",
            "evidence": "Four months of Project access with 4,000 monthly credits; student email or ID verification; coupon redemption Verified 2026-11-04."
          }
        ]
      },
      {
        "url": "https://www.tavily.com/pricing",
        "title": "Tavily official pricing",
        "claims": [
          {
            "field": "description_en",
            "value": "Current pricing page lists Project at $30/month and links to the student offer",
            "evidence": "Current pricing page lists Project at $30/month and links to the student offer Verified 2026-11-04."
          }
        ]
      },
      {
        "url": "https://help.tavily.com/articles/8816424538-pricing",
        "title": "Tavily official pricing help",
        "claims": [
          {
            "field": "description_en",
            "value": "No-card statement applies to the general free Researcher plan, not expressly to the student Project coupon",
            "evidence": "No-card statement applies to the general free Researcher plan, not expressly to the student Project coupon Verified 2026-11-04."
          }
        ]
      }
    ],
    "get_offer": {
      "url": "https://help.tavily.com/articles/6606514713-student-account",
      "type": "official",
      "label": {
        "ar": "مقالة حساب الطالب الرسمية في مركز مساعدة Tavily",
        "en": "Official Student Account article in the Tavily help center"
      }
    },
    "review": {
      "verdict": "verified",
      "verification_status": "supported",
      "reviewed_on": "2026-11-04",
      "verified_on": "2026-11-04",
      "reviewed_at": "2026-11-04",
      "offer_status": "active",
      "unknown_fields": [
        "Iraq eligibility",
        "applicant type",
        "open-to-all eligibility",
        "phone requirement",
        "card policy",
        "new-account requirement"
      ],
      "notes": {
        "ar": "أُبقيت سياسة بطاقة الطالب مجهولة؛ لا يُعمّم شرط الخطة العامة Researcher على عرض Project.",
        "en": "Student-offer card policy remains unknown; the general Researcher no-card statement is not generalized to Project."
      }
    },
    "status": "active",
    "ends_at": null
  },
  {
    "id": "speechmatics-signup-bonus",
    "slug": "speechmatics-signup-bonus",
    "name_ar": "Speechmatics — مكافأة تسجيل (رصيد مجاني) + أول مليون حرف TTS مجاني",
    "name_en": "Speechmatics — Signup Bonus (Free Credit) + First 1M TTS Characters Free",
    "description_ar": "يحصل المسجلون الجدد على منحة رصيد $100 صالحة 12 شهرًا؛ وأول مليون حرف من Text-to-Speech مجاني (نحو 20 ساعة). الخطة المجانية لا تتطلب بطاقة. بعد نفاد الرصيد يتوقف الوصول المجاني إلى API؛ إضافة بطاقة تنقل الحساب إلى Pro وتسمح باستخدام مدفوع. أهلية العراق غير مذكورة رسميًا.",
    "description_en": "New sign-ups receive a $100 credit grant valid for 12 months; the first 1 million Text-to-Speech characters are free (about 20 hours). The Free plan does not require a payment card. When credits run out, free API access pauses; adding a card upgrades the account to Pro and permits billable usage. Iraq eligibility is not stated officially.",
    "category": {
      "value": "ai-tools",
      "review_status": "verified"
    },
    "benefits": [
      {
        "type": "free_quota",
        "amount": {
          "unit": "characters",
          "value": 1000000,
          "currency": null
        },
        "description": {
          "ar": "منحة $100 للمسجلين الجدد صالحة 12 شهرًا + أول مليون حرف TTS مجاني (~20 ساعة)، بلا بطاقة للخطة المجانية.",
          "en": "$100 grant for new sign-ups, valid 12 months, plus first 1M TTS characters free (~20 hours); no card for Free."
        }
      }
    ],
    "eligibility": {
      "new_account": "yes",
      "card_required": "no",
      "countries": {
        "status": "unknown",
        "values": []
      },
      "conditions": {
        "ar": "منحة التسجيل للمسجلين الجدد وصلاحيتها 12 شهرًا. يتوقف API المجاني عند نفاد الرصيد؛ إضافة بطاقة تنقل الحساب إلى Pro وقد تتيح رسومًا. العراق غير مؤكد.",
        "en": "Signup grant is for new users and lasts 12 months. Free API pauses when credits run out; adding a card upgrades to Pro and may enable charges. Iraq is unconfirmed."
      },
      "applicant_type": "unknown",
      "phone_required": "unknown",
      "student_status": "unknown"
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
      "steps": {
        "ar": "سجل في speechmatics.com واحصل على مكافأة التسجيل.",
        "en": "Sign up at speechmatics.com to get the signup bonus."
      }
    },
    "official_sources": [
      {
        "url": "https://www.speechmatics.com/pricing",
        "title": "Speechmatics official pricing",
        "claims": [
          {
            "field": "description_en",
            "value": "$100 signup credit",
            "evidence": "$100 signup credit; first 1M TTS characters free, about 20 hours; signup bonus lasts 12 months Verified 2026-11-04."
          }
        ]
      },
      {
        "url": "https://docs.speechmatics.com/administration/plans",
        "title": "Speechmatics official plans docs",
        "claims": [
          {
            "field": "description_en",
            "value": "Free plan is no cost and does not require a payment card",
            "evidence": "Free plan is no cost and does not require a payment card Verified 2026-11-04."
          }
        ]
      },
      {
        "url": "https://docs.speechmatics.com/administration/billing",
        "title": "Speechmatics official billing docs",
        "claims": [
          {
            "field": "description_en",
            "value": "Free API pauses after grant exhaustion without a payment card",
            "evidence": "Free API pauses after grant exhaustion without a payment card; adding payment allows paid usage Verified 2026-11-04."
          }
        ]
      }
    ],
    "get_offer": {
      "url": "https://www.speechmatics.com/pricing",
      "type": "official",
      "label": {
        "ar": "صفحة تسعير Speechmatics الرسمية",
        "en": "Official Speechmatics pricing page"
      }
    },
    "review": {
      "verdict": "verified",
      "verification_status": "supported",
      "reviewed_on": "2026-11-04",
      "verified_on": "2026-11-04",
      "reviewed_at": "2026-11-04",
      "offer_status": "active",
      "unknown_fields": [
        "Iraq eligibility",
        "applicant type",
        "open-to-all eligibility",
        "phone requirement",
        "student eligibility"
      ],
      "notes": {
        "ar": "تأكيد قيمة المنحة $100 وعدم الحاجة إلى بطاقة في الخطة المجانية، مع حد الوصول بعد نفاد الرصيد.",
        "en": "Confirmed the $100 grant and no-card Free plan, with the access limit after credits run out."
      }
    },
    "status": "active",
    "ends_at": null
  },
  {
    "id": "aiven-free-tier-managed-db",
    "slug": "aiven-free-tier-managed-db",
    "name_ar": "Aiven — طبقة مجانية دائمة لقواعد البيانات المدارة (بلا بطاقة)",
    "name_en": "Aiven — Free Forever Tier for Managed Databases (No Card)",
    "description_ar": "طبقة Aiven المجانية دائمة، بلا بطاقة أو تفاصيل دفع ولا خصم تلقائي. تشمل خدمة مجانية واحدة لكل نوع حسب التوثيق: PostgreSQL وKafka وOpenSearch وValkey وMySQL. الموارد محدودة وقد تُطفأ الخدمات لقلة الاستخدام؛ ليست للإنتاج ولا تتضمن SLA الإنتاجية.",
    "description_en": "Aiven’s free tier is indefinite, requires no card or payment details, and does not charge automatically. Official docs list one free service per type, including PostgreSQL, Kafka, OpenSearch, Valkey, and MySQL. Resources are capped and services may be powered off for inactivity; this tier is not aimed at production and has no production SLA.",
    "category": {
      "value": "other",
      "review_status": "verified"
    },
    "benefits": [
      {
        "type": "free_access",
        "description": {
          "ar": "خدمة مجانية واحدة لكل نوع من الأنواع المدعومة، بلا بطاقة أو خصم تلقائي.",
          "en": "One free service per supported type, with no card or automatic charge."
        }
      }
    ],
    "eligibility": {
      "new_account": "unknown",
      "card_required": "no",
      "countries": {
        "status": "unknown",
        "values": []
      },
      "conditions": {
        "ar": "موارد ثابتة ومحدودة؛ قد تُطفأ الخدمة عند الخمول أو عند عدم الاستخدام الأولي؛ غير مخصصة للإنتاج ولا يوجد SLA للإنتاج. تشمل أنواع الخدمة المجانية MySQL حسب التوثيق.",
        "en": "Fixed, capped resources; services may be powered off for inactivity or lack of initial use; not for production and no production SLA. Official service-pricing docs also list MySQL as a free type."
      },
      "applicant_type": "unknown",
      "phone_required": "unknown",
      "student_status": "unknown"
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
      "steps": {
        "ar": "أنشئ حساب Aiven وفعّل الخدمة المجانية للنوع الذي تريد.",
        "en": "Create an Aiven account and activate the free service of the type you need."
      }
    },
    "official_sources": [
      {
        "url": "https://aiven.io/free-tier",
        "title": "Aiven official free tier",
        "claims": [
          {
            "field": "description_en",
            "value": "Free forever",
            "evidence": "Free forever; no credit card/payment details; no automatic charge; PostgreSQL, Kafka, OpenSearch and Valkey Verified 2026-11-04."
          }
        ]
      },
      {
        "url": "https://aiven.io/docs/platform/concepts/service-pricing",
        "title": "Aiven official service pricing docs",
        "claims": [
          {
            "field": "description_en",
            "value": "Free service types include MySQL and one service per type",
            "evidence": "Free service types include MySQL and one service per type; inactivity power-off and capped free resources Verified 2026-11-04."
          }
        ]
      },
      {
        "url": "https://aiven.io/docs/products/postgresql/concepts/pg-free-tier",
        "title": "Aiven official PostgreSQL docs",
        "claims": [
          {
            "field": "description_en",
            "value": "Free PostgreSQL resource limits and inactivity/power-off conditions",
            "evidence": "Free PostgreSQL resource limits and inactivity/power-off conditions Verified 2026-11-04."
          }
        ]
      }
    ],
    "get_offer": {
      "url": "https://aiven.io/free-tier",
      "type": "official",
      "label": {
        "ar": "صفحة الطبقة المجانية الرسمية في Aiven",
        "en": "Official Aiven free-tier page"
      }
    },
    "review": {
      "verdict": "verified",
      "verification_status": "supported",
      "reviewed_on": "2026-11-04",
      "verified_on": "2026-11-04",
      "reviewed_at": "2026-11-04",
      "offer_status": "active",
      "unknown_fields": [
        "Iraq eligibility",
        "applicant type",
        "open-to-all eligibility",
        "phone requirement",
        "new-account requirement",
        "student eligibility"
      ],
      "notes": {
        "ar": "أُضيف MySQL حسب التوثيق وأُبرز الإيقاف بسبب الخمول وحدود الإنتاج.",
        "en": "Added MySQL per official docs and highlighted inactivity shutdown and production limitations."
      }
    },
    "status": "active",
    "ends_at": null
  },
  {
    "id": "layerbase-free-db",
    "slug": "layerbase-free-db",
    "name_ar": "Layerbase — طبقة مجانية دائمة: قاعدتان + 5GB بلا بطاقة",
    "name_en": "Layerbase — Free Forever Tier: 2 Databases + 5GB, No Card",
    "description_ar": "خطة Layerbase المجانية بسعر $0: قاعدتان، 5GB، 8 محركات Standard، 20 اتصالًا متزامنًا، وبلا بطاقة. تنام القاعدة بعد 15 دقيقة خمول؛ قد تُؤرشف بعد 14 يومًا من السكون (7 أيام إن لم تُستخدم) وتُزال بعد 90 يومًا في الأرشيف مع إشعارات واحتفاظ بأحدث نسخة احتياطية. الاستضافة المشتركة في US East. ليست للإنتاج؛ شروط الخطة التجريبية الحالية للفترة يونيو 2026–يوليو 2027 وقد تتغير.",
    "description_en": "Layerbase Free costs $0 and includes two databases, 5GB, eight Standard engines, 20 concurrent connections, and no credit card. Databases sleep after 15 minutes idle; they may be archived after 14 days hibernated (7 days if never used) and removed after 90 archived days, with warnings and the latest backup retained. Shared hosting is in US East. Not for production; current beta terms run June 2026–July 2027 and features may change.",
    "category": {
      "value": "other",
      "review_status": "verified"
    },
    "benefits": [
      {
        "type": "free_access",
        "description": {
          "ar": "قاعدتان + 5GB + 8 محركات + 20 اتصالًا متزامنًا، بلا بطاقة؛ مع أرشفة/احتفاظ محدد للخمول.",
          "en": "Two databases + 5GB + 8 engines + 20 concurrent connections, no card; idle archival/retention limits apply."
        }
      }
    ],
    "eligibility": {
      "new_account": "unknown",
      "card_required": "no",
      "countries": {
        "status": "unknown",
        "values": []
      },
      "conditions": {
        "ar": "للتطوير والاختبار والتقييم والمشاريع المبكرة، لا للإنتاج؛ US East فقط على الخطط المشتركة. نوم بعد 15 دقيقة؛ أرشفة بعد 14 يومًا (7 إن لم تُستخدم) وحذف بعد 90 يوم أرشفة؛ شروط Beta حتى يوليو 2027 وقد تتغير.",
        "en": "For development, testing, evaluation and early projects, not production; US East only on shared plans. Sleeps after 15 minutes; archives after 14 idle days (7 if never used) and is removed after 90 archived days; beta terms through July 2027 may change."
      },
      "applicant_type": "unknown",
      "phone_required": "unknown",
      "student_status": "unknown"
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
      "steps": {
        "ar": "أنشئ حساب Layerbase وأنشئ قاعدة البيانات المجانية.",
        "en": "Create a Layerbase account and create the free database."
      }
    },
    "official_sources": [
      {
        "url": "https://layerbase.com/pricing",
        "title": "Layerbase official pricing",
        "claims": [
          {
            "field": "description_en",
            "value": "Free $0/month",
            "evidence": "Free $0/month; two databases, 5GB, eight Standard engines, 20 concurrent connections; no card; sleep/archive/delete/region and beta terms Verified 2026-11-04."
          }
        ]
      }
    ],
    "get_offer": {
      "url": "https://layerbase.com/pricing",
      "type": "official",
      "label": {
        "ar": "صفحة تسعير Layerbase الرسمية",
        "en": "Official Layerbase pricing page"
      }
    },
    "review": {
      "verdict": "verified",
      "verification_status": "supported",
      "reviewed_on": "2026-11-04",
      "verified_on": "2026-11-04",
      "reviewed_at": "2026-11-04",
      "offer_status": "active",
      "unknown_fields": [
        "Iraq eligibility",
        "applicant type",
        "open-to-all eligibility",
        "phone requirement",
        "new-account requirement",
        "student eligibility"
      ],
      "notes": {
        "ar": "توضيح أن الأرشفة/الإزالة وشروط Beta تمنع وصف البيانات بأنها بلا انتهاء مطلقًا.",
        "en": "Clarified archival/removal and beta terms; no unconditional no-expiry claim."
      }
    },
    "status": "active",
    "ends_at": null
  },
  {
    "id": "apple-pcc-free-foundation-models",
    "slug": "apple-pcc-free-foundation-models",
    "name_ar": "Apple Private Cloud Compute — نماذج AI سحابية مجانية لمطوري iOS المستقلين",
    "name_en": "Apple Private Cloud Compute — Free Cloud AI Models for Indie iOS Developers",
    "description_ar": "استخدام Apple Foundation Models عبر Private Cloud Compute بلا رسم API سحابي للمطورين المؤهلين في App Store Small Business Program ممن لديهم أقل من مليوني تنزيل أولي، بعد تعيين استحقاق PCC. ليس استخدامًا غير محدود: توجد حدود يومية متغيرة. يتطلب عضوية Apple Developer المدفوعة (السعر القياسي $99 سنويًا وقد يختلف إقليميًا؛ توجد إعفاءات مؤهلة) والانضمام للبرنامج؛ يلزم الانتقال إلى بديل خلال 6 أشهر عند تجاوز حد التنزيل أو مغادرة البرنامج. أهلية العراق غير مؤكدة.",
    "description_en": "Apple Foundation Models on Private Cloud Compute have no cloud API fee for eligible App Store Small Business Program developers with fewer than 2 million first-time App Store downloads, once the PCC entitlement is assigned. This is not unlimited use: daily limits vary. It requires paid Apple Developer Program membership (standard $99/year, with regional variation and qualifying fee waivers) and Small Business Program enrollment; developers must migrate within six months after crossing the download threshold or leaving the program. Iraq eligibility is unknown.",
    "category": {
      "value": "other",
      "review_status": "verified"
    },
    "benefits": [
      {
        "type": "free_access",
        "description": {
          "ar": "استدلال Foundation Models عبر PCC بلا رسم API سحابي للمطورين المؤهلين؛ حدود الاستخدام اليومية متغيرة.",
          "en": "Foundation Models inference via PCC with no cloud API fee for eligible developers; daily limits vary."
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
      "conditions": {
        "ar": "عضوية Apple Developer مدفوعة، تسجيل App Store Small Business Program، أقل من مليوني تنزيل أولي، وتعيين استحقاق PCC. عضوية Apple تكلف عادة $99/سنة وقد تختلف إقليميًا؛ قد توجد إعفاءات لبعض الجهات. حدود الاستخدام اليومية متغيرة؛ الانتقال خلال 6 أشهر عند تجاوز العتبة أو مغادرة البرنامج.",
        "en": "Requires paid Apple Developer membership, App Store Small Business Program enrollment, fewer than 2M first-time downloads, and assigned PCC entitlement. Membership is normally $99/year with regional variation and possible qualifying waivers. Daily usage limits vary; migrate within six months after exceeding the threshold or leaving the program."
      },
      "applicant_type": "unknown",
      "phone_required": "unknown",
      "student_status": "unknown"
    },
    "pricing": {
      "currency": "USD",
      "offer_price": 0,
      "billing_cycle": "conditional_free",
      "original_price": null
    },
    "registration": {
      "deadline": {
        "date": null,
        "status": "ongoing"
      },
      "steps": {
        "ar": "سجل في Apple Developer Program ثم في Small Business Program واطلب entitlement من Apple.",
        "en": "Enroll in the Apple Developer Program, then the Small Business Program, and request the entitlement from Apple."
      }
    },
    "official_sources": [
      {
        "url": "https://developer.apple.com/private-cloud-compute/",
        "title": "Apple official PCC offer",
        "claims": [
          {
            "field": "description_en",
            "value": "No cloud API cost for eligible Small Business Program developers under 2M downloads",
            "evidence": "No cloud API cost for eligible Small Business Program developers under 2M downloads; entitlement required; six-month migration Verified 2026-11-04."
          }
        ]
      },
      {
        "url": "https://developer.apple.com/app-store/small-business-program/",
        "title": "Apple official Small Business Program",
        "claims": [
          {
            "field": "description_en",
            "value": "Program enrollment and eligibility conditions",
            "evidence": "Program enrollment and eligibility conditions Verified 2026-11-04."
          }
        ]
      },
      {
        "url": "https://developer.apple.com/programs/",
        "title": "Apple Developer Program",
        "claims": [
          {
            "field": "description_en",
            "value": "Standard $99 annual membership price",
            "evidence": "Standard $99 annual membership price; regional pricing and fee waivers may apply Verified 2026-11-04."
          }
        ]
      },
      {
        "url": "https://support.apple.com/121115",
        "title": "Apple Intelligence availability support",
        "claims": [
          {
            "field": "description_en",
            "value": "Server-side features can have variable daily limits and regional/language availability",
            "evidence": "Server-side features can have variable daily limits and regional/language availability Verified 2026-11-04."
          }
        ]
      }
    ],
    "get_offer": {
      "url": "https://developer.apple.com/private-cloud-compute/",
      "type": "official",
      "label": {
        "ar": "صفحة Apple الرسمية لـPrivate Cloud Compute",
        "en": "Official Apple Private Cloud Compute page"
      }
    },
    "review": {
      "verdict": "verified",
      "verification_status": "supported",
      "reviewed_on": "2026-11-04",
      "verified_on": "2026-11-04",
      "reviewed_at": "2026-11-04",
      "offer_status": "active",
      "unknown_fields": [
        "Iraq eligibility",
        "applicant type",
        "open-to-all eligibility",
        "phone requirement",
        "card policy",
        "new-account requirement",
        "student eligibility"
      ],
      "notes": {
        "ar": "أُضيفت حدود الاستخدام اليومية المتغيرة وشروط البرنامج والسعر القياسي مع الاستثناءات الإقليمية.",
        "en": "Added variable daily limits, program requirements, and standard membership price with regional/waiver caveats."
      }
    },
    "status": "active",
    "ends_at": null
  },
  {
    "id": "inferall-open-models-free",
    "slug": "inferall-open-models-free",
    "name_ar": "InferAll — بوابة API موحدة: نماذج مفتوحة $0 دخل/خرج (25 مكالمة/يوم بلا بطاقة)",
    "name_en": "InferAll — Unified API Gateway: Open Models at $0 In/Out (25 Calls/Day, No Card)",
    "description_ar": "تتيح InferAll أكثر من 10 نماذج مفتوحة على NVIDIA NIM بسعر $0 للمدخلات والمخرجات. تحصل الحسابات الجديدة على 25 مكالمة NIM أولية مجانية، ثم تذكر الصفحة حدًا مجانيًا قدره 25 مكالمة يوميًا للنماذج المفتوحة (إعادة الضبط 00:00 UTC). لا بطاقة للتجربة المجانية. تفعيل اختياري لمرة واحدة بـ$5 يصبح رصيدًا قابلًا للإنفاق ويرفع حد الدردشة إلى 50/يوم؛ المزودون المميزون قد يتطلبون الدفع.",
    "description_en": "InferAll offers 10+ open models on NVIDIA NIM at $0 for input and output. New accounts get 25 initial free NIM calls, after which the page states a free limit of 25 calls/day for open models (reset 00:00 UTC). No card is required for the free trial. Optional one-time $5 activation becomes spendable balance and raises the chat limit to 50/day; premium providers may cost extra.",
    "category": {
      "value": "api",
      "review_status": "verified"
    },
    "benefits": [
      {
        "type": "free_quota",
        "amount": {
          "unit": "requests",
          "value": 25,
          "currency": null
        },
        "description": {
          "ar": "نماذج مفتوحة على NIM بسعر $0: 25 مكالمة أولية للحساب الجديد ثم 25/يوم حسب الصفحة، بلا بطاقة للتجربة.",
          "en": "Open NIM models at $0: 25 initial calls for new accounts then 25/day per the page; no card for the free trial."
        },
        "frequency": "daily"
      }
    ],
    "eligibility": {
      "new_account": "yes",
      "card_required": "no",
      "countries": {
        "status": "unknown",
        "values": []
      },
      "conditions": {
        "ar": "الحدود تختلف حسب نوع الاستدعاء؛ $5 اختيارية لمرة واحدة وتصبح رصيدًا قابلًا للإنفاق، وليست اشتراكًا. الاستخدام مع المزودين المدفوعين قد يكلّف.",
        "en": "Limits vary by request type; optional $5 activation is a one-time spendable balance, not a subscription. Paid providers can incur charges."
      },
      "applicant_type": "unknown",
      "phone_required": "unknown",
      "student_status": "unknown"
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
      "steps": {
        "ar": "أنشئ حساب InferAll واحصل على 25 مكالمة NIM مجانية ثم 25/يوم.",
        "en": "Create an InferAll account and get 25 free NIM calls, then 25/day."
      }
    },
    "official_sources": [
      {
        "url": "https://inferall.ai/pricing",
        "title": "InferAll official pricing",
        "claims": [
          {
            "field": "description_en",
            "value": "10+ NIM open models at $0",
            "evidence": "10+ NIM open models at $0; 25 initial calls then 25/day; no card for free trial Verified 2026-11-04."
          }
        ]
      },
      {
        "url": "https://inferall.ai/pricing",
        "title": "InferAll official pricing FAQ",
        "claims": [
          {
            "field": "description_en",
            "value": "Optional one-time $5 becomes spendable balance and raises chat calls to 50/day",
            "evidence": "Optional one-time $5 becomes spendable balance and raises chat calls to 50/day; not a fee or subscription Verified 2026-11-04."
          }
        ]
      }
    ],
    "get_offer": {
      "url": "https://inferall.ai/pricing",
      "type": "official",
      "label": {
        "ar": "صفحة تسعير InferAll الرسمية",
        "en": "Official InferAll pricing page"
      }
    },
    "review": {
      "verdict": "verified",
      "verification_status": "supported",
      "reviewed_on": "2026-11-04",
      "verified_on": "2026-11-04",
      "reviewed_at": "2026-11-04",
      "offer_status": "active",
      "unknown_fields": [
        "Iraq eligibility",
        "applicant type",
        "open-to-all eligibility",
        "phone requirement",
        "student eligibility"
      ],
      "notes": {
        "ar": "وُضّح أن الرصيد الاختياري $5 قابل للإنفاق وليس رسومًا، وأن حدود الاستدعاءات تختلف حسب النوع.",
        "en": "Clarified that optional $5 is spendable balance, not a fee, and that request caps vary by modality."
      }
    },
    "status": "active",
    "ends_at": null
  },
  {
    "id": "geekflare-api-500-credits",
    "slug": "geekflare-api-500-credits",
    "name_ar": "Geekflare API — 500 رصيد API شهريًا مجانيًا (14 واجهة برصيد واحد)",
    "name_en": "Geekflare API — 500 Free API Credits/Month (14 APIs on One Credit Pool)",
    "description_ar": "خطة Geekflare المجانية: 500 رصيد شهريًا لـ14 واجهة API في رصيد مشترك، بلا بطاقة. تتوقف الطلبات عند بلوغ الحد، لا يُرحّل الرصيد غير المستخدم، والحد المجاني طلب واحد في الثانية. تنص الصفحة على أن الخطة «فعليًا إلى الأبد»، لكن الشروط تسمح بتعديل الخدمة أو سحبها؛ لذلك ليس ضمانًا غير مشروط للاستمرار. أهلية العراق غير مذكورة.",
    "description_en": "Geekflare Free provides 500 monthly credits across 14 APIs in one shared pool, with no card required. Requests pause at the limit, unused credits do not roll over, and the free-tier rate limit is 1 request/second. The page says the tier is “effectively forever,” but the Terms allow service changes or withdrawal, so continuation is not an unconditional guarantee. Iraq eligibility is not stated.",
    "category": {
      "value": "api",
      "review_status": "verified"
    },
    "benefits": [
      {
        "type": "free_quota",
        "amount": {
          "unit": "credits",
          "value": 500,
          "currency": null
        },
        "description": {
          "ar": "500 رصيدًا شهريًا لـ14 API في رصيد مشترك، بلا بطاقة؛ الطلبات تتوقف عند الحد.",
          "en": "500 monthly credits across 14 APIs in one pool, no card; requests pause at the limit."
        },
        "frequency": "monthly"
      }
    ],
    "eligibility": {
      "new_account": "unknown",
      "card_required": "no",
      "countries": {
        "status": "unknown",
        "values": []
      },
      "conditions": {
        "ar": "حد مجاني 1 طلب/ثانية؛ الرصيد شهري ولا يُرحّل، وتتوقف الطلبات عند الحد. الشروط تسمح بتغيير الخدمة أو سحبها. أهلية العراق غير مذكورة.",
        "en": "Free-plan rate limit is 1 request/second; monthly credits do not roll over and requests stop at the limit. Terms permit changes or withdrawal. Iraq eligibility is not stated."
      },
      "applicant_type": "unknown",
      "phone_required": "unknown",
      "student_status": "unknown"
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
      "steps": {
        "ar": "أنشئ حساب Geekflare وستبدأ بـ500 رصيد شهريًا.",
        "en": "Create a Geekflare account; it starts with 500 credits/month."
      }
    },
    "official_sources": [
      {
        "url": "https://geekflare.com/pricing/",
        "title": "Geekflare official pricing",
        "claims": [
          {
            "field": "description_en",
            "value": "Free $0, 500 monthly credits across 14 APIs, no card, monthly reset, requests pause at quota",
            "evidence": "Free $0, 500 monthly credits across 14 APIs, no card, monthly reset, requests pause at quota Verified 2026-11-04."
          }
        ]
      },
      {
        "url": "https://docs.geekflare.com/intro",
        "title": "Geekflare official API docs",
        "claims": [
          {
            "field": "description_en",
            "value": "Free plan requires no card",
            "evidence": "Free plan requires no card; 1 request/second limit Verified 2026-11-04."
          }
        ]
      },
      {
        "url": "https://geekflare.com/terms/",
        "title": "Geekflare official Terms",
        "claims": [
          {
            "field": "description_en",
            "value": "Provider may withdraw/amend services and change rates/limits subject to terms",
            "evidence": "Provider may withdraw/amend services and change rates/limits subject to terms Verified 2026-11-04."
          }
        ]
      }
    ],
    "get_offer": {
      "url": "https://geekflare.com/pricing/",
      "type": "official",
      "label": {
        "ar": "صفحة تسعير Geekflare الرسمية",
        "en": "Official Geekflare pricing page"
      }
    },
    "review": {
      "verdict": "verified",
      "verification_status": "supported",
      "reviewed_on": "2026-11-04",
      "verified_on": "2026-11-04",
      "reviewed_at": "2026-11-04",
      "offer_status": "active",
      "unknown_fields": [
        "Iraq eligibility",
        "applicant type",
        "open-to-all eligibility",
        "phone requirement",
        "new-account requirement",
        "student eligibility"
      ],
      "notes": {
        "ar": "تصحيح سياسة البطاقة إلى «غير مطلوبة»؛ المصدر الرسمي يصرّح بذلك. أضيف حد 1 طلب/ثانية وتحفظ الاستمرار.",
        "en": "Corrected card policy to no card required as explicitly stated; added 1 RPS cap and the Terms caveat."
      }
    },
    "status": "active",
    "ends_at": null
  },
  {
    "id": "hetzner-experiments-inference-api",
    "slug": "hetzner-experiments-inference-api",
    "name_ar": "Hetzner Experiments Inference API — استدلال LLM مجاني تجريبي (Qwen بسياق 262K)",
    "name_en": "Hetzner Experiments Inference API — Free Experimental LLM Inference (Qwen, 262K Context)",
    "description_ar": "واجهة Hetzner Inference API متوافقة مع OpenAI ومجانية ما دامت تجريبية. الحدود لكل مفتاح: 4 ملايين توكن دخل و100 ألف خرج لكل 60 ثانية، و10 طلبات لكل 60 ثانية. قائمة النماذج الحية هي المرجع وتضم حاليًا Qwen/Qwen3.6-35B-A3B-FP8 وQwen3.8-27B، بسياق 262,144 توكن لكل منهما. المحتوى لا يُخزّن، لكن بيانات الاستخدام تُحتفظ لمتابعة الاستخدام والفوترة المستقبلية. ليست للإنتاج والتوفر غير مضمون؛ البطاقة وأهلية العراق غير مذكورتين.",
    "description_en": "Hetzner Inference API is OpenAI-compatible and free while experimental. Per-key limits are 4 million input and 100,000 output tokens per 60 seconds, plus 10 requests per 60 seconds. The live model list is definitive and currently includes Qwen/Qwen3.6-35B-A3B-FP8 and Qwen3.8-27B, each with 262,144-token context. Request/response content is not stored, but usage metadata is retained for tracking/future billing. Not for production and availability is not guaranteed; card policy and Iraq eligibility are not stated.",
    "category": {
      "value": "ai-model",
      "review_status": "verified"
    },
    "benefits": [
      {
        "type": "free_access",
        "description": {
          "ar": "استدلال نماذج Qwen عبر API متوافق مع OpenAI، مجاني أثناء الحالة التجريبية، بقيود معدل معلنة.",
          "en": "Qwen inference through an OpenAI-compatible API, free while experimental and subject to published rate limits."
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
      "conditions": {
        "ar": "تجريبي وغير مخصص للإنتاج؛ التوفر والنماذج قد تتغير. لا يُخزّن محتوى الطلب/الاستجابة لكن تُحفظ بيانات استخدام. الحساب والرمز مطلوبان؛ البطاقة والعراق غير مذكورين.",
        "en": "Experimental, not for production; availability and models may change. Request/response content is not stored, but usage metadata is retained. Account and API token are required; card and Iraq terms are not stated."
      },
      "applicant_type": "unknown",
      "phone_required": "unknown",
      "student_status": "unknown"
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
      "steps": {
        "ar": "أنشئ حساب Hetzner واطلب رمز token من experiments.hetzner.com ثم استخدم /v1/models للقائمة الحية.",
        "en": "Create a Hetzner account, request a token at experiments.hetzner.com, then use /v1/models for the live list."
      }
    },
    "official_sources": [
      {
        "url": "https://docs.hetzner.com/general/company-and-policy/experiments/inference/",
        "title": "Hetzner official Inference API docs",
        "claims": [
          {
            "field": "description_en",
            "value": "Free while experimental",
            "evidence": "Free while experimental; current limits 4M input/100K output tokens and 10 requests per 60 seconds; live models and 262K context; content not stored but usage data retained Verified 2026-11-04."
          }
        ]
      }
    ],
    "get_offer": {
      "url": "https://docs.hetzner.com/general/company-and-policy/experiments/inference/",
      "type": "official",
      "label": {
        "ar": "توثيق Hetzner الرسمي لـInference API",
        "en": "Official Hetzner Inference API docs"
      }
    },
    "review": {
      "verdict": "verified",
      "verification_status": "supported",
      "reviewed_on": "2026-11-04",
      "verified_on": "2026-11-04",
      "reviewed_at": "2026-11-04",
      "offer_status": "active",
      "unknown_fields": [
        "Iraq eligibility",
        "applicant type",
        "open-to-all eligibility",
        "phone requirement",
        "card policy",
        "new-account requirement",
        "student eligibility"
      ],
      "notes": {
        "ar": "أُضيف الاحتفاظ ببيانات الاستخدام وحدود المعدل، مع اعتبار قائمة النماذج الحية المرجع النهائي.",
        "en": "Added retained usage metadata and rate caps; the live model list is the authoritative source for available models."
      }
    },
    "status": "active",
    "ends_at": null
  },
  {
    "id": "orcarouter-free-models",
    "slug": "orcarouter-free-models",
    "name_ar": "OrcaRouter — نماذج AI مجانية دائمة ($0/توكن) بلا بطاقة (شرط حساب «راسخ»)",
    "name_en": "OrcaRouter — Permanent Free AI Models ($0/Token), No Card (Established Account Required)",
    "description_ar": "تجمع OrcaRouter نماذج مجانية بسعر $0 لكل توكن، بلا رصيد مطلوب أو مؤقت تجريبي ما دامت النماذج ضمن القائمة المتغيرة. لا بطاقة لبدء الاستخدام، لكن الوصول يتطلب حسابًا راسخًا (مثل ربط GitHub ذي سجل أو شراء مدفوع)؛ قد ينتظر حساب GitHub الجديد. حدود الطلب تختلف حسب النموذج والحساب والمنطقة؛ لا يوجد حد عام ثابت قدره 50 طلبًا أو 800 طلب يوميًا. أهلية العراق غير مؤكدة.",
    "description_en": "OrcaRouter offers rotating free models at $0/token with no credit required or trial clock while a model remains listed. No card is required to start, but access requires an established account (for example, a GitHub account with history or a paid purchase); new GitHub accounts may have a waiting period. Request limits vary by model, account, and region; 50/day or 800/day is not a universal limit. Iraq eligibility is unconfirmed.",
    "category": {
      "value": "api",
      "review_status": "verified"
    },
    "benefits": [
      {
        "type": "free_access",
        "description": {
          "ar": "نماذج متغيرة بسعر $0/توكن، بلا بطاقة للبدء؛ الحدود تختلف حسب النموذج والحساب والمنطقة.",
          "en": "Rotating $0/token models, no card to start; limits vary by model, account, and region."
        }
      }
    ],
    "eligibility": {
      "new_account": "unknown",
      "card_required": "no",
      "countries": {
        "status": "unknown",
        "values": []
      },
      "conditions": {
        "ar": "يشترط حسابًا راسخًا؛ ربط GitHub ذي سجل أو شراء مدفوع، وقد ينتظر حساب GitHub الجديد. قائمة النماذج والحدود تختلف حسب الحساب والمنطقة؛ لا تعميم لحد 50/800 يوميًا.",
        "en": "Established account required; link a GitHub account with history or make a paid purchase; new GitHub accounts may wait. Model lineup and limits vary by account/region; do not generalize 50/800 daily limits."
      },
      "applicant_type": "unknown",
      "phone_required": "unknown",
      "student_status": "unknown"
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
      "steps": {
        "ar": "أنشئ حساب OrcaRouter واربط GitHub له تاريخ (أو أي عملية شراء مدفوعة) واستخدم الاسم orcarouter/free.",
        "en": "Create an OrcaRouter account, link a GitHub account with history (or any paid purchase), and use the name orcarouter/free."
      }
    },
    "official_sources": [
      {
        "url": "https://www.orcarouter.ai/offers",
        "title": "OrcaRouter official offers",
        "claims": [
          {
            "field": "description_en",
            "value": "Free models cost $0/token without a trial clock",
            "evidence": "Free models cost $0/token without a trial clock; no card to start; established-account and region/account eligibility; model-specific daily limits vary Verified 2026-11-04."
          }
        ]
      },
      {
        "url": "https://www.orcarouter.ai/models/deepseek/deepseek-v4-flash-free",
        "title": "OrcaRouter official model page",
        "claims": [
          {
            "field": "description_en",
            "value": "Example free model is $0 and rate-limited",
            "evidence": "Example free model is $0 and rate-limited Verified 2026-11-04."
          }
        ]
      },
      {
        "url": "https://www.orcarouter.ai/models/tencent/hy3-free",
        "title": "OrcaRouter official model page",
        "claims": [
          {
            "field": "description_en",
            "value": "Example free model has a different daily limit, demonstrating model-specific quotas",
            "evidence": "Example free model has a different daily limit, demonstrating model-specific quotas Verified 2026-11-04."
          }
        ]
      }
    ],
    "get_offer": {
      "url": "https://www.orcarouter.ai/offers",
      "type": "official",
      "label": {
        "ar": "صفحة عروض OrcaRouter الرسمية",
        "en": "Official OrcaRouter offers page"
      }
    },
    "review": {
      "verdict": "verified",
      "verification_status": "supported",
      "reviewed_on": "2026-11-04",
      "verified_on": "2026-11-04",
      "reviewed_at": "2026-11-04",
      "offer_status": "active",
      "unknown_fields": [
        "Iraq eligibility",
        "applicant type",
        "open-to-all eligibility",
        "phone requirement",
        "new-account requirement",
        "student eligibility"
      ],
      "notes": {
        "ar": "حُذف حد 50/800 اليومي العام؛ الحدود والعتبة تختلف باختلاف بطاقة النموذج والحساب والمنطقة.",
        "en": "Removed the blanket 50/800 daily limit; quotas and paid thresholds differ by model/account/region."
      }
    },
    "status": "active",
    "ends_at": null
  },
  {
    "id": "requesty-free-200-day",
    "slug": "requesty-free-200-day",
    "name_ar": "Requesty — بوابة LLM موحدة بطبقة Free دائمة (200 طلب/يوم بلا بطاقة)",
    "name_en": "Requesty — Unified LLM Gateway With Permanent Free Tier (200 Requests/Day, No Card)",
    "description_ar": "خطة Requesty المجانية: 200 طلب يوميًا على النماذج المصنفة مجانية، المنصة بلا بطاقة ولا مؤقت تجربة. قائمة النماذج المجانية تتغير حسب ما يضيفه أو يزيله المزودون؛ النماذج المدفوعة تتطلب الترقية وقد تترتب عليها رسوم. أهلية العراق غير مذكورة رسميًا.",
    "description_en": "Requesty’s Free plan provides 200 requests/day on models marked free, with no card and no trial timer. The free-model catalogue changes as providers add or remove models; paid models require an upgrade and may incur charges. Iraq eligibility is not stated officially.",
    "category": {
      "value": "api",
      "review_status": "verified"
    },
    "benefits": [
      {
        "type": "free_quota",
        "amount": {
          "unit": "requests",
          "value": 200,
          "currency": null
        },
        "description": {
          "ar": "200 طلب يوميًا على النماذج المجانية؛ بلا بطاقة ولا مؤقت تجربة.",
          "en": "200 requests/day on free models; no card and no trial timer."
        },
        "frequency": "daily"
      }
    ],
    "eligibility": {
      "new_account": "unknown",
      "card_required": "no",
      "countries": {
        "status": "unknown",
        "values": []
      },
      "conditions": {
        "ar": "الحد يخص النماذج المصنفة مجانية فقط، والقائمة تتغير؛ النماذج المدفوعة تتطلب الترقية. أهلية العراق غير مذكورة.",
        "en": "Quota applies only to models designated free, and the lineup changes; paid models require upgrading. Iraq eligibility is not stated."
      },
      "applicant_type": "unknown",
      "phone_required": "unknown",
      "student_status": "unknown"
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
      "steps": {
        "ar": "سجل في requesty.ai وابدأ بالطبقة المجانية.",
        "en": "Sign up at requesty.ai and start with the free tier."
      }
    },
    "official_sources": [
      {
        "url": "https://requesty.ai/pricing",
        "title": "Requesty official pricing",
        "claims": [
          {
            "field": "description_en",
            "value": "Free plan $0",
            "evidence": "Free plan $0; 200 requests/day; no credit card Verified 2026-11-04."
          }
        ]
      },
      {
        "url": "https://www.requesty.ai/free-models",
        "title": "Requesty official free models",
        "claims": [
          {
            "field": "description_en",
            "value": "200 free requests/day, no trial expiry, free-model catalogue changes",
            "evidence": "200 free requests/day, no trial expiry, free-model catalogue changes Verified 2026-11-04."
          }
        ]
      }
    ],
    "get_offer": {
      "url": "https://requesty.ai/pricing",
      "type": "official",
      "label": {
        "ar": "صفحة تسعير Requesty الرسمية",
        "en": "Official Requesty pricing page"
      }
    },
    "review": {
      "verdict": "verified",
      "verification_status": "supported",
      "reviewed_on": "2026-11-04",
      "verified_on": "2026-11-04",
      "reviewed_at": "2026-11-04",
      "offer_status": "active",
      "unknown_fields": [
        "Iraq eligibility",
        "applicant type",
        "open-to-all eligibility",
        "phone requirement",
        "new-account requirement",
        "student eligibility"
      ],
      "notes": {
        "ar": "تأكيد حد 200 طلب يوميًا وشرط استخدام النماذج المجانية فقط؛ القائمة متغيرة.",
        "en": "Confirmed 200 daily requests on free models only; catalog is variable."
      }
    },
    "status": "active",
    "ends_at": null
  }
]
$reviewed_batch$::jsonb) AS candidate(id text, slug text, name_ar text, name_en text, description_ar text, description_en text, category jsonb, benefits jsonb, eligibility jsonb, pricing jsonb, registration jsonb, official_sources jsonb, get_offer jsonb, review jsonb, status text, ends_at date)
WHERE NOT EXISTS (
  SELECT 1 FROM public.deals existing
  WHERE existing.id = candidate.id OR existing.slug = candidate.slug
)
LIMIT 13
ON CONFLICT (id) DO NOTHING;

SELECT id, slug, review->>'verdict' AS verdict, review->>'reviewed_on' AS reviewed_on, status
FROM public.deals
WHERE id IN ('context-dev-1000-api', 'runway-free-125-credits', 'cartesia-free-tts-stt', 'tavily-student-4-months', 'speechmatics-signup-bonus', 'aiven-free-tier-managed-db', 'layerbase-free-db', 'apple-pcc-free-foundation-models', 'inferall-open-models-free', 'geekflare-api-500-credits', 'hetzner-experiments-inference-api', 'orcarouter-free-models', 'requesty-free-200-day')
ORDER BY id
LIMIT 100;
COMMIT;
