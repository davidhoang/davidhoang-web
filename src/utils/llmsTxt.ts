/** Pure builder for /llms.txt — keep route thin and unit-testable. */

export const CANONICAL_SITE = 'https://www.davidhoang.com';

export type LlmsLink = {
  title: string;
  path: string;
  description?: string;
};

export type LlmsTxtInput = {
  site?: string;
  summary?: string;
  details?: string;
  pages: readonly LlmsLink[];
  writing: readonly LlmsLink[];
  notes: readonly LlmsLink[];
};

function normalizePath(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const withSlash = path.startsWith('/') ? path : `/${path}`;
  // Site uses trailingSlash: 'never'
  return withSlash.length > 1 ? withSlash.replace(/\/+$/, '') : withSlash;
}

export function absoluteUrl(path: string, site: string = CANONICAL_SITE): string {
  if (/^https?:\/\//i.test(path)) return path;
  const base = site.replace(/\/+$/, '');
  return `${base}${normalizePath(path)}`;
}

function formatListItem(link: LlmsLink, site: string): string {
  const url = absoluteUrl(link.path, site);
  const note = link.description?.trim();
  return note ? `- [${link.title}](${url}): ${note}` : `- [${link.title}](${url})`;
}

function section(title: string, links: readonly LlmsLink[], site: string): string {
  if (links.length === 0) return '';
  const items = links.map((link) => formatListItem(link, site)).join('\n');
  return `## ${title}\n\n${items}`;
}

const DEFAULT_SUMMARY =
  'Personal website of David Hoang — designer, investor, and builder. Essays, digital garden notes, career journey, and experiments.';

const DEFAULT_DETAILS =
  'Canonical host is https://www.davidhoang.com. Draft writing and notes are omitted. Prefer the links below; sitemap and search-index.json cover broader discovery.';

/**
 * Build an llmstxt.org-shaped markdown document for AI/agent discovery.
 */
export function buildLlmsTxt(input: LlmsTxtInput): string {
  const site = (input.site ?? CANONICAL_SITE).replace(/\/+$/, '');
  const summary = (input.summary ?? DEFAULT_SUMMARY).trim();
  const details = (input.details ?? DEFAULT_DETAILS).trim();

  const feeds: LlmsLink[] = [
    {
      title: 'Writing RSS',
      path: '/rss.xml',
      description: 'Full-content RSS for published writing (same scope as /rss/writing.xml).',
    },
    {
      title: 'Notes RSS',
      path: '/rss/notes.xml',
      description: 'RSS for published digital garden notes.',
    },
    {
      title: 'Sitemap',
      path: '/sitemap-index.xml',
      description: 'XML sitemap index of public pages.',
    },
    {
      title: 'Search index',
      path: '/search-index.json',
      description: 'JSON index of primary pages, writing, and notes used by site search.',
    },
  ];

  const parts = [
    '# David Hoang',
    '',
    `> ${summary}`,
    '',
    details,
    '',
    section('Pages', input.pages, site),
    '',
    section('Writing', input.writing, site),
    '',
    section('Notes', input.notes, site),
    '',
    section('Feeds & indexes', feeds, site),
    '',
  ];

  return parts
    .filter((part, index, arr) => !(part === '' && arr[index - 1] === ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd() + '\n';
}
