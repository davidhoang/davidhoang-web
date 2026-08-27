import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { pocVentureInvestments, pocVentures } from '../src/data/pocVentures';

const forbiddenCopy = [
  'fund i investors',
  'joey banks',
  'ellen chisa',
  'min lp',
  'lp check',
  'link to invest',
  'coming soon',
  '20% carry',
  'management fee',
  'gp commit',
  'capital call',
  'capital calls',
  '$5m',
  '$5 m',
  '100-300k',
  '100–300k',
  '$100k',
  '$100 k',
] as const;

function readPublicSurfaces(): string {
  const files = [
    'poc-ventures.md',
    'src/data/pocVentures.ts',
    'src/pages/fund.astro',
  ];
  return files.map((file) => readFileSync(file, 'utf8')).join('\n').toLowerCase();
}

describe('Proof of Concept Ventures public front door', () => {
  it('exposes name, mission, inquire email, and selected investments', () => {
    expect(pocVentures.name).toBe('Proof of Concept Ventures');
    expect(pocVentures.mission.length).toBeGreaterThan(40);
    expect(pocVentures.inquiryEmail).toBe('david@davidhoang.com');
    expect(pocVentures.inquiryMailto).toBe(`mailto:${pocVentures.inquiryEmail}`);
    expect(pocVentureInvestments.length).toBeGreaterThan(8);
    expect(pocVentureInvestments.every((item) => item.name.trim().length > 0)).toBe(true);
  });

  it('lists investments as names only (no dates in the data)', () => {
    for (const item of pocVentureInvestments) {
      expect(item.name).not.toMatch(/\b20\d{2}\b/);
    }
  });

  it('keeps LP, raise, and fund-mechanics copy off public surfaces', () => {
    const haystack = readPublicSurfaces();
    for (const needle of forbiddenCopy) {
      expect(haystack, `forbidden copy leaked: ${needle}`).not.toContain(needle);
    }
  });

  it('keeps the markdown contract aligned with typed copy', () => {
    const markdown = readFileSync('poc-ventures.md', 'utf8');
    expect(markdown).toContain(pocVentures.name);
    expect(markdown).toContain(pocVentures.mission);
    expect(markdown).toContain(pocVentures.inquiryEmail);
    expect(markdown).toContain('Do not include');
    expect(markdown).toContain('SquareSpace');
    for (const item of pocVentureInvestments) {
      expect(markdown).toContain(item.name);
    }
  });
});
