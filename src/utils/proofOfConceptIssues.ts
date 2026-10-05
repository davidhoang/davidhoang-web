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
