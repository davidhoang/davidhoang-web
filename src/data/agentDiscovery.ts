import { z } from 'zod';

/** Canonical public origin (matches astro.config `site`). */
export const CANONICAL_ORIGIN = 'https://www.davidhoang.com';

/** Contract schema version — bump when breaking the JSON shape. */
export const AGENT_DISCOVERY_VERSION = '1.0.0';

const discoveryResourceSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['sitemap', 'rss', 'search-index', 'robots']),
  url: z.url(),
  description: z.string().min(1),
});

const humanActionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1),
  url: z.url(),
  kind: z.enum(['page', 'form', 'email']),
});

export const agentDiscoverySchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  identity: z.object({
    name: z.string().min(1),
    siteName: z.string().min(1),
    description: z.string().min(1),
    url: z.url(),
    sameAs: z.array(z.url()).min(1),
  }),
  canonicalOrigin: z.url(),
  discovery: z.object({
    resources: z.array(discoveryResourceSchema).min(1),
  }),
  humanActions: z.array(humanActionSchema).min(1),
  attribution: z.object({
    required: z.literal(true),
    preferredCitation: z.string().min(1),
    linkBack: z.url(),
    guidance: z.string().min(1),
  }),
  usage: z.object({
    summary: z.string().min(1),
    preferPublicDiscoveryResources: z.literal(true),
    notes: z.array(z.string().min(1)).min(1),
  }),
});

export type AgentDiscoveryContract = z.infer<typeof agentDiscoverySchema>;

/**
 * Paths advertised in the contract. Only include resources that exist on main today.
 * Do not list /llms.txt or other planned endpoints until they ship.
 */
export const PUBLIC_DISCOVERY_PATHS = [
  '/sitemap-index.xml',
  '/rss.xml',
  '/rss/writing.xml',
  '/rss/notes.xml',
  '/search-index.json',
  '/robots.txt',
] as const;

const FORBIDDEN_ADVERTISED_PATHS = [
  '/llms.txt',
  '/.agent/inbox',
  '/api/og',
  '/api/theme-query',
] as const;

export function absoluteUrl(pathOrUrl: string, origin: string = CANONICAL_ORIGIN): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const base = origin.replace(/\/+$/, '');
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  const normalized = path.length > 1 ? path.replace(/\/+$/, '') : path;
  return `${base}${normalized}`;
}

export function buildAgentDiscoveryContract(
  options: { origin?: string; updated?: string } = {},
): AgentDiscoveryContract {
  const origin = (options.origin ?? CANONICAL_ORIGIN).replace(/\/+$/, '');
  const updated = options.updated ?? '2026-08-07';

  const contract: AgentDiscoveryContract = {
    version: AGENT_DISCOVERY_VERSION,
    updated,
    identity: {
      name: 'David Hoang',
      siteName: 'davidhoang.com',
      description:
        'Personal website of David Hoang — designer, investor, and builder. Essays, digital garden notes, career journey, and experiments.',
      url: origin,
      sameAs: [
        'https://twitter.com/davidhoang',
        'https://github.com/davidhoang',
        'https://linkedin.com/in/dhoang2',
      ],
    },
    canonicalOrigin: origin,
    discovery: {
      resources: [
        {
          id: 'sitemap',
          type: 'sitemap',
          url: absoluteUrl('/sitemap-index.xml', origin),
          description: 'XML sitemap index of public pages.',
        },
        {
          id: 'rss-writing',
          type: 'rss',
          url: absoluteUrl('/rss.xml', origin),
          description:
            'Full-content RSS for published writing (same scope as /rss/writing.xml).',
        },
        {
          id: 'rss-writing-alias',
          type: 'rss',
          url: absoluteUrl('/rss/writing.xml', origin),
          description: 'Alias of the writing RSS feed at /rss.xml.',
        },
        {
          id: 'rss-notes',
          type: 'rss',
          url: absoluteUrl('/rss/notes.xml', origin),
          description: 'RSS for published digital garden notes.',
        },
        {
          id: 'search-index',
          type: 'search-index',
          url: absoluteUrl('/search-index.json', origin),
          description:
            'JSON index of primary pages, writing, and notes used by site search (⌘K).',
        },
        {
          id: 'robots',
          type: 'robots',
          url: absoluteUrl('/robots.txt', origin),
          description: 'Crawl rules; API routes under /api/ are disallowed.',
        },
      ],
    },
    humanActions: [
      {
        id: 'read-about',
        label: 'About',
        description: 'Read bio and background.',
        url: absoluteUrl('/about', origin),
        kind: 'page',
      },
      {
        id: 'browse-writing',
        label: 'Writing',
        description: 'Browse essays and articles.',
        url: absoluteUrl('/writing', origin),
        kind: 'page',
      },
      {
        id: 'browse-notes',
        label: 'Notes',
        description: 'Browse the digital garden.',
        url: absoluteUrl('/notes', origin),
        kind: 'page',
      },
      {
        id: 'subscribe',
        label: 'Subscribe',
        description: 'Subscribe to the Proof of Concept newsletter.',
        url: absoluteUrl('/subscribe', origin),
        kind: 'form',
      },
      {
        id: 'advising-inquiry',
        label: 'Advising inquiry',
        description:
          'Submit a short advising inquiry for Heads of Design at growth-stage startups.',
        url: 'https://tally.so/r/D4M0lb',
        kind: 'form',
      },
      {
        id: 'poc-ventures',
        label: 'Proof of Concept Ventures',
        description: 'Read the fund mission and selected investments, then inquire by email.',
        url: absoluteUrl('/fund', origin),
        kind: 'page',
      },
      {
        id: 'contact-email',
        label: 'Email',
        description: 'Contact David by email.',
        url: 'mailto:david@davidhoang.com',
        kind: 'email',
      },
    ],
    attribution: {
      required: true,
      preferredCitation: 'David Hoang (davidhoang.com)',
      linkBack: origin,
      guidance:
        'When quoting, summarizing, or citing site content, attribute David Hoang and link to the canonical page or https://www.davidhoang.com when a specific URL is unavailable.',
    },
    usage: {
      summary:
        'Lightweight discovery and usage contract for agents. Prefer public discovery resources below; do not invent APIs or agent inboxes.',
      preferPublicDiscoveryResources: true,
      notes: [
        'This document is separate from llms.txt and does not imply that /llms.txt exists.',
        'Only advertise and fetch endpoints listed under discovery.resources.',
        'Human actions are browser/email flows for people; there is no machine action inbox.',
        'Respect robots.txt. Do not call /api/ endpoints for content discovery.',
      ],
    },
  };

  return agentDiscoverySchema.parse(contract);
}

/** URLs that must never appear in the contract payload. */
export function collectAdvertisedUrls(contract: AgentDiscoveryContract): string[] {
  return [
    ...contract.discovery.resources.map((resource) => resource.url),
    ...contract.humanActions.map((action) => action.url),
    contract.identity.url,
    contract.canonicalOrigin,
    contract.attribution.linkBack,
  ];
}

export function assertNoForbiddenEndpoints(contract: AgentDiscoveryContract): void {
  const advertised = collectAdvertisedUrls(contract).join('\n');
  for (const path of FORBIDDEN_ADVERTISED_PATHS) {
    if (advertised.includes(path)) {
      throw new Error(`Agent discovery contract must not advertise ${path}`);
    }
  }
}
