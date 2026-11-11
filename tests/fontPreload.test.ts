import { describe, expect, it } from 'vitest';
import { fontPreloadFetchPriority, getCriticalFonts } from '../src/utils/font-preload';

describe('fontPreloadFetchPriority', () => {
  it('does not high-priority preload site UI fonts on home/index routes (hero image LCP)', () => {
    expect(
      fontPreloadFetchPriority('home', '/fonts/ABCDiatypeVariable-latin.woff2'),
    ).toBeUndefined();
  });

  it('high-priority preloads ABC Diatype latin subset on article and about routes', () => {
    expect(
      fontPreloadFetchPriority('blog', '/fonts/ABCDiatypeVariable-latin.woff2'),
    ).toBe('high');
    expect(
      fontPreloadFetchPriority('about', '/fonts/ABCDiatypeVariable-latin.woff2'),
    ).toBe('high');
  });

  it('leaves theme subset preloads at default priority', () => {
    expect(
      fontPreloadFetchPriority('blog', '/fonts/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2'),
    ).toBeUndefined();
  });
});

describe('getCriticalFonts', () => {
  it('includes mono on blog routes only', () => {
    const home = getCriticalFonts('home');
    const blog = getCriticalFonts('blog');
    expect(home.some((f) => f.includes('Mono'))).toBe(false);
    expect(blog.some((f) => f.includes('Mono'))).toBe(true);
  });

  it('preloads Source Serif 4 only when today’s theme uses it (not on every writing route)', () => {
    const serifLatin = '/fonts/vEFF2_tTDB4M7-auWDN0ahZJW3IX2ih5nk3AucvUHf6kDXr4.woff2';
    expect(getCriticalFonts('blog')).not.toContain(serifLatin);
    expect(getCriticalFonts('blog', ['Source Serif 4'])).toContain(serifLatin);
  });

  it('does not preload ABC Diatype on home (hero image LCP)', () => {
    const home = getCriticalFonts('home');
    expect(home.some((f) => f.includes('Diatype'))).toBe(false);
  });

  it('preloads latin Diatype subset on about and blog routes', () => {
    expect(getCriticalFonts('about')).toContain('/fonts/ABCDiatypeVariable-latin.woff2');
    expect(getCriticalFonts('blog')).toContain('/fonts/ABCDiatypeVariable-latin.woff2');
  });
});
