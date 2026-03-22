export type SpeakingEntry = {
  /** Month / day fragment shown in the margin, e.g. "May" or "September 14–16" */
  meta: string;
  title: string;
  href?: string;
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
        meta: 'May',
        title: 'Hatch Leadership Ateliers, Amsterdam',
        href: 'https://leadershipateliers.com/',
      },
    ],
  },
  {
    year: '2025',
    entries: [
      {
        meta: 'May',
        title: 'NYCxDESIGN: The future of software design',
        href: 'https://nycxdesign.org/nycxdesign-talk-with-will-hall-designing-intelligence/',
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
      { meta: 'September 29', title: 'VanCocoa' },
      { meta: 'September 14–16', title: 'UX Cambridge' },
      { meta: 'September 9–10', title: 'CocoaConf Washington DC' },
      { meta: 'May 6–7', title: 'CocoaConf in Seattle, WA' },
      {
        meta: 'April 14',
        title: 'Seattle Xcoders: Me too! Designers working in Xcode',
      },
      {
        meta: 'April 6',
        title: 'Tradecraft: Fast With Intent — Learning Through Rapid Prototyping',
      },
    ],
  },
  {
    year: '2015',
    entries: [
      { meta: 'July 15', title: 'Seattle Prototyping for Designers' },
      {
        meta: 'May 8–9',
        title: 'CocoaConf 2015 in Portland, Oregon: Designing For WATCH',
      },
      {
        meta: 'January 8',
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
