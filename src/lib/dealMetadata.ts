import type { Deal } from '@/types';
import { resolveDealOfficialUrl } from './safeUrl.js';

export const OFFICIAL_TOOL_NAMES: Record<string, string> = {
  'antigravity-ultra-scientists': 'Google Antigravity',
  antigravity: 'Google Antigravity',
  'qwen-cloud': 'Qwen Cloud',
  qwen: 'Qwen Cloud',
  'you-com': 'You.com',
  youcom: 'You.com',
  deepgram: 'Deepgram',
  assemblyai: 'AssemblyAI',
  'github-copilot': 'GitHub Copilot',
  copilot: 'GitHub Copilot',
  'exa-ai': 'Exa AI',
  exa: 'Exa AI',
  figma: 'Figma',
  'general-compute': 'General Compute',
  generalcompute: 'General Compute',
  tinyfish: 'TinyFish',
  zed: 'Zed',
  'beam-vercel-gateway': 'Vercel Beam',
  'blitz-cloud': 'blitz.cloud',
  'bolt-builders-week': 'Bolt',
  'deepseek-flash-1017-free': 'DeepSeek',
  'deepseek-v41-flash-opencode': 'DeepSeek V4.1',
  'docker-cloud-sandbox-250': 'Docker',
  'dolphin-api10-credit': 'Dolphin',
  freebuff: 'Freebuff',
  'indra-ocr': 'Indra OCR',
  'minimax-h3-max': 'MiniMax',
  nararouter: 'NaraRouter',
  'openai-codex-oss': 'OpenAI Codex',
  'qwen38-27b-itera': 'IteraCompute',
  'retriever-ai': 'Retriever AI',
  tokenrouter: 'TokenRouter',
  zenmux: 'ZenMux',
};

export const SIMPLE_ICONS_MAP: Record<string, string> = {
  'qwen-cloud': 'qwen',
  qwen: 'qwen',
  deepgram: 'deepgram',
  'github-copilot': 'githubcopilot/white',
  copilot: 'githubcopilot/white',
  figma: 'figma',
  zed: 'zedindustries',
  'docker-cloud-sandbox-250': 'docker',
  docker: 'docker',
  'openai-codex-oss': 'openai',
  openai: 'openai',
};

export function extractDomainFromUrl(rawUrl?: string | null): string | null {
  if (!rawUrl) return null;
  try {
    const url = new URL(rawUrl);
    return url.hostname.replace(/^www\./i, '');
  } catch {
    return null;
  }
}

export function getDealOfficialDomain(deal: Deal): string | null {
  const official = resolveDealOfficialUrl(deal);
  if (official) {
    const d = extractDomainFromUrl(official);
    if (d) return d;
  }
  const firstSource = deal.official_sources?.[0]?.url;
  if (firstSource) {
    const d = extractDomainFromUrl(firstSource);
    if (d) return d;
  }
  const offerUrl = deal.get_offer?.url;
  if (offerUrl) {
    const d = extractDomainFromUrl(offerUrl);
    if (d) return d;
  }
  return null;
}

export function getDealDisplayName(deal: Deal): string {
  if (deal.name && deal.name.trim()) {
    return deal.name.trim();
  }
  const fromSlug = deal.slug ? OFFICIAL_TOOL_NAMES[deal.slug] : undefined;
  if (fromSlug) {
    return fromSlug;
  }
  const fromId = deal.id ? OFFICIAL_TOOL_NAMES[deal.id] : undefined;
  if (fromId) {
    return fromId;
  }
  if (deal.name_en && deal.name_en.trim()) {
    // If name_en contains a separator (e.g. "Bolt — free GLM..."), extract the short prefix
    const parts = deal.name_en.split(/\s+[—–-]\s+/);
    const prefix = parts[0]?.trim();
    if (parts.length > 1 && prefix && prefix.length < 30) {
      return prefix;
    }
    return deal.name_en.trim();
  }
  return deal.name_ar;
}

// Never invent a value: a card with no recorded benefit shows no headline.
// "Free featured offer" was a claim the data did not support.
export function getDealHeadlineValue(deal: Deal, lang: 'ar' | 'en' = 'ar'): string | null {
  if (deal.headline_value && deal.headline_value.trim()) {
    return deal.headline_value.trim();
  }
  const benefit = deal.benefits?.[0];
  const amount = benefit?.amount;
  // A zero amount is not a benefit. Rendering "0$ رصيد مجاني" announced a
  // credit the record does not grant, so absent or zero means no headline.
  if (typeof amount?.value === 'number' && Number.isFinite(amount.value) && amount.value > 0) {
    const unit = amount.unit || (amount.currency === 'USD' ? '$' : '');
    const val = amount.value;
    if (amount.currency === 'USD') {
      return `${val}$ ${lang === 'ar' ? 'رصيد مجاني' : 'free credit'}`;
    }
    return `${val} ${unit}`;
  }
  if (benefit?.description) {
    const desc = lang === 'ar' ? benefit.description.ar : benefit.description.en;
    if (desc && desc !== 'غير معلوم' && desc !== 'Unknown') return desc;
  }
  return null;
}

export function getDealKeyCondition(deal: Deal, lang: 'ar' | 'en' = 'ar'): string | null {
  if (deal.key_condition && deal.key_condition.trim()) {
    return deal.key_condition.trim();
  }
  if (deal.eligibility?.card_required === 'not_required') {
    return lang === 'ar' ? 'بدون بطاقة ائتمان' : 'No credit card';
  }
  // A required card is a condition the reader must see. Staying silent about
  // it read as "no card needed", which was the C-01 complaint.
  if (deal.eligibility?.card_required === 'required') {
    return lang === 'ar' ? 'تتطلب بطاقة ائتمان' : 'Credit card required';
  }
  if (deal.eligibility?.student_status === 'required') {
    return lang === 'ar' ? 'للطلاب والجامعيين' : 'Students only';
  }
  if (deal.eligibility?.new_account === 'required') {
    return lang === 'ar' ? 'للحسابات الجديدة' : 'New accounts';
  }
  return null;
}

export interface DealIconSources {
  primary: string;
  fallback: string | null;
}

export function getDealIconSources(deal: Deal): DealIconSources {
  const domain = getDealOfficialDomain(deal);
  const googleFavicon = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null;

  if (deal.icon_url && deal.icon_url.trim()) {
    return {
      primary: deal.icon_url.trim(),
      fallback: googleFavicon,
    };
  }

  const simpleSlug = SIMPLE_ICONS_MAP[deal.slug] || SIMPLE_ICONS_MAP[deal.id];
  if (simpleSlug) {
    return {
      primary: `https://cdn.simpleicons.org/${simpleSlug}`,
      fallback: googleFavicon,
    };
  }

  if (googleFavicon) {
    return {
      primary: googleFavicon,
      fallback: null,
    };
  }

  return {
    primary: '/favicon.svg',
    fallback: null,
  };
}
