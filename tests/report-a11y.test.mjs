// REC-17 — the report form's accessibility contract.
//
// Four gaps were open: no group label for the reason options, no label for the
// note field (the placeholder was doing that job), no live announcement for the
// error, and buttons without an explicit type. This test reads the component
// source, because the project has no DOM test environment; it pins the
// structure rather than the rendering.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const source = readFileSync(join(process.cwd(), 'src/components/ReportDealBox.tsx'), 'utf8');

test('REC-17: the reason options are a labelled group', () => {
  assert.match(source, /<fieldset>/);
  assert.match(source, /<legend className="sr-only">/);

  // The legend must come before the options it names.
  const legendAt = source.indexOf('<legend');
  const optionsAt = source.indexOf('REPORT_REASON_OPTIONS.map');
  assert.ok(legendAt > -1 && optionsAt > legendAt, 'legend must precede the options');
});

test('REC-17: the note field has an explicit label, not just a placeholder', () => {
  assert.match(source, /const noteId = useId\(\);/);
  assert.match(source, /<label htmlFor=\{noteId\}/);
  assert.match(source, /<input\s+id=\{noteId\}/);
});

test('REC-17: a failed submission is announced immediately', () => {
  assert.match(source, /<p role="alert"/);
});

test('REC-17: every button declares its type', () => {
  const buttons = [...source.matchAll(/<button\b[^>]*>/g)].map((match) => match[0]);
  assert.ok(buttons.length >= 4, `expected the form controls, found ${buttons.length}`);
  for (const button of buttons) {
    assert.match(button, /\stype="(?:button|submit)"/, button.slice(0, 60));
  }

  // Exactly one control submits the form; everything else is type="button".
  const submitting = buttons.filter((button) => button.includes('type="submit"'));
  assert.equal(submitting.length, 1);
});
