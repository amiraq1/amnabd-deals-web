export interface ActivationGuide {
  slug: string;
  summary: string;
  steps: string[];
  notes?: string;
}

// Static activation copy has no per-claim link to official evidence or review
// state. Keep the public registry empty until guides can be validated against
// the same evidence model as deal eligibility and review notes.
export const activationGuides: Readonly<Record<string, ActivationGuide>> =
  Object.freeze({});

export function getActivationGuide(slug: string): ActivationGuide | undefined {
  return activationGuides[slug];
}
