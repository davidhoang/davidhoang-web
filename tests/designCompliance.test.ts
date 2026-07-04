import { describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

describe('design compliance audit', () => {
  it('passes strict layout and hero rules (same as CI)', () => {
    const script = join(process.cwd(), 'scripts/audit-design-compliance.mjs');
    const out = execSync(`node ${script} --check`, { encoding: 'utf-8' });
    expect(out).toContain('Design compliance: no violations found.');
  });
});
