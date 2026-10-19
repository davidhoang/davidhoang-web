/**
 * RSS item URLs: `link` matches site canonical (no trailing slash); `guid` stays on the
 * legacy slash URL so existing subscribers do not see items as new.
 */

function siteOrigin(site: string | URL): string {
  const href = site instanceof URL ? site.href : site;
  return href.replace(/\/+$/, '');
}

/** Stable absolute guid URL (legacy feeds used trailingSlash default on @astrojs/rss). */
export function rssLegacyGuidUrl(site: string | URL, pathname: string): string {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const normalized = path.replace(/\/+$/, '');
  return `${siteOrigin(site)}${normalized}/`;
}

export function rssWritingItemPermalinks(site: string | URL, id: string) {
  const path = `/writing/${id}`;
  return {
    link: path,
    customData: `<guid isPermaLink="true">${rssLegacyGuidUrl(site, path)}</guid>`,
  };
}

export function rssNoteItemPermalinks(site: string | URL, id: string) {
  const path = `/notes/${id}`;
  return {
    link: path,
    customData: `<guid isPermaLink="true">${rssLegacyGuidUrl(site, path)}</guid>`,
  };
}

/** Pass to @astrojs/rss — aligns item links with astro.config trailingSlash: 'never'. */
export const RSS_TRAILING_SLASH = false as const;
