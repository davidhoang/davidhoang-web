import { describe, it, expect } from 'vitest';
import {
  NOTE_STAGE_VALUES,
  noteStageInfo,
  resolveNoteStage,
  defaultNoteMetaDescription,
} from '../src/utils/noteStages';

describe('resolveNoteStage', () => {
  it('passes valid stages through', () => {
    for (const stage of NOTE_STAGE_VALUES) {
      expect(resolveNoteStage(stage)).toBe(stage);
    }
  });

  it('falls back to "thoughts" for undefined', () => {
    expect(resolveNoteStage(undefined)).toBe('thoughts');
  });

  it('falls back to "thoughts" for unknown values', () => {
    expect(resolveNoteStage('published')).toBe('thoughts');
    expect(resolveNoteStage('')).toBe('thoughts');
    expect(resolveNoteStage('THOUGHTS')).toBe('thoughts'); // case-sensitive
  });
});

describe('defaultNoteMetaDescription', () => {
  it('produces stage-appropriate descriptions', () => {
    expect(defaultNoteMetaDescription('thoughts', 'foo')).toBe('Early thoughts on foo');
    expect(defaultNoteMetaDescription('sketching', 'foo')).toBe(
      'Sketching ideas around foo',
    );
    expect(defaultNoteMetaDescription('evergreen', 'foo')).toBe(
      'An evergreen note on foo',
    );
  });
});

describe('noteStageInfo', () => {
  it('has an entry for every stage in NOTE_STAGE_VALUES', () => {
    for (const stage of NOTE_STAGE_VALUES) {
      expect(noteStageInfo[stage]).toBeDefined();
      expect(noteStageInfo[stage].label).toBeTruthy();
      expect(noteStageInfo[stage].icon).toBeTruthy();
    }
  });
});
