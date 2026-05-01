export interface Card {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  color: string;
  pattern: 'lines' | 'grid' | 'waves' | 'dots' | 'circuits' | 'none';
  link?: string;
  linkText?: string;
  image?: string;
  thumbnail?: string;
  /** Optional hero image above unified title / copy (local URL or absolute). */
  heroImage?: string;
  /** Static frame while idle (hover off / collapsed). Shown until hover or open; then `heroImage` (or video) is used. */
  heroImageStill?: string;
  /** Optional looping video (webm/mp4); uses heroImage as poster. Plays on hover + expanded view. */
  heroVideo?: string;
}

/** True when the card uses a generative shader in the header (title can overlap busy art). */
export function cardHasShaderSurface(card: Pick<Card, 'image' | 'thumbnail' | 'heroImage'>): boolean {
  return !card.image && !card.thumbnail && !card.heroImage;
}

/** Hero image + single body panel (title, subtitle, description, CTA). */
export function cardHasHeroLayout(card: Pick<Card, 'heroImage'>): card is Card & { heroImage: string } {
  return Boolean(card.heroImage);
}

export interface LayoutProps {
  cards: Card[];
  selectedCard: string | null;
  hoveredCard: string | null;
  isLoaded: boolean;
  hasAnimatedIn: boolean;
  cardStyle: string | null;
  onCardClick: (cardId: string, link?: string) => void;
  onCardHover: (cardId: string | null) => void;
}

export const cards: Card[] = [
  {
    id: 'atlassian',
    title: 'Atlassian',
    subtitle: 'VP, Head of Design, AI',
    description: 'Leading design for Rovo, Atlassian\'s AI-powered knowledge assistant that connects teams, work, and applications across the SaaS ecosystem.',
    color: '#0052CC',
    pattern: 'waves',
    link: 'https://www.atlassian.com/software/rovo',
    linkText: 'Learn about Rovo',
    heroImage: '/images/hero/placeholder.svg',
  },
  {
    id: 'poc',
    title: 'Proof of Concept',
    subtitle: 'Newsletter',
    description: 'A weekly newsletter about design, technology, and experimentation. Exploring the intersection of creativity, code, and community.',
    color: '#E85D04',
    pattern: 'lines',
    link: 'https://www.proofofconcept.pub',
    linkText: 'Subscribe'
  },
  {
    id: 'config',
    title: 'Config 2021',
    subtitle: 'Figma Conference',
    description: 'Spoke about the universal challenges of scaling design teams and building design culture.',
    color: '#2D6A4F',
    pattern: 'dots',
    link: 'https://youtu.be/piGC-iFwmrk',
    linkText: 'Watch talk',
    heroImage: '/images/davidhoang-web-config.webp',
    /** Static first frame — animated hero only while hovered / expanded (see CardHeroMedia). */
    heroImageStill: '/images/davidhoang-web-config-still.webp',
  },
  {
    id: 'diveclub',
    title: 'Dive Club',
    subtitle: 'Podcast',
    description: 'Joined the Dive Club podcast to discuss design leadership, creative tools, and career journeys.',
    color: '#1e3a5f',
    pattern: 'waves',
    link: 'https://www.youtube.com/watch?v=6Z88rLjF-lc',
    linkText: 'Listen',
    heroImage: '/images/davidhoang-web-ridd.webp',
    heroImageStill: '/images/davidhoang-web-ridd-still.webp',
  },
  {
    id: 'hatch',
    title: 'Design & (Blank)',
    subtitle: 'Hatch Conference',
    description:
      'Keynote at Hatch Conference on design, creativity, and what we put in the blank—how constraints and openness shape the work we ship.',
    color: '#7c3aed',
    pattern: 'grid',
    link: 'https://www.youtube.com/watch?v=4lWYcr53kyI',
    linkText: 'Watch keynote',
    heroImage: '/images/davidhoang-web-hatch.webp',
    heroImageStill: '/images/davidhoang-web-hatch-still.webp',
  },
  {
    id: 'about',
    title: 'About',
    subtitle: 'A bit about myself',
    description: 'Designer, investor, and builder focused on tools that revolutionize the internet. Previously at Replit, Webflow, and One Medical.',
    color: '#78716c',
    pattern: 'none',
    link: '/about',
    linkText: 'Learn more',
    thumbnail: '/images/img-dh-web-light.webp'
  },
];

export const rotatingRoles = [
  { label: 'Investor', link: '/investing' },
  { label: 'Writer', link: 'https://www.proofofconcept.pub' },
];

// Legacy hero layout mapping
export const LAYOUT_MAP: Record<string, string> = {
  'centered': 'stacked-fan',
  'left-aligned': 'editorial',
  'minimal': 'scattered',
  'bold': 'rolodex',
};

export type HeroLayout = 'stacked-fan' | 'editorial' | 'scattered' | 'rolodex' | 'cinematic';

export function resolveLayout(raw: string | null): HeroLayout {
  if (!raw) return 'stacked-fan';
  if (raw in LAYOUT_MAP) return LAYOUT_MAP[raw] as HeroLayout;
  const valid: HeroLayout[] = ['stacked-fan', 'editorial', 'scattered', 'rolodex', 'cinematic'];
  return valid.includes(raw as HeroLayout) ? (raw as HeroLayout) : 'stacked-fan';
}
