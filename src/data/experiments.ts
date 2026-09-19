export const experiments = [
  {
    id: 'daily-themes',
    title: 'Daily Themes',
    medium: 'Generative design',
    question: 'Can a website change its visual identity every day and still feel familiar?',
    takeaway: 'Variation works best with a few constants: dependable navigation, readable type, and clear contrast.',
    href: '/daily-themes',
    action: 'Explore the themes',
  },
  {
    id: 'career-odyssey',
    title: 'Career Odyssey',
    medium: 'Interactive storytelling',
    question: 'What happens when a career becomes a canvas of people, ideas, and moments?',
    takeaway: 'Connections tell a different story than chronology. The influences between roles matter as much as the roles themselves.',
    href: '/career-odyssey',
    action: 'Explore the canvas',
  },
  {
    id: 'tectonic-cross-section',
    title: 'The Plate Tectonics of Design Leadership',
    medium: 'Essay companion',
    question: 'Can a geological cross-section help explain the shifts happening in design leadership?',
    takeaway: 'Giving a metaphor a physical form makes its tensions easier to examine: pressure, displacement, and the space for something new.',
    href: '/prototypes/design-leadership-obduction',
    action: 'Explore the cross-section',
  },
] as const;

export type Experiment = (typeof experiments)[number];

/** Same selection worldwide for a UTC day; no timer changes it during a visit. */
export function featuredExperimentIndex(date = new Date()): number {
  const day = Math.floor(date.getTime() / 86_400_000);
  return ((day % experiments.length) + experiments.length) % experiments.length;
}
