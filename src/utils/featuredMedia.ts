import { fetchOpenGraphPreview, type OpenGraphPreview } from './openGraph';

export type FeaturedMediaSource = {
  url: string;
  kicker: string;
  fallbackTitle: string;
  fallbackDescription: string;
  fallbackImage?: string | null;
};

export type ResolvedFeaturedMedia = FeaturedMediaSource & {
  title: string;
  description: string;
  image: string | null;
  hostname: string;
};

export async function resolveFeaturedMedia(items: FeaturedMediaSource[]): Promise<ResolvedFeaturedMedia[]> {
  const out: ResolvedFeaturedMedia[] = [];
  for (const item of items) {
    let hostname = '';
    try {
      hostname = new URL(item.url).hostname.replace(/^www\./, '');
    } catch {
      hostname = '';
    }

    let og: OpenGraphPreview = { title: '', description: '', image: null };
    try {
      og = await fetchOpenGraphPreview(item.url);
    } catch {
      /* use fallbacks */
    }

    const ogTitle = (og.title || '').trim();
    const fb = item.fallbackTitle;
    const ogWords = ogTitle ? ogTitle.split(/\s+/).filter(Boolean).length : 0;
    const fbWords = fb.split(/\s+/).filter(Boolean).length;
    /* Many hosts set og:title to the site name; prefer a curated line when OG is too terse */
    const title =
      ogTitle && !(ogWords <= 2 && fbWords >= 4) ? ogTitle : fb;
    let description = (og.description || '').trim() || item.fallbackDescription;
    if (description.length > 280) {
      description = `${description.slice(0, 277).trim()}…`;
    }

    // Featured media cards are text-only; skip resolving OG / fallback images.
    out.push({
      ...item,
      title,
      description,
      image: null,
      hostname,
    });
  }
  return out;
}
