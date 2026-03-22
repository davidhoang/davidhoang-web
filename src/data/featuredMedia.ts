import type { FeaturedMediaSource } from '../utils/linkPreview';

/**
 * Media & publications — URLs are enriched at build time via Open Graph fetch,
 * with fallbacks when a host is unreachable or omits tags.
 */
export const featuredMedia: FeaturedMediaSource[] = [
  {
    url: 'https://www.codenewbie.org/podcast/how-no-code-tools-can-help-your-coding',
    kicker: 'Podcast',
    fallbackTitle: 'How no-code tools can help your coding',
    fallbackDescription:
      'On CodeNewbie: how no-code and visual tools sit alongside engineering practice—and how they helped me grow as a builder.',
    fallbackImage: null,
  },
  {
    url: 'https://webflow.com/blog/from-no-code-to-know-code',
    kicker: 'Essay',
    fallbackTitle: 'From no-code to know code',
    fallbackDescription:
      'On growing up with analog tools, early no-code apps like Flash and Dreamweaver, and how they led to real engineering craft.',
    // Curated still when OG fetch fails (matches Webflow marketing CDN)
    fallbackImage:
      'https://cdn.prod.website-files.com/687e8d1b96312cc631cafec7/68c58494d7cdd60541f55cce_pvOaWMFJfxZwMVxh8ENJG6ilZl23UbhMaD5aM0p8usE.webp',
  },
];
