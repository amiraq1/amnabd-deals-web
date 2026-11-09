import type {
  SmsSupplier,
  SmsSupplierPrivacy,
  SmsSupplierServiceType,
  SmsSupplierSourceClassification,
  SmsSupplierVerificationStatus,
} from '../content/smsSuppliersDirectory.js';

export type { SmsSupplierSourceClassification, SmsSupplierVerificationStatus };

export type ListedSourceUrlReason =
  | 'needsReview'
  | 'notHttps'
  | 'domainMismatch'
  | 'invalidUrl';

export type ListedSourceUrlResult =
  | { ok: true; url: string }
  | { ok: false; reason: ListedSourceUrlReason };

export const LINK_REASON_MESSAGES: Record<
  ListedSourceUrlReason,
  { ar: string; en: string }
> = {
  needsReview: {
    ar: 'الرابط محجوب لحين مراجعة المصدر',
    en: 'Link withheld until the source is reviewed',
  },
  notHttps: {
    ar: 'الرابط المدرج لا يستخدم HTTPS',
    en: 'The listed link does not use HTTPS',
  },
  domainMismatch: {
    ar: 'الرابط لا يطابق النطاق المسجّل',
    en: 'The link does not match the registered domain',
  },
  invalidUrl: {
    ar: 'الرابط المدرج غير صالح أو غير مكتمل',
    en: 'The listed link is invalid or incomplete',
  },
};

const BLOCKED_HOSTS = ['studentoffers.co', 'www.studentoffers.co'];

export function isListedAsOfficial(supplier: Pick<SmsSupplier, 'sourceClassification'>): boolean {
  return supplier.sourceClassification === 'official';
}

export interface SmsDirectorySummary {
  totalCount: number;
  officialCount: number;
  reviewCount: number;
  badge: { ar: string; en: string };
  title: { ar: string; en: string };
  seoTitle: { ar: string; en: string };
  description: { ar: string; en: string };
  intro: { ar: string; en: string };
}

export function buildSmsDirectorySummary(
  suppliers: readonly Pick<SmsSupplier, 'sourceClassification'>[]
): SmsDirectorySummary {
  const totalCount = suppliers.length;
  const officialCount = suppliers.filter(isListedAsOfficial).length;
  const reviewCount = totalCount - officialCount;

  return {
    totalCount,
    officialCount,
    reviewCount,
    badge: {
      ar: `دليل مستقل — ${totalCount} سجلًا`,
      en: `Standalone directory — ${totalCount} entries`,
    },
    title: {
      ar: `دليل خدمات وأدلة أرقام SMS — ${totalCount} سجلًا`,
      en: `SMS Number Services & Directories — ${totalCount} Entries`,
    },
    seoTitle: {
      ar: `دليل خدمات وأدلة أرقام SMS — ${totalCount} سجلًا — نبض`,
      en: `SMS Number Services & Directories — ${totalCount} Entries — AMNABD Deals`,
    },
    description: {
      ar: `دليل ثنائي اللغة لـ${totalCount} سجلًا من خدمات وأدلة أرقام SMS، مع فصل السجلات الموسومة رسميًا في الملف عن الإدخالات التي تحتاج إلى مراجعة.`,
      en: `A bilingual directory of ${totalCount} SMS number and inbox entries, separating records marked official in the supplied file from entries that need review.`,
    },
    intro: {
      ar: `دليل استرشادي يضم ${totalCount} خدمة ودليلًا لأرقام واستقبال الرسائل، نُقلت كما وردت في قائمة مستقلة. ${officialCount} سجلًا منها يحمل تصنيف مصدر رسمي في الملف، و${reviewCount} سجلًا بحاجة إلى مراجعة. لم نُعِد التحقق من هذه التصنيفات لهذه الصفحة.`,
      en: `An informational directory of ${totalCount} SMS number and reception entries transcribed from an independent list. The source marks ${officialCount} entries as having an official source and ${reviewCount} as needing review; classifications are not independently re-checked for this page.`,
    },
  };
}

export function getListedSourceUrl(
  supplier: Pick<SmsSupplier, 'sourceClassification' | 'url' | 'domain'>
): ListedSourceUrlResult {
  // Step 1: Status check - only official classification allowed to display link
  if (!isListedAsOfficial(supplier)) {
    return { ok: false, reason: 'needsReview' };
  }

  // Step 2: URL parsing and protocol check
  if (!supplier.url || typeof supplier.url !== 'string') {
    return { ok: false, reason: 'invalidUrl' };
  }

  let parsed: URL;
  try {
    parsed = new URL(supplier.url);
  } catch {
    return { ok: false, reason: 'invalidUrl' };
  }

  if (parsed.protocol !== 'https:') {
    return { ok: false, reason: 'notHttps' };
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
  if (!hostname || BLOCKED_HOSTS.includes(hostname)) {
    return { ok: false, reason: 'domainMismatch' };
  }

  // Step 3: Domain match check (exact match or subdomain with leading dot)
  const listedDomain = (supplier.domain ?? '').toLowerCase().replace(/^www\./, '');
  if (!listedDomain) {
    return { ok: false, reason: 'invalidUrl' };
  }

  if (hostname === listedDomain || hostname.endsWith(`.${listedDomain}`)) {
    return { ok: true, url: supplier.url };
  }

  return { ok: false, reason: 'domainMismatch' };
}

export const SMS_PAGE_SIZE = 15;

export interface SmsSupplierFilters {
  query?: string;
  serviceType?: 'all' | SmsSupplierServiceType;
  privacy?: 'all' | SmsSupplierPrivacy;
  status?: 'all' | SmsSupplierSourceClassification;
}

export function filterSuppliers(
  suppliers: readonly SmsSupplier[],
  filters: SmsSupplierFilters,
  lang: 'ar' | 'en' = 'ar'
): SmsSupplier[] {
  const needle = (filters.query ?? '').trim().toLocaleLowerCase(lang);
  const serviceType = filters.serviceType ?? 'all';
  const privacy = filters.privacy ?? 'all';
  const status = filters.status ?? 'all';

  return suppliers.filter((supplier) => {
    const matchesQuery =
      !needle ||
      `${supplier.name} ${supplier.domain} ${supplier.id}`
        .toLocaleLowerCase(lang)
        .includes(needle);
    const matchesType = serviceType === 'all' || supplier.serviceTypes.includes(serviceType);
    const matchesPrivacy = privacy === 'all' || supplier.privacy === privacy;
    const matchesStatus = status === 'all' || supplier.sourceClassification === status;
    return matchesQuery && matchesType && matchesPrivacy && matchesStatus;
  });
}

export function clampPage(page: number, totalItems: number, pageSize: number = SMS_PAGE_SIZE): number {
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.min(Math.floor(page), pageCount);
}

export function paginateSuppliers<T>(
  items: readonly T[],
  page: number,
  pageSize: number = SMS_PAGE_SIZE
): {
  page: number;
  pageCount: number;
  totalItems: number;
  pageRows: T[];
} {
  const totalItems = items.length;
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = clampPage(page, totalItems, pageSize);
  const start = (safePage - 1) * pageSize;
  const pageRows = items.slice(start, start + pageSize);

  return {
    page: safePage,
    pageCount,
    totalItems,
    pageRows,
  };
}

export const VALID_SMS_SERVICE_TYPES: readonly SmsSupplierServiceType[] = [
  'activation', 'rental', 'public', 'app', 'messaging', 'bot', 'unknown',
];
export const VALID_SMS_PRIVACY_TYPES: readonly SmsSupplierPrivacy[] = [
  'private', 'mixed', 'public', 'unknown',
];
export const VALID_SMS_STATUS_TYPES: readonly SmsSupplierSourceClassification[] = [
  'official', 'needsReview',
];

export interface SmsDirectoryUrlState {
  query: string;
  serviceType: 'all' | SmsSupplierServiceType;
  privacy: 'all' | SmsSupplierPrivacy;
  status: 'all' | SmsSupplierSourceClassification;
  page: number;
}

export const SMS_DIRECTORY_DEFAULT_STATE: SmsDirectoryUrlState = {
  query: '',
  serviceType: 'all',
  privacy: 'all',
  status: 'all',
  page: 1,
};

export function hasActiveSmsFilters(
  state: Partial<Pick<SmsDirectoryUrlState, 'query' | 'serviceType' | 'privacy' | 'status'>>
): boolean {
  if (typeof state.query === 'string' && state.query.trim().length > 0) return true;
  if (state.serviceType && state.serviceType !== 'all') return true;
  if (state.privacy && state.privacy !== 'all') return true;
  if (state.status && state.status !== 'all') return true;
  return false;
}

export function parseSmsDirectoryUrlParams(search: string): SmsDirectoryUrlState {
  if (!search || typeof search !== 'string') {
    return { ...SMS_DIRECTORY_DEFAULT_STATE };
  }
  const cleanSearch = search.startsWith('?') ? search.slice(1) : search;
  const params = new URLSearchParams(cleanSearch);

  const rawQ = params.get('q');
  const query = typeof rawQ === 'string' ? rawQ.trim() : '';

  const rawType = params.get('type');
  const serviceType: 'all' | SmsSupplierServiceType =
    rawType && (VALID_SMS_SERVICE_TYPES as readonly string[]).includes(rawType)
      ? (rawType as SmsSupplierServiceType)
      : 'all';

  const rawPrivacy = params.get('privacy');
  const privacy: 'all' | SmsSupplierPrivacy =
    rawPrivacy && (VALID_SMS_PRIVACY_TYPES as readonly string[]).includes(rawPrivacy)
      ? (rawPrivacy as SmsSupplierPrivacy)
      : 'all';

  const rawStatus = params.get('status');
  const status: 'all' | SmsSupplierSourceClassification =
    rawStatus && (VALID_SMS_STATUS_TYPES as readonly string[]).includes(rawStatus)
      ? (rawStatus as SmsSupplierSourceClassification)
      : 'all';

  const rawPage = params.get('page');
  let page = 1;
  if (rawPage) {
    const parsed = parseInt(rawPage, 10);
    if (Number.isInteger(parsed) && parsed >= 1 && String(parsed) === rawPage.trim()) {
      page = parsed;
    }
  }

  return { query, serviceType, privacy, status, page };
}

export function serializeSmsDirectoryUrlParams(
  state: Partial<SmsDirectoryUrlState>,
  existingSearch = ''
): string {
  const cleanExisting = (existingSearch || '').replace(/^\?/, '');
  const params = new URLSearchParams(cleanExisting);

  // Query parameter `q`
  if (state.query && state.query.trim().length > 0) {
    params.set('q', state.query.trim());
  } else {
    params.delete('q');
  }

  // Service type `type`
  if (
    state.serviceType &&
    state.serviceType !== 'all' &&
    (VALID_SMS_SERVICE_TYPES as readonly string[]).includes(state.serviceType)
  ) {
    params.set('type', state.serviceType);
  } else {
    params.delete('type');
  }

  // Privacy `privacy`
  if (
    state.privacy &&
    state.privacy !== 'all' &&
    (VALID_SMS_PRIVACY_TYPES as readonly string[]).includes(state.privacy)
  ) {
    params.set('privacy', state.privacy);
  } else {
    params.delete('privacy');
  }

  // Source classification `status`
  if (
    state.status &&
    state.status !== 'all' &&
    (VALID_SMS_STATUS_TYPES as readonly string[]).includes(state.status)
  ) {
    params.set('status', state.status);
  } else {
    params.delete('status');
  }

  // Page `page`
  if (typeof state.page === 'number' && Number.isInteger(state.page) && state.page > 1) {
    params.set('page', String(state.page));
  } else {
    params.delete('page');
  }

  return params.toString();
}
