import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const robotsPath = join(process.cwd(), 'public/robots.txt');
const policyPath = join(process.cwd(), 'docs/ai-crawler-policy.md');

const RETRIEVAL_BOTS = [
  'OAI-SearchBot',
  'ChatGPT-User',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
] as const;

const TRAINING_BOTS = [
  'GPTBot',
  'ClaudeBot',
  'anthropic-ai',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
  'Bytespider',
  'meta-externalagent',
] as const;

const SEARCH_BOTS = ['Googlebot', 'Bingbot', 'DuckDuckBot', 'Applebot'] as const;

function userAgentBlock(robots: string, userAgent: string): string | null {
  const pattern = new RegExp(
    `User-agent:\\s*${userAgent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\n([\\s\\S]*?)(?=\\nUser-agent:|\\nSitemap:|$)`,
    'i',
  );
  const match = robots.match(pattern);
  return match ? match[0] : null;
}

describe('public/robots.txt AI crawler policy', () => {
  it('exists alongside the human-readable policy doc', () => {
    expect(existsSync(robotsPath)).toBe(true);
    expect(existsSync(policyPath)).toBe(true);
  });

  it('keeps /api/ disallowed and declares the sitemap', () => {
    const robots = readFileSync(robotsPath, 'utf8');
    expect(robots).toMatch(/Disallow:\s*\/api\//);
    expect(robots).toContain('Sitemap: https://www.davidhoang.com/sitemap-index.xml');
  });

  it('points maintainers at the policy doc and states robots.txt limitations', () => {
    const robots = readFileSync(robotsPath, 'utf8');
    expect(robots).toContain('docs/ai-crawler-policy.md');
    expect(robots.toLowerCase()).toMatch(/cannot reliably distinguish/);
  });

  it('lists major search, retrieval, and training crawlers with public Allow', () => {
    const robots = readFileSync(robotsPath, 'utf8');

    for (const bot of [...SEARCH_BOTS, ...RETRIEVAL_BOTS, ...TRAINING_BOTS]) {
      const block = userAgentBlock(robots, bot);
      expect(block, `missing User-agent group for ${bot}`).toBeTruthy();
      expect(block!).toMatch(/Allow:\s*\//);
      expect(block!).toMatch(/Disallow:\s*\/api\//);
      expect(block!).not.toMatch(/Disallow:\s*\/\s*$/m);
    }
  });

  it('preserves wildcard public access (Allow /) without sitewide Disallow /', () => {
    const robots = readFileSync(robotsPath, 'utf8');
    const wildcard = userAgentBlock(robots, '*');
    expect(wildcard).toBeTruthy();
    expect(wildcard!).toMatch(/Allow:\s*\//);
    expect(wildcard!).toMatch(/Disallow:\s*\/api\//);
    expect(wildcard!).not.toMatch(/Disallow:\s*\/\s*$/m);
  });

  it('documents retrieval vs training stance in the policy markdown', () => {
    const policy = readFileSync(policyPath, 'utf8');
    expect(policy).toMatch(/## Stance/);
    expect(policy).toMatch(/\*\*Retrieval\*\*/);
    expect(policy).toMatch(/\*\*Training\*\*/);
    expect(policy).toMatch(/How to update the bot list/);
    expect(policy).toMatch(/What robots\.txt is/);
  });
});
