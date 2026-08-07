/**
 * Schema.org JSON-LD builders for davidhoang.com.
 * Keep entities linked via stable @ids; only emit facts supported by page/content data.
 */

export const CANONICAL_SITE = 'https://www.davidhoang.com';

export const PERSON_ID = `${CANONICAL_SITE}/#person`;
export const WEBSITE_ID = `${CANONICAL_SITE}/#website`;
export const BLOG_ID = `${CANONICAL_SITE}/writing#blog`;
export const NOTES_ID = `${CANONICAL_SITE}/notes#garden`;

export const SITE_NAME = 'David Hoang';
export const SITE_ALTERNATE_NAME = 'davidhoang.com';
export const SITE_DESCRIPTION = 'The official website of David Hoang';
export const SITE_LANGUAGE = 'en-US';

/** Stable portrait used on About — safe Person.image. */
export const PERSON_IMAGE = `${CANONICAL_SITE}/images/img-david-sf.webp`;

/** Matches About page copy — do not invent titles beyond this. */
export const PERSON_JOB_TITLE = 'VP and Head of Design, Rovo & AI and Ecosystem';
export const PERSON_WORKS_FOR = 'Atlassian';
export const PERSON_DESCRIPTION =
  "Designer, investor, and builder focused on tools that revolutionize the internet. VP and Head of Design, Rovo & AI and Ecosystem at Atlassian.";

export const PERSON_SAME_AS = [
  'https://twitter.com/davidhoang',
  'https://github.com/davidhoang',
  'https://linkedin.com/in/dhoang2',
] as const;

export type JsonLd = Record<string, unknown>;

export function absoluteUrl(pathOrUrl: string, site: string = CANONICAL_SITE): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const base = site.replace(/\/+$/, '');
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  const normalized = path.length > 1 ? path.replace(/\/+$/, '') : path;
  return `${base}${normalized}`;
}

export function toIsoDate(value: Date | string): string {
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date for structured data: ${value}`);
  }
  return parsed.toISOString();
}

/** Calendar date (YYYY-MM-DD) for pages that only claim a day-level update. */
export function toIsoDateOnly(value: Date | string): string {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return toIsoDate(value).slice(0, 10);
}

function idRef(id: string): JsonLd {
  return { '@id': id };
}

function webPageRef(canonicalUrl: string): JsonLd {
  return {
    '@type': 'WebPage',
    '@id': canonicalUrl,
  };
}

export function buildPersonJsonLd(): JsonLd {
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: SITE_NAME,
    url: CANONICAL_SITE,
    image: PERSON_IMAGE,
    jobTitle: PERSON_JOB_TITLE,
    description: PERSON_DESCRIPTION,
    worksFor: {
      '@type': 'Organization',
      name: PERSON_WORKS_FOR,
    },
    sameAs: [...PERSON_SAME_AS],
  };
}

export function buildWebSiteJsonLd(description: string = SITE_DESCRIPTION): JsonLd {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: SITE_NAME,
    alternateName: SITE_ALTERNATE_NAME,
    url: CANONICAL_SITE,
    description,
    inLanguage: SITE_LANGUAGE,
    publisher: idRef(PERSON_ID),
    author: idRef(PERSON_ID),
    mainEntity: idRef(PERSON_ID),
  };
}

export function buildBlogJsonLd(): JsonLd {
  return {
    '@type': 'Blog',
    '@id': BLOG_ID,
    name: 'Writing',
    url: `${CANONICAL_SITE}/writing`,
    description: 'Essays and posts on design, engineering, AI, and entrepreneurship.',
    inLanguage: SITE_LANGUAGE,
    publisher: idRef(PERSON_ID),
    author: idRef(PERSON_ID),
    isPartOf: idRef(WEBSITE_ID),
  };
}

export function buildNotesGardenJsonLd(): JsonLd {
  return {
    '@type': 'CollectionPage',
    '@id': NOTES_ID,
    name: 'Notes',
    url: `${CANONICAL_SITE}/notes`,
    description: 'A digital garden of notes that may change as they grow.',
    inLanguage: SITE_LANGUAGE,
    isPartOf: idRef(WEBSITE_ID),
    author: idRef(PERSON_ID),
  };
}

/** Site-wide @graph: Person + WebSite (+ Blog + Notes collection for stable linking). */
export function buildSiteGraphJsonLd(options?: { description?: string }): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildPersonJsonLd(),
      buildWebSiteJsonLd(options?.description ?? SITE_DESCRIPTION),
      buildBlogJsonLd(),
      buildNotesGardenJsonLd(),
    ],
  };
}

export type BlogPostingInput = {
  title: string;
  description: string;
  canonicalUrl: string;
  datePublished: Date | string;
  /** Omit or match published when the content collection has no update field. */
  dateModified?: Date | string;
  imageUrl?: string;
  tags?: string[];
};

export function buildBlogPostingJsonLd(input: BlogPostingInput): JsonLd {
  const published = toIsoDate(input.datePublished);
  const modified = input.dateModified != null ? toIsoDate(input.dateModified) : published;
  const postId = `${input.canonicalUrl}#blogposting`;

  const jsonLd: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': postId,
    headline: input.title,
    name: input.title,
    description: input.description,
    datePublished: published,
    dateModified: modified,
    inLanguage: SITE_LANGUAGE,
    url: input.canonicalUrl,
    mainEntityOfPage: webPageRef(input.canonicalUrl),
    isPartOf: idRef(BLOG_ID),
    author: idRef(PERSON_ID),
    publisher: idRef(PERSON_ID),
  };

  if (input.imageUrl) {
    jsonLd.image = [input.imageUrl];
  }

  if (input.tags && input.tags.length > 0) {
    jsonLd.keywords = input.tags.join(', ');
  }

  return jsonLd;
}

export type NoteCreativeWorkInput = {
  title: string;
  description: string;
  canonicalUrl: string;
  datePublished: Date | string;
  dateModified?: Date | string;
  imageUrl?: string;
  tags?: string[];
};

/**
 * Notes are a digital garden, not a blog — CreativeWork (not BlogPosting).
 * Only includes dates/tags/images present in content frontmatter.
 */
export function buildNoteCreativeWorkJsonLd(input: NoteCreativeWorkInput): JsonLd {
  const published = toIsoDate(input.datePublished);
  const modified = input.dateModified != null ? toIsoDate(input.dateModified) : published;
  const noteId = `${input.canonicalUrl}#creativework`;

  const jsonLd: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    '@id': noteId,
    name: input.title,
    headline: input.title,
    description: input.description,
    datePublished: published,
    dateModified: modified,
    inLanguage: SITE_LANGUAGE,
    url: input.canonicalUrl,
    mainEntityOfPage: webPageRef(input.canonicalUrl),
    isPartOf: idRef(NOTES_ID),
    author: idRef(PERSON_ID),
    publisher: idRef(PERSON_ID),
  };

  if (input.imageUrl) {
    jsonLd.image = [input.imageUrl];
  }

  if (input.tags && input.tags.length > 0) {
    jsonLd.keywords = input.tags.join(', ');
  }

  return jsonLd;
}

export type BreadcrumbItem = {
  name: string;
  item: string;
};

export function buildBreadcrumbListJsonLd(items: BreadcrumbItem[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((entry, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: entry.name,
      item: entry.item,
    })),
  };
}

export type NowPageInput = {
  title?: string;
  description: string;
  /** Day-level last update shown on the page (YYYY-MM-DD or Date). */
  dateModified: Date | string;
  canonicalUrl?: string;
};

/** /now freshness: WebPage with dateModified aligned to visible "Last updated". */
export function buildNowPageJsonLd(input: NowPageInput): JsonLd {
  const canonicalUrl = input.canonicalUrl ?? `${CANONICAL_SITE}/now`;
  const modified = toIsoDateOnly(input.dateModified);

  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${canonicalUrl}#webpage`,
    url: canonicalUrl,
    name: input.title ?? 'Now',
    description: input.description,
    dateModified: modified,
    inLanguage: SITE_LANGUAGE,
    isPartOf: idRef(WEBSITE_ID),
    author: idRef(PERSON_ID),
    mainEntity: idRef(PERSON_ID),
    mainEntityOfPage: webPageRef(canonicalUrl),
  };
}

/** Shared /now last-updated day — keep visible copy and JSON-LD in sync. */
export const NOW_LAST_UPDATED = '2026-06-06';
export const NOW_LAST_UPDATED_LABEL = 'Saturday, June 6, 2026';
