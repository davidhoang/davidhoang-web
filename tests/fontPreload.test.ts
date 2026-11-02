import { describe, expect, it } from 'vitest';
import { fontPreloadFetchPriority, getCriticalFonts } from '../src/utils/font-preload';

describe('fontPreloadFetchPriority', () => {
  it('does not high-priority preload site UI fonts on home/index routes (hero image LCP)', () => {
    expect(
      fontPreloadFetchPriority('home', '/fonts/ABCDiatypeVariable.woff2'),
    ).toBeUndefined();
  });

  it('high-priority preloads ABC Diatype on article and about routes', () => {
    expect(
      fontPreloadFetchPriority('blog', '/fonts/ABCDiatypeVariable.woff2'),
    ).toBe('high');
    expect(
      fontPreloadFetchPriority('about', '/fonts/ABCDiatypeVariable.woff2'),
    ).toBe('high');
  });

  it('leaves theme subset preloads at default priority', () => {
    expect(
      fontPreloadFetchPriority('blog', '/fonts/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2'),
    ).toBeUndefined();
  });
});

describe('getCriticalFonts', () => {
  it('includes mono and serif on blog routes only', () => {
    const home = getCriticalFonts('home');
    const blog = getCriticalFonts('blog');
    expect(home.some((f) => f.includes('Mono'))).toBe(false);
    expect(blog.some((f) => f.includes('Mono'))).toBe(true);
  });
});
