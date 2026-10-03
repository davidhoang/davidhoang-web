/**
 * Works case studies (PC-21) — long-form chapters linked from /works role cards.
 * Slugs match `WorkEntry.id` in works.ts.
 */

export type WorkCaseStudySection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type WorkCaseStudy = {
  slug: string;
  title: string;
  role: string;
  when: string;
  description: string;
  heroImage: string;
  heroAlt: string;
  companyUrl?: string;
  sections: WorkCaseStudySection[];
};

export const workCaseStudies: WorkCaseStudy[] = [
  {
    slug: 'atlassian-ai-ecosystem',
    title: 'Atlassian',
    role: 'VP of Design, Rovo & AI and Ecosystem',
    when: '2024–',
    description:
      'Design leadership for Rovo, AI teammates, and ecosystem surfaces across Jira and the Teamwork Graph.',
    heroImage: '/images/odyssey/img-rovo.webp',
    heroAlt: 'Rovo and AI ecosystem design',
    companyUrl: 'https://www.atlassian.com',
    sections: [
      {
        heading: 'Context',
        paragraphs: [
          'Atlassian sits at the center of how teams plan, ship, and learn together. My work focuses on making AI feel like a teammate inside that flow — not a bolt-on chat window — by grounding experiences in the Teamwork Graph and the products people already live in.',
        ],
      },
      {
        heading: 'Focus',
        paragraphs: ['Three threads run through the design work:'],
        bullets: [
          'Rovo as an AI knowledge teammate — context, trust, and clear boundaries when agents act on your behalf',
          'Agent Experience patterns that scale across Jira, Confluence, and third-party ecosystem apps',
          'Ecosystem surfaces where partners and customers extend Atlassian without fragmenting the core UX',
        ],
      },
      {
        heading: 'How I work',
        paragraphs: [
          'This is org-scale systems design: partnering with product and engineering on primitives (states, permissions, disclosure), not one-off pixels. We prototype in code when interactions depend on real data, and we treat contrast, motion, and accessibility as part of the AI UX — not a polish pass at the end.',
        ],
      },
    ],
  },
  {
    slug: 'replit-marketing-design',
    title: 'Replit',
    role: 'VP of Marketing and Design',
    when: '2022–2024',
    description:
      'Rebrand, AI-native product moments, and Developer Day — repositioning Replit for professional builders.',
    heroImage: '/images/odyssey/img-replit.webp',
    heroAlt: 'Replit brand and product design',
    companyUrl: 'https://replit.com',
    sections: [
      {
        heading: 'Context',
        paragraphs: [
          'I joined Replit first as an advisor, then led marketing and design through a pivotal stretch: the product was crossing from hobbyist energy into a serious, AI-native development platform. That shift needed a coherent brand, a clearer story on replit.com, and product moments that felt as capable as the underlying tech.',
        ],
      },
      {
        heading: 'Brand & go-to-market',
        paragraphs: ['The rebrand was not cosmetic — it changed how teams understood what Replit could be.'],
        bullets: [
          'New visual identity and replit.com narrative for professional and team use cases',
          'Replit Core membership and Teams positioning tied to real workflows, not slogans',
          'Developer Day and launch beats that matched product truth on stage and in the product',
        ],
      },
      {
        heading: 'Product design',
        paragraphs: [
          'Design and marketing shared a pipeline: research and AI innovation fed prototypes, prototypes informed campaigns, and campaigns stress-tested whether the product story held up. We optimized for speed without sacrificing craft — the same bar I hold on davidhoang.com.',
        ],
      },
    ],
  },
  {
    slug: 'webflow-head-of-design',
    title: 'Webflow',
    role: 'Head of Design',
    when: '2018–2022',
    description:
      'First Head of Design — building the design function and scaling Webflow’s vision for the visual web.',
    heroImage: '/images/odyssey/img-webflow.webp',
    heroAlt: 'Webflow design leadership',
    companyUrl: 'https://webflow.com',
    sections: [
      {
        heading: 'Context',
        paragraphs: [
          'Webflow was growing fast, and design needed to become a first-class function — not a service org bolted onto product. As the first Head of Design, I hired, shaped process, and kept the team close to Webflow’s core belief: more people should be able to build for the web with real layout and CMS power.',
        ],
      },
      {
        heading: 'Scaling the team',
        paragraphs: ['The work spanned org design and product quality:'],
        bullets: [
          'Hiring and leveling a multi-disciplinary design team across product, brand, and marketing surfaces',
          'Design systems and critique rituals that survived hypergrowth without freezing exploration',
          'Partnership with engineering on layout engine constraints — prototypes in code when Figma was not enough',
        ],
      },
      {
        heading: 'Outcomes',
        paragraphs: [
          'We shipped experiences that matched Webflow’s ambition: expressive sites without giving up accessibility or performance. Config talks from this era (including scaling design teams) came directly from lessons learned inside the company.',
        ],
      },
    ],
  },
  {
    slug: 'one-medical',
    title: 'One Medical',
    role: 'Head of Product Design',
    when: '2015–2018',
    description:
      'Product design through virtual care, member experience, and the path to IPO.',
    heroImage: '/images/highlights/img-highlights-proof-of-concept.webp',
    heroAlt: 'Healthcare product design',
    companyUrl: 'https://www.onemedical.com',
    sections: [
      {
        heading: 'Context',
        paragraphs: [
          'Healthcare UX is unforgiving: people are stressed, tasks are high stakes, and “delight” only matters when trust and clarity come first. At One Medical I led product design as the company expanded virtual care and prepared for public markets.',
        ],
      },
      {
        heading: 'Focus',
        paragraphs: ['Design problems centered on access and continuity of care:'],
        bullets: [
          'Virtual visit flows that felt human — scheduling, intake, and follow-up without dead ends',
          'Member app patterns that worked for busy adults, not just idealized personas',
          'Cross-functional alignment with clinical, ops, and eng on what “safe to ship” meant',
        ],
      },
      {
        heading: 'Lesson',
        paragraphs: [
          'The through-line to my AI and agent work today: high-trust environments need explicit states, plain language, and systems that fail gracefully. One Medical sharpened that instinct early.',
        ],
      },
    ],
  },
];

const bySlug = new Map(workCaseStudies.map((study) => [study.slug, study]));

export const workCaseStudySlugs = new Set(workCaseStudies.map((study) => study.slug));

export function getWorkCaseStudy(slug: string): WorkCaseStudy | undefined {
  return bySlug.get(slug);
}

export function workCaseStudyPath(slug: string): string {
  return `/works/${slug}`;
}
