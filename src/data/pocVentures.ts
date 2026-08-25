/**
 * Public front-door copy for Proof of Concept Ventures.
 * Editorial rules live in /poc-ventures.md — keep this file aligned.
 */

export const pocVentures = {
  name: 'Proof of Concept Ventures',
  path: '/fund',
  inquiryEmail: 'david@davidhoang.com',
  inquiryMailto: 'mailto:david@davidhoang.com',
  twitterHandle: '@davidhoang',
  twitterHref: 'https://x.com/davidhoang',
  gpName: 'David Hoang',
  gpSiteHref: 'https://www.davidhoang.com',
  tagline: 'A front door for founders.',
  mission:
    'Investing in pre-seed and seed companies building tools that revolutionize the internet — and in founders looking for the winning interaction layer in the paradigm shift of AI.',
  missionDetail:
    'The fund exists to seed the next generation of software builders, especially teams working on design and developer tools, empowering products, computer vision, and AI-first applications.',
  pageDescription:
    'Proof of Concept Ventures is a pre-seed and seed fund investing in tools that revolutionize the internet. Inquire with David Hoang.',
} as const;

export type PocVentureInvestment = {
  name: string;
  href?: string;
};

/** Selected investments only. No dates, check sizes, or round details. */
export const pocVentureInvestments: readonly PocVentureInvestment[] = [
  { name: 'Proto' },
  { name: 'Fuser Studio', href: 'https://fuser.studio/' },
  { name: 'Paper', href: 'https://paper.design/' },
  { name: 'Sunflower', href: 'https://sunflower.me/' },
  { name: 'Turf Sports', href: 'https://turfsports.com/' },
  { name: 'Flint', href: 'https://www.tryflint.com/' },
  { name: 'Visual Electric', href: 'https://visualelectric.com/' },
  { name: 'Ozu', href: 'https://ozu.ai' },
  { name: 'Liveblocks', href: 'https://liveblocks.io/' },
  { name: 'Daydream', href: 'https://www.withdaydream.com/' },
  { name: 'Ditto', href: 'https://www.dittowords.com/' },
  { name: 'Opal Camera', href: 'https://opalcamera.com/' },
  { name: 'Texts.com', href: 'https://texts.com/' },
  { name: 'Galileo', href: 'https://www.usegalileo.ai/explore' },
  { name: 'Eraser', href: 'https://www.eraser.io/' },
  { name: 'Passionfroot', href: 'https://www.passionfroot.me/' },
  { name: 'Open Sauced', href: 'https://opensauced.pizza/' },
  { name: 'Muse', href: 'https://museapp.com/' },
  { name: 'Theatre.js', href: 'https://www.theatrejs.com/' },
  { name: 'Startupy' },
  { name: 'Cycle', href: 'https://www.cycle.app/' },
  { name: 'Carrd', href: 'https://carrd.co/' },
];

/** Strings that must never appear on the public fund page or its markdown. */
export const pocVenturesForbiddenCopy = [
  'fund i investors',
  'joey banks',
  'ellen chisa',
  'min lp',
  'lp check',
  'link to invest',
  'coming soon',
  '20% carry',
  'management fee',
  'gp commit',
  'capital call',
  'capital calls',
  '$5m',
  '$5 m',
  '100-300k',
  '100–300k',
  '$100k',
  '$100 k',
] as const;
