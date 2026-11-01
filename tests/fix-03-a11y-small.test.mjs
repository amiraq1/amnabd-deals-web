// FIX-03 (AUD-13, AUD-14): the language toggle's accessible name must contain
// its visible text (WCAG 2.5.3), and category count labels must not be dimmed
// with opacity below the 4.5:1 text contrast floor.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { after, before, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const root = process.cwd();
let vite;
let Navbar;
let LanguageProvider;

before(async () => {
  vite = await createServer({
    configFile: resolve(root, 'vite.config.ts'),
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'error',
  });
  ({ Navbar } = await vite.ssrLoadModule('/src/components/Navbar.tsx'));
  ({ LanguageProvider } = await vite.ssrLoadModule('/src/context/LanguageContext.tsx'));
});

after(async () => {
  await vite?.close();
});

function renderNavbar(lang) {
  const values = new Map();
  globalThis.window = {
    location: { search: `?lang=${lang}`, hash: '' },
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
      removeItem: (key) => values.delete(key),
    },
  };
  try {
    return renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        null,
        React.createElement(Navbar, { route: { name: 'home' }, navigate: () => {}, savedCount: 0 })
      )
    );
  } finally {
    delete globalThis.window;
  }
}

// Visible text of the toggle, from Navbar translations.langButton.
const VISIBLE = { ar: 'EN', en: 'ع' };

for (const lang of ['ar', 'en']) {
  test(`language toggle accessible name contains its visible text (${lang})`, () => {
    const html = renderNavbar(lang);
    const buttons = html.match(/<button\b[\s\S]*?<\/button>/g) ?? [];
    const toggle = buttons.find((button) => button.includes(`<span>${VISIBLE[lang]}</span>`));
    assert.ok(toggle, `a button shows the visible text ${VISIBLE[lang]}`);
    const label = /aria-label="([^"]*)"/.exec(toggle)?.[1];
    assert.ok(label, 'toggle has an aria-label');
    assert.ok(
      label.includes(VISIBLE[lang]),
      `accessible name "${label}" must contain visible text "${VISIBLE[lang]}"`
    );
  });
}

test('category count labels are not dimmed with opacity-75', () => {
  const source = readFileSync(resolve(root, 'src/pages/HomePage.tsx'), 'utf8');
  assert.equal(source.includes('opacity-75'), false, 'no opacity-75 on HomePage');
});
