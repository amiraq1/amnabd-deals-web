import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const read = (path) => readFileSync(join(process.cwd(), path), 'utf8');
const workflow = read('.github/workflows/deploy.yml');
const resources = read('src/lib/loadResources.ts');

function selectedColumns(table, constant) {
  const start = resources.indexOf(`.from('${table}')`);
  assert.notEqual(start, -1, `missing query for ${table}`);
  const end = resources.indexOf('.abortSignal(signal)', start);
  assert.notEqual(end, -1, `missing abort signal for ${table}`);
  const query = resources.slice(start, end);
  assert.match(query, new RegExp(`\\.select\\(${constant}\\)`));
  const declaration = resources.match(
    new RegExp(`const ${constant} = \\[([\\s\\S]*?)\\]\\.join\\('?,?'?\\);`)
  );
  assert.ok(declaration, `missing explicit column list ${constant}`);
  return [...declaration[1].matchAll(/'([a-z_]+)'/g)].map((match) => match[1]);
}

test('manual dispatches from non-main refs cannot enter the build or deploy path', () => {
  const build = workflow.match(/^\s{2}build:\n([\s\S]*?)^\s{2}deploy:/m)?.[1];
  const deploy = workflow.match(/^\s{2}deploy:\n([\s\S]*)$/m)?.[1];
  assert.ok(build, 'missing build job');
  assert.ok(deploy, 'missing deploy job');
  assert.match(build, /if:\s*github\.event_name\s*==\s*'pull_request'\s*\|\|\s*github\.ref\s*==\s*'refs\/heads\/main'/);
  assert.match(build, /if:\s*github\.ref\s*==\s*'refs\/heads\/main'\s*&&\s*github\.event_name\s*!=\s*'pull_request'/);
  assert.match(deploy, /if:\s*github\.ref\s*==\s*'refs\/heads\/main'\s*&&\s*github\.event_name\s*!=\s*'pull_request'/);
  assert.doesNotMatch(build, /^\s{4}env:/m, 'production secrets must not be job-wide');
  assert.match(build, /Validate production secrets on main[\s\S]*?env:[\s\S]*?secrets\.VITE_SUPABASE_URL/);
  assert.match(
    build,
    /Build and verify with fixture config[\s\S]*?run: npm run build && node scripts\/verify-dist\.mjs[\s\S]*?env:[\s\S]*?secrets\.VITE_SUPABASE_ANON_KEY/
  );
});

test('public resource queries request only columns consumed by validation', () => {
  assert.deepEqual(selectedColumns('deals', 'DEAL_COLUMNS'), [
    'id',
    'slug',
    'name_ar',
    'name_en',
    'description_ar',
    'description_en',
    'category',
    'benefits',
    'eligibility',
    'pricing',
    'registration',
    'official_sources',
    'get_offer',
    'review',
    'created_at',
    'icon_url',
    'status',
    'ends_at',
  ]);
  assert.deepEqual(selectedColumns('usage_guides', 'GUIDE_COLUMNS'), ['slug', 'sections']);
  assert.deepEqual(selectedColumns('site_config', 'CONFIG_COLUMNS'), [
    'id',
    'overview',
    'section_labels',
    'last_reviewed',
  ]);
  assert.doesNotMatch(resources, /\.select\(\s*['"]\*['"]\s*\)/);
});
