import { Experimental_EvaluationMockModelV4 } from 'ai/test';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../src/pages/api/jev-editorial-triage';
import {
  evaluateEditorialIdea,
  JEV_GATEWAY_MODEL,
  resolveJevConfiguration,
} from '../src/utils/jevEditorialTriage';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Jev editorial triage', () => {
  it('prefers AI Gateway when Vercel OIDC is available', () => {
    expect(
      resolveJevConfiguration({
        VERCEL_OIDC_TOKEN: 'test-token',
        TYPESAFE_AI_API_KEY: 'direct-key',
      }),
    ).toEqual({ mode: 'gateway', model: JEV_GATEWAY_MODEL });
  });

  it('falls back to the direct TypeSafe provider for local development', () => {
    const configuration = resolveJevConfiguration({
      TYPESAFE_API_KEY: 'direct-key',
    });

    expect(configuration.mode).toBe('direct');
    expect(configuration.model).toBeDefined();
  });

  it('reports missing configuration without constructing a model', () => {
    expect(resolveJevConfiguration({})).toEqual({ mode: 'missing' });
  });

  it('returns typed route, readiness, and boolean decisions', async () => {
    const model = new Experimental_EvaluationMockModelV4({
      modelId: 'jev-test',
      doEvaluate: async () => ({
        answers: {
          destination: {
            type: 'choice',
            choice: 'writing',
            probabilities: { writing: 0.74, notes: 0.2, projects: 0.06 },
          },
          readiness: {
            type: 'score',
            score: 2.2,
            probabilities: { '0': 0.05, '1': 0.1, '2': 0.45, '3': 0.4 },
          },
          hasClearClaim: { type: 'boolean', probability: 0.81 },
        },
        warnings: [],
        response: { modelId: 'jev-test' },
      }),
    });

    const result = await evaluateEditorialIdea(
      {
        title: 'Quiet interfaces',
        excerpt:
          'AI interfaces should use confidence to decide when to answer, ask, or stay quiet.',
      },
      model,
    );

    expect(result.route).toEqual({
      destination: 'writing',
      probabilities: { writing: 0.74, notes: 0.2, projects: 0.06 },
      shouldAutoRoute: true,
    });
    expect(result.readiness).toMatchObject({
      score: 2.2,
      label: 'Ready to edit',
    });
    expect(result.hasClearClaim.probability).toBe(0.81);
    expect(result.model).toBe('jev-test');
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });
});

describe('POST /api/jev-editorial-triage', () => {
  it('validates the idea length before checking credentials', async () => {
    const response = await callRoute({ excerpt: 'too short' });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'The idea must be between 20 and 5,000 characters.',
    });
  });

  it('returns a useful local setup error when Jev is not configured', async () => {
    for (const key of [
      'VERCEL',
      'VERCEL_OIDC_TOKEN',
      'AI_GATEWAY_API_KEY',
      'TYPESAFE_AI_API_KEY',
      'TYPESAFE_API_KEY',
    ]) {
      vi.stubEnv(key, '');
    }

    const response = await callRoute({
      excerpt: 'This is a long enough editorial idea to evaluate safely.',
    });

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      code: 'JEV_NOT_CONFIGURED',
    });
  });
});

async function callRoute(body: unknown) {
  return POST({
    request: new Request('https://example.test/api/jev-editorial-triage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  } as Parameters<typeof POST>[0]);
}
