import { describe, expect, it } from 'vitest';
import {
  getProofOfConceptIssuesArchive,
  mapProofOfConceptIssuesForCanvas,
} from '../src/utils/proofOfConceptIssues';

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

  it('maps canvas issues without sync metadata or unused fields', () => {
    const archive = getProofOfConceptIssuesArchive();
    const canvasIssues = mapProofOfConceptIssuesForCanvas(archive);
    expect(canvasIssues).toHaveLength(archive.count);
    for (const issue of canvasIssues) {
      expect(Object.keys(issue).sort()).toEqual(
        ['coverImage', 'id', 'subtitle', 'title', 'url'].sort(),
      );
    }
  });
});
