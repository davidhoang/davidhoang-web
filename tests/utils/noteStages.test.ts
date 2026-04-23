import { describe, expect, it } from 'vitest';
import {
  NOTE_STAGE_VALUES,
  noteStageInfo,
  resolveNoteStage,
  defaultNoteMetaDescription,
} from '../../src/utils/noteStages';

describe('resolveNoteStage', () => {
  it.each(NOTE_STAGE_VALUES)('returns the valid stage %s unchanged', (stage) => {
    expect(resolveNoteStage(stage)).toBe(stage);
  });

  it('falls back to thoughts for unknown or missing values', () => {
    expect(resolveNoteStage(undefined)).toBe('thoughts');
    expect(resolveNoteStage('')).toBe('thoughts');
    expect(resolveNoteStage('archived')).toBe('thoughts');
  });
});

describe('defaultNoteMetaDescription', () => {
  it('renders a stage-specific description', () => {
    expect(defaultNoteMetaDescription('thoughts', 'Topic')).toBe('Early thoughts on Topic');
    expect(defaultNoteMetaDescription('sketching', 'Topic')).toBe('Sketching ideas around Topic');
    expect(defaultNoteMetaDescription('evergreen', 'Topic')).toBe('An evergreen note on Topic');
  });
});

describe('noteStageInfo', () => {
  it('covers every stage in NOTE_STAGE_VALUES', () => {
    for (const stage of NOTE_STAGE_VALUES) {
      expect(noteStageInfo[stage]).toMatchObject({
        icon: expect.any(String),
        label: expect.any(String),
        description: expect.any(String),
      });
    }
  });
});
