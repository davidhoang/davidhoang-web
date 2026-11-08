#!/usr/bin/env node
/**
 * Fetches Proof of Concept (Substack) archive posts that have a cover image.
 * Writes src/data/proof-of-concept-issues.json for the /subscribe infinite canvas.
 */
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ARCHIVE_ORIGIN = 'https://www.proofofconcept.pub/api/v1/archive';
/** Substack dropped `limit`/`offset`; archive is cursor-paged with `order_by=display_date`. */
const ARCHIVE_FIRST_PAGE = `${ARCHIVE_ORIGIN}?order_by=display_date`;
const FALLBACK_WARNING =
  'PoC archive sync failed; keeping existing src/data/proof-of-concept-issues.json and continuing the build.';
const OUT_PATH = join(process.cwd(), 'src/data/proof-of-concept-issues.json');

/** @typedef {{ id: number; title: string; slug: string; subtitle: string | null; postDate: string; coverImage: string; url: string }} PocIssue */

/**
 * @param {unknown} payload
 * @returns {{ posts: unknown[]; nextCursor: string | null }}
 */
export function parseArchivePage(payload) {
  if (Array.isArray(payload)) {
    return { posts: payload, nextCursor: null };
  }
  if (payload && typeof payload === 'object' && Array.isArray(payload.posts)) {
    const nextCursor =
      typeof payload.nextCursor === 'string' && payload.nextCursor.length > 0
        ? payload.nextCursor
        : null;
    return { posts: payload.posts, nextCursor };
  }
  return { posts: [], nextCursor: null };
}

/**
 * @param {string | null | undefined} cursor
 */
export function buildArchivePageUrl(cursor) {
  if (!cursor) return ARCHIVE_FIRST_PAGE;
  return `${ARCHIVE_FIRST_PAGE}&cursor=${encodeURIComponent(cursor)}`;
}

/** @returns {Promise<PocIssue[]>} */
async function fetchIssuesWithCovers() {
  /** @type {PocIssue[]} */
  const withCover = [];
  let pageUrl = ARCHIVE_FIRST_PAGE;

  while (pageUrl) {
    const res = await fetch(pageUrl);
    if (!res.ok) {
      throw new Error(`Archive fetch failed (${res.status}) for ${pageUrl}`);
    }
    const { posts, nextCursor } = parseArchivePage(await res.json());
    if (posts.length === 0) break;

    for (const post of posts) {
      if (!post?.cover_image || !post?.slug) continue;
      withCover.push({
        id: post.id,
        title: String(post.title ?? '').trim(),
        slug: String(post.slug),
        subtitle: post.subtitle ? String(post.subtitle).trim() : null,
        postDate: String(post.post_date ?? post.postDate ?? ''),
        coverImage: String(post.cover_image),
        url: post.canonical_url
          ? String(post.canonical_url)
          : `https://www.proofofconcept.pub/p/${post.slug}`,
      });
    }

    pageUrl = nextCursor ? buildArchivePageUrl(nextCursor) : '';
  }

  withCover.sort((a, b) => Date.parse(b.postDate) - Date.parse(a.postDate));
  return withCover;
}

async function main() {
  const issues = await fetchIssuesWithCovers();
  const payload = {
    syncedAt: new Date().toISOString(),
    publication: 'https://www.proofofconcept.pub',
    count: issues.length,
    issues,
  };
  writeFileSync(OUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`✓ Wrote ${issues.length} PoC issues with cover images → ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  if (existsSync(OUT_PATH)) {
    console.warn(`⚠ ${FALLBACK_WARNING}`);
    process.exit(0);
  }
  process.exit(1);
});
