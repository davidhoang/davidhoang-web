/** URL-derived layout page kind for theme priority and Open Graph typing. */
export type LayoutPageKind = 'home' | 'blog' | 'about';

export function detectLayoutPageKind(pathname: string): LayoutPageKind {
  if (pathname === '/' || pathname === '') return 'home';
  if (pathname.includes('/writing/') || pathname.includes('/notes/')) return 'blog';
  if (pathname.includes('/about')) return 'about';
  return 'home';
}

/** Topic listing hubs (`/writing/tag/{tag}`) are indexes, not articles. */
export function isWritingTagListingPath(pathname: string): boolean {
  return /^\/writing\/tag(?:\/|$)/.test(pathname);
}

export function openGraphTypeForPageKind(kind: LayoutPageKind): 'website' | 'article' {
  return kind === 'blog' ? 'article' : 'website';
}

export function resolveOpenGraphType(
  pathname: string,
  explicitPageType?: LayoutPageKind,
): 'website' | 'article' {
  if (isWritingTagListingPath(pathname)) return 'website';
  return openGraphTypeForPageKind(resolveLayoutPageKind(pathname, explicitPageType));
}

export function resolveLayoutPageKind(
  pathname: string,
  explicit?: LayoutPageKind,
): LayoutPageKind {
  return explicit ?? detectLayoutPageKind(pathname);
}
