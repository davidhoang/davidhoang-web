import { describe, expect, it } from 'vitest';
import {
  rankCommandPaletteItems,
  readRecentSearches,
  RECENT_SEARCHES_STORAGE_KEY,
  saveRecentSearch,
  scoreCommandPaletteItem,
  updateRecentSearches,
  type CommandPaletteSearchItem,
} from '../src/utils/commandPaletteSearch';

const items: CommandPaletteSearchItem[] = [
  {
    title: 'Design Resources',
    description: 'Curated tools and references',
    path: '/design-resources',
    type: 'page',
  },
  {
    title: 'Design Systems Thinking',
    description: 'Patterns for evolving product systems',
    path: '/notes/design-systems-thinking',
    type: 'note',
    tags: ['product design'],
  },
  {
    title: 'Career Odyssey',
    description: 'Career journey and timeline',
    path: '/career-odyssey',
    type: 'page',
  },
  {
    title: 'Building Interfaces',
    description: 'An essay about interaction design',
    path: '/writing/building-interfaces',
    type: 'writing',
    tags: ['interface design'],
  },
];

describe('command palette fuzzy ranking', () => {
  it('ranks exact and title-prefix matches above broader field matches', () => {
    const ranked = rankCommandPaletteItems('design', items);

    expect(ranked.map(({ title }) => title).slice(0, 2)).toEqual([
      'Design Resources',
      'Design Systems Thinking',
    ]);
    expect(ranked.at(-1)?.title).toBe('Building Interfaces');
  });

  it('matches multiple word prefixes, acronyms, and ordered fuzzy characters', () => {
    expect(rankCommandPaletteItems('career ody', items)[0]?.title).toBe('Career Odyssey');
    expect(rankCommandPaletteItems('ds', items)[0]?.title).toBe('Design Resources');
    expect(rankCommandPaletteItems('dsgnrsrcs', items)[0]?.title).toBe('Design Resources');
  });

  it('uses tags while rejecting unrelated searches', () => {
    expect(rankCommandPaletteItems('interface design', items)[0]?.title).toBe(
      'Building Interfaces',
    );
    expect(scoreCommandPaletteItem('zzzz', items[0])).toBe(0);
  });
});

describe('recent command palette searches', () => {
  it('deduplicates case-insensitively, promotes the latest, and caps the list', () => {
    const updated = updateRecentSearches(
      ['Design', 'career', 'notes', 'themes', 'writing'],
      '  design  ',
    );

    expect(updated).toEqual(['design', 'career', 'notes', 'themes', 'writing']);
    expect(updateRecentSearches(updated, 'a')).toEqual(updated);
  });

  it('reads and writes browser-local search history safely', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };

    saveRecentSearch('daily themes', storage);
    saveRecentSearch('design', storage);

    expect(readRecentSearches(storage)).toEqual(['design', 'daily themes']);
    expect(JSON.parse(values.get(RECENT_SEARCHES_STORAGE_KEY) ?? '[]')).toEqual([
      'design',
      'daily themes',
    ]);
  });

  it('ignores malformed or unavailable storage', () => {
    const malformedStorage = {
      getItem: () => '{broken',
      setItem: () => {
        throw new Error('blocked');
      },
    };

    expect(readRecentSearches(malformedStorage)).toEqual([]);
    expect(() => saveRecentSearch('design', malformedStorage)).not.toThrow();
  });
});
