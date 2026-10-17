export type Lang = 'ar' | 'en';

export type TriState = 'yes' | 'no' | 'unknown' | 'required' | 'not_required';

export interface Localized {
  ar: string;
  en: string;
}

export interface Category {
  value: string;
  legacy_value?: string;
  review_status?: string;
}

export interface Benefit {
  type: string;
  amount?: {
    unit: string | null;
    value: number | null;
    currency: string | null;
  };
  duration?: {
    unit: string | null;
    value: number | null;
    status: string;
  };
  frequency?: string;
  description: Localized;
}

export interface CountriesInfo {
  status: string;
  values: string[];
}

export interface Eligibility {
  countries: CountriesInfo;
  conditions: Localized;
  new_account: TriState;
  card_required: TriState;
  applicant_type: TriState | string;
  phone_required: TriState;
  student_status: TriState;
}

export interface Pricing {
  currency: string | null;
  offer_price: number | null;
  billing_cycle: string;
  original_price: number | null;
}

export interface Registration {
  deadline: {
    date: string | null;
    status: string;
  };
  credit_validity: {
    unit: string | null;
    status: string;
    duration: number | null;
  };
}

export interface Claim {
  field: string;
  value: unknown;
  evidence: string;
}

export interface OfficialSource {
  url: string;
  title: string;
  claims: Claim[];
  context?: string;
}

export interface GetOffer {
  url: string;
  type: string;
  label: Localized;
}

export interface Review {
  notes: Localized;
  reviewed_on: string;
  verified_on: string | null;
  offer_status: string;
  unknown_fields: string[];
  verification_status: string;
}

export interface Deal {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  icon_url?: string;
  description_ar: string;
  description_en: string;
  category: Category;
  benefits: Benefit[];
  eligibility: Eligibility;
  pricing: Pricing;
  registration: Registration;
  official_sources: OfficialSource[];
  get_offer: GetOffer;
  review: Review;
  created_at?: string;
}

export interface GuideSection {
  ar: string;
  en: string;
  sources: string[];
}

export type GuideSectionKey =
  | 'eligibility'
  | 'registration'
  | 'limitations'
  | 'after_expiry';

export interface UsageGuide {
  slug: string;
  sections: Record<GuideSectionKey, GuideSection>;
}

export interface SiteConfig {
  id: string;
  overview: {
    ar: Record<string, string>;
    en: Record<string, string>;
  };
  section_labels: {
    ar: Record<string, string>;
    en: Record<string, string>;
  };
  last_reviewed: string;
}
