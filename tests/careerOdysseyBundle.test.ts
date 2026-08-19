import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('CareerOdyssey bundle (PC-26)', () => {
  it('lazy-loads the detail modal instead of static import', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/components/career-odyssey/CareerCanvas.tsx'),
      'utf8',
    );

    expect(source).toMatch(/lazy\(\s*\(\)\s*=>\s*\n?\s*import\('\.\/NodeDetailModal'\)/);
    expect(source).not.toMatch(/import\s+\{\s*NodeDetailModal\s*\}\s+from\s+'\.\/NodeDetailModal'/);
  });

  it('keeps CareerCanvas behind Suspense in the wrapper', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/components/CareerOdysseyWrapper.tsx'),
      'utf8',
    );

    expect(source).toMatch(/lazy\(\(\)\s*=>\s*import\('\.\/career-odyssey\/CareerCanvas'\)/);
    expect(source).toMatch(/Suspense/);
  });
});
