-- Evidence-backed correction of the 17 deal rows from the 2026-11-03 batch.
-- Snapshot/restore copy was preserved outside the repository before this update.
-- This statement updates existing rows only; it performs no inserts or deletions.
WITH corrections AS (
  SELECT *
  FROM jsonb_to_recordset($corrections$
[
  {
    "id": "novita-ai-sandbox-100",
    "description_en": "New users can receive $100 in promotional credits for eligible Novita Sandbox use after a short setup survey. Credits are valid for 90 days, and Novita says no card is required. The credits apply to Sandbox resources, not direct model API tokens.",
    "description_ar": "يمكن للمستخدمين الجدد الحصول على رصيد ترويجي بقيمة 100 دولار لاستخدام Novita Sandbox المؤهل بعد استبيان إعداد قصير. الصلاحية 90 يومًا، وتذكر Novita أن البطاقة غير مطلوبة. الرصيد مخصص لموارد Sandbox وليس لرموز واجهة النماذج المباشرة.",
    "benefits": [
      {
        "type": "free_quota",
        "description": {
          "en": "$100 promotional Sandbox credit, valid 90 days after the setup survey.",
          "ar": "رصيد Sandbox ترويجي بقيمة $100 صالح 90 يومًا بعد استبيان الإعداد."
        },
        "amount": {
          "unit": "USD",
          "value": 100,
          "currency": "USD"
        },
        "duration": {
          "unit": "day",
          "value": 90,
          "status": "known"
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
        "en": "Eligible Sandbox use only; a short setup survey is required. Country eligibility is unknown.",
        "ar": "لاستخدام Sandbox المؤهل فقط؛ يلزم استبيان إعداد قصير. أهلية البلدان غير معلومة."
      },
      "applicant_type": "unknown",
      "open_to_all": "unknown",
      "phone_required": "unknown",
      "student_status": "unknown"
    },
    "registration": {
      "deadline": {
        "date": null,
        "status": "ongoing"
      },
      "credit_validity": {
        "unit": null,
        "duration": null,
        "status": "unknown"
      },
      "steps": {
        "en": "Sign up and complete the short account setup survey.",
        "ar": "أنشئ حسابًا وأكمل استبيان إعداد الحساب القصير."
      }
    },
    "official_sources": [
      {
        "url": "https://docs.novita.ai/guides/sandbox-pricing",
        "title": "Novita Sandbox pricing",
        "claims": [
          {
            "field": "description_en",
            "value": "supported",
            "evidence": "Says new users can complete a short setup survey for $100 promotional credits for eligible Sandbox usage; no card required; 90-day validity and usage limits may apply."
          }
        ]
      },
      {
        "url": "https://docs.novita.ai/guides/sandbox-your-first-agent-sandbox",
        "title": "Your First Sandbox",
        "claims": [
          {
            "field": "description_en",
            "value": "supported",
            "evidence": "Confirms the new-user survey, $100 promotional Sandbox credit, and no-card requirement."
          }
        ]
      },
      {
        "url": "https://novita.ai/user/register",
        "title": "Novita registration",
        "claims": [
          {
            "field": "description_en",
            "value": "supported",
            "evidence": "Advertises $100 Sandbox credits valid for 90 days."
          }
        ]
      }
    ],
    "get_offer": {
      "url": "https://novita.ai/user/register",
      "type": "official",
      "label": {
        "en": "Official Novita registration",
        "ar": "صفحة التسجيل الرسمية لدى Novita"
      }
    },
    "review": {
      "verdict": "verified",
      "verification_status": "supported",
      "reviewed_on": "2026-11-03",
      "verified_on": "2026-11-03",
      "reviewed_at": "2026-11-03",
      "offer_status": "active",
      "unknown_fields": [
        "country eligibility"
      ],
      "notes": {
        "en": "Official docs confirm the Sandbox-only scope, 90-day validity, survey condition and no-card term. Country eligibility remains unknown.",
        "ar": "تؤكد الوثائق الرسمية نطاق Sandbox وصلاحية 90 يومًا وشرط الاستبيان وعدم الحاجة لبطاقة. أهلية البلدان غير معلومة."
      }
    },
    "status": "active",
    "ends_at": null
  },
  {
    "id": "smartoken-5-promo",
    "description_en": "The campaign includes existing users and qualifying low-risk new Google signups for a one-time $5 credit. No card is required. It ends on December 31, 2026 at 23:59:59 UTC+8. OpenAI-compatible routes include DeepSeek, Kimi, Qwen and GLM.",
    "description_ar": "تشمل الحملة المستخدمين الحاليين والتسجيلات الجديدة المؤهلة منخفضة المخاطر عبر Google، برصيد لمرة واحدة قدره $5. لا تُطلب بطاقة. تنتهي في 31 ديسمبر 2026 عند 23:59:59 بتوقيت UTC+8. تشمل المسارات المتوافقة مع OpenAI نماذج DeepSeek وKimi وQwen وGLM.",
    "benefits": [
      {
        "type": "free_quota",
        "description": {
          "en": "$5 one-time campaign credit for existing users and qualifying new Google signups.",
          "ar": "$5 رصيد حملة لمرة واحدة للمستخدمين الحاليين والتسجيلات الجديدة المؤهلة عبر Google."
        },
        "amount": {
          "unit": "USD",
          "value": 5,
          "currency": "USD"
        },
        "frequency": "one-time"
      }
    ],
    "eligibility": {
      "new_account": "no",
      "card_required": "no",
      "countries": {
        "status": "unknown",
        "values": []
      },
      "conditions": {
        "en": "New Google signups must pass the campaign risk checks; existing users are included. Country eligibility is unknown.",
        "ar": "يجب أن تجتاز التسجيلات الجديدة عبر Google فحوصات المخاطر؛ ويشمل العرض المستخدمين الحاليين. أهلية البلدان غير معلومة."
      },
      "applicant_type": "unknown",
      "open_to_all": "unknown",
      "phone_required": "unknown",
      "student_status": "unknown"
    },
    "registration": {
      "deadline": {
        "date": "2026-12-31",
        "status": "known"
      },
      "credit_validity": {
        "unit": null,
        "duration": null,
        "status": "unknown"
      },
      "steps": {
        "en": "Use the campaign page; new Google signups are subject to its risk checks.",
        "ar": "استخدم صفحة الحملة؛ تخضع التسجيلات الجديدة عبر Google لفحوصات المخاطر."
      }
    },
    "official_sources": [
      {
        "url": "https://thesmartoken.com/campaign/free-credit",
        "title": "SmarToken campaign terms",
        "claims": [
          {
            "field": "description_en",
            "value": "supported",
            "evidence": "States $5, includes existing users and low-risk new Google users, no card required, and campaign end at 2026-12-31 23:59:59 UTC+8."
          }
        ]
      },
      {
        "url": "https://thesmartoken.com/docs",
        "title": "SmarToken developer docs",
        "claims": [
          {
            "field": "description_en",
            "value": "supported",
            "evidence": "Documents OpenAI-compatible API calls and DeepSeek, Kimi, Qwen and GLM routes."
          }
        ]
      }
    ],
    "get_offer": {
      "url": "https://thesmartoken.com/campaign/free-credit",
      "type": "official",
      "label": {
        "en": "Official SmarToken campaign",
        "ar": "حملة SmarToken الرسمية"
      }
    },
    "review": {
      "verdict": "verified",
      "verification_status": "supported",
      "reviewed_on": "2026-11-03",
      "verified_on": "2026-11-03",
      "reviewed_at": "2026-11-03",
      "offer_status": "active",
      "unknown_fields": [
        "country eligibility"
      ],
      "notes": {
        "en": "Existing-user inclusion is explicit. The new-signup credit is limited to low-risk Google accounts; the campaign deadline is UTC+8.",
        "ar": "يشمل العرض المستخدمين الحاليين صراحةً. رصيد التسجيل الجديد مشروط بحساب Google منخفض المخاطر، والموعد النهائي بتوقيت UTC+8."
      }
    },
    "status": "active",
    "ends_at": "2026-12-31 23:59:59+08:00"
  },
  {
    "id": "valyu-api-credits",
    "description_en": "New Valyu accounts receive $10 in API credits, or $20 with a company email, for search and extraction. No card is required; credits expire 12 months after signup.",
    "description_ar": "تحصل حسابات Valyu الجديدة على رصيد API بقيمة $10، أو $20 عند استخدام بريد شركة، للبحث والاستخراج. لا تُطلب بطاقة؛ وتنتهي صلاحية الرصيد بعد 12 شهرًا من التسجيل.",
    "benefits": [
      {
        "type": "free_quota",
        "description": {
          "en": "$10 for a new account, or $20 with a company email; expires after 12 months.",
          "ar": "$10 للحساب الجديد أو $20 ببريد شركة؛ تنتهي بعد 12 شهرًا."
        },
        "amount": {
          "unit": "USD",
          "value": 10,
          "currency": "USD"
        },
        "duration": {
          "unit": "month",
          "value": 12,
          "status": "known"
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
        "en": "The $20 tier depends on a company email. Country eligibility is unknown.",
        "ar": "تعتمد فئة $20 على استخدام بريد شركة. أهلية البلدان غير معلومة."
      },
      "applicant_type": "unknown",
      "open_to_all": "unknown",
      "phone_required": "unknown",
      "student_status": "unknown"
    },
    "registration": {
      "deadline": {
        "date": null,
        "status": "ongoing"
      },
      "credit_validity": {
        "unit": "month",
        "duration": 12,
        "status": "known"
      },
      "steps": {
        "en": "Create an account and use the API credits for search or extraction.",
        "ar": "أنشئ حسابًا واستخدم رصيد API للبحث أو الاستخراج."
      }
    },
    "official_sources": [
      {
        "url": "https://docs.valyu.ai/pricing",
        "title": "Valyu pricing",
        "claims": [
          {
            "field": "description_en",
            "value": "supported",
            "evidence": "States $10 free credits for new accounts, $20 with company email, no card required, and expiry 12 months after signup."
          }
        ]
      },
      {
        "url": "https://docs.valyu.ai/quickstart",
        "title": "Valyu quickstart",
        "claims": [
          {
            "field": "description_en",
            "value": "supported",
            "evidence": "Independently confirms the $10/$20 signup credits and no-card term."
          }
        ]
      }
    ],
    "get_offer": {
      "url": "https://docs.valyu.ai/pricing",
      "type": "official",
      "label": {
        "en": "Official Valyu pricing",
        "ar": "تسعير Valyu الرسمي"
      }
    },
    "review": {
      "verdict": "verified",
      "verification_status": "supported",
      "reviewed_on": "2026-11-03",
      "verified_on": "2026-11-03",
      "reviewed_at": "2026-11-03",
      "offer_status": "active",
      "unknown_fields": [
        "country eligibility"
      ],
      "notes": {
        "en": "The official pricing page supports amount, company-email qualification, card policy and 12-month expiry.",
        "ar": "تدعم صفحة التسعير الرسمية المبلغ وشرط بريد الشركة وسياسة البطاقة وصلاحية 12 شهرًا."
      }
    },
    "status": "active",
    "ends_at": null
  },
  {
    "id": "llm7-io-free-tier",
    "description_en": "The free API tier provides 100,000 input-plus-output tokens per rolling 24-hour window at /v1/chat/completions. The provider may reduce free quotas without notice. Card policy and country eligibility are not stated.",
    "description_ar": "توفر فئة API المجانية 100,000 توكن إدخال وإخراج خلال نافذة متحركة مدتها 24 ساعة عبر /v1/chat/completions. قد يخفض المزوّد الحصة المجانية دون إشعار. سياسة البطاقة وأهلية البلدان غير مذكورتين.",
    "benefits": [
      {
        "type": "free_quota",
        "description": {
          "en": "100,000 input plus output tokens per rolling 24 hours.",
          "ar": "100,000 توكن إدخال وإخراج لكل 24 ساعة متحركة."
        },
        "amount": {
          "unit": "tokens",
          "value": 100000
        },
        "frequency": "rolling 24 hours"
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
        "en": "Free quota can be reduced without notice; card requirement and country eligibility are unknown.",
        "ar": "قد تُخفض الحصة المجانية دون إشعار؛ وشرط البطاقة وأهلية البلدان غير معلومين."
      },
      "applicant_type": "unknown",
      "open_to_all": "unknown",
      "phone_required": "unknown",
      "student_status": "unknown"
    },
    "registration": {
      "deadline": {
        "date": null,
        "status": "ongoing"
      },
      "credit_validity": {
        "unit": null,
        "duration": null,
        "status": "unknown"
      },
      "steps": {
        "en": "Create an API token and call /v1/chat/completions.",
        "ar": "أنشئ رمز API واستخدم /v1/chat/completions."
      }
    },
    "official_sources": [
      {
        "url": "https://docs.llm7.io/limits",
        "title": "LLM7 limits",
        "claims": [
          {
            "field": "description_en",
            "value": "supported",
            "evidence": "Lists 100,000 free tokens per 24 hours for /v1/chat/completions, input plus output usage, and possible quota reduction without notice."
          }
        ]
      },
      {
        "url": "https://llm7.io/",
        "title": "LLM7 homepage",
        "claims": [
          {
            "field": "description_en",
            "value": "supported",
            "evidence": "Clarifies the quota uses a rolling 24-hour window and mentions card/crypto only for paid top-ups."
          }
        ]
      }
    ],
    "get_offer": {
      "url": "https://docs.llm7.io/limits",
      "type": "official",
      "label": {
        "en": "Official LLM7 limits",
        "ar": "حدود LLM7 الرسمية"
      }
    },
    "review": {
      "verdict": "verified",
      "verification_status": "supported",
      "reviewed_on": "2026-11-03",
      "verified_on": "2026-11-03",
      "reviewed_at": "2026-11-03",
      "offer_status": "active",
      "unknown_fields": [
        "card requirement",
        "country eligibility"
      ],
      "notes": {
        "en": "The public docs do not state whether a card is required for free-tier access.",
        "ar": "لا توضح الوثائق العامة ما إذا كانت البطاقة مطلوبة لاستخدام الفئة المجانية."
      }
    },
    "status": "active",
    "ends_at": null
  },
  {
    "id": "junie-lite-jetbrains",
    "description_en": "Junie Lite is a free coding-agent tier for JetBrains accounts, with no card required, available in JetBrains Air and Junie CLI. The announcement says the offer is valid through December 31, 2026, while later documentation describes a standing tier; official pages conflict on duration.",
    "description_ar": "Junie Lite فئة وكيل برمجة مجانية لحسابات JetBrains، بلا بطاقة، وتتوفر في JetBrains Air وJunie CLI. يذكر الإعلان أن العرض صالح حتى 31 ديسمبر 2026، بينما تصفه وثائق أحدث بأنه فئة مستمرة؛ لذلك تتعارض الصفحات الرسمية بشأن المدة.",
    "benefits": [
      {
        "type": "free_access",
        "description": {
          "en": "Free coding-agent tier for JetBrains accounts; supported in JetBrains Air and Junie CLI.",
          "ar": "فئة وكيل برمجة مجانية لحسابات JetBrains؛ تعمل في JetBrains Air وJunie CLI."
        }
      }
    ],
    "eligibility": {
      "new_account": "no",
      "card_required": "no",
      "countries": {
        "status": "unknown",
        "values": []
      },
      "conditions": {
        "en": "The supported locations are JetBrains Air and Junie CLI, not JetBrains AI Assistant. Official announcement and later docs conflict on the offer duration.",
        "ar": "مواقع الاستخدام المدعومة هي JetBrains Air وJunie CLI، وليس JetBrains AI Assistant. يتعارض الإعلان الرسمي والوثائق الأحدث بشأن مدة العرض."
      },
      "applicant_type": "unknown",
      "open_to_all": "unknown",
      "phone_required": "unknown",
      "student_status": "unknown"
    },
    "registration": {
      "deadline": {
        "date": null,
        "status": "conflicting"
      },
      "credit_validity": {
        "unit": null,
        "duration": null,
        "status": "unknown"
      },
      "steps": {
        "en": "Use Junie Lite through JetBrains Air or Junie CLI with a JetBrains account.",
        "ar": "استخدم Junie Lite عبر JetBrains Air أو Junie CLI بحساب JetBrains."
      }
    },
    "official_sources": [
      {
        "url": "https://junie.jetbrains.com/blog/junie-lite/",
        "title": "Junie Lite announcement",
        "claims": [
          {
            "field": "description_en",
            "value": "supported",
            "evidence": "Says the free tier is included with every JetBrains account, no card required, available in Air and CLI, and the offer is valid until 2026-12-31."
          }
        ]
      },
      {
        "url": "https://junie.jetbrains.com/docs/junie-lite.html",
        "title": "Junie Lite documentation",
        "claims": [
          {
            "field": "description_en",
            "value": "supported",
            "evidence": "Confirms no card and Air/CLI availability, but describes the tier as standing/non-expiring, creating a duration conflict."
          }
        ]
      }
    ],
    "get_offer": {
      "url": "https://junie.jetbrains.com/",
      "type": "official",
      "label": {
        "en": "Official Junie homepage",
        "ar": "موقع Junie الرسمي"
      }
    },
    "review": {
      "verdict": "verified",
      "verification_status": "supported",
      "reviewed_on": "2026-11-03",
      "verified_on": "2026-11-03",
      "reviewed_at": "2026-11-03",
      "offer_status": "active",
      "unknown_fields": [
        "fixed_term",
        "country eligibility"
      ],
      "notes": {
        "en": "The announcement has a 2026-12-31 cutoff, but documentation describes a standing tier; the date is retained as a conflict, not an undisputed expiry.",
        "ar": "يتضمن الإعلان موعد 2026-12-31، بينما تصف الوثائق الفئة بأنها مستمرة؛ لذا يُسجّل التاريخ كتعارض لا كتاريخ انتهاء محسوم."
      }
    },
    "status": "active",
    "ends_at": null
  },
  {
    "id": "ideavo-free-ai-builder",
    "description_en": "Ideavo offers a $0 free app-builder tier with no card, using your own AI subscription or API key. Optional paid Pro and Agent+ plans also exist, and model-provider charges remain separate.",
    "description_ar": "تقدم Ideavo فئة مجانية لبناء التطبيقات بسعر $0 ومن دون بطاقة، باستخدام اشتراكك أو مفتاح API الخاص بك. توجد أيضًا خطتا Pro وAgent+ المدفوعتان اختياريًا، وتُحاسب مزودات النماذج على تكاليفها بصورة منفصلة.",
    "benefits": [
      {
        "type": "free_access",
        "description": {
          "en": "Free $0 app-builder tier with bring-your-own-key/subscription.",
          "ar": "فئة مجانية بسعر $0 لبناء التطبيقات باستخدام مفتاحك أو اشتراكك الخاص."
        }
      }
    ],
    "eligibility": {
      "new_account": "no",
      "card_required": "no",
      "countries": {
        "status": "unknown",
        "values": []
      },
      "conditions": {
        "en": "Bring your own AI key or subscription; optional paid plans exist and third-party model charges are separate.",
        "ar": "استخدم مفتاح AI أو اشتراكك الخاص؛ توجد خطط مدفوعة اختيارية وتكاليف مزود النموذج منفصلة."
      },
      "applicant_type": "unknown",
      "open_to_all": "unknown",
      "phone_required": "unknown",
      "student_status": "unknown"
    },
    "registration": {
      "deadline": {
        "date": null,
        "status": "ongoing"
      },
      "credit_validity": {
        "unit": null,
        "duration": null,
        "status": "unknown"
      },
      "steps": {
        "en": "Create an Ideavo account and connect your own AI key or subscription.",
        "ar": "أنشئ حساب Ideavo واربط مفتاح AI أو اشتراكك الخاص."
      }
    },
    "official_sources": [
      {
        "url": "https://ideavo.ai",
        "title": "Ideavo homepage",
        "claims": [
          {
            "field": "description_en",
            "value": "supported",
            "evidence": "Shows a $0 free tier and states no card is required; users connect their own AI subscription/API key."
          }
        ]
      },
      {
        "url": "https://ideavo.ai/blog/ideavo-is-free",
        "title": "Ideavo free announcement",
        "claims": [
          {
            "field": "description_en",
            "value": "supported",
            "evidence": "Explains BYOK and that model charges are paid to the selected provider."
          }
        ]
      },
      {
        "url": "https://docs.ideavo.ai/docs/introduction/pricing",
        "title": "Ideavo pricing docs",
        "claims": [
          {
            "field": "description_en",
            "value": "supported",
            "evidence": "Lists a Free plan at $0 alongside optional paid plans."
          }
        ]
      }
    ],
    "get_offer": {
      "url": "https://ideavo.ai",
      "type": "official",
      "label": {
        "en": "Official Ideavo site",
        "ar": "موقع Ideavo الرسمي"
      }
    },
    "review": {
      "verdict": "verified",
      "verification_status": "supported",
      "reviewed_on": "2026-11-03",
      "verified_on": "2026-11-03",
      "reviewed_at": "2026-11-03",
      "offer_status": "active",
      "unknown_fields": [
        "country eligibility"
      ],
      "notes": {
        "en": "The published $0 offer is a free tier, not a claim that every Ideavo plan is free.",
        "ar": "العرض المنشور بسعر $0 هو فئة مجانية، وليس ادعاءً بأن جميع خطط Ideavo مجانية."
      }
    },
    "status": "active",
    "ends_at": null
  },
  {
    "id": "amd-ai-dev-100-credits",
    "description_en": "The AMD AI Developer Program is free to join, but the $100 AMD Developer Cloud credit requires approval and expires 30 days after activation. AMD separately estimates about 50 hours on a single MI300X; this is not a universal hourly-rate promise. Card policy and Iraq eligibility are unknown.",
    "description_ar": "الانضمام إلى برنامج AMD AI Developer مجاني، لكن رصيد AMD Developer Cloud البالغ $100 يتطلب الموافقة وينتهي بعد 30 يومًا من التفعيل. تقدر AMD في مقال منفصل الاستخدام بنحو 50 ساعة على MI300X واحدة؛ وهذا ليس وعدًا بسعر ساعة عام. شرط البطاقة وأهلية العراق غير معلومين.",
    "benefits": [
      {
        "type": "free_quota",
        "description": {
          "en": "$100 AMD Developer Cloud credit; AMD separately estimates about 50 hours on one MI300X.",
          "ar": "$100 رصيد AMD Developer Cloud؛ وتقدّر AMD في مصدر منفصل نحو 50 ساعة على MI300X واحدة."
        },
        "amount": {
          "unit": "USD",
          "value": 100,
          "currency": "USD"
        },
        "duration": {
          "unit": "day",
          "value": 30,
          "status": "known"
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
        "en": "Free to join; credits require AMD approval and expire 30 days after activation. Card requirement and country eligibility are unknown.",
        "ar": "الانضمام مجاني؛ ويتطلب الرصيد موافقة AMD وينتهي بعد 30 يومًا من التفعيل. شرط البطاقة وأهلية البلدان غير معلومين."
      },
      "applicant_type": "unknown",
      "open_to_all": "unknown",
      "phone_required": "unknown",
      "student_status": "unknown"
    },
    "registration": {
      "deadline": {
        "date": null,
        "status": "ongoing"
      },
      "credit_validity": {
        "unit": null,
        "duration": null,
        "status": "unknown"
      },
      "steps": {
        "en": "Join the program, submit the request and wait for AMD approval.",
        "ar": "انضم إلى البرنامج وأرسل الطلب وانتظر موافقة AMD."
      }
    },
    "official_sources": [
      {
        "url": "https://www.amd.com/en/developer/resources/cloud-access/amd-developer-cloud.html",
        "title": "AMD Developer Cloud",
        "claims": [
          {
            "field": "description_en",
            "value": "supported",
            "evidence": "States complimentary $100 AMD Developer Cloud credit and explains approval and payment terms; does not say a card is required for the free credit."
          }
        ]
      },
      {
        "url": "https://developer.amd.com/ai-developer-program/",
        "title": "AMD AI Developer Program",
        "claims": [
          {
            "field": "description_en",
            "value": "supported",
            "evidence": "States the program is free to join and lists $100 cloud credits."
          }
        ]
      },
      {
        "url": "https://www.amd.com/en/developer/resources/technical-articles/2026/how-to-claim-amd-cloud-credits.html",
        "title": "How to claim AMD credits",
        "claims": [
          {
            "field": "description_en",
            "value": "supported",
            "evidence": "Describes the approval process and 30-day expiry after activation."
          }
        ]
      },
      {
        "url": "https://www.amd.com/en/developer/resources/technical-articles/2026/openclaw-on-amd-developer-cloud-qwen-3-5-and-sglang.html",
        "title": "AMD MI300X example",
        "claims": [
          {
            "field": "description_en",
            "value": "supported",
            "evidence": "Estimates about 50 hours on a single MI300X; does not establish a universal current hourly rate."
          }
        ]
      }
    ],
    "get_offer": {
      "url": "https://www.amd.com/en/developer/resources/cloud-access/amd-developer-cloud.html",
      "type": "official",
      "label": {
        "en": "Official AMD Developer Cloud",
        "ar": "AMD Developer Cloud الرسمي"
      }
    },
    "review": {
      "verdict": "verified",
      "verification_status": "supported",
      "reviewed_on": "2026-11-03",
      "verified_on": "2026-11-03",
      "reviewed_at": "2026-11-03",
      "offer_status": "active",
      "unknown_fields": [
        "card requirement",
        "country eligibility",
        "Iraq_availability",
        "other_signup_restrictions"
      ],
      "notes": {
        "en": "Card requirement and Iraq eligibility remain unknown. The separate Hot Aisle $1.99/hour rate is not attributed to the current AMD Developer Cloud credit.",
        "ar": "شرط البطاقة وأهلية العراق غير معلومين. لا تُنسب قيمة $1.99/ساعة الخاصة بعرض Hot Aisle المنفصل إلى رصيد AMD Developer Cloud الحالي."
      }
    },
    "status": "active",
    "ends_at": null
  },
  {
    "id": "pingwise-free-monitoring",
    "description_en": "PingWise grants 650,000 free uptime-monitoring credits each calendar month with no card. The grant resets on the first of the month, and unused free credits do not roll over.",
    "description_ar": "تمنح PingWise عدد 650,000 رصيد مجاني لمراقبة الجاهزية شهريًا ومن دون بطاقة. تتجدد الحصة في اليوم الأول من الشهر ولا يترحل الرصيد المجاني غير المستخدم.",
    "benefits": [
      {
        "type": "free_quota",
        "description": {
          "en": "650,000 free uptime-monitoring credits per calendar month.",
          "ar": "650,000 رصيد مجاني لمراقبة الجاهزية في كل شهر تقويمي."
        },
        "amount": {
          "unit": "credits",
          "value": 650000
        },
        "frequency": "monthly"
      }
    ],
    "eligibility": {
      "new_account": "no",
      "card_required": "no",
      "countries": {
        "status": "unknown",
        "values": []
      },
      "conditions": {
        "en": "Free credits reset on the first of each calendar month and do not roll over. Country eligibility is unknown.",
        "ar": "تتجدد الأرصدة المجانية في اليوم الأول من كل شهر تقويمي ولا تتراكم. أهلية البلدان غير معلومة."
      },
      "applicant_type": "unknown",
      "open_to_all": "unknown",
      "phone_required": "unknown",
      "student_status": "unknown"
    },
    "registration": {
      "deadline": {
        "date": null,
        "status": "ongoing"
      },
      "credit_validity": {
        "unit": null,
        "duration": null,
        "status": "unknown"
      },
      "steps": {
        "en": "Create a PingWise account and configure uptime checks.",
        "ar": "أنشئ حساب PingWise واضبط فحوصات الجاهزية."
      }
    },
    "official_sources": [
      {
        "url": "https://pingwise.com/",
        "title": "PingWise homepage and pricing",
        "claims": [
          {
            "field": "description_en",
            "value": "supported",
            "evidence": "States 650,000 free credits each month and no card."
          }
        ]
      },
      {
        "url": "https://pingwise.com/terms/",
        "title": "PingWise terms",
        "claims": [
          {
            "field": "description_en",
            "value": "supported",
            "evidence": "States monthly credits arrive on the first and unused free credits do not roll over."
          }
        ]
      }
    ],
    "get_offer": {
      "url": "https://pingwise.com/",
      "type": "official",
      "label": {
        "en": "Official PingWise site",
        "ar": "موقع PingWise الرسمي"
      }
    },
    "review": {
      "verdict": "verified",
      "verification_status": "supported",
      "reviewed_on": "2026-11-03",
      "verified_on": "2026-11-03",
      "reviewed_at": "2026-11-03",
      "offer_status": "active",
      "unknown_fields": [
        "country eligibility"
      ],
      "notes": {
        "en": "Terms state the free grant is monthly and non-accumulating.",
        "ar": "تنص الشروط على أن الرصيد المجاني شهري ولا يتراكم."
      }
    },
    "status": "active",
    "ends_at": null
  },
  {
    "id": "docspring-developer-free",
    "description_en": "The free Developer plan includes 200 monthly credits, enough for about 10 filled PDF forms of up to 10 pages each. No card is required for the free plan. Live e-signatures and data requests require a paid plan.",
    "description_ar": "تتضمن خطة Developer المجانية 200 رصيد شهريًا، تكفي لنحو 10 نماذج PDF مملوءة بحد أقصى 10 صفحات لكل نموذج. لا تُطلب بطاقة للخطة المجانية. تتطلب التواقيع الإلكترونية وطلبات البيانات الحية خطة مدفوعة.",
    "benefits": [
      {
        "type": "free_quota",
        "description": {
          "en": "200 credits per month; about 10 filled forms up to 10 pages each.",
          "ar": "200 رصيد شهريًا؛ تكفي لنحو 10 نماذج مملوءة حتى 10 صفحات لكل نموذج."
        },
        "amount": {
          "unit": "credits",
          "value": 200
        },
        "frequency": "monthly"
      }
    ],
    "eligibility": {
      "new_account": "no",
      "card_required": "no",
      "countries": {
        "status": "unknown",
        "values": []
      },
      "conditions": {
        "en": "The approximately 10-PDF estimate applies to filled forms of up to 10 pages; live signatures and data requests require a paid plan.",
        "ar": "تقدير نحو 10 ملفات ينطبق على النماذج المملوءة حتى 10 صفحات؛ وتتطلب التواقيع وطلبات البيانات الحية خطة مدفوعة."
      },
      "applicant_type": "unknown",
      "open_to_all": "unknown",
      "phone_required": "unknown",
      "student_status": "unknown"
    },
    "registration": {
      "deadline": {
        "date": null,
        "status": "ongoing"
      },
      "credit_validity": {
        "unit": null,
        "duration": null,
        "status": "unknown"
      },
      "steps": {
        "en": "Choose the free Developer plan and use test mode; paid plan is needed for live signatures.",
        "ar": "اختر خطة Developer المجانية واستخدم وضع الاختبار؛ وتتطلب التواقيع الحية خطة مدفوعة."
      }
    },
    "official_sources": [
      {
        "url": "https://docspring.com/pricing",
        "title": "DocSpring pricing",
        "claims": [
          {
            "field": "description_en",
            "value": "supported",
            "evidence": "Lists the free Developer plan, 200 monthly credits and no-card term."
          }
        ]
      },
      {
        "url": "https://docspring.com/docs/billing/how-credits-work/",
        "title": "How credits work",
        "claims": [
          {
            "field": "description_en",
            "value": "supported",
            "evidence": "Explains that a filled PDF form up to 10 pages costs 20 credits."
          }
        ]
      },
      {
        "url": "https://docspring.com/docs/billing/",
        "title": "Billing overview",
        "claims": [
          {
            "field": "description_en",
            "value": "supported",
            "evidence": "States that live e-signatures/data requests are paid-plan features and a successful first payment starts the paid subscription."
          }
        ]
      }
    ],
    "get_offer": {
      "url": "https://docspring.com/pricing",
      "type": "official",
      "label": {
        "en": "Official DocSpring pricing",
        "ar": "تسعير DocSpring الرسمي"
      }
    },
    "review": {
      "verdict": "verified",
      "verification_status": "supported",
      "reviewed_on": "2026-11-03",
      "verified_on": "2026-11-03",
      "reviewed_at": "2026-11-03",
      "offer_status": "active",
      "unknown_fields": [
        "country eligibility"
      ],
      "notes": {
        "en": "The free plan needs no card; live use is a separate paid-plan feature.",
        "ar": "لا تحتاج الخطة المجانية إلى بطاقة؛ أما الاستخدام الحي فهو ميزة منفصلة ضمن خطة مدفوعة."
      }
    },
    "status": "active",
    "ends_at": null
  },
  {
    "id": "certavert-ssl-monitoring",
    "description_en": "CertAvert offers free SSL/TLS monitoring with no card. Its monitoring page says the free plan covers up to 15 domains, while its registration page says up to 3; the provider’s official pages conflict, so the exact limit is unresolved.",
    "description_ar": "تقدم CertAvert مراقبة SSL/TLS مجانية ومن دون بطاقة. تذكر صفحة المراقبة أن الخطة المجانية تشمل حتى 15 نطاقًا، بينما تذكر صفحة التسجيل حتى 3؛ تتعارض الصفحات الرسمية، لذلك لا يُحسم الحد الدقيق.",
    "benefits": [
      {
        "type": "free_access",
        "description": {
          "en": "Free SSL/TLS monitoring with no card; the published domain limit conflicts between official pages.",
          "ar": "مراقبة SSL/TLS مجانية بلا بطاقة؛ ويتعارض الحد المنشور للنطاقات بين الصفحات الرسمية."
        }
      }
    ],
    "eligibility": {
      "new_account": "no",
      "card_required": "no",
      "countries": {
        "status": "unknown",
        "values": []
      },
      "conditions": {
        "en": "The monitoring page says 15 domains while the registration page says 3; do not rely on a single exact domain limit.",
        "ar": "تذكر صفحة المراقبة 15 نطاقًا بينما تذكر صفحة التسجيل 3؛ لا تعتمد حدًا واحدًا دقيقًا للنطاقات."
      },
      "applicant_type": "unknown",
      "open_to_all": "unknown",
      "phone_required": "unknown",
      "student_status": "unknown"
    },
    "registration": {
      "deadline": {
        "date": null,
        "status": "ongoing"
      },
      "credit_validity": {
        "unit": null,
        "duration": null,
        "status": "unknown"
      },
      "steps": {
        "en": "Review both the monitoring and registration pages because their domain limits differ.",
        "ar": "راجع صفحتي المراقبة والتسجيل لأن حد النطاقات يختلف بينهما."
      }
    },
    "official_sources": [
      {
        "url": "https://certavert.com/monitoring",
        "title": "CertAvert monitoring plans",
        "claims": [
          {
            "field": "description_en",
            "value": "supported",
            "evidence": "Lists free SSL/TLS monitoring up to 15 domains, free forever, no card."
          }
        ]
      },
      {
        "url": "https://certavert.com/register",
        "title": "CertAvert registration",
        "claims": [
          {
            "field": "description_en",
            "value": "supported",
            "evidence": "States the free plan is for up to 3 domains and no card is needed."
          }
        ]
      },
      {
        "url": "https://certavert.com/terms",
        "title": "CertAvert terms",
        "claims": [
          {
            "field": "description_en",
            "value": "supported",
            "evidence": "Describes the free monitoring tier but does not resolve the 3-versus-15 conflict."
          }
        ]
      }
    ],
    "get_offer": {
      "url": "https://certavert.com/monitoring",
      "type": "official",
      "label": {
        "en": "Official CertAvert monitoring plans",
        "ar": "خطط مراقبة CertAvert الرسمية"
      }
    },
    "review": {
      "verdict": "verified",
      "verification_status": "supported",
      "reviewed_on": "2026-11-03",
      "verified_on": "2026-11-03",
      "reviewed_at": "2026-11-03",
      "offer_status": "active",
      "unknown_fields": [
        "other_signup_restrictions",
        "country eligibility"
      ],
      "notes": {
        "en": "The free/no-card offer is supported, but the official pages disagree on the exact domain limit.",
        "ar": "العرض المجاني ومن دون بطاقة مدعوم، لكن الصفحات الرسمية تختلف في حد النطاقات الدقيق."
      }
    },
    "status": "active",
    "ends_at": null
  },
  {
    "id": "yepapi-5-credit",
    "description_en": "YepAPI advertises $5 signup credit with no card; its official FAQ says new accounts in most countries receive the credit, but it does not publish the country list or a 45-day expiry. A unified key supports AI-model and SEO/data APIs; the homepage says AI-model access unlocks after a first top-up.",
    "description_ar": "تعلن YepAPI عن رصيد تسجيل بقيمة $5 ومن دون بطاقة؛ وتذكر الأسئلة الرسمية أن الحسابات الجديدة في معظم البلدان تحصل على الرصيد، لكنها لا تنشر قائمة البلدان ولا تثبت صلاحية 45 يومًا. يدعم المفتاح الموحد واجهات النماذج وواجهات SEO والبيانات؛ ويذكر الموقع أن الوصول إلى النماذج يتطلب أول تعبئة.",
    "benefits": [
      {
        "type": "free_quota",
        "description": {
          "en": "$5 signup credit; no official 45-day expiry was found.",
          "ar": "$5 رصيد عند التسجيل؛ لم يُعثر على مدة صلاحية رسمية قدرها 45 يومًا."
        },
        "amount": {
          "unit": "USD",
          "value": 5,
          "currency": "USD"
        },
        "frequency": "signup"
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
        "en": "The official FAQ says signup credits are available in most countries but provides no country list. The claimed 45-day expiry is not documented.",
        "ar": "تذكر الأسئلة الرسمية أن رصيد التسجيل متاح في معظم البلدان من دون نشر قائمة البلدان. لم تُوثق صلاحية 45 يومًا المزعومة."
      },
      "applicant_type": "unknown",
      "open_to_all": "unknown",
      "phone_required": "unknown",
      "student_status": "unknown"
    },
    "registration": {
      "deadline": {
        "date": null,
        "status": "ongoing"
      },
      "credit_validity": {
        "unit": null,
        "duration": null,
        "status": "unknown"
      },
      "steps": {
        "en": "Create a new account; check current country eligibility and model top-up requirements.",
        "ar": "أنشئ حسابًا جديدًا؛ وتحقق من أهلية بلدك ومتطلبات تعبئة رصيد النماذج."
      }
    },
    "official_sources": [
      {
        "url": "https://www.yepapi.com/ai-api/openai/gpt-5.5",
        "title": "YepAPI GPT API offer page",
        "claims": [
          {
            "field": "description_en",
            "value": "supported",
            "evidence": "States $5 signup credit, no card, and that new accounts in most countries receive free signup credit; no 45-day expiry is stated."
          }
        ]
      },
      {
        "url": "https://www.yepapi.com/",
        "title": "YepAPI homepage",
        "claims": [
          {
            "field": "description_en",
            "value": "supported",
            "evidence": "Describes the shared key for AI and SEO/data APIs and says AI models unlock after a first top-up."
          }
        ]
      },
      {
        "url": "https://www.yepapi.com/ai-api",
        "title": "YepAPI AI API catalog",
        "claims": [
          {
            "field": "description_en",
            "value": "supported",
            "evidence": "Lists GPT, Claude, Gemini, DeepSeek, Llama and Qwen through an OpenAI-compatible endpoint."
          }
        ]
      }
    ],
    "get_offer": {
      "url": "https://www.yepapi.com/ai-api/openai/gpt-5.5",
      "type": "official",
      "label": {
        "en": "Official YepAPI signup offer",
        "ar": "عرض التسجيل الرسمي من YepAPI"
      }
    },
    "review": {
      "verdict": "verified",
      "verification_status": "supported",
      "reviewed_on": "2026-11-03",
      "verified_on": "2026-11-03",
      "reviewed_at": "2026-11-03",
      "offer_status": "active",
      "unknown_fields": [
        "credit expiration",
        "country eligibility"
      ],
      "notes": {
        "en": "No source reviewed states a 45-day expiry or gives the country list.",
        "ar": "لم يذكر أي مصدر تمت مراجعته مدة صلاحية 45 يومًا أو قائمة البلدان."
      }
    },
    "status": "active",
    "ends_at": null
  },
  {
    "id": "serpkite-search-credits",
    "description_en": "SerpKite offers up to 2,500 signup credits: 1,000 after email verification plus 1,500 after linking GitHub or Google. If its monthly signup budget is exhausted, later accounts may receive less. Verified accounts get 1,000 monthly credits; no card is required.",
    "description_ar": "تقدم SerpKite حتى 2,500 رصيد عند التسجيل: 1,000 بعد تأكيد البريد و1,500 إضافية بعد ربط GitHub أو Google. إذا نفدت ميزانية التسجيل الشهرية فقد تحصل الحسابات اللاحقة على أقل. تحصل الحسابات الموثقة على 1,000 رصيد شهريًا ومن دون بطاقة.",
    "benefits": [
      {
        "type": "free_quota",
        "description": {
          "en": "Up to 2,500 signup credits under the stated verification/linking conditions, then 1,000 monthly for verified accounts.",
          "ar": "حتى 2,500 رصيد تسجيل وفق شروط التحقق والربط، ثم 1,000 شهريًا للحسابات الموثقة."
        },
        "amount": {
          "unit": "credits",
          "value": 2500
        },
        "frequency": "signup plus monthly"
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
        "en": "Signup total requires email verification and linking GitHub or Google; after the monthly signup budget is exhausted, amounts may be lower. Country eligibility is unknown.",
        "ar": "يتطلب مجموع رصيد التسجيل تأكيد البريد وربط GitHub أو Google؛ وقد تقل الكمية بعد نفاد ميزانية التسجيل الشهرية. أهلية البلدان غير معلومة."
      },
      "applicant_type": "unknown",
      "open_to_all": "unknown",
      "phone_required": "unknown",
      "student_status": "unknown"
    },
    "registration": {
      "deadline": {
        "date": null,
        "status": "ongoing"
      },
      "credit_validity": {
        "unit": null,
        "duration": null,
        "status": "unknown"
      },
      "steps": {
        "en": "Verify your email, then link GitHub or Google to claim the additional credits.",
        "ar": "أكد بريدك ثم اربط GitHub أو Google للمطالبة بالرصيد الإضافي."
      }
    },
    "official_sources": [
      {
        "url": "https://serpkite.com/pricing",
        "title": "SerpKite pricing",
        "claims": [
          {
            "field": "description_en",
            "value": "supported",
            "evidence": "Breaks signup credits into 1,000 after email verification plus 1,500 after GitHub/Google linking; says later signups may receive 250+up to 250 after the monthly budget is exhausted; 1,000 monthly for verified accounts; no card."
          }
        ]
      },
      {
        "url": "https://serpkite.com/docs/quickstart",
        "title": "SerpKite quickstart",
        "claims": [
          {
            "field": "description_en",
            "value": "supported",
            "evidence": "Confirms signup/linking credits and no-card access."
          }
        ]
      }
    ],
    "get_offer": {
      "url": "https://serpkite.com/pricing",
      "type": "official",
      "label": {
        "en": "Official SerpKite pricing",
        "ar": "تسعير SerpKite الرسمي"
      }
    },
    "review": {
      "verdict": "verified",
      "verification_status": "supported",
      "reviewed_on": "2026-11-03",
      "verified_on": "2026-11-03",
      "reviewed_at": "2026-11-03",
      "offer_status": "active",
      "unknown_fields": [
        "country eligibility"
      ],
      "notes": {
        "en": "The 2,500 total is conditional and can be reduced after the monthly signup budget is exhausted.",
        "ar": "إجمالي 2,500 مشروط وقد ينخفض بعد نفاد ميزانية التسجيل الشهرية."
      }
    },
    "status": "active",
    "ends_at": null
  },
  {
    "id": "fish-audio-s21-pro-free",
    "description_en": "Fish Audio’s S2.1 Pro Free API is available at no charge through November 30, 2026, with no card, under its Fair Use Policy. There are no uptime/latency guarantees, and requests may be used to improve model quality.",
    "description_ar": "تتوفر واجهة Fish Audio S2.1 Pro Free مجانًا حتى 30 نوفمبر 2026 ومن دون بطاقة، وفق سياسة الاستخدام العادل. لا توجد ضمانات للجاهزية أو زمن الاستجابة، وقد تُستخدم الطلبات لتحسين جودة النموذج.",
    "benefits": [
      {
        "type": "free_access",
        "description": {
          "en": "S2.1 Pro Free TTS API through 2026-11-30 under fair use.",
          "ar": "واجهة TTS مجانية لنموذج S2.1 Pro حتى 2026-11-30 وفق الاستخدام العادل."
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
        "en": "Fair Use limits apply; no uptime/latency guarantees. Requests may be used to improve model quality. Country eligibility is unknown.",
        "ar": "تطبق حدود الاستخدام العادل؛ ولا توجد ضمانات للجاهزية أو زمن الاستجابة. قد تُستخدم الطلبات لتحسين جودة النموذج. أهلية البلدان غير معلومة."
      },
      "applicant_type": "unknown",
      "open_to_all": "unknown",
      "phone_required": "unknown",
      "student_status": "unknown"
    },
    "registration": {
      "deadline": {
        "date": "2026-11-30",
        "status": "known"
      },
      "credit_validity": {
        "unit": null,
        "duration": null,
        "status": "unknown"
      },
      "steps": {
        "en": "Create an API key and use the S2.1 Pro Free model before the stated cutoff.",
        "ar": "أنشئ مفتاح API واستخدم نموذج S2.1 Pro Free قبل الموعد المحدد."
      }
    },
    "official_sources": [
      {
        "url": "https://fish.audio/blog/s2-1-pro-free-api/",
        "title": "S2.1 Pro Free announcement",
        "claims": [
          {
            "field": "description_en",
            "value": "supported",
            "evidence": "States free API through 2026-11-30, no card, Fair Use Policy, no SLA/latency guarantees, and requests may be used to improve quality."
          }
        ]
      },
      {
        "url": "https://fish.audio/developers/",
        "title": "Fish Audio developer page",
        "claims": [
          {
            "field": "description_en",
            "value": "supported",
            "evidence": "Lists S2.1 Pro Free at $0 and no card required."
          }
        ]
      }
    ],
    "get_offer": {
      "url": "https://fish.audio/developers/",
      "type": "official",
      "label": {
        "en": "Official Fish Audio developer page",
        "ar": "صفحة المطورين الرسمية من Fish Audio"
      }
    },
    "review": {
      "verdict": "verified",
      "verification_status": "supported",
      "reviewed_on": "2026-11-03",
      "verified_on": "2026-11-03",
      "reviewed_at": "2026-11-03",
      "offer_status": "active",
      "unknown_fields": [
        "country eligibility"
      ],
      "notes": {
        "en": "The offer is time-limited; Fair Use and data-use terms apply.",
        "ar": "العرض محدد المدة؛ وتطبق سياسة الاستخدام العادل وشروط استخدام البيانات."
      }
    },
    "status": "active",
    "ends_at": null
  },
  {
    "id": "cometapi-free-trial",
    "description_en": "CometAPI offers an OpenAI-compatible API for 500+ models with free test credits at signup and no card required to start. The official public pages do not state the numeric signup-credit amount.",
    "description_ar": "تقدم CometAPI واجهة متوافقة مع OpenAI لأكثر من 500 نموذج، مع رصيد اختبار مجاني عند التسجيل ومن دون بطاقة للبدء. لا تذكر الصفحات الرسمية العامة مقدار رصيد التسجيل رقميًا.",
    "benefits": [
      {
        "type": "free_quota",
        "description": {
          "en": "Signup test credits are included; the official amount is not published.",
          "ar": "يتضمن التسجيل أرصدة اختبار؛ ولم يُنشر مقدارها رسميًا."
        },
        "frequency": "signup"
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
        "en": "The signup-credit amount is not stated publicly. Country eligibility is unknown.",
        "ar": "لم يُذكر مقدار رصيد التسجيل علنًا. أهلية البلدان غير معلومة."
      },
      "applicant_type": "unknown",
      "open_to_all": "unknown",
      "phone_required": "unknown",
      "student_status": "unknown"
    },
    "registration": {
      "deadline": {
        "date": null,
        "status": "ongoing"
      },
      "credit_validity": {
        "unit": null,
        "duration": null,
        "status": "unknown"
      },
      "steps": {
        "en": "Create an account and check the dashboard for the current test-credit amount.",
        "ar": "أنشئ حسابًا وتحقق من لوحة التحكم لمعرفة مقدار رصيد الاختبار الحالي."
      }
    },
    "official_sources": [
      {
        "url": "https://cometapi.com/",
        "title": "CometAPI homepage",
        "claims": [
          {
            "field": "description_en",
            "value": "supported",
            "evidence": "States 500+ models, OpenAI compatibility, signup test credits and no card required."
          }
        ]
      },
      {
        "url": "https://www.cometapi.com/quickstart/",
        "title": "CometAPI quickstart",
        "claims": [
          {
            "field": "description_en",
            "value": "supported",
            "evidence": "Confirms free signup credits and no card to start; no numeric amount is given."
          }
        ]
      }
    ],
    "get_offer": {
      "url": "https://cometapi.com/",
      "type": "official",
      "label": {
        "en": "Official CometAPI site",
        "ar": "موقع CometAPI الرسمي"
      }
    },
    "review": {
      "verdict": "verified",
      "verification_status": "supported",
      "reviewed_on": "2026-11-03",
      "verified_on": "2026-11-03",
      "reviewed_at": "2026-11-03",
      "offer_status": "active",
      "unknown_fields": [
        "benefits.0.amount",
        "country eligibility"
      ],
      "notes": {
        "en": "The free trial is supported, but its numeric credit amount is not published.",
        "ar": "الفترة التجريبية المجانية مدعومة، لكن مقدار الرصيد غير منشور."
      }
    },
    "status": "active",
    "ends_at": null
  },
  {
    "id": "heygen-voice-turbo-free",
    "description_en": "HeyGen Voice Turbo Free is priced at $0 per million characters through November 30, 2026, with no card. It is best-effort shared capacity: uptime and latency are not guaranteed, and requests may return HTTP 429 when capacity is full.",
    "description_ar": "تبلغ كلفة HeyGen Voice Turbo Free صفرًا لكل مليون حرف حتى 30 نوفمبر 2026 ومن دون بطاقة. الخدمة تعتمد سعة مشتركة بأفضل جهد؛ لا توجد ضمانات للجاهزية أو زمن الاستجابة، وقد ترجع الطلبات HTTP 429 عند امتلاء السعة.",
    "benefits": [
      {
        "type": "free_usage",
        "description": {
          "en": "$0 per million characters through 2026-11-30.",
          "ar": "$0 لكل مليون حرف حتى 2026-11-30."
        },
        "amount": {
          "unit": "characters",
          "value": 0,
          "currency": "USD"
        },
        "frequency": "per million"
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
        "en": "Shared free capacity is best-effort; uptime/latency are not guaranteed and HTTP 429 may occur when capacity is full. Country eligibility is unknown.",
        "ar": "السعة المجانية المشتركة تُقدم بأفضل جهد؛ ولا توجد ضمانات للجاهزية أو زمن الاستجابة وقد يحدث HTTP 429 عند امتلاء السعة. أهلية البلدان غير معلومة."
      },
      "applicant_type": "unknown",
      "open_to_all": "unknown",
      "phone_required": "unknown",
      "student_status": "unknown"
    },
    "registration": {
      "deadline": {
        "date": "2026-11-30",
        "status": "known"
      },
      "credit_validity": {
        "unit": null,
        "duration": null,
        "status": "unknown"
      },
      "steps": {
        "en": "Create a HeyGen account and API key; use the free model before the stated cutoff.",
        "ar": "أنشئ حساب HeyGen ومفتاح API واستخدم النموذج المجاني قبل الموعد المحدد."
      }
    },
    "official_sources": [
      {
        "url": "https://www.heygen.com/blog/heygen-voice-turbo",
        "title": "HeyGen Voice Turbo announcement",
        "claims": [
          {
            "field": "description_en",
            "value": "supported",
            "evidence": "States $0 per million characters until 2026-11-30, no card, best-effort service, no uptime/latency guarantee and 429 when free capacity is full."
          }
        ]
      },
      {
        "url": "https://developers.heygen.com/docs/models/heygen-voice",
        "title": "HeyGen Voice model docs",
        "claims": [
          {
            "field": "description_en",
            "value": "supported",
            "evidence": "Confirms the free period, shared capacity, no availability/response-time guarantee and possible 429."
          }
        ]
      }
    ],
    "get_offer": {
      "url": "https://www.heygen.com/blog/heygen-voice-turbo",
      "type": "official",
      "label": {
        "en": "Official HeyGen Voice Turbo offer",
        "ar": "عرض HeyGen Voice Turbo الرسمي"
      }
    },
    "review": {
      "verdict": "verified",
      "verification_status": "supported",
      "reviewed_on": "2026-11-03",
      "verified_on": "2026-11-03",
      "reviewed_at": "2026-11-03",
      "offer_status": "active",
      "unknown_fields": [
        "country eligibility"
      ],
      "notes": {
        "en": "Official wording is no uptime/latency or availability guarantee; it does not specifically use the phrase “no SLA.”",
        "ar": "الصياغة الرسمية تنفي ضمان الجاهزية أو زمن الاستجابة؛ ولا تستخدم تحديدًا عبارة «لا توجد SLA»."
      }
    },
    "status": "active",
    "ends_at": null
  },
  {
    "id": "marsai-5m-credits",
    "description_en": "MarsAI docs state that new accounts receive 10M signup credits and can claim an additional 5M after Discord and Telegram verification; credits are valid for 7 days. The homepage says no card is needed. Official pages conflict on free-tier request limits, so no numeric rate limit is asserted.",
    "description_ar": "تذكر وثائق MarsAI أن الحسابات الجديدة تحصل على 10 ملايين رصيد تسجيل ويمكنها المطالبة بـ5 ملايين إضافية بعد توثيق Discord وTelegram؛ وصلاحية الأرصدة 7 أيام. يذكر الموقع أنه لا حاجة لبطاقة. تتعارض الصفحات الرسمية بشأن حدود الطلبات للفئة المجانية، لذلك لا نثبت حدًا رقميًا.",
    "benefits": [
      {
        "type": "free_quota",
        "description": {
          "en": "10M signup credits plus a 5M Discord/Telegram verification bonus, valid 7 days.",
          "ar": "10 ملايين رصيد تسجيل إضافة إلى مكافأة توثيق Discord/Telegram بقيمة 5 ملايين، صالحة 7 أيام."
        },
        "amount": {
          "unit": "credits",
          "value": 15000000
        },
        "duration": {
          "unit": "day",
          "value": 7,
          "status": "known"
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
        "en": "Discord and Telegram verification claims an additional 5M credits; official pages disagree on free-tier rate limits, which are omitted.",
        "ar": "يمنح توثيق Discord وTelegram رصيدًا إضافيًا قدره 5 ملايين؛ وتختلف الصفحات الرسمية بشأن حدود الطلبات التي تم حذفها من الوصف."
      },
      "applicant_type": "unknown",
      "open_to_all": "unknown",
      "phone_required": "unknown",
      "student_status": "unknown"
    },
    "registration": {
      "deadline": {
        "date": null,
        "status": "ongoing"
      },
      "credit_validity": {
        "unit": "day",
        "duration": 7,
        "status": "known"
      },
      "steps": {
        "en": "Create an account, then verify Discord and Telegram to claim the additional bonus.",
        "ar": "أنشئ حسابًا ثم وثّق Discord وTelegram للمطالبة بالمكافأة الإضافية."
      }
    },
    "official_sources": [
      {
        "url": "https://marsai.click/",
        "title": "MarsAI homepage",
        "claims": [
          {
            "field": "description_en",
            "value": "supported",
            "evidence": "Advertises a 5M verification credit bonus valid 7 days and says no card is needed; gives a 10 RPM/100 per day free-tier limit."
          }
        ]
      },
      {
        "url": "https://marsai.click/docs",
        "title": "MarsAI documentation",
        "claims": [
          {
            "field": "description_en",
            "value": "supported",
            "evidence": "States 10M signup credits plus a 5M verification bonus, 7-day validity, and conflicting free-tier rate-limit values."
          }
        ]
      }
    ],
    "get_offer": {
      "url": "https://marsai.click/",
      "type": "official",
      "label": {
        "en": "Official MarsAI site",
        "ar": "موقع MarsAI الرسمي"
      }
    },
    "review": {
      "verdict": "verified",
      "verification_status": "supported",
      "reviewed_on": "2026-11-03",
      "verified_on": "2026-11-03",
      "reviewed_at": "2026-11-03",
      "offer_status": "active",
      "unknown_fields": [
        "other_signup_restrictions",
        "country eligibility"
      ],
      "notes": {
        "en": "The 10M+5M total is documented; free-tier rate limits conflict across official pages and remain unspecified here.",
        "ar": "إجمالي 10+5 ملايين موثق؛ لكن حدود الطلبات تختلف بين الصفحات الرسمية وتظل غير محددة هنا."
      }
    },
    "status": "active",
    "ends_at": null
  },
  {
    "id": "free-ai-30k-tokens",
    "description_en": "Free.ai provides 30,000 tokens per 24 hours to free accounts after email confirmation; anonymous users receive 6,000 per day. Its API is OpenAI-compatible and no card is required. Country eligibility for the specific signup-credit offer is not specified.",
    "description_ar": "توفر Free.ai عدد 30,000 توكن لكل 24 ساعة للحسابات المجانية بعد تأكيد البريد؛ ويحصل المستخدم المجهول على 6,000 يوميًا. واجهتها متوافقة مع OpenAI ولا تُطلب بطاقة. أهلية البلدان لهذا العرض عند التسجيل غير محددة.",
    "benefits": [
      {
        "type": "free_quota",
        "description": {
          "en": "30,000 tokens per 24 hours for confirmed accounts; 6,000 for anonymous users.",
          "ar": "30,000 توكن لكل 24 ساعة للحسابات المؤكدة؛ و6,000 للمستخدمين المجهولين."
        },
        "amount": {
          "unit": "tokens",
          "value": 30000
        },
        "frequency": "24 hours"
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
        "en": "Email confirmation unlocks the 30,000-token free pool; country eligibility for this specific offer is unknown.",
        "ar": "يفتح تأكيد البريد حصة 30,000 توكن المجانية؛ وأهلية البلدان لهذا العرض تحديدًا غير معلومة."
      },
      "applicant_type": "unknown",
      "open_to_all": "unknown",
      "phone_required": "unknown",
      "student_status": "unknown"
    },
    "registration": {
      "deadline": {
        "date": null,
        "status": "ongoing"
      },
      "credit_validity": {
        "unit": null,
        "duration": null,
        "status": "unknown"
      },
      "steps": {
        "en": "Sign up free and confirm your email to access the 30,000-token pool.",
        "ar": "سجل مجانًا وأكد بريدك للوصول إلى حصة 30,000 توكن."
      }
    },
    "official_sources": [
      {
        "url": "https://free.ai/pricing/",
        "title": "Free.ai pricing",
        "claims": [
          {
            "field": "description_en",
            "value": "supported",
            "evidence": "States confirmed accounts receive 30,000 tokens/day with a 24-hour reset."
          }
        ]
      },
      {
        "url": "https://free.ai/",
        "title": "Free.ai homepage",
        "claims": [
          {
            "field": "description_en",
            "value": "supported",
            "evidence": "States anonymous users receive 6,000 tokens/day and signed-up users get 30,000/day; no card required."
          }
        ]
      },
      {
        "url": "https://free.ai/api/",
        "title": "Free.ai API docs",
        "claims": [
          {
            "field": "description_en",
            "value": "supported",
            "evidence": "Documents OpenAI-compatible chat API and free plan."
          }
        ]
      }
    ],
    "get_offer": {
      "url": "https://free.ai/",
      "type": "official",
      "label": {
        "en": "Official Free.ai site",
        "ar": "موقع Free.ai الرسمي"
      }
    },
    "review": {
      "verdict": "verified",
      "verification_status": "supported",
      "reviewed_on": "2026-11-03",
      "verified_on": "2026-11-03",
      "reviewed_at": "2026-11-03",
      "offer_status": "active",
      "unknown_fields": [
        "country eligibility"
      ],
      "notes": {
        "en": "The provider says the service is available worldwide in 99 languages, but does not publish offer-specific country eligibility; that remains unknown.",
        "ar": "يقول المزوّد إن الخدمة متاحة عالميًا بـ99 لغة، لكنه لا ينشر أهلية البلدان الخاصة بهذا العرض؛ وتظل غير معلومة."
      }
    },
    "status": "active",
    "ends_at": null
  }
]
$corrections$::jsonb) AS x(
    id text,
    description_ar text,
    description_en text,
    benefits jsonb,
    eligibility jsonb,
    registration jsonb,
    official_sources jsonb,
    get_offer jsonb,
    review jsonb,
    status text,
    ends_at timestamptz
  )
)
UPDATE public.deals AS d
SET description_ar = c.description_ar,
    description_en = c.description_en,
    benefits = c.benefits,
    eligibility = c.eligibility,
    registration = c.registration,
    official_sources = c.official_sources,
    get_offer = c.get_offer,
    review = c.review,
    status = c.status,
    ends_at = c.ends_at
FROM corrections AS c
WHERE d.id = c.id
RETURNING d.id, d.slug, d.status, d.review->>'verdict' AS verdict,
          d.review->>'verification_status' AS evidence_status;
