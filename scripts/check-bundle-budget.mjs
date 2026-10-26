// Bundle budget gate.
//
// AMN-011 measured a 370 KB JS bundle but could not say whether that is slow,
// because no Lighthouse baseline existed. A budget does not measure speed
// either — it only stops the number from growing unnoticed while the baseline
// is still missing. Raise the numbers here deliberately, in a commit, when a
// change genuinely needs the room.
//
//   node scripts/check-bundle-budget.mjs
//   node scripts/check-bundle-budget.mjs --json
//
// Env: AMN_DIST_DIR to point at another build directory.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = process.env.AMN_DIST_DIR ? resolve(process.env.AMN_DIST_DIR) : join(ROOT, 'dist');

// Limits are gzip sizes, because that is what a visitor downloads.
const BUDGET_KB = { js: 120, css: 10, html: 8, total: 140 };

const kb = (bytes) => Math.round((bytes / 1024) * 100) / 100;

function gzipSize(path) {
  return gzipSync(readFileSync(path), { level: 9 }).length;
}

function collect(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files.push(...collect(full));
    else files.push(full);
  }
  return files;
}

function kindOf(path, entryHtml) {
  const normalized = path.replace(/\\/g, '/');
  // Only what the entry route actually downloads: hashed assets plus the single
  // entry document. Generated route pages and the service worker are not part
  // of that payload, and summing 50 route documents would measure nothing real.
  if (path === entryHtml) return 'html';
  if (!normalized.includes('/assets/')) return null;
  if (normalized.endsWith('.js')) return 'js';
  if (normalized.endsWith('.css')) return 'css';
  return null;
}

function main() {
  const asJson = process.argv.includes('--json');
  const totals = { js: 0, css: 0, html: 0 };
  const rows = [];

  const entryHtml = join(DIST, 'index.html');
  for (const path of collect(DIST)) {
    const kind = kindOf(path, entryHtml);
    if (!kind) continue;
    const raw = statSync(path).size;
    const gz = gzipSize(path);
    totals[kind] += gz;
    rows.push({ file: path.slice(DIST.length + 1), kind, rawKb: kb(raw), gzipKb: kb(gz) });
  }

  if (rows.length === 0) {
    console.error(`bundle-budget: no build output in ${DIST}. Run the build first.`);
    process.exitCode = 1;
    return;
  }

  const measured = { ...totals, total: totals.js + totals.css + totals.html };
  const over = Object.entries(BUDGET_KB).filter(([key, limit]) => measured[key] > limit * 1024);

  if (asJson) {
    console.log(JSON.stringify({ dist: DIST, measured: Object.fromEntries(Object.entries(measured).map(([k, v]) => [k, kb(v)])), budgetKb: BUDGET_KB, over: over.map(([k]) => k) }, null, 2));
  } else {
    console.log(`bundle-budget: ${DIST}`);
    for (const row of rows.filter((r) => r.kind !== 'html').sort((a, b) => b.gzipKb - a.gzipKb)) {
      console.log(`  ${row.kind.padEnd(4)} ${String(row.gzipKb).padStart(8)} KB gzip  ${String(row.rawKb).padStart(8)} KB raw  ${row.file}`);
    }
    for (const key of ['js', 'css', 'html', 'total']) {
      const value = kb(measured[key]);
      const limit = BUDGET_KB[key];
      console.log(`  ${key.padEnd(5)} ${String(value).padStart(8)} KB gzip / budget ${limit} KB ${value > limit ? 'OVER' : 'ok'}`);
    }
  }

  if (over.length) {
    console.error(`bundle-budget: over budget for ${over.map(([k, limit]) => `${k} (${limit} KB)`).join(', ')}`);
    process.exitCode = 1;
  }
}

main();
