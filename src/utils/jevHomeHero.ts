import {
  experimental_evaluate as evaluate,
  type Experimental_EvaluationModel as EvaluationModel,
} from 'ai';
import {
  cards as fallbackCards,
  heroCardSources,
  presentHeroCard,
  type Card,
  type HeroCardId,
} from '../components/hero/types';
import { resolveJevConfiguration } from './jevEditorialTriage';
import {
  appendHomeHeroDecision,
  applyRecencyPenalty,
  fetchHomeHeroHistory,
  formatHomeHeroBuildContextDate,
  isoDateOnly,
  resolveLeadFromProbabilities,
  writeHomeHeroHistoryFile,
  type HomeHeroHistoryEntry,
} from './homeHeroHistory';

const heroQuestions = {
  leadCard: {
    type: 'choice',
    instructions:
      'Which item should lead the davidhoang.com home-page hero for a first-time visitor?',
    criteria: {
      atlassian: 'Best when current AI design leadership is the strongest introduction.',
      poc: 'Best when ongoing writing and the weekly newsletter are most timely.',
      config: 'Best when a proven design leadership talk is the clearest introduction.',
      diveclub: 'Best when a conversational overview of the career is most useful.',
      hatch: 'Best when creativity and design practice should lead.',
      about: 'Best when a direct personal introduction is more useful than a project.',
    },
  },
  detailLevel: {
    type: 'score',
    instructions:
      'How much supporting editorial detail should the hero show without overwhelming a card stack?',
    criteria: [
      'Concise: one featured supporting card and short labels elsewhere.',
      'Balanced: two supporting cards with short contextual lines.',
      'Expansive: prioritize context, while keeping remaining cards scannable.',
    ],
  },
  showPersonalContext: {
    type: 'boolean',
    instructions:
      'Would first-person context make the selected lead more meaningful than a factual summary?',
    criteria: {
      true: 'Personal context helps explain why this work matters in David’s practice.',
      false: 'A direct factual summary is clearer and more useful.',
    },
  },
} as const;

export interface HomeHeroJevAnswers {
  leadCard: {
    choice: HeroCardId;
    probabilities: Partial<Record<HeroCardId, number>>;
  };
  detailLevel: {
    score: number;
    probabilities: Record<string, number>;
  };
  showPersonalContext: {
    probability: number;
  };
}

export interface HomeHeroCardPlan {
  cards: Card[];
  source: 'jev' | 'fallback';
  answers?: HomeHeroJevAnswers;
  leadId?: HeroCardId;
  leadProbabilities?: Partial<Record<HeroCardId, number>>;
}

export interface HomeHeroBuildOptions {
  buildDate?: Date;
  recentWritingTitles?: string[];
  history?: HomeHeroHistoryEntry[];
  skipHistoryWrite?: boolean;
  projectRoot?: string;
}

const LEAD_CONFIDENCE_THRESHOLD = 0.55;
const PERSONAL_CONTEXT_THRESHOLD = 0.6;
const FALLBACK_LEAD: HeroCardId = 'config';

export function selectHomeHeroCards(
  answers: HomeHeroJevAnswers,
  options?: { history?: HomeHeroHistoryEntry[]; today?: string },
): Card[] {
  const today = options?.today;
  const adjustedProbabilities =
    options?.history?.length && today
      ? applyRecencyPenalty(answers.leadCard.probabilities, options.history, today)
      : answers.leadCard.probabilities;
  const rankedChoice = resolveLeadFromProbabilities(
    adjustedProbabilities,
    answers.leadCard.choice,
  );
  const selectedProbability = adjustedProbabilities[rankedChoice] ?? 0;
  const leadId =
    selectedProbability >= LEAD_CONFIDENCE_THRESHOLD ? rankedChoice : FALLBACK_LEAD;
  const featureCount = answers.detailLevel.score >= 1.5 ? 2 : 1;
  const usePersonalContext =
    answers.showPersonalContext.probability >= PERSONAL_CONTEXT_THRESHOLD;

  const supportingIds = heroCardSources
    .filter((source) => source.id !== leadId)
    .sort((left, right) => {
      const probabilityDelta =
        (adjustedProbabilities[right.id] ?? 0) - (adjustedProbabilities[left.id] ?? 0);
      return probabilityDelta || left.id.localeCompare(right.id);
    })
    .slice(0, featureCount)
    .map((source) => source.id);
  const featureIds = new Set(supportingIds);

  return heroCardSources.map((source) => {
    if (source.id === leadId) {
      return presentHeroCard(source, {
        variant: 'spotlight',
        usePersonalContext,
      });
    }
    if (featureIds.has(source.id)) {
      return presentHeroCard(source, { variant: 'feature' });
    }
    return presentHeroCard(source, { variant: 'brief' });
  });
}

export interface HomeHeroEvaluationContext {
  buildDate: Date;
  recentWritingTitles: string[];
  history: HomeHeroHistoryEntry[];
}

export async function evaluateHomeHeroCards(
  model: EvaluationModel,
  context: HomeHeroEvaluationContext,
): Promise<HomeHeroCardPlan> {
  const { date, weekday } = formatHomeHeroBuildContextDate(context.buildDate);
  const today = isoDateOnly(context.buildDate);
  const recentLeadHistory = context.history.map(({ date: historyDate, lead, source }) => ({
    date: historyDate,
    lead,
    source,
  }));

  const result = await evaluate({
    model,
    state: {
      site: 'davidhoang.com',
      surface: 'home-page hero card stack',
      audience: 'first-time and returning visitors',
      date,
      weekday,
      recentWritingTitles: context.recentWritingTitles,
      recentLeadHistory,
      candidates: heroCardSources.map(({ id, title, subtitle, description }) => ({
        id,
        title,
        subtitle: subtitle ?? null,
        description,
      })),
    },
    questions: heroQuestions,
  });

  const answers: HomeHeroJevAnswers = {
    leadCard: {
      choice: result.answers.leadCard.choice,
      probabilities: result.answers.leadCard.probabilities ?? {},
    },
    detailLevel: {
      score: result.answers.detailLevel.score,
      probabilities: result.answers.detailLevel.probabilities ?? {},
    },
    showPersonalContext: {
      probability: result.answers.showPersonalContext.probability,
    },
  };

  const leadProbabilities = applyRecencyPenalty(
    answers.leadCard.probabilities,
    context.history,
    today,
  );
  const leadId = resolveLeadFromProbabilities(leadProbabilities, answers.leadCard.choice);

  return {
    cards: selectHomeHeroCards(answers, { history: context.history, today }),
    source: 'jev',
    answers,
    leadId,
    leadProbabilities,
  };
}

export async function buildHomeHeroCards(
  environment: Record<string, string | undefined> = process.env,
  options: HomeHeroBuildOptions = {},
): Promise<HomeHeroCardPlan> {
  const buildDate = options.buildDate ?? new Date();
  const today = isoDateOnly(buildDate);
  const history =
    options.history ?? (await fetchHomeHeroHistory(environment));
  const recentWritingTitles = options.recentWritingTitles ?? [];

  const configuration = resolveJevConfiguration(environment);
  if (!configuration.model) {
    const plan: HomeHeroCardPlan = { cards: fallbackCards, source: 'fallback', leadId: FALLBACK_LEAD };
    persistHomeHeroHistory(plan, history, today, options);
    return plan;
  }

  try {
    const plan = await evaluateHomeHeroCards(configuration.model, {
      buildDate,
      recentWritingTitles,
      history,
    });
    persistHomeHeroHistory(plan, history, today, options);
    return plan;
  } catch (error) {
    console.warn('Jev home hero evaluation failed; using deterministic cards.', error);
    const plan: HomeHeroCardPlan = { cards: fallbackCards, source: 'fallback', leadId: FALLBACK_LEAD };
    persistHomeHeroHistory(plan, history, today, options);
    return plan;
  }
}

function persistHomeHeroHistory(
  plan: HomeHeroCardPlan,
  history: HomeHeroHistoryEntry[],
  today: string,
  options: HomeHeroBuildOptions,
): void {
  if (options.skipHistoryWrite) return;

  const lead = plan.leadId ?? FALLBACK_LEAD;
  const probabilities =
    plan.leadProbabilities ??
    plan.answers?.leadCard.probabilities ??
    {};
  const entry: HomeHeroHistoryEntry = {
    date: today,
    lead,
    probabilities,
    source: plan.source,
  };
  writeHomeHeroHistoryFile(
    appendHomeHeroDecision(history, entry),
    options.projectRoot ?? process.cwd(),
  );
}

export { applyRecencyPenalty } from './homeHeroHistory';
