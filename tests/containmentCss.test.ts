import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('CSS containment (PC-8)', () => {
  it('declares card containment and list content-visibility rules', () => {
    const css = readFileSync(
      join(process.cwd(), 'src/styles/modules/containment.css'),
      'utf8',
    );

    expect(css).toContain('contain: layout paint');
    expect(css).toContain('content-visibility: auto');
    expect(css).toContain('.content-filter-wrapper');
    expect(css).toContain('isolation: isolate');
  });

  it('is imported from global.css', () => {
    const globalCss = readFileSync(join(process.cwd(), 'src/styles/global.css'), 'utf8');
    expect(globalCss).toContain('modules/containment.css');
  });
});
