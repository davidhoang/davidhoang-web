import archiveJson from '../data/proof-of-concept-issues.json';

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

export function mapProofOfConceptIssuesForCanvas(
  archive: ProofOfConceptIssuesFile,
): ProofOfConceptCanvasIssue[] {
  return archive.issues.map((issue) => ({
    id: issue.id,
    title: issue.title,
    subtitle: issue.subtitle,
    coverImage: issue.coverImage,
    url: issue.url,
  }));
}
