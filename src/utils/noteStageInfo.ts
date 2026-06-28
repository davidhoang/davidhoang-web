import type { NoteStage } from '../content/noteStages';

export const noteStageInfo = {
  thoughts: {
    icon: '○',
    label: 'Thoughts',
    description: 'Loose captures and early ideas—not yet shaped into a full note.',
  },
  sketching: {
    icon: '◐',
    label: 'Sketching',
    description: 'Taking shape; links and structure still in motion.',
  },
  evergreen: {
    icon: '●',
    label: 'Evergreen',
    description:
      'Written to evolve, link, and stay useful over time—along the lines of evergreen notes in personal knowledge work.',
  },
} as const satisfies Record<
  NoteStage,
  { icon: string; label: string; description: string }
>;
