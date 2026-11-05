export type AiModelAccessType = 'direct' | 'gateway' | 'broker' | 'unknown';
export type AiModelTierType = 'trial' | 'quota' | 'permanent' | 'unknown';
export type AiModelEvidenceStatus = 'verified' | 'partial' | 'unknown';
export type AiModelCapability = 'chat' | 'coding' | 'reasoning' | 'vision' | 'tool-calling' | 'audio' | 'video' | 'pdf';
export type AiModelModality = 'text' | 'image' | 'audio' | 'video' | 'pdf';
export type AiModelUnknownPolicy = 'not_required' | 'required' | 'unknown';

export interface FreeAiModelEntry {
  id: string;
  slug: string;
  name: string;
  modelId: string;
  developer: string;
  providerId: string;
  providerName: string;
  providerNameAr: string;
  accessType: AiModelAccessType;
  tierType: AiModelTierType;
  tierLabel: { ar: string; en: string };
  description: { ar: string; en: string };
  trialLimits: { ar: string; en: string };
  contextTokens: number | null;
  modalities: readonly AiModelModality[];
  outputModalities: readonly AiModelModality[];
  capabilities: readonly AiModelCapability[];
  cardPolicy: AiModelUnknownPolicy;
  phonePolicy: AiModelUnknownPolicy;
  evidenceStatus: AiModelEvidenceStatus;
  verifiedDate: string;
  officialUrl: string;
  termsUrl: string | null;
}

export interface AiModelProvider {
  id: string;
  name: string;
  nameAr: string;
  type: AiModelAccessType;
  officialUrl: string;
  summary: { ar: string; en: string };
}

export const FREE_AI_MODELS_DIRECTORY_LAST_VERIFIED = '2026-11-05';

// Records below are model/provider facts checked against official provider sources.
// User-supplied freellm.net files were used only to discover candidates; their scores,
// free-tier flags, quotas, card/phone claims and aggregate counts are not used here.
export const FREE_AI_MODEL_PROVIDERS: readonly AiModelProvider[] = [
  {
    id: 'nvidia-nim',
    name: 'NVIDIA NIM',
    nameAr: 'إنفيديا NIM',
    type: 'direct',
    officialUrl: 'https://build.nvidia.com/',
    summary: {
      ar: 'توفّر NVIDIA نقاط API للنمذجة الأولية المجانية وفق حدودها وشروط التجربة؛ لا يعني ذلك استخدامًا إنتاجيًا أو مجانيًا دائمًا.',
      en: 'NVIDIA offers API endpoints for free prototyping under its rate limits and trial terms; this does not mean production access or a permanently free service.',
    },
  },
  {
    id: 'google-gemini',
    name: 'Google Gemini API',
    nameAr: 'واجهة Google Gemini',
    type: 'direct',
    officialUrl: 'https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash',
    summary: {
      ar: 'توفّر Google طبقة مجانية لواجهة Gemini API بحصص تختلف حسب المشروع والمستوى؛ تفاصيل الأسعار والحدود مرتبطة بالمصادر الرسمية.',
      en: 'Google provides a Gemini API free tier with quotas that vary by project and tier; pricing and limits are linked to official documentation.',
    },
  },
];

export const FREE_AI_MODEL_ENTRIES: readonly FreeAiModelEntry[] = [
  {
    id: 'nvidia-nim-z-ai-glm-5-3-flash',
    slug: 'z-ai-glm-5-3-flash',
    name: 'GLM-5.3-Flash',
    modelId: 'z-ai/glm-5.3-flash',
    developer: 'Z.ai',
    providerId: 'nvidia-nim',
    providerName: 'NVIDIA NIM',
    providerNameAr: 'إنفيديا NIM',
    accessType: 'direct',
    tierType: 'trial',
    tierLabel: { ar: 'تجريبي محدود — للاختبار الداخلي', en: 'Limited trial — internal evaluation' },
    description: {
      ar: 'نموذج من تطوير Z.ai متاح عبر NVIDIA Build. تؤكد صفحة NVIDIA إدخال النص والصورة، والاستدلال واستدعاء الأدوات، وسياقًا يصل إلى 1,048,576 رمزًا.',
      en: 'A Z.ai model available through NVIDIA Build. NVIDIA confirms text and image input, reasoning, tool calling, and context up to 1,048,576 tokens.',
    },
    trialLimits: {
      ar: 'شروط NVIDIA تصف وصولًا تجريبيًا محدود المدة والاستخدام، للاختبار والتقييم الداخلي فقط وليس للإنتاج. قد تُمنح أرصدة محدودة؛ لا تنشر الصفحة المفتوحة حصة أو سعرًا خاصًا بهذا النموذج.',
      en: 'NVIDIA terms describe limited trial access for internal testing and evaluation only, not production. Limited credits may be offered; the opened model page does not publish a model-specific quota or price.',
    },
    contextTokens: 1_048_576,
    modalities: ['text', 'image'],
    outputModalities: ['text'],
    capabilities: ['chat', 'coding', 'reasoning', 'vision', 'tool-calling'],
    cardPolicy: 'unknown',
    phonePolicy: 'unknown',
    evidenceStatus: 'partial',
    verifiedDate: '2026-11-05',
    officialUrl: 'https://build.nvidia.com/z-ai/glm-5-3-flash/modelcard',
    termsUrl: 'https://assets.ngc.nvidia.com/products/api-catalog/legal/NVIDIA%20API%20Trial%20Terms%20of%20Service.pdf',
  },
  {
    id: 'nvidia-deepseek-v4-1-flash',
    slug: 'deepseek-v4-1-flash',
    name: 'DeepSeek V4.1 Flash',
    modelId: 'deepseek-ai/deepseek-v4.1-flash',
    developer: 'DeepSeek-AI',
    providerId: 'nvidia-nim',
    providerName: 'NVIDIA NIM',
    providerNameAr: 'إنفيديا NIM',
    accessType: 'direct',
    tierType: 'trial',
    tierLabel: { ar: 'تجريبي محدود — للاختبار الداخلي', en: 'Limited trial — internal evaluation' },
    description: {
      ar: 'نموذج من تطوير DeepSeek-AI مستضاف عبر NVIDIA NIM. توثّق NVIDIA إدخال النص والصورة، والاستدلال واستدعاء الدوال، وسياقًا يصل إلى 1,048,576 رمزًا.',
      en: 'A DeepSeek-AI model hosted through NVIDIA NIM. NVIDIA documents text and image input, reasoning, function calling, and context up to 1,048,576 tokens.',
    },
    trialLimits: {
      ar: 'تخضع واجهة NVIDIA لشروط تجربة محدودة المدة والاستخدام. قد تمنح NVIDIA أرصدة تُخصم حسب الاستعمال؛ يلزم اشتراك بعد نفادها أو للإنتاج. لا توجد حصة رقمية خاصة بالنموذج منشورة في الصفحات التي راجعناها.',
      en: 'NVIDIA API access is subject to limited trial terms. NVIDIA may provide credits that are consumed with usage; a subscription is required after they run out or for production. The reviewed pages do not publish a numeric model-specific quota.',
    },
    contextTokens: 1_048_576,
    modalities: ['text', 'image'],
    outputModalities: ['text'],
    capabilities: ['chat', 'coding', 'reasoning', 'vision', 'tool-calling'],
    cardPolicy: 'unknown',
    phonePolicy: 'unknown',
    evidenceStatus: 'partial',
    verifiedDate: '2026-11-05',
    officialUrl: 'https://build.nvidia.com/deepseek-ai/deepseek-v4.1-flash',
    termsUrl: 'https://assets.ngc.nvidia.com/products/api-catalog/legal/NVIDIA%20API%20Trial%20Terms%20of%20Service.pdf',
  },
  {
    id: 'nvidia-minimax-m3-1-flash',
    slug: 'minimax-m3-1-flash',
    name: 'MiniMax M3.1 Flash',
    modelId: 'minimaxai/minimax-m3.1-flash',
    developer: 'MiniMax',
    providerId: 'nvidia-nim',
    providerName: 'NVIDIA NIM',
    providerNameAr: 'إنفيديا NIM',
    accessType: 'direct',
    tierType: 'trial',
    tierLabel: { ar: 'تجريبي محدود — للنمذجة الأولية', en: 'Limited free prototyping trial' },
    description: {
      ar: 'نموذج من تطوير MiniMax تعرضه NVIDIA للنمذجة الأولية عبر NIM. تؤكد بطاقة النموذج إدخال النص والصورة، واستدعاء الأدوات، وسياقًا يصل إلى مليون رمز.',
      en: 'A MiniMax model offered by NVIDIA for prototyping through NIM. Its model card confirms text and image input, tool calling, and context up to one million tokens.',
    },
    trialLimits: {
      ar: 'تصف NVIDIA نماذج Build بأنها مجانية للنمذجة الأولية مع حدود لمعدل الطلبات، وتُحكم الخدمة بشروط API Trial المحدودة؛ لا يثبت ذلك وصولًا إنتاجيًا أو مجانيًا دائمًا. لا تعرض الصفحة حدًا شخصيًا لهذا النموذج.',
      en: 'NVIDIA describes Build models as free for prototyping with rate limits, under limited API Trial terms; this does not establish production access or a permanently free service. The page does not publish a personal limit for this model.',
    },
    contextTokens: 1_000_000,
    modalities: ['text', 'image'],
    outputModalities: ['text'],
    capabilities: ['chat', 'coding', 'reasoning', 'vision', 'tool-calling'],
    cardPolicy: 'unknown',
    phonePolicy: 'unknown',
    evidenceStatus: 'partial',
    verifiedDate: '2026-11-05',
    officialUrl: 'https://build.nvidia.com/minimaxai/minimax-m3.1-flash/modelcard',
    termsUrl: 'https://assets.ngc.nvidia.com/products/api-catalog/legal/NVIDIA%20API%20Trial%20Terms%20of%20Service.pdf',
  },
  {
    id: 'nvidia-step-5-preview',
    slug: 'step-5-preview',
    name: 'Step 5 Preview',
    modelId: 'stepfun-ai/step-5-preview',
    developer: 'StepFun',
    providerId: 'nvidia-nim',
    providerName: 'NVIDIA NIM',
    providerNameAr: 'إنفيديا NIM',
    accessType: 'direct',
    tierType: 'trial',
    tierLabel: { ar: 'تجريبي محدود — للنمذجة الأولية', en: 'Limited free prototyping trial' },
    description: {
      ar: 'نموذج من تطوير StepFun متاح عبر NVIDIA Build. توثّق NVIDIA إدخال النص والصورة، والاستدلال واستدعاء الدوال، وسياقًا يصل إلى 1,048,576 رمزًا؛ ولا يدعم توثيق NIM إدخال الفيديو.',
      en: 'A StepFun model available through NVIDIA Build. NVIDIA documents text and image input, reasoning, function calling, and context up to 1,048,576 tokens; NIM documentation does not support video input.',
    },
    trialLimits: {
      ar: 'تصف NVIDIA خدمة Build بأنها مجانية للنمذجة الأولية مع حدود معدل للطلبات، وتخضع لشروط API Trial المحدودة؛ لا يعني ذلك مجانية دائمة أو استخدامًا إنتاجيًا. الحد الشخصي غير منشور في بطاقة النموذج.',
      en: 'NVIDIA describes Build access as free for prototyping with request-rate limits under limited API Trial terms; this does not mean permanently free or production access. A personal limit is not published on the model card.',
    },
    contextTokens: 1_048_576,
    modalities: ['text', 'image'],
    outputModalities: ['text'],
    capabilities: ['chat', 'coding', 'reasoning', 'vision', 'tool-calling'],
    cardPolicy: 'unknown',
    phonePolicy: 'unknown',
    evidenceStatus: 'partial',
    verifiedDate: '2026-11-05',
    officialUrl: 'https://build.nvidia.com/stepfun-ai/step-5-preview/modelcard',
    termsUrl: 'https://assets.ngc.nvidia.com/products/api-catalog/legal/NVIDIA%20API%20Trial%20Terms%20of%20Service.pdf',
  },
  {
    id: 'google-gemini-3-8-flash',
    slug: 'gemini-3-8-flash',
    name: 'Gemini 3.8 Flash',
    modelId: 'gemini-3.8-flash',
    developer: 'Google',
    providerId: 'google-gemini',
    providerName: 'Google Gemini API',
    providerNameAr: 'واجهة Google Gemini',
    accessType: 'direct',
    tierType: 'quota',
    tierLabel: { ar: 'طبقة مجانية — بحصص استخدام', en: 'Free tier — usage quotas apply' },
    description: {
      ar: 'نموذج Google متاح عبر Gemini API وAI Studio. توثّق Google إدخال النص والصورة والفيديو والصوت وPDF، وإخراج النص، وسياق إدخال يصل إلى 1,048,576 رمزًا.',
      en: 'A Google model available through Gemini API and AI Studio. Google documents text, image, video, audio, and PDF input; text output; and an input context window up to 1,048,576 tokens.',
    },
    trialLimits: {
      ar: 'تعرض صفحة أسعار Gemini API طبقة مجانية بسعر 0 دولار لمدخلات ومخرجات النموذج القياسية. تختلف الحصص حسب النموذج والمشروع والمستوى؛ لم تنشر الصفحات التي راجعناها رقم RPM/TPM/RPD لهذا النموذج. يتطلب المستوى المدفوع ربط الفوترة.',
      en: 'The Gemini API pricing page lists a $0 Free Tier for standard model input and output. Quotas vary by model, project, and tier; the reviewed pages do not publish this model’s RPM/TPM/RPD. Paid-tier access requires billing to be enabled.',
    },
    contextTokens: 1_048_576,
    modalities: ['text', 'image', 'video', 'audio', 'pdf'],
    outputModalities: ['text'],
    capabilities: ['chat', 'reasoning', 'vision', 'tool-calling', 'video'],
    cardPolicy: 'unknown',
    phonePolicy: 'unknown',
    evidenceStatus: 'partial',
    verifiedDate: '2026-11-05',
    officialUrl: 'https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash',
    termsUrl: 'https://ai.google.dev/gemini-api/docs/pricing',
  },
];
