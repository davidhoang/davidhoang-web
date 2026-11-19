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
      expect(issue.coverImage).toMatch(
        /^(https:\/\/substackcdn\.com\/image\/fetch\/w_600,c_limit,|https:\/\/www\.proofofconcept\.pub\/api\/v1\/post_preview\/\d+\/twitter\.jpg)/,
      );
    }
  });

  it('rewrites dead pbs.substack.com Twitter embed covers to post_preview art', () => {
    const archive = getProofOfConceptIssuesArchive();
    const dead = archive.issues.find((issue) => issue.slug === 'can-projects-recharge-you-an-approach');
    expect(dead).toBeDefined();
    const [canvasIssue] = mapProofOfConceptIssuesForCanvas({
      ...archive,
      count: 1,
      issues: [dead!],
    });
    expect(canvasIssue.coverImage).toBe(
      'https://www.proofofconcept.pub/api/v1/post_preview/26776496/twitter.jpg',
    );
    expect(canvasIssue.coverImage).not.toContain('pbs.substack.com');
    expect(canvasIssue.coverImage).not.toContain('substackcdn.com');
  });
});
