import type { FeaturedMediaSource } from '../utils/linkPreview';

/**
 * Media & publications — titles and descriptions are enriched at build time via Open Graph fetch,
 * with fallbacks when a host is unreachable or omits tags.
 */
export const featuredMedia: FeaturedMediaSource[] = [
  {
    url: 'https://museapp.com/podcast/47-designing-creative-tools/',
    kicker: 'Podcast',
    fallbackTitle: 'Designing creative tools',
    fallbackDescription:
      'On Metamuse: tools for creators vs consumer software, mental models, opinionated vs open-ended tools, and staying true to the web as material — with Adam Wiggins, Mark McGranaghan, and guests.',
  },
  {
    url: 'https://www.codenewbie.org/podcast/how-no-code-tools-can-help-your-coding',
    kicker: 'Podcast',
    fallbackTitle: 'How no-code tools can help your coding',
    fallbackDescription:
      'On CodeNewbie: how no-code and visual tools sit alongside engineering practice—and how they helped me grow as a builder.',
  },
  {
    url: 'https://webflow.com/blog/from-no-code-to-know-code',
    kicker: 'Essay',
    fallbackTitle: 'From no-code to know code',
    fallbackDescription:
      'On growing up with analog tools, early no-code apps like Flash and Dreamweaver, and how they led to real engineering craft.',
  },
];
