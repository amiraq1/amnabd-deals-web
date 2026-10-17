import assert from 'node:assert/strict';
import { test } from 'node:test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const load = (name) =>
  import(pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, `src/lib/${name}.js`)));
const { requirementState, truthState, applicantType, isOpenToAll, matchesEligibility } =
  await load('eligibility');
const { requirementLabel } = await load('tristate');
const { validateDeals } = await load('validate');
const { evidenceStatus, evidenceLabel, offerStatusLabel } = await load('evidence');
const { parseHash, routeHash } = await load('routes');
const { readLanguage, saveLanguage } = await load('languageStorage');
const { publicSupabaseConfig } = await load('environment');
const { startRequest, ResourceError } = await load('resource');
const rich = (changes = {}) => ({
  countries: { status: 'worldwide', values: [] },
  conditions: { ar: 'شروط مثبتة', en: 'Established terms' },
  new_account: 'not_required',
  card_required: 'not_required',
  phone_required: 'unknown',
  applicant_type: 'any',
  student_status: 'not_required',
  open_to_all: 'yes',
  ...changes,
});

for (const [input, expected] of [
  ['yes', 'required'],
  ['required', 'required'],
  ['no', 'not_required'],
  ['not_required', 'not_required'],
  ['unknown', 'unknown'],
  [null, 'unknown'],
  [true, 'unknown'],
  ['maybe', 'unknown'],
]) {
  test(`AMN-003 requirement alias ${String(input)}`, () =>
    assert.equal(requirementState(input), expected));
}
test('AMN-003 labels agree with filtering and validation', () => {
  const parsed = validateDeals([
    {
      id: 's',
      slug: 's',
      name_en: 'Student',
      eligibility: rich({
        student_status: 'yes',
        card_required: 'no',
        new_account: 'no',
        phone_required: 'yes',
      }),
    },
  ]).values[0];
  assert.equal(parsed.eligibility.student_status, 'required');
  assert.equal(parsed.eligibility.card_required, 'not_required');
  assert.equal(parsed.eligibility.phone_required, 'required');
  assert.equal(requirementLabel('no', 'en'), 'Not Required');
  assert.equal(requirementLabel('yes', 'ar'), 'مطلوب');
  assert.equal(matchesEligibility(parsed.eligibility, 'student', 'not_required'), true);
  assert.equal(applicantType('individual'), 'individual');
  assert.equal(applicantType('private-program'), 'unknown');
  assert.equal(truthState('required'), 'unknown');
});
test('AMN-001 explicitly reviewed general eligibility passes, missing assertion does not', () => {
  assert.equal(isOpenToAll(rich()), true);
  assert.equal(isOpenToAll(rich({ open_to_all: undefined })), false);
  assert.equal(isOpenToAll(rich({ open_to_all: 'unknown' })), false);
  assert.equal(isOpenToAll(rich({ open_to_all: 'no' })), false);
});
for (const restriction of [
  { applicant_type: 'student' },
  { applicant_type: 'startup' },
  { applicant_type: 'individual' },
  { applicant_type: 'unknown' },
  { student_status: 'required' },
  { student_status: 'unknown' },
  { new_account: 'required' },
  { new_account: 'unknown' },
  { countries: { status: 'unknown', values: [] } },
  { countries: { status: 'worldwide', values: ['IQ'] } },
]) {
  test(`AMN-001 conservative exclusion ${JSON.stringify(restriction)}`, () => {
    assert.equal(matchesEligibility(rich(restriction), 'any', 'all'), false);
  });
}
test('AMN-001 card and applicant filters compose without treating unknown as no', () => {
  assert.equal(matchesEligibility(rich(), 'any', 'not_required'), true);
  assert.equal(
    matchesEligibility(rich({ card_required: 'unknown' }), 'any', 'not_required'),
    false
  );
  assert.equal(matchesEligibility(rich({ card_required: 'required' }), 'all', 'all'), true);
});
for (const [input, status] of [
  ['supported', 'supported'],
  ['partial', 'partial'],
  ['partially_supported', 'partial'],
  ['unsupported', 'unsupported'],
  ['unknown', 'unknown'],
  ['verified', 'unknown'],
  [null, 'unknown'],
  ['new-future-state', 'unknown'],
]) {
  test(`AMN-009 evidence state ${String(input)}`, () => {
    assert.equal(evidenceStatus(input), status);
    assert.doesNotMatch(evidenceLabel(input, 'ar'), /موثق رسمي/);
    if (status === 'unknown') assert.doesNotMatch(evidenceLabel(input, 'en'), /Partially/);
  });
}
test('AMN-009 availability is separate and unknown is not active', () => {
  assert.equal(offerStatusLabel('active', 'en'), 'Available as reviewed');
  assert.equal(offerStatusLabel(undefined, 'en'), 'Unknown');
  assert.equal(offerStatusLabel('new-future-state', 'en'), 'Unknown');
});
for (const hash of [
  '#/deal/%E0%A4%A',
  '#/deal/%',
  '#/deal/a/b',
  '#/guide/extra',
  '#/deal/',
  '#/deal/%2F',
  '#/deal/%5C',
  '#/deal/%00',
  '#/deal/a%20b',
  null,
]) {
  test(`AMN-019 invalid hash ${String(hash)}`, () =>
    assert.deepEqual(parseHash(hash), { name: 'notfound' }));
}
test('AMN-019 valid routes, Unicode and single decoding', () => {
  for (const hash of ['', '#', '#/']) assert.deepEqual(parseHash(hash), { name: 'home' });
  assert.deepEqual(parseHash('#/guide/'), { name: 'guide' });
  assert.deepEqual(parseHash('#/deal/%D9%86%D8%A8%D8%B6'), { name: 'deal', slug: 'نبض' });
  assert.deepEqual(parseHash('#/deal/%252F'), { name: 'deal', slug: '%2F' });
  assert.equal(routeHash({ name: 'deal', slug: 'نبض' }), '#/deal/%D9%86%D8%A8%D8%B6');
  assert.equal(routeHash({ name: 'deal', slug: '\ud800' }), '#/404');
  assert.equal(routeHash({ name: 'deal', slug: 'bad/slug' }), '#/404');
});
test('AMN-008 storage getter/read/write failure is contained', () => {
  const throwing = () => {
    throw new DOMException('DENIED_PRIVATE_DATA', 'SecurityError');
  };
  assert.equal(readLanguage(throwing), 'ar');
  assert.equal(saveLanguage('en', throwing), false);
  assert.equal(
    readLanguage(() => ({ getItem: throwing })),
    'ar'
  );
  assert.equal(
    saveLanguage('en', () => ({ setItem: throwing })),
    false
  );
});
test('AMN-008 good preference works and unknown preference defaults to Arabic', () => {
  assert.equal(
    readLanguage(() => ({ getItem: () => 'en' })),
    'en'
  );
  assert.equal(
    readLanguage(() => ({ getItem: () => 'unknown' })),
    'ar'
  );
  let saved;
  assert.equal(
    saveLanguage('en', () => ({
      setItem: (_key, value) => {
        saved = value;
      },
    })),
    true
  );
  assert.equal(saved, 'en');
});
const url = 'https://fixture.supabase.co';
const publishable = 'sb_publishable_AUDIT_FIXTURE_NOT_A_REAL_KEY_0001';
const jwt = (role) =>
  [
    'eyJhbGciOiJIUzI1NiJ9',
    Buffer.from(JSON.stringify({ role })).toString('base64url'),
    'synthetic_signature',
  ].join('.');
test('AMN-018 public publishable/anon keys accepted without asserting authenticity', () => {
  assert.equal(publicSupabaseConfig(url, publishable).ok, true);
  assert.equal(publicSupabaseConfig(url, jwt('anon')).ok, true);
  assert.equal(publicSupabaseConfig('http://127.0.0.1:54321', publishable, true).ok, true);
});
for (const [u, k, reason] of [
  ['', publishable, 'missing_url'],
  [url, '', 'missing_key'],
  ['garbage', publishable, 'invalid_url'],
  [url + '?', publishable, 'invalid_url'],
  [url + '#', publishable, 'invalid_url'],
  ['http://fixture.supabase.co', publishable, 'invalid_url'],
  ['http://127.0.0.1:54321', publishable, 'invalid_url'],
  ['https://user:pass@fixture.supabase.co', publishable, 'invalid_url'],
  [url, 'sb_secret_FAKE_NEVER_USE', 'private_key'],
  [url, jwt('service_role'), 'private_key'],
  [url, jwt('authenticated'), 'invalid_public_key'],
  [url, 'opaque-random', 'invalid_public_key'],
]) {
  test(`AMN-018 config rejected: ${reason}`, () => {
    const result = publicSupabaseConfig(u, k);
    assert.equal(result.ok, false);
    assert.equal(result.reason, reason);
    assert.equal('key' in result, false);
    assert.equal('url' in result, false);
  });
}
test('AMN-004 request success and failure are observed', async () => {
  const success = startRequest(async () => 42, 100);
  assert.equal(await success.promise, 42);
  const failure = startRequest(async () => {
    throw new ResourceError('network');
  }, 100);
  await assert.rejects(failure.promise, (e) => e.kind === 'network');
});
test('AMN-004 timeout bounds an adapter ignoring abort', async () => {
  let signal;
  const request = startRequest((s) => {
    signal = s;
    return new Promise(() => {});
  }, 5);
  await assert.rejects(request.promise, (e) => e.kind === 'timeout');
  assert.equal(signal.aborted, true);
});
test('AMN-004 cancelling before execution prevents adapter side effects', async () => {
  let called = false;
  const request = startRequest(async () => {
    called = true;
    return 1;
  }, 100);
  request.cancel();
  await assert.rejects(request.promise, (e) => e.kind === 'cancelled');
  assert.equal(called, false);
});
test('AMN-004 late response/failure after timeout cannot change settled result', async () => {
  let fail;
  const request = startRequest(
    () =>
      new Promise((_resolve, reject) => {
        fail = reject;
      }),
    5
  );
  await assert.rejects(request.promise, (e) => e.kind === 'timeout');
  fail(new Error('LATE_PRIVATE_ERROR'));
  await new Promise((resolve) => setTimeout(resolve, 5));
});
