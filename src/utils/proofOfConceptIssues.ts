import archiveJson from '../data/proof-of-concept-issues.json';
import { resizeSubstackCdnCover } from './substackCoverImage';

export type ProofOfConceptIssue = {
  id: number;
  title: string;
  slug: string;
  subtitle: string | null;
  postDate: string;
  coverImage: string;
  url: string;
};

export type ProofOfConceptIssuesFile = {
  syncedAt: string;
  publication: string;
  count: number;
  issues: ProofOfConceptIssue[];
};

export function getProofOfConceptIssuesArchive(): ProofOfConceptIssuesFile {
  return archiveJson as ProofOfConceptIssuesFile;
}

/** Fields read by ProofOfConceptIssueCanvas — keep island props small. */
export type ProofOfConceptCanvasIssue = {
  id: number;
  title: string;
  subtitle: string | null;
  coverImage: string;
  url: string;
};

/** Legacy PoC covers that pointed at Twitter via pbs.substack.com now 404 on substackcdn. */
function resolvePoCCanvasCover(issue: ProofOfConceptIssue): string {
  const cover = issue.coverImage;
  const usesDeadTwitterEmbed =
    cover.includes('pbs.substack.com/media') || cover.includes('%2Fpbs.substack.com%2Fmedia%2F');

  if (usesDeadTwitterEmbed) {
    // Substack CDN cannot proxy arbitrary origins (post_preview 404s when wrapped). Serve directly.
    return `https://www.proofofconcept.pub/api/v1/post_preview/${issue.id}/twitter.jpg`;
  }

  return resizeSubstackCdnCover(cover);
}

export function mapProofOfConceptIssuesForCanvas(
  archive: ProofOfConceptIssuesFile,
): ProofOfConceptCanvasIssue[] {
  return archive.issues.map((issue) => ({
    id: issue.id,
    title: issue.title,
    subtitle: issue.subtitle,
    coverImage: resolvePoCCanvasCover(issue),
    url: issue.url,
  }));
}
