const SPEAKING_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/**
 * Speaking rows show the year as a heading and the month in the list item.
 * Day numbers in `meta` ("November 5", "September 14–16") are dropped.
 */
export function speakingMonthLabel(meta: string): string {
  const month = meta.trim().split(/\s+/)[0] ?? '';
  return (SPEAKING_MONTHS as readonly string[]).includes(month) ? month : '';
}

export type SpeakingEntry = {
  /** Month only. Days are omitted. e.g. "May" */
  meta: string;
  title: string;
  href?: string;
  /** Opens an in-page detail popover (see featuredSpeakingDetails). */
  detailKey?: string;
};

export type SpeakingYear = {
  year: string;
  entries: SpeakingEntry[];
};

export const featuredSpeaking: SpeakingYear[] = [
  {
    year: '2026',
    entries: [
      {
        meta: 'November',
        title:
          'UXDX San Francisco: When Everyone Can Build, What Happens to Product Teams?',
        href: 'https://uxdx.com/session/when-everyone-can-build-what-happens-to-product-teams/',
      },
      {
        meta: 'October',
        title:
          'Flexxi Studio with Allie Vogel: design leadership, AI, and design at Atlassian',
        href: 'https://www.youtube.com/watch?v=eKGcVzJV2MQ',
      },
      {
        meta: 'October',
        title:
          'Team \'26 Europe: Building in Public: How Atlassian designs and ships in the AI era',
        href: 'https://events.atlassian.com/teameurope/session/4405764/building-in-public-how-atlassian-designs-and-ships-in-the-ai-era',
      },
      {
        meta: 'May',
        title: 'Hatch Leadership Ateliers, Amsterdam',
        href: 'https://leadershipateliers.com/',
        detailKey: 'hatch-amsterdam',
      },
    ],
  },
  {
    year: '2025',
    entries: [
      {
        meta: 'May',
        title: 'NYCxDESIGN: The future of software design',
        href: 'https://nycxdesign.org/programming/nycxdesign-talks/designing-intelligence-shaping-the-future-with-ai',
      },
      {
        meta: 'May',
        title: 'Config 2025: Maturing your teams & your leadership',
        href: 'https://www.youtube.com/watch?v=xkriqGkodQA',
      },
    ],
  },
  {
    year: '2024',
    entries: [
      {
        meta: 'September',
        title: 'Hatch Conference: Design and (Blank)',
        href: 'https://www.youtube.com/watch?v=4lWYcr53kyI',
      },
    ],
  },
  {
    year: '2022',
    entries: [
      {
        meta: 'October',
        title: 'Disco Conf by Maze: Prototyping towards outcomes',
      },
      {
        meta: 'November',
        title: 'Front Utah: Leading and operating design orgs',
      },
    ],
  },
  {
    year: '2021',
    entries: [
      {
        meta: 'April',
        title: 'Figma Config: The Universal Challenges of Every Scaling Design Team',
        href: 'https://www.youtube.com/watch?app=desktop&v=piGC-iFwmrk&t=45s',
      },
      {
        meta: 'March',
        title: 'Design Career Network — From Designer to Manager',
      },
      {
        meta: 'January',
        title: 'Product Hive: Lessons Learned in Prototyping',
      },
    ],
  },
  {
    year: '2020',
    entries: [
      {
        meta: 'December',
        title: 'Curiosity: The Product Development Superpower (Duke University)',
      },
      {
        meta: 'November',
        title: 'Principles and Allegories (Hyper Island)',
      },
    ],
  },
  {
    year: '2019',
    entries: [
      { meta: 'November', title: 'No Code Conference' },
      { meta: 'November', title: 'Productized in Lisbon, Portugal' },
      { meta: 'April', title: 'Designing for healthcare' },
    ],
  },
  {
    year: '2018',
    entries: [
      { meta: 'October', title: 'UXDX in Dublin, Ireland' },
      {
        meta: 'September',
        title:
          'UX Cambridge in Cambridge, UK — An introduction to human-centred design leadership',
      },
      {
        meta: 'June',
        title:
          'UX Scotland in Edinburgh, Scotland — Play the part: an introduction to technology experience prototyping',
      },
      {
        meta: 'June',
        title: 'UX Scotland in Edinburgh, Scotland — Human-Centered Design Leadership',
      },
      { meta: 'March', title: 'try!Swift, Tokyo, Japan' },
      { meta: 'February', title: 'Seattle Xcoders in Seattle, Washington' },
    ],
  },
  {
    year: '2017',
    entries: [
      { meta: 'September', title: 'UX Cambridge' },
      { meta: 'September', title: 'SwiftConf in Cologne, Germany' },
      { meta: 'June', title: 'Cocoa Conf Next Door in San Jose, California' },
      { meta: 'March', title: 'Design for Healthcare: Designing For Doctors' },
      { meta: 'March', title: 'Seattle Xcoders: Build Like a Kid' },
    ],
  },
  {
    year: '2016',
    entries: [
      { meta: 'September', title: 'VanCocoa' },
      { meta: 'September', title: 'UX Cambridge' },
      { meta: 'September', title: 'CocoaConf Washington DC' },
      { meta: 'May', title: 'CocoaConf in Seattle, WA' },
      {
        meta: 'April',
        title: 'Seattle Xcoders: Me too! Designers working in Xcode',
      },
      {
        meta: 'April',
        title: 'Tradecraft: Fast With Intent — Learning Through Rapid Prototyping',
      },
    ],
  },
  {
    year: '2015',
    entries: [
      { meta: 'July', title: 'Seattle Prototyping for Designers' },
      {
        meta: 'May',
        title: 'CocoaConf 2015 in Portland, Oregon: Designing For WATCH',
      },
      {
        meta: 'January',
        title:
          'Seattle Xcoders in Seattle, Washington: Designing for WATCH before it ships',
      },
    ],
  },
  {
    year: '2013',
    entries: [
      {
        meta: '',
        title: 'Seattle Ignite: Coast-To-Coast: How to live in two cities',
      },
    ],
  },
];
