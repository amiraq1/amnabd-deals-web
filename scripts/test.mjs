// Compile only the pure boundary/format modules using the existing TypeScript
// dependency. Compatible with Node 20+; no strip-types flags or new dependency.
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = mkdtempSync(join(tmpdir(), 'amnabd-tests-'));
let status = 1;
try {
  const compiled = spawnSync(
    process.execPath,
    [
      join(root, 'node_modules/typescript/bin/tsc'),
      '-p',
      join(root, 'tsconfig.test.json'),
      '--outDir',
      output,
    ],
    { stdio: 'inherit', cwd: root }
  );
  if (compiled.error) throw compiled.error;
  if (compiled.status === 0) {
    writeFileSync(join(output, 'package.json'), JSON.stringify({ type: 'module' }));
    const tests = readdirSync(join(root, 'tests'))
      .filter((name) => name.endsWith('.test.mjs'))
      .sort();
    if (tests.length === 0) throw new Error('No test files found');
    const checked = spawnSync(
      process.execPath,
      ['--test', ...tests.map((name) => join(root, 'tests', name))],
      {
        stdio: 'inherit',
        cwd: root,
        env: { ...process.env, AMN_TEST_BUILD_DIR: output },
      }
    );
    if (checked.error) throw checked.error;
    status = checked.status ?? 1;
  } else status = compiled.status ?? 1;
} finally {
  rmSync(output, { recursive: true, force: true });
}
process.exitCode = status;
