import { Experimental_EvaluationMockModelV4 } from 'ai/test';
import { describe, expect, it } from 'vitest';
import {
  buildHomeHeroCards,
  evaluateHomeHeroCards,
  selectHomeHeroCards,
  type HomeHeroJevAnswers,
} from '../src/utils/jevHomeHero';
import {
  applyRecencyPenalty,
  fetchHomeHeroHistory,
} from '../src/utils/homeHeroHistory';

const balancedAnswers: HomeHeroJevAnswers = {
  leadCard: {
    choice: 'hatch',
    probabilities: {
      hatch: 0.72,
      config: 0.11,
      atlassian: 0.08,
      poc: 0.04,
      diveclub: 0.03,
      about: 0.02,
    },
  },
  detailLevel: {
    score: 1.7,
    probabilities: { '0': 0.05, '1': 0.2, '2': 0.75 },
  },
  showPersonalContext: {
    probability: 0.81,
  },
};

describe('Jev home hero cards', () => {
  it('maps typed choice, score, and boolean answers to three card variants', () => {
    const cards = selectHomeHeroCards(balancedAnswers);
    const lead = cards.find((card) => card.id === 'hatch');

    expect(lead).toMatchObject({
      variant: 'spotlight',
      summary: 'My framework for deciding what belongs in the blank after “Design &”.',
    });
    expect(cards.filter((card) => card.variant === 'feature')).toHaveLength(2);
    expect(cards.some((card) => card.variant === 'brief')).toBe(true);
  });

  it('uses the deterministic lead and factual copy when confidence is low', () => {
    const cards = selectHomeHeroCards({
      ...balancedAnswers,
      leadCard: {
        choice: 'about',
        probabilities: { about: 0.4, config: 0.35 },
      },
      detailLevel: {
        score: 0.4,
        probabilities: { '0': 0.7, '1': 0.2, '2': 0.1 },
      },
      showPersonalContext: { probability: 0.59 },
    });
    const lead = cards.find((card) => card.variant === 'spotlight');

    expect(lead).toMatchObject({
      id: 'config',
      summary: 'A practical look at scaling design teams without losing their culture.',
    });
    expect(cards.filter((card) => card.variant === 'feature')).toHaveLength(1);
  });

  it('returns deterministic cards when Gateway and direct keys are unavailable', async () => {
    const plan = await buildHomeHeroCards({});

    expect(plan.source).toBe('fallback');
    expect(plan.cards.map((card) => card.variant)).toEqual([
      'feature',
      'brief',
      'spotlight',
      'brief',
      'feature',
      'brief',
    ]);
  });

  it('applyRecencyPenalty flips the lead when yesterday pick had the top score', () => {
    const today = '2026-10-26';
    const probabilities = {
      hatch: 0.55,
      config: 0.4,
      atlassian: 0.05,
    };
    const history = [
      {
        date: '2026-10-25',
        lead: 'hatch' as const,
        probabilities: { hatch: 0.7 },
        source: 'jev' as const,
      },
    ];

    const cards = selectHomeHeroCards(
      {
        ...balancedAnswers,
        leadCard: {
          choice: 'hatch',
          probabilities,
        },
      },
      { history, today },
    );

    expect(cards.find((card) => card.variant === 'spotlight')?.id).toBe('config');
  });

  it('applyRecencyPenalty leaves probabilities unchanged when history is empty', () => {
    const probabilities = { hatch: 0.6, config: 0.4 };
    expect(applyRecencyPenalty(probabilities, [], '2026-10-26')).toEqual(probabilities);
    expect(applyRecencyPenalty(probabilities, undefined, '2026-10-26')).toEqual(probabilities);
  });

  it('fetchHomeHeroHistory returns empty history on failure or timeout', async () => {
    await expect(
      fetchHomeHeroHistory({}, async () => {
        throw new Error('network down');
      }),
    ).resolves.toEqual([]);

    await expect(
      fetchHomeHeroHistory({}, async () => new Response('', { status: 503 })),
    ).resolves.toEqual([]);
  });

  it('evaluates the home hero through the typed Jev questions', async () => {
    const model = new Experimental_EvaluationMockModelV4({
      modelId: 'jev-home-test',
      doEvaluate: async () => ({
        answers: {
          leadCard: {
            type: 'choice',
            choice: 'hatch',
            probabilities: balancedAnswers.leadCard.probabilities,
          },
          detailLevel: {
            type: 'score',
            score: balancedAnswers.detailLevel.score,
            probabilities: balancedAnswers.detailLevel.probabilities,
          },
          showPersonalContext: {
            type: 'boolean',
            probability: balancedAnswers.showPersonalContext.probability,
          },
        },
        warnings: [],
        response: { modelId: 'jev-home-test' },
      }),
    });

    const plan = await evaluateHomeHeroCards(model, {
      buildDate: new Date('2026-10-26T12:00:00.000Z'),
      recentWritingTitles: [],
      history: [],
    });

    expect(plan.source).toBe('jev');
    expect(plan.answers).toEqual(balancedAnswers);
    expect(plan.cards.find((card) => card.id === 'hatch')?.variant).toBe('spotlight');
  });

  it('includes build date and lead history in the Jev evaluation state', async () => {
    let capturedState: Record<string, unknown> | undefined;
    const model = new Experimental_EvaluationMockModelV4({
      modelId: 'jev-home-context-test',
      doEvaluate: async ({ state }) => {
        capturedState = state as Record<string, unknown>;
        return {
          answers: {
            leadCard: {
              type: 'choice',
              choice: 'hatch',
              probabilities: balancedAnswers.leadCard.probabilities,
            },
            detailLevel: {
              type: 'score',
              score: balancedAnswers.detailLevel.score,
              probabilities: balancedAnswers.detailLevel.probabilities,
            },
            showPersonalContext: {
              type: 'boolean',
              probability: balancedAnswers.showPersonalContext.probability,
            },
          },
          warnings: [],
          response: { modelId: 'jev-home-context-test' },
        };
      },
    });

    const buildDate = new Date('2026-10-26T12:00:00.000Z');
    await evaluateHomeHeroCards(model, {
      buildDate,
      recentWritingTitles: ['Latest post', 'Second post', 'Third post'],
      history: [
        {
          date: '2026-10-25',
          lead: 'config',
          probabilities: { config: 0.8 },
          source: 'jev',
        },
      ],
    });

    expect(capturedState).toMatchObject({
      date: buildDate.toISOString(),
      weekday: 'Monday',
      recentWritingTitles: ['Latest post', 'Second post', 'Third post'],
      recentLeadHistory: [{ date: '2026-10-25', lead: 'config', source: 'jev' }],
    });
  });
});
