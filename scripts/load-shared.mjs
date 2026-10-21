// Compiles the shared TypeScript modules that the app also imports, so the
// build-time generator and the browser run literally the same code instead of
// two drifting copies. Node cannot import `.ts` directly and this project has no
// bundler step for scripts, so we transpile the (few, dependency-free) modules
// into a temp directory and import them from there.
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

// Keep in sync with the runtime imports of `src/lib/seoFacts.ts`.
const SHARED_MODULES = [
  'src/lib/seoFacts.ts',
  'src/lib/eligibility.ts',
  'src/lib/format.ts',
  'src/lib/aggregations.ts',
];

export async function loadSharedSeo(rootDir) {
  const out = mkdtempSync(join(tmpdir(), 'amnabd-shared-'));
  for (const rel of SHARED_MODULES) {
    const { outputText } = ts.transpileModule(readFileSync(join(rootDir, rel), 'utf8'), {
      fileName: rel,
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
    });
    const dest = join(out, rel.replace(/\.ts$/, '.js'));
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, outputText, 'utf8');
  }
  writeFileSync(join(out, 'package.json'), '{"type":"module"}', 'utf8');
  return import(pathToFileURL(join(out, 'src/lib/seoFacts.js')).href);
}
