import { describe, expect, it } from 'vitest';
import { writingTitleTransitionName } from '../src/utils/writingViewTransition';

describe('writingTitleTransitionName', () => {
  it('returns title-{slug} for writing post hrefs', () => {
    expect(writingTitleTransitionName('/writing/optimizing-for-agents')).toBe(
      'title-optimizing-for-agents',
    );
    expect(writingTitleTransitionName('/writing/optimizing-for-agents/')).toBe(
      'title-optimizing-for-agents',
    );
  });

  it('returns undefined for non-writing hrefs', () => {
    expect(writingTitleTransitionName('/notes/seedling')).toBeUndefined();
    expect(writingTitleTransitionName('/writing')).toBeUndefined();
  });
});
