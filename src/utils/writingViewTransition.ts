/** View-transition name for writing post titles (matches `WritingPost.astro`). */
export function writingTitleTransitionName(href: string): string | undefined {
  const slug = href.match(/^\/writing\/([^/?#]+)\/?$/)?.[1];
  return slug ? `title-${slug}` : undefined;
}
