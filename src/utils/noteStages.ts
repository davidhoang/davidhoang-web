export const NOTE_STAGE_VALUES = ['thoughts', 'sketching', 'evergreen'] as const;
export type NoteStage = (typeof NOTE_STAGE_VALUES)[number];

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

export function resolveNoteStage(value: string | undefined): NoteStage {
  if (value === 'thoughts' || value === 'sketching' || value === 'evergreen') {
    return value;
  }
  return 'thoughts';
}

/** SEO / OG fallback when `description` is missing */
export function defaultNoteMetaDescription(
  stage: NoteStage,
  title: string
): string {
  switch (stage) {
    case 'thoughts':
      return `Early thoughts on ${title}`;
    case 'sketching':
      return `Sketching ideas around ${title}`;
    case 'evergreen':
      return `An evergreen note on ${title}`;
  }
}
