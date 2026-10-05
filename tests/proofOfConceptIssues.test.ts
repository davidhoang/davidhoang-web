import { describe, expect, it } from 'vitest';
import { getProofOfConceptIssuesArchive } from '../src/utils/proofOfConceptIssues';

describe('proof of concept archive', () => {
  it('loads synced issues with cover images', () => {
    const archive = getProofOfConceptIssuesArchive();
    expect(archive.count).toBeGreaterThan(0);
    expect(archive.issues.length).toBe(archive.count);
    for (const issue of archive.issues) {
      expect(issue.coverImage).toMatch(/^https:\/\//);
      expect(issue.url).toContain('proofofconcept.pub');
      expect(issue.title.length).toBeGreaterThan(0);
    }
  });
});
