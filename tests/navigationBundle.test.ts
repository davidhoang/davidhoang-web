import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Navigation bundle (PCD-143)', () => {
  it('does not statically import hero-components or framer-motion', () => {
    const astroDir = join(process.cwd(), 'dist/client/_astro');
    if (!existsSync(astroDir)) {
      expect.fail('Run `npm run build` before this test.');
    }

    const navChunk = readdirSync(astroDir).find(
      (name) => name.startsWith('Navigation.astro_astro_type_script_index_0_lang.') && name.endsWith('.js'),
    );
    expect(navChunk).toBeTruthy();

    const source = readFileSync(join(astroDir, navChunk!), 'utf8');
    expect(source).not.toMatch(/hero-components\./);
    expect(source).not.toMatch(/framer-motion\./);
    expect(source).toMatch(/viewport-capabilities\./);
  });
});
