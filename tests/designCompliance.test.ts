import { describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

describe('design compliance audit', () => {
  it('runs and prints a status line', () => {
    const script = join(process.cwd(), 'scripts/audit-design-compliance.mjs');
    const out = execSync(`node ${script}`, { encoding: 'utf-8' });
    expect(out).toMatch(/Design compliance: (no violations found|\d+ violation\(s\))/);
  });
});
