import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { discoverableStaticPages } from '../src/data/navigation';
import { isIndexedSitemapPage } from '../src/data/searchIndexConfig';
import { SEARCH_INDEX_SITE, absoluteUrl } from '../src/utils/searchIndex';
import {
  loadNoteEntriesFromDisk,
  loadWritingEntriesFromDisk,
} from './helpers/contentEntriesFromDisk';

const CANONICAL = SEARCH_INDEX_SITE;

function collectCandidateSitemapPaths(): string[] {
  const staticPaths = discoverableStaticPages.map((page) => page.path);
  const writing = loadWritingEntriesFromDisk()
    .filter((entry) => !entry.data.draft)
    .map((entry) => `/writing/${entry.id}`);
  const notes = loadNoteEntriesFromDisk()
    .filter((entry) => !entry.data.draft)
    .map((entry) => `/notes/${entry.id}`);

  return [...staticPaths, ...writing, ...notes];
}

describe('sitemap indexing policy', () => {
  it('uses the canonical www host for indexed URLs', () => {
    expect(absoluteUrl('/about')).toBe(`${CANONICAL}/about`);
    expect(isIndexedSitemapPage(`${CANONICAL}/about`)).toBe(true);
    expect(isIndexedSitemapPage('https://davidhoang.com/about')).toBe(true);
  });

  it('keeps utility, API, feed, and unlisted experiment routes excluded', () => {
    const blocked = [
      '/api/og',
      '/rss.xml',
      '/rss/notes.xml',
      '/search-index.json',
      '/llms.txt',
      '/default-layout',
      '/labs',
      '/projects',
      '/experiments/greco-diorama',
      '/404',
    ];
    for (const path of blocked) {
      expect(isIndexedSitemapPage(absoluteUrl(path)), path).toBe(false);
    }
  });

  it('indexes discoverable static pages and published content without duplicates', () => {
    const paths = collectCandidateSitemapPaths();
    const unique = new Set(paths);
    expect(unique.size).toBe(paths.length);

    for (const path of paths) {
      expect(isIndexedSitemapPage(absoluteUrl(path)), path).toBe(true);
    }
  });

  it('matches astro.config sitemap filter export', () => {
    const config = readFileSync(join(process.cwd(), 'astro.config.mjs'), 'utf8');
    expect(config).toContain('sitemap({');
    expect(config).toContain('filter: isIndexedSitemapPage');
  });
});

describe('built sitemap output (when dist/ exists)', () => {
  it('lists only canonical www URLs without duplicates', () => {
    const distDir = join(process.cwd(), 'dist/client');
    const indexPath = join(distDir, 'sitemap-index.xml');
    if (!existsSync(indexPath)) {
      return;
    }

    const indexXml = readFileSync(indexPath, 'utf8');
    const partNames = [...indexXml.matchAll(/<loc>([^<]+sitemap-\d+\.xml)<\/loc>/g)].map(
      (match) => match[1],
    );
    expect(partNames.length).toBeGreaterThan(0);

    const locs: string[] = [];
    for (const partUrl of partNames) {
      const partPath = join(distDir, partUrl.split('/').pop()!);
      const partXml = readFileSync(partPath, 'utf8');
      locs.push(...[...partXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]));
    }

    expect(new Set(locs).size).toBe(locs.length);
    for (const loc of locs) {
      expect(loc === CANONICAL || loc.startsWith(`${CANONICAL}/`)).toBe(true);
      expect(loc.includes('/api/')).toBe(false);
      expect(loc.includes('/default-layout')).toBe(false);
    }
  });

  it('does not advertise excluded prototype routes when dist is present', () => {
    const distDir = join(process.cwd(), 'dist/client');
    if (!existsSync(distDir)) return;

    const sitemapFiles = readdirSync(distDir).filter((name) => name.startsWith('sitemap-'));
    if (!sitemapFiles.length) return;

    const combined = sitemapFiles
      .map((name) => readFileSync(join(distDir, name), 'utf8'))
      .join('\n');

    expect(combined).not.toContain(`${CANONICAL}/api/og`);
    expect(combined).not.toContain(`${CANONICAL}/default-layout`);
    expect(combined).not.toContain(`${CANONICAL}/experiments/greco-diorama`);
  });
});
