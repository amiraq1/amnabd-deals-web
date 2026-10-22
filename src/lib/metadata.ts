// One formatter for the document metadata of every route (A12).
//
// Before this, only the deal page wrote canonical/OG/JSON-LD, and nothing put
// them back when the visitor left. The canonical and `og:url` of a deal stayed
// on the home page, so a crawler or a share card saw the wrong address.
//
// Every route now resolves through `routeMetadata`, which always returns a
// complete set: title, description, canonical, image and JSON-LD. A deal page
// overrides the defaults with its own metadata; every other route gets its own
// instead of inheriting the previous page's.
import type { Lang } from '@/types';
import { getAggregationConfig } from './aggregations.js';
import { routePath, type Route } from './routes.js';
import { DEFAULT_SITE_URL, type DealSeoMetadata } from './seoFacts.js';

export interface RouteMetadata {
  title: string;
  description: string;
  canonicalUrl: string;
  ogImageUrl: string;
  jsonLd: Record<string, unknown>;
}

const SUFFIX = 'AMNABD Deals';

function siteBase(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

interface RouteCopy {
  title: { ar: string; en: string };
  description: { ar: string; en: string };
}

const HOME_COPY: RouteCopy = {
  title: { ar: 'AMNABD Deals — دليل عروض الذكاء الاصطناعي والسحابة', en: 'AMNABD Deals — AI & Cloud Deals Directory' },
  description: {
    ar: 'دليل ثنائي اللغة يربطك مباشرة بالمصادر الرسمية لعروض أدوات الذكاء الاصطناعي والحوسبة السحابية.',
    en: 'A bilingual directory linking you to the official sources of AI-tool and cloud-computing offers.',
  },
};

const COPY: Record<string, RouteCopy> = {
  home: HOME_COPY,
  guide: {
    title: { ar: 'دليل الاستخدام والشروط', en: 'Usage Guide & Terms' },
    description: {
      ar: 'كيف تتحقق من شروط العرض قبل التفعيل، وما تعنيه حالة كل حقل في الدليل.',
      en: 'How to check an offer’s terms before activating it, and what each field in the directory means.',
    },
  },
  favorites: {
    title: { ar: 'مفضلتي', en: 'My Favorites' },
    description: {
      ar: 'العروض التي حفظتها في هذا المتصفح.',
      en: 'The deals you saved in this browser.',
    },
  },
  changelog: {
    title: { ar: 'سجل التغييرات وتحديثات العروض', en: 'Changelog & Deal Updates' },
    description: {
      ar: 'أحدث العروض المضافة، المراجعات الدورية، والتنبيهات قبل انتهاء صلاحية أرصدة الذكاء الاصطناعي.',
      en: 'New offers, periodic reviews, and warnings before AI credits expire.',
    },
  },
  notfound: {
    title: { ar: 'الصفحة غير موجودة (404)', en: 'Page Not Found (404)' },
    description: {
      ar: 'الرابط المطلوب غير موجود في هذا الدليل.',
      en: 'The requested link does not exist in this directory.',
    },
  },
};

/**
 * Complete metadata for a route. `dealSeo` is the already-built deal metadata
 * when the deal is known; without it the deal route falls back to the 404
 * copy, because an unknown deal has no canonical of its own to claim.
 */
export function routeMetadata(
  route: Route,
  lang: Lang,
  dealSeo: DealSeoMetadata | null = null,
  baseUrl: string = DEFAULT_SITE_URL
): RouteMetadata {
  const base = siteBase(baseUrl);
  const ogImageUrl = `${base}/og-image.png`;

  if (route.name === 'deal' && dealSeo) {
    return {
      title: dealSeo.title,
      description: dealSeo.description,
      canonicalUrl: dealSeo.canonicalUrl,
      ogImageUrl: dealSeo.ogImageUrl,
      jsonLd: dealSeo.jsonLd,
    };
  }

  const key = route.name === 'collection' ? 'home' : route.name;
  const copy = COPY[key] ?? HOME_COPY;
  const path = route.name === 'deal' || route.name === 'notfound' ? '/404' : routePath(route);

  if (route.name === 'collection' && route.collectionKey) {
    const agg = getAggregationConfig(route.collectionKey);
    if (agg) {
      return {
        title: `${lang === 'ar' ? agg.titleAr : agg.titleEn} — ${SUFFIX}`,
        description: lang === 'ar' ? agg.metaDescriptionAr : agg.metaDescriptionEn,
        canonicalUrl: `${base}${agg.path}`,
        ogImageUrl,
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: lang === 'ar' ? agg.headingAr : agg.headingEn,
          url: `${base}${agg.path}`,
        },
      };
    }
  }

  return {
    title: `${copy.title[lang]} — ${SUFFIX}`,
    description: copy.description[lang],
    canonicalUrl: `${base}${path}`,
    ogImageUrl,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': route.name === 'collection' ? 'CollectionPage' : 'WebSite',
      name: copy.title[lang],
      url: `${base}${path}`,
    },
  };
}
