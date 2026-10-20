export type ReportReason =
  | 'expired'
  | 'card_changed'
  | 'terms_changed'
  | 'broken_link';

export interface DealReportPayload {
  dealSlug: string;
  reason: ReportReason;
  note?: string | null;
  honeypot?: string; // Hidden anti-bot trap field
}

export interface SubmitReportResult {
  ok: boolean;
  alreadyReported?: boolean;
  mode: 'supabase' | 'local_fallback' | 'blocked_bot';
}

const REPORT_STORAGE_KEY = 'ai_deals_reported_slugs_v1';
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours per deal

export const REPORT_REASON_OPTIONS: { value: ReportReason; label: string; labelEn: string }[] = [
  { value: 'expired', label: 'انتهى العرض', labelEn: 'Offer expired' },
  { value: 'card_changed', label: 'أصبح يطلب بطاقة بنكية', labelEn: 'Credit card now required' },
  { value: 'terms_changed', label: 'تغيّرت القيمة أو الشروط', labelEn: 'Value or terms changed' },
  { value: 'broken_link', label: 'الرابط الرسمي لا يعمل', labelEn: 'Official link broken' },
];

function getReportedMap(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(REPORT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function hasRecentlyReported(dealSlug: string, now = Date.now()): boolean {
  const map = getReportedMap();
  const timestamp = map[dealSlug];
  if (!timestamp) return false;
  return now - timestamp < COOLDOWN_MS;
}

export function markDealAsReported(dealSlug: string, now = Date.now()): void {
  if (typeof window === 'undefined') return;
  try {
    const map = getReportedMap();
    map[dealSlug] = now;
    window.localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore private browsing or storage quota errors
  }
}

export async function submitDealReport(
  payload: DealReportPayload
): Promise<SubmitReportResult> {
  // 1. Silent bot deflection via honeypot trap
  if (payload.honeypot && payload.honeypot.trim() !== '') {
    return { ok: true, mode: 'blocked_bot' };
  }

  const cleanSlug = payload.dealSlug.trim();
  if (!cleanSlug) {
    throw new Error('معرّف العرض غير صالح');
  }

  // 2. Prevent spam: 24h per-deal cooldown
  if (hasRecentlyReported(cleanSlug)) {
    return { ok: true, alreadyReported: true, mode: 'local_fallback' };
  }

  const cleanNote = payload.note?.trim().slice(0, 280) || null;
  const metaEnv =
    typeof import.meta !== 'undefined'
      ? (import.meta as unknown as { env?: Record<string, string | undefined> }).env
      : undefined;
  const nodeEnv =
    typeof globalThis !== 'undefined' && 'process' in globalThis
      ? (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
      : undefined;
  const supabaseUrl = metaEnv?.VITE_SUPABASE_URL || nodeEnv?.VITE_SUPABASE_URL;
  const supabaseKey = metaEnv?.VITE_SUPABASE_ANON_KEY || nodeEnv?.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const endpoint = `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/deal_reports`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          deal_slug: cleanSlug,
          reason: payload.reason,
          note: cleanNote,
        }),
      });

      if (!response.ok) {
        throw new Error(`فشل إرسال البلاغ (${response.status})`);
      }

      markDealAsReported(cleanSlug);
      return { ok: true, mode: 'supabase' };
    } catch {
      // If network fails, gracefully save locally
      markDealAsReported(cleanSlug);
      return { ok: true, mode: 'local_fallback' };
    }
  }

  // Development / test fallback when Supabase keys are not active
  markDealAsReported(cleanSlug);
  return { ok: true, mode: 'local_fallback' };
}
