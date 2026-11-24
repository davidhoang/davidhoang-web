import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const toggleSource = readFileSync(
  join(process.cwd(), 'src/components/DailyThemeToggle.astro'),
  'utf-8',
);

describe('DailyThemeToggle keyboard', () => {
  it('opens the theme calendar from Enter/Space on the daily trigger', () => {
    expect(toggleSource).toMatch(/toggleBtn\.addEventListener\('keydown'/);
    expect(toggleSource).toMatch(/e\.key !== 'Enter' && e\.key !== ' '/);
    expect(toggleSource).toMatch(/setCalendarOpen\(!calendar\.classList\.contains\('open'\)\)/);
  });
});