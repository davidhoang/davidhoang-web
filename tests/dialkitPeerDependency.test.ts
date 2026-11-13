import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();

describe('dialkit peer dependencies', () => {
  it('keeps motion installed for dialkit (Vite dev + UI tests)', () => {
    const pkg = JSON.parse(
      readFileSync(join(ROOT, 'package.json'), 'utf8'),
    ) as { dependencies?: Record<string, string> };

    expect(pkg.dependencies?.dialkit).toBeDefined();
    expect(pkg.dependencies?.motion).toMatch(/^\^12\./);
  });
});