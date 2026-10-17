import type { Deal } from '@/types';
import { resolveDealOfficialUrl } from './safeUrl';

export const OFFICIAL_TOOL_NAMES: Record<string, string> = {
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
};

export const SIMPLE_ICONS_MAP: Record<string, string> = {
  'qwen-cloud': 'qwen',
  qwen: 'qwen',
  deepgram: 'deepgram',
  'github-copilot': 'githubcopilot/white',
  copilot: 'githubcopilot/white',
  figma: 'figma',
  zed: 'zedindustries',
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
  if (deal.name_en && deal.name_en.trim()) {
    return deal.name_en.trim();
  }
  return OFFICIAL_TOOL_NAMES[deal.slug] || OFFICIAL_TOOL_NAMES[deal.id] || deal.name_ar;
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
