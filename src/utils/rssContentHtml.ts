import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';
import { rssSiteOrigin } from './rssFeedItems';

const md = new MarkdownIt();

const RSS_CONTENT_ALLOWED_TAGS = sanitizeHtml.defaults.allowedTags.concat(['img']);

/** Root-relative URLs in RSS content break validators and some readers (W3C feed validator). */
export function absolutizeRssContentHtml(html: string, site: string | URL): string {
  const origin = rssSiteOrigin(site);

  const withRootPaths = html.replace(
    /\b(src|href|poster)=(["'])\/(?!\/)([^"']*)\2/gi,
    (_match, attr: string, quote: string, path: string) =>
      `${attr}=${quote}${origin}/${path}${quote}`,
  );

  return withRootPaths.replace(
    /\bsrcset=(["'])([^"']+)\1/gi,
    (_match, quote: string, srcset: string) => {
      const fixed = srcset
        .split(',')
        .map((part) => {
          const trimmed = part.trim();
          const pieces = trimmed.split(/\s+/);
          const url = pieces[0];
          if (url?.startsWith('/')) {
            return [`${origin}${url}`, ...pieces.slice(1)].join(' ');
          }
          return trimmed;
        })
        .join(', ');
      return `srcset=${quote}${fixed}${quote}`;
    },
  );
}

export function renderRssMarkdownContent(body: string, site: string | URL): string {
  const html = sanitizeHtml(md.render(body), {
    allowedTags: RSS_CONTENT_ALLOWED_TAGS,
  });
  return absolutizeRssContentHtml(html, site);
}
