import type { NoteStage } from '../content/noteStages';

export const noteStageInfo = {
  thoughts: {
    icon: '○',
    label: 'Thoughts',
    description: 'Early captures, not yet a full note.',
  },
  sketching: {
    icon: '◐',
    label: 'Sketching',
    description: 'Taking shape; structure still moving.',
  },
  evergreen: {
    icon: '●',
    label: 'Evergreen',
    description: 'Meant to link, evolve, and stay useful.',
  },
} as const satisfies Record<
  NoteStage,
  { icon: string; label: string; description: string }
>;
