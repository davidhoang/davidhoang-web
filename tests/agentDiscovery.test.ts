import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  AGENT_DISCOVERY_VERSION,
  agentDiscoverySchema,
  assertNoForbiddenEndpoints,
  absoluteUrl,
  buildAgentDiscoveryContract,
  CANONICAL_ORIGIN,
  collectAdvertisedUrls,
  PUBLIC_DISCOVERY_PATHS,
} from '../src/data/agentDiscovery';

describe('absoluteUrl', () => {
  it('builds canonical https://www.davidhoang.com URLs without trailing slash', () => {
    expect(absoluteUrl('/about')).toBe('https://www.davidhoang.com/about');
    expect(absoluteUrl('/rss.xml')).toBe('https://www.davidhoang.com/rss.xml');
    expect(absoluteUrl('search-index.json')).toBe(
      'https://www.davidhoang.com/search-index.json',
    );
  });
});

describe('buildAgentDiscoveryContract', () => {
  const contract = buildAgentDiscoveryContract();

  it('validates against the published schema', () => {
    expect(() => agentDiscoverySchema.parse(contract)).not.toThrow();
  });

  it('includes explicit semver versioning and an updated date', () => {
    expect(contract.version).toBe(AGENT_DISCOVERY_VERSION);
    expect(contract.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(contract.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('describes site identity and canonical origin', () => {
    expect(contract.identity.name).toBe('David Hoang');
    expect(contract.identity.siteName).toBe('davidhoang.com');
    expect(contract.identity.url).toBe(CANONICAL_ORIGIN);
    expect(contract.canonicalOrigin).toBe(CANONICAL_ORIGIN);
    expect(contract.identity.sameAs).toEqual(
      expect.arrayContaining([
        'https://twitter.com/davidhoang',
        'https://github.com/davidhoang',
        'https://linkedin.com/in/dhoang2',
      ]),
    );
  });

  it('lists only public discovery resources that already exist on main', () => {
    const urls = contract.discovery.resources.map((resource) => resource.url);
    for (const path of PUBLIC_DISCOVERY_PATHS) {
      expect(urls).toContain(`${CANONICAL_ORIGIN}${path}`);
    }

    const types = new Set(contract.discovery.resources.map((resource) => resource.type));
    expect(types.has('sitemap')).toBe(true);
    expect(types.has('rss')).toBe(true);
    expect(types.has('search-index')).toBe(true);
  });

  it('exposes human actions for subscribe, advising, and contact', () => {
    const ids = contract.humanActions.map((action) => action.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'subscribe',
        'advising-inquiry',
        'contact-email',
        'browse-writing',
        'browse-notes',
        'read-about',
      ]),
    );

    const advising = contract.humanActions.find((action) => action.id === 'advising-inquiry');
    expect(advising?.url).toBe('https://tally.so/r/D4M0lb');
    expect(advising?.kind).toBe('form');

    const email = contract.humanActions.find((action) => action.id === 'contact-email');
    expect(email?.url).toBe('mailto:david@davidhoang.com');
  });

  it('requires attribution with a preferred citation and link-back', () => {
    expect(contract.attribution.required).toBe(true);
    expect(contract.attribution.preferredCitation).toContain('David Hoang');
    expect(contract.attribution.linkBack).toBe(CANONICAL_ORIGIN);
    expect(contract.attribution.guidance.toLowerCase()).toContain('attribute');
  });

  it('does not advertise endpoints that do not exist on main', () => {
    expect(() => assertNoForbiddenEndpoints(contract)).not.toThrow();

    const advertised = collectAdvertisedUrls(contract).join('\n');
    expect(advertised).not.toContain('/llms.txt');
    expect(advertised).not.toContain('/.agent/inbox');
    expect(advertised).not.toContain('/api/og');
    expect(advertised).not.toContain('/api/theme-query');
  });
});

describe('well-known agent endpoint wiring', () => {
  it('serves /.well-known/agent.json with JSON content-type and cache headers', () => {
    const routePath = resolve(
      process.cwd(),
      'src/pages/.well-known/agent.json.ts',
    );
    const source = readFileSync(routePath, 'utf8');
    expect(source).toContain("Content-Type': 'application/json; charset=utf-8'");
    expect(source).toContain(
      "const CACHE_CONTROL = 'public, max-age=3600, stale-while-revalidate=86400'",
    );
    expect(source).toContain("'Cache-Control': CACHE_CONTROL");
    expect(source).toContain('buildAgentDiscoveryContract');
    expect(source).toContain('prerender = true');
  });

  it('configures matching Cache-Control in vercel.json', () => {
    const vercel = JSON.parse(
      readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf8'),
    ) as {
      headers: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
    };

    const wellKnown = vercel.headers.find(
      (entry) => entry.source === '/.well-known/agent.json',
    );
    expect(wellKnown).toBeTruthy();
    expect(wellKnown?.headers).toEqual(
      expect.arrayContaining([
        {
          key: 'Cache-Control',
          value: 'public, max-age=3600, stale-while-revalidate=86400',
        },
      ]),
    );
  });
});
