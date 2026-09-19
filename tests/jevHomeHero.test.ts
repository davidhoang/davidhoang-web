import { Experimental_EvaluationMockModelV4 } from 'ai/test';
import { describe, expect, it } from 'vitest';
import {
  buildHomeHeroCards,
  evaluateHomeHeroCards,
  selectHomeHeroCards,
  type HomeHeroJevAnswers,
} from '../src/utils/jevHomeHero';

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

    const plan = await evaluateHomeHeroCards(model);

    expect(plan.source).toBe('jev');
    expect(plan.answers).toEqual(balancedAnswers);
    expect(plan.cards.find((card) => card.id === 'hatch')?.variant).toBe('spotlight');
  });
});
