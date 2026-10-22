import { describe, expect, it } from 'vitest';
import { accessibleNameWithVisibleLabel } from '../src/utils/accessibleName';

describe('accessibleNameWithVisibleLabel', () => {
  it('returns undefined when descriptive name is redundant', () => {
    expect(accessibleNameWithVisibleLabel('Writing', 'Writing')).toBeUndefined();
    expect(accessibleNameWithVisibleLabel('DH', undefined)).toBeUndefined();
  });

  it('keeps descriptive name when it already contains visible label', () => {
    expect(accessibleNameWithVisibleLabel('About', 'About David Hoang')).toBe('About David Hoang');
  });

  it('prefixes visible label when descriptive name omits it', () => {
    expect(accessibleNameWithVisibleLabel('DH', 'David Hoang homepage')).toBe(
      'DH, David Hoang homepage',
    );
    expect(accessibleNameWithVisibleLabel('Works', 'Selected work')).toBe('Works, Selected work');
    expect(accessibleNameWithVisibleLabel('⌘K', 'Search site')).toBe('⌘K, Search site');
  });
});
