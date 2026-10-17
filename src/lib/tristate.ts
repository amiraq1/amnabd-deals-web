import type { Lang, TriState } from '@/types';

export function tristateLabel(state: TriState | string, lang: Lang): string {
  if (lang === 'ar') {
    if (state === 'yes') return 'نعم';
    if (state === 'no') return 'لا';
    if (state === 'required') return 'مطلوب';
    if (state === 'not_required') return 'غير مطلوب';
    return 'غير معلوم';
  }
  if (state === 'yes') return 'Yes';
  if (state === 'no') return 'No';
  if (state === 'required') return 'Required';
  if (state === 'not_required') return 'Not Required';
  return 'Unknown';
}

export function isAffirmativeTriState(value: TriState | string | undefined): boolean {
  return value === 'yes' || value === 'required';
}

export function isNegativeTriState(value: TriState | string | undefined): boolean {
  return value === 'no' || value === 'not_required';
}

export function tristateTone(state: TriState | string): 'good' | 'bad' | 'neutral' {
  if (state === 'yes' || state === 'required') return 'neutral';
  if (state === 'no' || state === 'not_required') return 'good';
  return 'neutral';
}
