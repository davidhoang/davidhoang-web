import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

/**
 * Assertions for the hero-motion-continuity agent eval.
 * When run via @vercel/agent-eval, point ROOT at the sandbox output.
 */
describe('eval: hero motion continuity', () => {
  it('does not reintroduce remount-on-hover in CardBase', () => {
    const content = readFileSync(join(ROOT, 'src/components/hero/CardBase.tsx'), 'utf-8');
    expect(content).not.toMatch(/\banimPlayKey\b/);
    expect(content).not.toMatch(/key=\{`hero-anim-/);
    expect(content).not.toMatch(/isHeroMediaActive\s*\?\s*['"]card-hero-image--drift['"]/);
  });
});
