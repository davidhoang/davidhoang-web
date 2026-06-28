interface WritingPostImageInput {
  title: string;
  description?: string;
  coverImage?: string;
  ogImage?: string;
  body?: string;
}

function extractFirstImageUrl(markdown: string | undefined): string | undefined {
  if (!markdown) return undefined;

  const mdImageMatch = markdown.match(/!\[[^\]]*]\(([^)]+)\)/m);
  if (mdImageMatch?.[1]) {
    const inner = mdImageMatch[1].trim();
    let url = inner.split(/\s+/)[0]?.trim();
    if (url?.startsWith('<') && url.endsWith('>')) url = url.slice(1, -1).trim();
    if (!url) return undefined;
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith('/')) return url;
    if (url.startsWith('./')) return `/${url.slice(2)}`;
    return `/${url}`;
  }

  const htmlImageMatch = markdown.match(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/i);
  if (htmlImageMatch?.[1]) {
    const url = htmlImageMatch[1].trim();
    if (!url) return undefined;
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith('/')) return url;
    if (url.startsWith('./')) return `/${url.slice(2)}`;
    return `/${url}`;
  }

  return undefined;
}

/** Cover art for writing cards: explicit image, first in-body image, or generated OG. */
export function getWritingPostThumbnail(post: WritingPostImageInput): string {
  if (post.coverImage) return post.coverImage;
  if (post.ogImage) return post.ogImage;

  const firstImage = extractFirstImageUrl(post.body);
  if (firstImage) return firstImage;

  const params = new URLSearchParams({
    title: post.title,
    type: 'writing',
  });
  if (post.description) params.set('description', post.description);

  return `/api/og?${params.toString()}`;
}
