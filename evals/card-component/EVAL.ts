import { test, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';

const COMPONENT = 'src/components/eval/ThemeCard.astro';

test('ThemeCard.astro exists', () => {
  expect(existsSync(COMPONENT)).toBe(true);
});

test('uses card primitive', () => {
  const content = readFileSync(COMPONENT, 'utf-8');
  expect(content).toMatch(/class=["'][^"']*\bcard\b/);
});

test('no hardcoded hex colors in component', () => {
  const content = readFileSync(COMPONENT, 'utf-8');
  const styleBlocks = content.match(/<style[^>]*>([\s\S]*?)<\/style>/g) ?? [];
  for (const block of styleBlocks) {
    expect(block).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  }
});

test('no glass card style', () => {
  const content = readFileSync(COMPONENT, 'utf-8');
  expect(content).not.toMatch(/card-glass|data-card-style=["']glass["']/);
});

test('uses spacing or color tokens in scoped CSS', () => {
  const content = readFileSync(COMPONENT, 'utf-8');
  if (content.includes('<style')) {
    expect(content).toMatch(/var\(--(?:spacing-|color-|card-)/);
  }
});
