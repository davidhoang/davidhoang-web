import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

function readProductionCsp(): string {
  const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  const globalHeaders = config.headers.find((rule: { source: string }) => rule.source === '/(.*)').headers;
  return globalHeaders.find((header: { key: string }) => header.key.toLowerCase() === 'content-security-policy')
    .value as string;
}

function directiveSources(policy: string, name: string): string[] {
  return (
    policy
      .split(';')
      .map((directive) => directive.trim().split(/\s+/))
      .find((directive) => directive[0] === name) ?? []
  );
}

describe('production Content-Security-Policy', () => {
  it('allows Astro ClientRouter view-transition scripts (data: URLs)', () => {
    const policy = readProductionCsp();
    const scriptSources = directiveSources(policy, 'script-src');
    expect(scriptSources).toContain('data:');
    expect(scriptSources).toContain("'wasm-unsafe-eval'");
    expect(scriptSources).not.toContain("'unsafe-eval'");
  });
});
