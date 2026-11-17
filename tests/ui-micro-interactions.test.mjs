import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('UI Micro-interactions and Animation Polish', () => {
  it('verifies DealCard includes active:scale press feedback on primary details link', () => {
    const filePath = path.resolve('src/components/DealCard.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    assert.match(
      content,
      /transition-\[colors,transform\]\s+duration-150\s+active:scale-\[0\.98\]/,
      'DealCard primary details link must include active scale feedback for tactile response',
    );
  });

  it('verifies FavoriteButton includes active:scale feedback on button surfaces', () => {
    const filePath = path.resolve('src/components/FavoriteButton.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    assert.match(
      content,
      /active:scale-\[0\.92\]/,
      'FavoriteButton icon-only variant must have active:scale-[0.92]',
    );
    assert.match(
      content,
      /active:scale-\[0\.98\]/,
      'FavoriteButton text variant must have active:scale-[0.98]',
    );
  });

  it('verifies HomePage filter buttons and use-case chips have tactile active press states', () => {
    const filePath = path.resolve('src/pages/HomePage.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    assert.match(
      content,
      /transition-\[colors,transform\]\s+duration-150\s+active:scale-\[0\.95\]/,
      'Use-case filter chips must include active:scale-[0.95]',
    );
    assert.match(
      content,
      /discovery-path.*?active:scale-\[0\.98\]/,
      'Hero discovery path buttons must include active:scale-[0.98]',
    );
    assert.match(
      content,
      /transition-opacity\s+duration-150/,
      'Copy status icon transition must be smooth',
    );
  });

  it('verifies index.css fade-up keyframe has subtle scale grounding and crisp easing', () => {
    const filePath = path.resolve('src/index.css');
    const content = fs.readFileSync(filePath, 'utf8');

    assert.match(
      content,
      /@keyframes fade-up\s*\{[\s\S]*?scale\(0\.98\)[\s\S]*?scale\(1\)/,
      'fade-up keyframe must include scale grounding',
    );
    assert.match(
      content,
      /\.animate-fade-up\s*\{[\s\S]*?cubic-bezier\(0\.23,\s*1,\s*0\.32,\s*1\)/,
      'animate-fade-up must use standard ease-out curve',
    );
  });
});
