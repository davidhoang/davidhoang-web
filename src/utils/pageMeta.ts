/** URL-derived layout page kind for theme priority and Open Graph typing. */
export type LayoutPageKind = 'home' | 'blog' | 'about';

export function detectLayoutPageKind(pathname: string): LayoutPageKind {
  if (pathname === '/' || pathname === '') return 'home';
  if (pathname.includes('/writing/') || pathname.includes('/notes/')) return 'blog';
  if (pathname.includes('/about')) return 'about';
  return 'home';
}

export function openGraphTypeForPageKind(kind: LayoutPageKind): 'website' | 'article' {
  return kind === 'blog' ? 'article' : 'website';
}

export function resolveLayoutPageKind(
  pathname: string,
  explicit?: LayoutPageKind,
): LayoutPageKind {
  return explicit ?? detectLayoutPageKind(pathname);
}
