export type HeroCardId = 'atlassian' | 'poc' | 'config' | 'diveclub' | 'hatch' | 'about';
export type HeroCardVariant = 'spotlight' | 'feature' | 'brief';

interface CardBase {
  id: HeroCardId;
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

export interface SpotlightCard extends CardBase {
  variant: 'spotlight';
  eyebrow: string;
  summary: string;
}

export interface FeatureCard extends CardBase {
  variant: 'feature';
  kicker: string;
}

export interface BriefCard extends CardBase {
  variant: 'brief';
  label: string;
}

export type Card = SpotlightCard | FeatureCard | BriefCard;

export interface HeroCardSource extends CardBase {
  editorial: {
    eyebrow: string;
    spotlightSummary: string;
    personalContext: string;
    featureKicker: string;
    briefLabel: string;
  };
}

export type HeroCardPresentation =
  | { variant: 'spotlight'; usePersonalContext: boolean }
  | { variant: 'feature' }
  | { variant: 'brief' };

export function presentHeroCard(
  source: HeroCardSource,
  presentation: HeroCardPresentation,
): Card {
  const { editorial, ...base } = source;

  switch (presentation.variant) {
    case 'spotlight':
      return {
        ...base,
        variant: 'spotlight',
        eyebrow: editorial.eyebrow,
        summary: presentation.usePersonalContext
          ? editorial.personalContext
          : editorial.spotlightSummary,
      };
    case 'feature':
      return {
        ...base,
        variant: 'feature',
        kicker: editorial.featureKicker,
      };
    case 'brief':
      return {
        ...base,
        variant: 'brief',
        label: editorial.briefLabel,
      };
  }
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
  onCardDismiss: () => void;
  onCardHover: (cardId: string | null) => void;
}

export const heroCardSources: readonly HeroCardSource[] = [
  {
    id: 'atlassian',
    title: 'Atlassian',
    subtitle: 'VP, Head of Design — Rovo & AI and Ecosystem',
    description: 'Leading design for Rovo & AI and Ecosystem at Atlassian — building AI-powered tools that connect teams, work, and applications across the SaaS ecosystem.',
    color: '#0052CC',
    pattern: 'waves',
    link: 'https://www.atlassian.com/software/rovo',
    linkText: 'Learn about Rovo',
    heroImage: '/images/hero/placeholder.svg',
    editorial: {
      eyebrow: 'Current work',
      spotlightSummary: 'Designing AI tools that connect people, knowledge, and work.',
      personalContext: 'What I am learning while leading design for Rovo, AI, and Ecosystem.',
      featureKicker: 'Building connected AI tools at enterprise scale.',
      briefLabel: 'Work',
    },
  },
  {
    id: 'poc',
    title: 'Proof of Concept',
    subtitle: 'Newsletter',
    description: 'A weekly newsletter about design, technology, and experimentation. Exploring the intersection of creativity, code, and community.',
    color: '#E85D04',
    pattern: 'lines',
    link: 'https://www.proofofconcept.pub',
    linkText: 'Subscribe',
    editorial: {
      eyebrow: 'Weekly dispatch',
      spotlightSummary: 'Notes on design, technology, and experiments worth sharing.',
      personalContext: 'The questions and observations shaping my work each week.',
      featureKicker: 'A weekly newsletter for curious builders.',
      briefLabel: 'Newsletter',
    },
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
    heroImage: '/images/davidhoang-web-config-still.webp',
    /** Static first frame — video only while hovered / expanded (see CardHeroMedia). */
    heroImageStill: '/images/davidhoang-web-config-still.webp',
    heroVideo: '/images/davidhoang-web-config.mp4',
    editorial: {
      eyebrow: 'Featured talk',
      spotlightSummary: 'A practical look at scaling design teams without losing their culture.',
      personalContext: 'What years of growing design organizations taught me about scale.',
      featureKicker: 'A Figma Config talk on design teams and culture.',
      briefLabel: 'Talk',
    },
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
    heroImage: '/images/davidhoang-web-ridd-still.webp',
    heroImageStill: '/images/davidhoang-web-ridd-still.webp',
    heroVideo: '/images/davidhoang-web-ridd.mp4',
    editorial: {
      eyebrow: 'In conversation',
      spotlightSummary: 'A candid discussion about leadership, creative tools, and career choices.',
      personalContext: 'The principles and detours behind my path through design leadership.',
      featureKicker: 'A conversation about making, leading, and learning.',
      briefLabel: 'Podcast',
    },
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
    heroImage: '/images/davidhoang-web-hatch-still.webp',
    heroImageStill: '/images/davidhoang-web-hatch-still.webp',
    heroVideo: '/images/davidhoang-web-hatch.mp4',
    editorial: {
      eyebrow: 'Keynote',
      spotlightSummary: 'How constraints and openness shape the creative work we choose to ship.',
      personalContext: 'My framework for deciding what belongs in the blank after “Design &”.',
      featureKicker: 'A keynote about creativity, constraints, and possibility.',
      briefLabel: 'Conference',
    },
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
    thumbnail: '/images/img-dh-web-light.webp',
    editorial: {
      eyebrow: 'About David',
      spotlightSummary: 'Designer, investor, and builder focused on tools for the internet.',
      personalContext: 'The people, products, and ideas that continue to shape my practice.',
      featureKicker: 'A career spent designing tools and growing teams.',
      briefLabel: 'Profile',
    },
  },
];

const FALLBACK_SPOTLIGHT: HeroCardId = 'config';
const FALLBACK_FEATURES = new Set<HeroCardId>(['atlassian', 'hatch']);

/** Stable no-network presentation used for local development and failed evaluations. */
export const cards: Card[] = heroCardSources.map((source) => {
  if (source.id === FALLBACK_SPOTLIGHT) {
    return presentHeroCard(source, { variant: 'spotlight', usePersonalContext: false });
  }
  if (FALLBACK_FEATURES.has(source.id)) {
    return presentHeroCard(source, { variant: 'feature' });
  }
  return presentHeroCard(source, { variant: 'brief' });
});

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
