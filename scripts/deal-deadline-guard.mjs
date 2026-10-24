// Detect only explicit offer cutoffs in user-visible deal copy. This is not a
// general date extractor: announcement, release, publication and review dates
// are ignored unless a clear offer-close phrase is immediately attached.
const EN_MONTH =
  '(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)';
const AR_MONTH =
  '(?:يناير|فبراير|مارس|أبريل|ابريل|مايو|يونيو|يوليو|أغسطس|اغسطس|سبتمبر|أكتوبر|اكتوبر|نوفمبر|ديسمبر)';
const DATE_TOKEN =
  `(?:\\d{4}-\\d{1,2}-\\d{1,2}|\\d{1,2}[./-]\\d{1,2}(?:[./-]\\d{2,4})?|\\d{1,2}\\s+${EN_MONTH}(?:\\s*,?\\s*\\d{4})?|${EN_MONTH}\\s+\\d{1,2}(?:st|nd|rd|th)?(?:\\s*,?\\s*\\d{4})?|[0-9]{1,2}\\s+${AR_MONTH}(?:\\s+[0-9]{4})?)`;
const SENTENCE_GAP = '[^.!?؟؛\\n]{0,90}?';

const ENGLISH_CUTOFF_CUES = [
  String.raw`\b(?:offer|deal|promotion|promo|campaign|free(?:\s+(?:access|use|period|trial))?|credit|benefit|subscription|trial|redemption|event|contest|entries|submissions?)\s+(?:ends?|expires?|closes?)\b(?:\s+(?:on|at|by))?`,
  String.raw`\b(?:offer|deal|promotion|promo|campaign|redemption|submission|entry)\s+deadline\b`,
  String.raw`\bdeadline\s+(?:for\s+(?:the\s+)?(?:offer|deal|promotion|redemption|access|submissions?|entries)|is|:)`,
  String.raw`\blast\s+day\s+to\s+(?:redeem|claim|use|enter|submit|sign\s+up)\b`,
  String.raw`\b(?:valid|available|redeemable|free)\s+(?:until|through)\b`,
  String.raw`\b(?:redeem|claim|sign\s+up|register|submit|enter)\s+(?:by|before)\b`,
  String.raw`\b(?:submissions?|entries|contest|event)\b[^.!?؟؛\n]{0,70}?\b(?:close|end|expire)s?\b`,
  String.raw`\bbilling\s+(?:starts?|begins?)\b`,
];

const ARABIC_CUTOFF_CUES = [
  String.raw`(?:الاسترداد|العرض|المجانية|مجاني|التسجيل|التقديم|النافذة|الفترة|الاشتراك|الرصيد)\s+حتى(?:\s+تاريخ)?`,
  String.raw`(?:ينتهي|تنتهي)\s+(?:العرض|الفترة|النافذة|التسجيل|الاشتراك|الاسترداد|الرصيد|الوصول|الخدمة\s+المجانية)`,
  String.raw`(?:يغلق|تغلق|يُغلق|تُغلق)\s+(?:باب\s+)?(?:التقديم|التسجيل|الاسترداد|المسابقة|النافذة)`,
  String.raw`آخر\s+(?:موعد|يوم)\s+(?:للاستفادة|للاسترداد|للحصول\s+على\s+(?:العرض|الرصيد)|للتقديم\s+على\s+(?:العرض|الحملة)|للمسابقة)`,
  String.raw`موعد\s+(?:الإغلاق|انتهاء\s+(?:العرض|الاسترداد)|نهائي\s+(?:للعرض|للاسترداد))`,
  String.raw`(?:صالح|ساري|متاح|مفتوح|مفتوحة)\s+حتى`,
  String.raw`(?:العرض|الفترة|النافذة|التقديم|التسجيل|الاسترداد)\b[^.!?؟؛\n]{0,70}?(?:يغلق|ينتهي|تنتهي|تغلق|حتى|لغاية)`,
];

const ENGLISH_RANGE = new RegExp(
  String.raw`\b(?:offer|deal|promotion|promo|free(?:\s+(?:access|use|period|trial))?|credit|window|submission\s+period|entry\s+period|contest|event)\b[^.!?؟؛\n]{0,75}?\bfrom\s+${DATE_TOKEN}[^.!?؟؛\n]{0,65}?\b(?:to|through|until)\s+${DATE_TOKEN}`,
  'giu'
);
const ARABIC_RANGE = new RegExp(
  String.raw`(?:عرض|مجان|مجاني|المجاني|مجانية|المجانية|رصيد|نافذة|فترة|التسجيل|التقديم|الاسترداد|المسابقة|الهاكاثون)[^.!?؟؛\n]{0,75}?من\s+${DATE_TOKEN}[^.!?؟؛\n]{0,65}?(?:إلى|حتى|لغاية)\s+${DATE_TOKEN}`,
  'gu'
);

const NON_DEADLINE_CONTEXT = [
  /\bno\s+(?:official\s+)?(?:offer\s+)?(?:deadline|cutoff|end\s+date|closing\s+date|expiry\s+date)\b/i,
  /\b(?:deadline|cutoff|end\s+date|closing\s+date|expiration|expiry)\b[^.!?؟؛\n]{0,55}\b(?:unknown|unverified|unconfirmed|not\s+(?:found|confirmed|verified|announced|stated|specified|published|established)|omitted|unsupported)\b/i,
  /\b(?:omitted|excluded|not\s+(?:found|confirmed|verified|announced|stated|specified|published|established))\b[^.!?؟؛\n]{0,55}\b(?:deadline|cutoff|end\s+date|closing\s+date|expiration|expiry)\b/i,
  /(?:لا\s+(?:يوجد|توجد|نُدرج|ندرج|نثبت|نؤكد)\s+(?:موعد|تاريخ)|لم\s+(?:يُعثر|يعثر|يُذكر|يذكر|يُعلن|يعلن|يثبت|يؤكد)\s+(?:على\s+)?(?:موعد|تاريخ)|(?:موعد|تاريخ)\s+(?:نهائي|الإغلاق|الانتهاء)[^.!?؟؛\n]{0,35}(?:غير\s+(?:مؤكد|مثبت|معلن|معروف)|لم\s+يُثبت|غير\s+متاح)|(?:حُذف|حذف|استُبعد|استبعد)\s+(?:الموعد|التاريخ))/u,
];

function normalizeDigits(value) {
  return String(value).replace(/[٠-٩۰-۹]/g, (digit) => {
    const code = digit.charCodeAt(0);
    return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660);
  });
}

function matchesForPattern(text, patternSource, flags = 'giu') {
  const expression = new RegExp(`${patternSource}${SENTENCE_GAP}(${DATE_TOKEN})`, flags);
  return [...text.matchAll(expression)];
}

function dateRangeMatches(text, expression) {
  expression.lastIndex = 0;
  return [...text.matchAll(expression)];
}

function lastDateIn(matchText) {
  const expression = new RegExp(DATE_TOKEN, 'giu');
  const matches = [...matchText.matchAll(expression)];
  return matches.at(-1) ?? null;
}

function contextIsNegated(text, matchIndex, matchLength) {
  const context = text.slice(Math.max(0, matchIndex - 75), matchIndex + matchLength + 55);
  return NON_DEADLINE_CONTEXT.some((pattern) => pattern.test(context));
}

function hasExplicitClock(text, matchIndex, dateStart, dateLength) {
  const dateEnd = matchIndex + dateStart + dateLength;
  const after = text.slice(dateEnd, Math.min(text.length, dateEnd + 70)).split(/[.!?؟؛\n]/u, 1)[0];
  const before = text.slice(Math.max(matchIndex, matchIndex + dateStart - 24), dateEnd);
  return /(?:\d{1,2}:\d{2}|\b\d{1,2}\s*(?:am|pm)\b|(?:at|الساعة)\s*\d{1,2}(?::\d{2})?)/iu.test(
    `${before} ${after}`
  );
}

function explicitDeadlineMatches(value) {
  if (typeof value !== 'string' || !value.trim()) return [];
  const text = normalizeDigits(value);
  const candidates = [];

  for (const cue of ENGLISH_CUTOFF_CUES) {
    candidates.push(...matchesForPattern(text, cue));
  }
  for (const cue of ARABIC_CUTOFF_CUES) {
    candidates.push(...matchesForPattern(text, cue));
  }
  candidates.push(...dateRangeMatches(text, ENGLISH_RANGE));
  candidates.push(...dateRangeMatches(text, ARABIC_RANGE));

  const seen = new Set();
  const result = [];
  for (const candidate of candidates) {
    const matchText = candidate[0];
    const matchIndex = candidate.index ?? 0;
    const date = lastDateIn(matchText);
    if (!date || date.index === undefined) continue;
    if (contextIsNegated(text, matchIndex, matchText.length)) continue;
    const key = `${matchIndex}:${date.index}:${date[0]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({
      hasClockTime: hasExplicitClock(text, matchIndex, date.index, date[0].length),
    });
  }
  return result;
}

function addTextField(result, path, value) {
  if (typeof value === 'string' && value.trim()) result.push({ path, text: value.trim() });
}

function addLocalizedFields(result, path, value) {
  if (typeof value === 'string') {
    addTextField(result, path, value);
    return;
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;
  addTextField(result, `${path}.ar`, value.ar);
  addTextField(result, `${path}.en`, value.en);
}

// These are the deal-record text fields rendered by the page/card or baked into
// per-deal SEO. Structured status/date fields are deliberately not scanned.
export function visibleDealTextFields(deal) {
  if (!deal || typeof deal !== 'object') return [];
  const result = [];
  for (const field of [
    'name',
    'name_ar',
    'name_en',
    'headline_value',
    'key_condition',
    'summary',
    'description_ar',
    'description_en',
  ]) {
    addTextField(result, field, deal[field]);
  }

  const benefits = Array.isArray(deal.benefits) ? deal.benefits : [];
  benefits.forEach((benefit, index) => {
    addLocalizedFields(result, `benefits[${index}].description`, benefit?.description);
  });
  addLocalizedFields(result, 'eligibility.conditions', deal.eligibility?.conditions);

  const sources = Array.isArray(deal.official_sources) ? deal.official_sources : [];
  sources.forEach((source, index) => {
    addTextField(result, `official_sources[${index}].title`, source?.title);
    addTextField(result, `official_sources[${index}].context`, source?.context);
    const claims = Array.isArray(source?.claims) ? source.claims : [];
    claims.forEach((claim, claimIndex) => {
      addTextField(
        result,
        `official_sources[${index}].claims[${claimIndex}].evidence`,
        claim?.evidence
      );
    });
  });
  addLocalizedFields(result, 'review.notes', deal.review?.notes);
  return result;
}

/**
 * Report records that state an explicit closing date/window but have no valid
 * ends_at according to the app's shared timestampInstant parser. A date-only
 * mention is reported as a non-blocking warning (ineligible for expiry handling)
 * because the missing time must not be invented; an explicit clock time blocks.
 */
export function inspectDealDeadlineCoverage(records, { timestampInstant } = {}) {
  if (!Array.isArray(records)) throw new TypeError('Deadline guard expects a deal array.');
  if (typeof timestampInstant !== 'function')
    throw new TypeError('Deadline guard requires the shared timestampInstant parser.');

  const violations = [];
  const warnings = [];
  const covered = [];
  for (const deal of records) {
    if (!deal || typeof deal !== 'object' || typeof deal.slug !== 'string') continue;
    const matches = visibleDealTextFields(deal).flatMap(({ path, text }) =>
      explicitDeadlineMatches(text).map((match) => ({ path, ...match }))
    );
    if (matches.length === 0) continue;

    const paths = [...new Set(matches.map((match) => match.path))].sort();
    if (timestampInstant(deal.ends_at) !== null) {
      covered.push({ slug: deal.slug, paths });
      continue;
    }

    const issue = {
      slug: deal.slug,
      paths,
      expiryEligible: false,
      reason: matches.some((match) => match.hasClockTime)
        ? 'timed-deadline-missing-valid-ends-at'
        : 'date-only-deadline-missing-valid-ends-at',
    };
    if (matches.some((match) => match.hasClockTime)) violations.push(issue);
    else warnings.push(issue);
  }
  return { violations, warnings, covered };
}
