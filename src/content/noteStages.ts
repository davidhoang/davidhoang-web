export const NOTE_STAGE_VALUES = ['thoughts', 'sketching', 'evergreen'] as const;
export type NoteStage = (typeof NOTE_STAGE_VALUES)[number];

export function resolveNoteStage(value: string | undefined): NoteStage {
  if (value === 'thoughts' || value === 'sketching' || value === 'evergreen') {
    return value;
  }
  return 'thoughts';
}

/** SEO / OG fallback when `description` is missing */
export function defaultNoteMetaDescription(stage: NoteStage, title: string): string {
  switch (stage) {
    case 'thoughts':
      return `Early thoughts on ${title}`;
    case 'sketching':
      return `Sketching ideas around ${title}`;
    case 'evergreen':
      return `An evergreen note on ${title}`;
  }
}
