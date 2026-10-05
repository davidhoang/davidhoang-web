#!/usr/bin/env node
/**
 * Fetches Proof of Concept (Substack) archive posts that have a cover image.
 * Writes src/data/proof-of-concept-issues.json for the /subscribe infinite canvas.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ARCHIVE_URL = 'https://www.proofofconcept.pub/api/v1/archive';
const OUT_PATH = join(process.cwd(), 'src/data/proof-of-concept-issues.json');

/** @typedef {{ id: number; title: string; slug: string; subtitle: string | null; postDate: string; coverImage: string; url: string }} PocIssue */

/** @returns {Promise<PocIssue[]>} */
async function fetchIssuesWithCovers() {
  /** @type {PocIssue[]} */
  const withCover = [];
  let offset = 0;
  const limit = 50;

  while (true) {
    const res = await fetch(`${ARCHIVE_URL}?limit=${limit}&offset=${offset}`);
    if (!res.ok) {
      throw new Error(`Archive fetch failed (${res.status}) at offset ${offset}`);
    }
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;

    for (const post of batch) {
      if (!post?.cover_image || !post?.slug) continue;
      withCover.push({
        id: post.id,
        title: String(post.title ?? '').trim(),
        slug: String(post.slug),
        subtitle: post.subtitle ? String(post.subtitle).trim() : null,
        postDate: String(post.post_date ?? ''),
        coverImage: String(post.cover_image),
        url: post.canonical_url
          ? String(post.canonical_url)
          : `https://www.proofofconcept.pub/p/${post.slug}`,
      });
    }

    if (batch.length < limit) break;
    offset += limit;
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
  process.exit(1);
});
