import { describe, expect, it, vi } from 'vitest';
import {
  applyJevTasteRanking,
  buildThemeJudgeQuestions,
  candidateQuestionKey,
  judgeThemeCandidates,
  normalizeJevAnswers,
  resolveJevConfig,
  summarizeThemeCandidate,
} from '../scripts/lib/theme-jev.mjs';

const safe = rankedCandidate('candidate-1', 'Ink Index', [], 40);
const cream = rankedCandidate('candidate-2', 'Warm Whisper', [], 42);
const unsafe = rankedCandidate('candidate-3', 'Broken Overflow', ['horizontal-overflow:20px'], 90);

describe('resolveJevConfig', () => {
  it('disables when the API key is missing', () => {
    expect(resolveJevConfig({})).toEqual({ enabled: false, reason: 'missing-key' });
  });

  it('disables when DAILY_THEME_SKIP_JEV is set even with a key', () => {
    expect(resolveJevConfig({
      TYPESAFE_API_KEY: 'sk-test',
      DAILY_THEME_SKIP_JEV: '1',
    })).toEqual({ enabled: false, reason: 'skip-env' });
  });

  it('enables the default TypeSafe endpoint', () => {
    const config = resolveJevConfig({ TYPESAFE_API_KEY: 'sk-test' });
    expect(config.enabled).toBe(true);
    expect(config.endpoint).toBe('https://api.typesafe.ai/v1/systemone');
    expect(config.model).toBe('jev-latest');
  });
});

describe('normalizeJevAnswers', () => {
  it('flattens grouped TypeSafe answers', () => {
    const answers = normalizeJevAnswers({
      answers: {
        nouls: { generic_candidate_1: { type: 'noul', noul: 0.1 } },
        choices: { pick: { type: 'choice', choice: 'candidate-1' } },
        scores: { quality_candidate_1: { type: 'score', score: 2.4 } },
      },
    });
    expect(answers.pick.choice).toBe('candidate-1');
    expect(answers.generic_candidate_1.noul).toBe(0.1);
    expect(answers.quality_candidate_1.score).toBe(2.4);
  });

  it('passes through a keyed answers map', () => {
    const answers = normalizeJevAnswers({
      answers: { pick: { type: 'choice', choice: 'candidate-2' } },
    });
    expect(answers.pick.choice).toBe('candidate-2');
  });
});

describe('buildThemeJudgeQuestions', () => {
  it('asks Jev to pick among candidates and score each one', () => {
    const questions = buildThemeJudgeQuestions([safe, cream], { name: 'Graphic Poster', intent: 'Type-led poster.' });
    expect(questions.pick.type).toBe('choice');
    expect(Object.keys(questions.pick.criteria)).toEqual(['candidate-1', 'candidate-2']);
    expect(questions.quality_candidate_1.type).toBe('score');
    expect(questions.generic_candidate_2.type).toBe('noul');
    expect(questions.recipe_candidate_1.instructions).toContain('Graphic Poster');
  });

  it('omits pick when only one candidate exists', () => {
    const questions = buildThemeJudgeQuestions([safe], { name: 'Journal' });
    expect(questions.pick).toBeUndefined();
    expect(questions.quality_candidate_1).toBeDefined();
  });
});

describe('applyJevTasteRanking', () => {
  it('never lets Jev promote an unsafe candidate over a safe one', () => {
    const ranking = {
      winner: unsafe,
      ranked: [unsafe, safe],
    };
    const result = applyJevTasteRanking(ranking, {
      answers: {
        pick: { type: 'choice', choice: 'candidate-3', confidence: 0.99 },
        quality_candidate_3: { score: 3 },
        generic_candidate_3: { noul: 0 },
        recipe_candidate_3: { score: 3 },
        quality_candidate_1: { score: 1 },
        generic_candidate_1: { noul: 0.4 },
        recipe_candidate_1: { score: 1 },
      },
    });
    expect(result.winner.id).toBe('candidate-1');
    expect(result.ranked[0].issues).toEqual([]);
  });

  it('can flip a close safe race toward the more authored candidate', () => {
    const ranking = {
      winner: cream,
      ranked: [cream, safe],
    };
    const result = applyJevTasteRanking(ranking, {
      answers: {
        pick: {
          type: 'choice',
          choice: 'candidate-1',
          confidence: 0.86,
          probabilities: { 'candidate-1': 0.86, 'candidate-2': 0.14 },
        },
        quality_candidate_1: { score: 2.8 },
        generic_candidate_1: { noul: 0.05 },
        recipe_candidate_1: { score: 2.7 },
        quality_candidate_2: { score: 0.4 },
        generic_candidate_2: { noul: 0.92 },
        recipe_candidate_2: { score: 0.6 },
      },
    });
    expect(result.winner.id).toBe('candidate-1');
    expect(result.ranked.find((c) => c.id === 'candidate-2')?.jev.generic).toBeCloseTo(0.92);
  });
});

describe('judgeThemeCandidates', () => {
  it('skips the network when no key is configured', async () => {
    const fetchImpl = vi.fn();
    const ranking = { winner: safe, ranked: [safe, cream] };
    const result = await judgeThemeCandidates({
      ranking,
      skipJev: false,
      env: {},
      fetchImpl,
    });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(result.jev.used).toBe(false);
    expect(result.jev.reason).toBe('missing-key');
    expect(result.ranking).toBe(ranking);
  });

  it('posts System One questions and returns a reweighted ranking', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify({
        model: 'jev-1.13.0',
        answers: {
          pick: { type: 'choice', choice: 'candidate-1', confidence: 0.8 },
          quality_candidate_1: { type: 'score', score: 2.6 },
          generic_candidate_1: { type: 'noul', noul: 0.1 },
          recipe_candidate_1: { type: 'score', score: 2.5 },
          quality_candidate_2: { type: 'score', score: 0.5 },
          generic_candidate_2: { type: 'noul', noul: 0.85 },
          recipe_candidate_2: { type: 'score', score: 0.8 },
        },
        usage: { input_tokens: 1200, output_tokens: 40 },
      }),
    }));

    const ranking = { winner: cream, ranked: [cream, safe] };
    const result = await judgeThemeCandidates({
      ranking,
      recipe: { id: 'poster', name: 'Graphic Poster', intent: 'Type-led.' },
      inspiration: 'Bauhaus',
      recentThemes: [],
      env: { TYPESAFE_API_KEY: 'sk-test' },
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledOnce();
    const [, request] = fetchImpl.mock.calls[0];
    const body = JSON.parse(request.body);
    expect(body.model).toBe('jev-latest');
    expect(body.questions.pick.criteria['candidate-1']).toContain('Ink Index');
    expect(result.jev.used).toBe(true);
    expect(result.jev.model).toBe('jev-1.13.0');
    expect(result.ranking.winner.id).toBe('candidate-1');
  });

  it('keeps heuristic ranking when Jev errors', async () => {
    const ranking = { winner: cream, ranked: [cream, safe] };
    const result = await judgeThemeCandidates({
      ranking,
      env: { TYPESAFE_API_KEY: 'sk-test' },
      fetchImpl: async () => ({
        ok: false,
        status: 401,
        text: async () => JSON.stringify({ error: 'unauthorized' }),
      }),
    });
    expect(result.jev.used).toBe(false);
    expect(result.jev.reason).toBe('error');
    expect(result.ranking).toBe(ranking);
  });
});

describe('summarizeThemeCandidate', () => {
  it('keeps a compact authored snapshot', () => {
    const summary = summarizeThemeCandidate(safe.theme);
    expect(summary.name).toBe('Ink Index');
    expect(summary.colors.light.bg).toBe('#0B1020');
    expect(candidateQuestionKey('candidate-1')).toBe('candidate_1');
  });
});

function rankedCandidate(id: string, name: string, issues: string[], score: number) {
  const isLight = name.includes('Warm');
  return {
    id,
    score,
    issues,
    assessment: { score: 0.4, changesFromYesterday: 4 },
    theme: {
      name,
      description: isLight ? 'A soft cream gallery' : 'A high-contrast index of ink and paper',
      artDirection: { recipe: 'poster', name: 'Graphic Poster' },
      fonts: { heading: { name: `${name} Display` }, body: { name: `${name} Text` } },
      colors: {
        colorScheme: isLight ? 'analogous' : 'complementary',
        contrastMode: isLight ? 'low' : 'high',
        light: {
          '--color-bg': isLight ? '#F5F1ED' : '#0B1020',
          '--color-text': isLight ? '#3A322C' : '#F2F2F2',
          '--color-link': isLight ? '#8A6A4A' : '#88AAFF',
          '--color-card-bg': isLight ? '#FAF7F4' : '#141A2A',
          '--color-muted': isLight ? '#7A6E64' : '#BBBBBB',
        },
        dark: {
          '--color-bg': '#111111',
          '--color-text': '#EEEEEE',
          '--color-link': '#88AAFF',
          '--color-card-bg': '#1A1A1A',
        },
      },
      cards: { style: 'outlined' },
      hero: { layout: 'editorial' },
      layout: { gridStyle: 'asymmetric' },
      links: { style: 'bracket' },
      background: { texture: 'none' },
      images: { style: 'grayscale', hover: 'colorize' },
      footer: { style: 'brutalist' },
      shader: { type: 'none' },
      typography: { scaleRatio: '1.618' },
    },
  };
}
