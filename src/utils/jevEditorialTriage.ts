import { createTypeSafeAi } from '@ai-sdk/typesafe-ai';
import {
  experimental_evaluate as evaluate,
  type Experimental_EvaluationModel as EvaluationModel,
} from 'ai';

export const JEV_GATEWAY_MODEL = 'typesafe-ai/jev';
export const JEV_DIRECT_MODEL = 'jev-latest';

const READINESS_LABELS = [
  'Raw fragment',
  'Structured idea',
  'Ready to edit',
  'Ready to publish',
] as const;

const editorialQuestions = {
  destination: {
    type: 'choice',
    instructions: 'Which section of davidhoang.com is the best home for this idea?',
    criteria: {
      writing:
        'A durable essay with a developed argument, supporting evidence, and a clear takeaway.',
      notes:
        'An evolving observation, research fragment, question, or idea that benefits from being shared before it is finished.',
      projects:
        'A software experiment, prototype, tool, or build-in-public update centered on something made.',
    },
  },
  readiness: {
    type: 'score',
    instructions: 'How ready is this idea to publish in its most appropriate section?',
    criteria: READINESS_LABELS,
  },
  hasClearClaim: {
    type: 'boolean',
    instructions:
      'Does the idea contain a specific central claim or point of view that a reader could accurately restate?',
    criteria: {
      true: 'A distinct, specific claim is present.',
      false: 'The idea is only a topic, collection of facts, or ambiguous fragment.',
    },
  },
} as const;

export type EditorialDestination = keyof typeof editorialQuestions.destination.criteria;

export interface EditorialTriageInput {
  title?: string;
  excerpt: string;
}

export interface EditorialTriageResult {
  route: {
    destination: EditorialDestination;
    probabilities: Partial<Record<EditorialDestination, number>>;
    shouldAutoRoute: boolean;
  };
  readiness: {
    score: number;
    label: (typeof READINESS_LABELS)[number];
    probabilities: Record<string, number>;
  };
  hasClearClaim: {
    probability: number;
  };
  model: string;
  latencyMs: number;
}

export type JevAuthMode = 'gateway' | 'direct' | 'missing';

export interface JevConfiguration {
  mode: JevAuthMode;
  model?: EvaluationModel;
}

type ServerEnvironment = Record<string, string | undefined>;

export function resolveJevConfiguration(
  environment: ServerEnvironment = process.env,
): JevConfiguration {
  const hasGatewayCredentials = Boolean(
    environment.VERCEL ||
      environment.VERCEL_OIDC_TOKEN ||
      environment.AI_GATEWAY_API_KEY,
  );

  if (hasGatewayCredentials) {
    return { mode: 'gateway', model: JEV_GATEWAY_MODEL };
  }

  const directApiKey =
    environment.TYPESAFE_AI_API_KEY || environment.TYPESAFE_API_KEY;

  if (directApiKey) {
    const typeSafeAi = createTypeSafeAi({ apiKey: directApiKey });
    return {
      mode: 'direct',
      model: typeSafeAi.evaluationModel(JEV_DIRECT_MODEL),
    };
  }

  return { mode: 'missing' };
}

export async function evaluateEditorialIdea(
  input: EditorialTriageInput,
  model: EvaluationModel,
): Promise<EditorialTriageResult> {
  const startedAt = performance.now();
  const result = await evaluate({
    model,
    state: {
      site: 'davidhoang.com',
      title: input.title || null,
      excerpt: input.excerpt,
    },
    questions: editorialQuestions,
  });

  const destination = result.answers.destination.choice;
  const destinationProbability =
    result.answers.destination.probabilities?.[destination] ?? 0;
  const readinessIndex = Math.max(
    0,
    Math.min(READINESS_LABELS.length - 1, Math.round(result.answers.readiness.score)),
  );

  return {
    route: {
      destination,
      probabilities: result.answers.destination.probabilities ?? {},
      shouldAutoRoute: destinationProbability >= 0.7,
    },
    readiness: {
      score: result.answers.readiness.score,
      label: READINESS_LABELS[readinessIndex],
      probabilities: result.answers.readiness.probabilities ?? {},
    },
    hasClearClaim: {
      probability: result.answers.hasClearClaim.probability,
    },
    model: result.response.modelId,
    latencyMs: Math.round(performance.now() - startedAt),
  };
}
