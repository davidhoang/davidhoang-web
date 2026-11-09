/**
 * Content-backed <lastmod> hints for @astrojs/sitemap serialize().
 * Only emits dates we can justify from frontmatter or shared page constants — no invented freshness.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { absoluteUrl, NOW_LAST_UPDATED, toIsoDateOnly } from './structuredData';

type ContentEntry = {
  path: string;
  lastmod: Date;
};

function parseFrontmatterBlock(block: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of block.split('\n')) {
    const match = line.match(/^([A-Za-z0-9_]+):\s*(.+)$/);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[match[1]] = value;
  }
  return out;
}

function parseMarkdownDates(dir: string, file: string): ContentEntry | null {
  const id = basename(file, '.md');
  const raw = readFileSync(join(dir, file), 'utf8');
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const fm = parseFrontmatterBlock(match[1]);
  if (fm.draft === 'true') return null;

  const pubRaw = fm.pubDate;
  if (!pubRaw) return null;
  const pubDate = new Date(pubRaw);
  if (Number.isNaN(pubDate.getTime())) return null;

  const updatedRaw = fm.updatedDate;
  const updatedDate = updatedRaw ? new Date(updatedRaw) : undefined;
  const lastmod =
    updatedDate && !Number.isNaN(updatedDate.getTime()) ? updatedDate : pubDate;

  return { path: id, lastmod };
}

function loadCollectionEntries(collection: 'writing' | 'notes'): ContentEntry[] {
  const pathPrefix = `/${collection}`;
  const dir = join(process.cwd(), 'src/content', collection);
  return readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .map((file) => parseMarkdownDates(dir, file))
    .filter((entry): entry is ContentEntry => entry != null)
    .map((entry) => ({
      path: `${pathPrefix}/${entry.path}`,
      lastmod: entry.lastmod,
    }));
}

function maxDate(dates: Date[]): Date | undefined {
  if (!dates.length) return undefined;
  return new Date(Math.max(...dates.map((d) => d.getTime())));
}

function normalizeSitemapUrl(pageUrl: string): string {
  const withoutQuery = pageUrl.split('?')[0].split('#')[0];
  return withoutQuery.length > 1 ? withoutQuery.replace(/\/+$/, '') : withoutQuery;
}

let cachedMap: Map<string, Date> | undefined;

/** Map canonical absolute URLs → last modification time for sitemap serialization. */
export function getSitemapLastmodMap(): Map<string, Date> {
  if (cachedMap) return cachedMap;

  const map = new Map<string, Date>();
  const writing = loadCollectionEntries('writing');
  const notes = loadCollectionEntries('notes');

  for (const entry of [...writing, ...notes]) {
    map.set(absoluteUrl(entry.path), entry.lastmod);
  }

  const writingIndexLast = maxDate(writing.map((e) => e.lastmod));
  if (writingIndexLast) {
    map.set(absoluteUrl('/writing'), writingIndexLast);
  }

  const notesIndexLast = maxDate(notes.map((e) => e.lastmod));
  if (notesIndexLast) {
    map.set(absoluteUrl('/notes'), notesIndexLast);
  }

  map.set(absoluteUrl('/now'), new Date(toIsoDateOnly(NOW_LAST_UPDATED)));

  cachedMap = map;
  return map;
}

export function resolveSitemapLastmod(pageUrl: string): Date | undefined {
  return getSitemapLastmodMap().get(normalizeSitemapUrl(pageUrl));
}
