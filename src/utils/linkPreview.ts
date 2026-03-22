/**
 * Minimal Open Graph parsing for build-time link previews (no extra deps).
 * Fetches HTML and reads og:* / twitter:* / title / description meta.
 */

export type OpenGraphPreview = {
  title: string;
  description: string;
  image: string | null;
};

const ENTITY_MAP: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  '#39': "'",
};

function decodeHtmlEntities(raw: string): string {
  return raw
    .replace(/&(#(?:x[0-9a-fA-F]+|\d+)|[a-zA-Z]+);/g, (_, ent: string) => {
      if (ent[0] === '#') {
        const code = ent[1] === 'x' ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : _;
      }
      return ENTITY_MAP[ent] ?? _;
    })
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)));
}

function metaByProperty(html: string, prop: string): string | undefined {
  const esc = prop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${esc}["'][^>]+content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${esc}["']`, 'i'),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return decodeHtmlEntities(m[1]);
  }
  return undefined;
}

function metaByName(html: string, name: string): string | undefined {
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`<meta[^>]+name=["']${esc}["'][^>]+content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+name=["']${esc}["']`, 'i'),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return decodeHtmlEntities(m[1]);
  }
  return undefined;
}

function parseTitleTag(html: string): string | undefined {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return m?.[1] ? decodeHtmlEntities(m[1].trim()) : undefined;
}

export function parseOpenGraphFromHtml(html: string): OpenGraphPreview {
  const title =
    metaByProperty(html, 'og:title') ??
    metaByName(html, 'twitter:title') ??
    parseTitleTag(html) ??
    '';

  const description =
    metaByProperty(html, 'og:description') ??
    metaByName(html, 'twitter:description') ??
    metaByName(html, 'description') ??
    '';

  const image =
    metaByProperty(html, 'og:image') ??
    metaByName(html, 'twitter:image') ??
    metaByProperty(html, 'og:image:secure_url') ??
    null;

  return {
    title,
    description,
    image: image || null,
  };
}

const DEFAULT_UA = 'davidhoang.com/link-preview (+https://www.davidhoang.com)';

export async function fetchOpenGraphPreview(url: string, timeoutMs = 10000): Promise<OpenGraphPreview> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': DEFAULT_UA,
      },
      redirect: 'follow',
    });
    if (!res.ok) {
      return { title: '', description: '', image: null };
    }
    const html = await res.text();
    return parseOpenGraphFromHtml(html);
  } finally {
    clearTimeout(t);
  }
}

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
    // Trim overly long descriptions for layout
    if (description.length > 280) {
      description = `${description.slice(0, 277).trim()}…`;
    }

    let imageUrl: string | null = null;
    if (og.image) {
      try {
        imageUrl = new URL(og.image, item.url).href;
      } catch {
        imageUrl = null;
      }
    }
    const image = imageUrl ?? item.fallbackImage ?? null;

    out.push({
      ...item,
      title,
      description,
      image,
      hostname,
    });
  }
  return out;
}
