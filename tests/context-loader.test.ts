import { describe, expect, it } from 'vitest';
import { listContextFiles, loadContext } from '../scripts/lib/context-loader.mjs';

describe('context bank', () => {
  it('includes more than the Tokyo / Ando pair', () => {
    const { markdowns } = listContextFiles();
    expect(markdowns).toEqual(expect.arrayContaining([
      'electric-tokyo.md',
      'concrete-and-light.md',
      'zellige-courtyard.md',
      'baltic-fog.md',
      'polaroid-summer.md',
      'y2k-terminal.md',
      'cerrado-shade.md',
      'brass-and-smoke.md',
    ]));
    expect(markdowns.length).toBeGreaterThanOrEqual(8);
  });

  it('skips recently used notes when others remain', () => {
    const picks = new Set();
    for (let index = 0; index < 20; index += 1) {
      const context = loadContext({
        excludeMarkdown: ['electric-tokyo.md', 'concrete-and-light.md'],
      });
      picks.add(context.markdown?.filename);
    }
    expect(picks.has('electric-tokyo.md')).toBe(false);
    expect(picks.has('concrete-and-light.md')).toBe(false);
    expect(picks.size).toBeGreaterThan(1);
  });
});
