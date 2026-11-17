import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const testBuildDir = process.env.AMN_TEST_BUILD_DIR;
const {
  parseReportedMap,
  hasRecentlyReported,
  markDealAsReported,
} = await import(
  pathToFileURL(join(testBuildDir, 'src/lib/dealReports.js'))
);
const {
  saveDeal,
  saveDealDetailed,
  clearSavedDeals,
} = await import(
  pathToFileURL(join(testBuildDir, 'src/lib/savedDeals.js'))
);

describe('Local State and Favorites Hardening', () => {
  describe('dealReports storage hardening', () => {
    it('returns empty map for null, undefined, empty, or whitespace raw values', () => {
      assert.deepEqual(parseReportedMap(null), {});
      assert.deepEqual(parseReportedMap(undefined), {});
      assert.deepEqual(parseReportedMap(''), {});
      assert.deepEqual(parseReportedMap('   '), {});
    });

    it('returns empty map for malformed JSON or invalid types (null, arrays, primitives)', () => {
      assert.deepEqual(parseReportedMap('{broken-json'), {});
      assert.deepEqual(parseReportedMap('null'), {});
      assert.deepEqual(parseReportedMap('[]'), {});
      assert.deepEqual(parseReportedMap('[1, 2, 3]'), {});
      assert.deepEqual(parseReportedMap('12345'), {});
      assert.deepEqual(parseReportedMap('"plain string"'), {});
      assert.deepEqual(parseReportedMap('true'), {});
    });

    it('filters out invalid or non-numeric timestamps', () => {
      const raw = JSON.stringify({
        'deal-1': 'not-a-number',
        'deal-2': null,
        'deal-3': undefined,
        'deal-4': NaN,
        'deal-5': Infinity,
        'deal-6': -1000,
        'deal-7': 0,
        'deal-valid': 1700000000000,
      });

      const parsed = parseReportedMap(raw, 1700000050000);
      assert.deepEqual(parsed, {
        'deal-valid': 1700000000000,
      });
    });

    it('rejects corrupted future timestamps beyond the 60s skew allowance', () => {
      const now = 1700000000000;
      const raw = JSON.stringify({
        'deal-normal': now - 5000,
        'deal-future-acceptable': now + 30000, // 30s in future: allowed clock skew
        'deal-future-corrupt': now + 120000,  // 2m in future: rejected
      });

      const parsed = parseReportedMap(raw, now);
      assert.equal(parsed['deal-normal'], now - 5000);
      assert.equal(parsed['deal-future-acceptable'], now + 30000);
      assert.equal(parsed['deal-future-corrupt'], undefined);
    });

    it('hasRecentlyReported handles corrupted storage without throwing', () => {
      const mockStorage = {
        data: new Map([['amnabd_reported_slugs_v1', 'null']]),
        getItem(k) { return this.data.get(k) ?? null; },
        setItem(k, v) { this.data.set(k, String(v)); },
        removeItem(k) { this.data.delete(k); },
      };

      assert.doesNotThrow(() => {
        const reported = hasRecentlyReported('some-deal', Date.now(), mockStorage);
        assert.equal(reported, false);
      });
    });

    it('markDealAsReported records and triggers cooldown cleanly', () => {
      const mockStorage = {
        data: new Map(),
        getItem(k) { return this.data.get(k) ?? null; },
        setItem(k, v) { this.data.set(k, String(v)); },
        removeItem(k) { this.data.delete(k); },
      };

      const now = 1700000000000;
      markDealAsReported('cursor-pro', now, mockStorage);
      assert.equal(hasRecentlyReported('cursor-pro', now + 1000, mockStorage), true);
      assert.equal(hasRecentlyReported('cursor-pro', now + 25 * 3600 * 1000, mockStorage), false); // 25h later
    });
  });

  describe('saveDealDetailed status and backward compatibility', () => {
    const memoryStorage = {
      data: new Map(),
      getItem(k) { return this.data.get(k) ?? null; },
      setItem(k, v) { this.data.set(k, String(v)); },
      removeItem(k) { this.data.delete(k); },
    };

    beforeEach(() => {
      clearSavedDeals(memoryStorage);
    });

    it('returns added for new valid deals and already_saved for duplicates', () => {
      assert.equal(saveDealDetailed('deal-alpha', memoryStorage), 'added');
      assert.equal(saveDealDetailed('deal-alpha', memoryStorage), 'already_saved');
    });

    it('returns invalid for empty or non-string inputs', () => {
      assert.equal(saveDealDetailed('', memoryStorage), 'invalid');
      assert.equal(saveDealDetailed('   ', memoryStorage), 'invalid');
      assert.equal(saveDealDetailed(null, memoryStorage), 'invalid');
    });

    it('saveDeal maintains boolean return for backwards compatibility', () => {
      assert.equal(saveDeal('deal-beta', memoryStorage), true);
      assert.equal(saveDeal('deal-beta', memoryStorage), false);
    });
  });
});
