/**
 * Optional Jev (TypeSafe System One) taste judge for daily theme candidates.
 *
 * Jev cannot generate theme JSON — it returns typed probabilities over questions
 * we define. Claude still authors candidates; heuristic ranking still owns
 * viewport/contrast safety. Jev only reweights taste among already-safe options.
 *
 * API: POST https://api.typesafe.ai/v1/systemone
 * Auth: TYPESAFE_API_KEY
 */

export const TYPESAFE_SYSTEMONE_URL = 'https://api.typesafe.ai/v1/systemone';
export const JEV_MODEL_DEFAULT = 'jev-latest';

/**
 * @typedef {Object} JevQuestion
 * @property {'noul' | 'choice' | 'score'} type
 * @property {string} instructions
 * @property {Record<string, string> | string[]} criteria
 */

/**
 * @typedef {Object} JevVerdict
 * @property {number} quality
 * @property {number} generic
 * @property {number} recipeFit
 * @property {boolean} picked
 * @property {number} pickConfidence
 * @property {number} bonus
 */

/**
 * A candidate as produced by rankThemeCandidates, plus any extra ranking fields.
 * @typedef {{
 *   id: string,
 *   score: number,
 *   issues: string[],
 *   theme: any,
 *   jev?: JevVerdict,
 * } & Record<string, any>} RankedThemeCandidate
 */

/**
 * @typedef {{ winner: RankedThemeCandidate, ranked: RankedThemeCandidate[] } & Record<string, any>} ThemeRanking
 */

/**
 * @typedef {Object} JevJudgeOutcome
 * @property {boolean} used
 * @property {string} reason
 * @property {string} [model]
 * @property {string | null} [pick]
 * @property {number} [pickConfidence]
 * @property {any} [usage]
 * @property {string} [error]
 */

/**
 * Only the subset of fetch this module relies on, so tests can pass a stub.
 * @typedef {(
 *   url: string,
 *   init: { method: string, headers: Record<string, string>, body: string },
 * ) => Promise<{ ok: boolean, status?: number, text: () => Promise<string> }>} JevFetch
 */

export const QUALITY_SCORE_CRITERIA = [
  'Generic AI default: cream or lavender attractor palette, interchangeable name, no clear concept.',
  'Competent but forgettable: valid craft with little identity or recipe commitment.',
  'Distinct pairing and palette that clearly follows the scheduled art-direction recipe.',
  'Memorable site identity I would be proud to ship as today\'s public theme.',
];

export const RECIPE_FIT_CRITERIA = [
  'Ignores or fights the scheduled recipe.',
  'Half-commits: a few matching primitives, mixed with unrelated treatments.',
  'Most primitives match the recipe intent.',
  'Fully commits: type, color, cards, density, and image treatment serve the recipe.',
];

/**
 * @typedef {Object} JevConfig
 * @property {boolean} enabled
 * @property {string} reason
 * @property {string} [apiKey]
 * @property {string} [endpoint]
 * @property {string} [model]
 */

/**
 * @param {Record<string, string | undefined>} [env]
 * @returns {JevConfig}
 */
export function resolveJevConfig(env = process.env) {
  if (env.DAILY_THEME_SKIP_JEV === '1') {
    return { enabled: false, reason: 'skip-env' };
  }

  const apiKey = env.TYPESAFE_API_KEY?.trim();
  if (!apiKey) {
    return { enabled: false, reason: 'missing-key' };
  }

  return {
    enabled: true,
    reason: 'configured',
    apiKey,
    endpoint: env.TYPESAFE_API_URL?.trim() || TYPESAFE_SYSTEMONE_URL,
    model: env.TYPESAFE_MODEL?.trim() || JEV_MODEL_DEFAULT,
  };
}

export function candidateQuestionKey(id) {
  return String(id).replace(/[^a-zA-Z0-9_]/g, '_');
}

function pickColor(colors, key) {
  return colors?.[key] || null;
}

export function summarizeThemeCandidate(theme) {
  const light = theme?.colors?.light || {};
  const dark = theme?.colors?.dark || {};
  return {
    name: theme?.name || null,
    description: theme?.description || null,
    recipe: theme?.artDirection?.recipe || theme?.artDirection?.name || null,
    fonts: {
      heading: theme?.fonts?.heading?.name || theme?.font?.name || null,
      body: theme?.fonts?.body?.name || null,
    },
    colors: {
      scheme: theme?.colors?.colorScheme || null,
      contrastMode: theme?.colors?.contrastMode || null,
      light: {
        bg: pickColor(light, '--color-bg'),
        text: pickColor(light, '--color-text'),
        link: pickColor(light, '--color-link'),
        card: pickColor(light, '--color-card-bg'),
        muted: pickColor(light, '--color-muted'),
      },
      dark: {
        bg: pickColor(dark, '--color-bg'),
        text: pickColor(dark, '--color-text'),
        link: pickColor(dark, '--color-link'),
        card: pickColor(dark, '--color-card-bg'),
      },
    },
    cards: theme?.cards?.style || null,
    hero: theme?.hero?.layout || null,
    grid: theme?.layout?.gridStyle || null,
    links: theme?.links?.style || null,
    texture: theme?.background?.texture || null,
    images: theme?.images?.style || null,
    imageHover: theme?.images?.hover || null,
    footer: theme?.footer?.style || null,
    shader: theme?.shader?.type || null,
    typography: {
      scaleRatio: theme?.typography?.scaleRatio || null,
      headingWeight: theme?.typography?.headingWeight || theme?.fonts?.heading?.weight || null,
      bodyWeight: theme?.typography?.bodyWeight || theme?.fonts?.body?.weight || null,
    },
  };
}

export function summarizeRecentTheme(theme) {
  return {
    date: theme?.date || null,
    name: theme?.name || null,
    recipe: theme?.artDirection?.recipe || null,
    heading: theme?.fonts?.heading?.name || null,
    body: theme?.fonts?.body?.name || null,
    lightBg: theme?.colors?.light?.['--color-bg'] || null,
    hero: theme?.hero?.layout || null,
    grid: theme?.layout?.gridStyle || null,
  };
}

/**
 * Flatten TypeSafe grouped answers (`nouls`/`choices`/`scores`) or a keyed map.
 * @param {object} payload
 */
export function normalizeJevAnswers(payload) {
  if (!payload || typeof payload !== 'object') return {};

  const grouped = payload.answers && typeof payload.answers === 'object'
    ? payload.answers
    : payload;

  if (grouped.nouls || grouped.choices || grouped.scores) {
    return {
      ...(grouped.nouls || {}),
      ...(grouped.choices || {}),
      ...(grouped.scores || {}),
    };
  }

  if (payload.answers && typeof payload.answers === 'object') {
    return payload.answers;
  }

  return {};
}

function noulValue(answer) {
  if (typeof answer?.noul === 'number') return answer.noul;
  if (typeof answer?.probability === 'number') return answer.probability;
  return 0;
}

function scoreValue(answer) {
  if (typeof answer?.score === 'number') return answer.score;
  return 0;
}

export function buildThemeJudgeState({ ranked, recipe, inspiration, recentThemes = [] }) {
  return {
    task: 'Pick the strongest daily visual identity for davidhoang.com among already-validated theme candidates.',
    site: 'Personal portfolio for a design-led product studio. Themes must feel authored, not default-LLM.',
    recipe: recipe
      ? {
          id: recipe.id,
          name: recipe.name,
          intent: recipe.intent,
          dominantPrimitive: recipe.dominantPrimitive,
        }
      : null,
    inspiration: typeof inspiration === 'string'
      ? inspiration
      : inspiration?.inspirationName || inspiration?.name || null,
    recentThemes: recentThemes.slice(0, 7).map(summarizeRecentTheme),
    candidates: ranked.map((candidate) => ({
      id: candidate.id,
      viewportAndContrastSafe: candidate.issues.length === 0,
      issues: candidate.issues,
      heuristicScore: Number(candidate.score.toFixed(2)),
      theme: summarizeThemeCandidate(candidate.theme),
    })),
  };
}

/**
 * @param {RankedThemeCandidate[]} ranked
 * @param {any} [recipe]
 * @returns {Record<string, JevQuestion>}
 */
export function buildThemeJudgeQuestions(ranked, recipe) {
  const recipeLabel = recipe?.name || recipe?.id || 'the scheduled recipe';
  /** @type {Record<string, JevQuestion>} */
  const questions = {};

  if (ranked.length >= 2) {
    questions.pick = {
      type: 'choice',
      instructions: [
        'Which candidate should publish as today\'s public site theme?',
        'Prefer a memorable, recipe-faithful identity over a generic but pretty default.',
        'Do not pick a candidate marked unsafe (viewport overflow or contrast failures) unless every option is unsafe.',
      ].join(' '),
      criteria: Object.fromEntries(
        ranked.map((candidate) => {
          const summary = summarizeThemeCandidate(candidate.theme);
          const safety = candidate.issues.length === 0 ? 'safe' : `unsafe: ${candidate.issues.join(', ')}`;
          return [
            candidate.id,
            `${summary.name}: ${summary.description || 'no description'}. ${summary.fonts.heading} / ${summary.fonts.body}, ${summary.colors.scheme} ${summary.colors.contrastMode}, cards ${summary.cards}, hero ${summary.hero}. ${safety}.`,
          ];
        }),
      ),
    };
  }

  for (const candidate of ranked) {
    const key = candidateQuestionKey(candidate.id);
    const summary = summarizeThemeCandidate(candidate.theme);
    const subject = `"${summary.name}" (${candidate.id})`;

    questions[`quality_${key}`] = {
      type: 'score',
      instructions: `How strong is ${subject} as a public daily identity for a designer's personal site, given the scheduled recipe "${recipeLabel}"?`,
      criteria: QUALITY_SCORE_CRITERIA,
    };
    questions[`generic_${key}`] = {
      type: 'noul',
      instructions: `Is ${subject} generic AI-default visual language (warm cream, dusty lavender, interchangeable poetic name, no authored concept)?`,
      criteria: {
        true: 'Looks like a default LLM palette or a name that could apply to any theme.',
        false: 'Has a specific concept, unusual pairing, or committed material language.',
      },
    };
    questions[`recipe_${key}`] = {
      type: 'score',
      instructions: `How fully does ${subject} commit to "${recipeLabel}" (${recipe?.intent || 'the scheduled art direction'})?`,
      criteria: RECIPE_FIT_CRITERIA,
    };
  }

  return questions;
}

/**
 * @param {ThemeRanking} ranking
 * @param {{ answers?: Record<string, any>, model?: string }} evaluation
 * @returns {ThemeRanking & { jev: { model: string | null, pick: string | null, pickConfidence: number } }}
 */
export function applyJevTasteRanking(ranking, evaluation) {
  const answers = evaluation.answers || {};
  const pick = answers.pick?.choice || null;
  const pickConfidence = typeof answers.pick?.confidence === 'number'
    ? answers.pick.confidence
    : (pick && typeof answers.pick?.probabilities?.[pick] === 'number'
      ? answers.pick.probabilities[pick]
      : 0);

  const ranked = ranking.ranked.map((candidate) => {
    const key = candidateQuestionKey(candidate.id);
    const quality = scoreValue(answers[`quality_${key}`]);
    const generic = noulValue(answers[`generic_${key}`]);
    const recipeFit = scoreValue(answers[`recipe_${key}`]);
    const qualityNorm = quality / (QUALITY_SCORE_CRITERIA.length - 1);
    const recipeNorm = recipeFit / (RECIPE_FIT_CRITERIA.length - 1);
    const pickBoost = candidate.id === pick && candidate.issues.length === 0
      ? pickConfidence * 8
      : 0;
    const jevBonus = qualityNorm * 22 + recipeNorm * 8 - generic * 16 + pickBoost;

    return {
      ...candidate,
      score: candidate.score + jevBonus,
      jev: {
        quality,
        generic,
        recipeFit,
        picked: candidate.id === pick,
        pickConfidence,
        bonus: jevBonus,
      },
    };
  }).sort((a, b) => {
    const safetyOrder = Number(a.issues.length > 0) - Number(b.issues.length > 0);
    return safetyOrder || b.score - a.score || a.id.localeCompare(b.id);
  });

  return {
    winner: ranked[0],
    ranked,
    jev: {
      model: evaluation.model || null,
      pick,
      pickConfidence,
    },
  };
}

/**
 * @param {{
 *   apiKey: string,
 *   endpoint: string,
 *   model: string,
 *   state: unknown,
 *   questions: Record<string, JevQuestion>,
 *   fetchImpl?: JevFetch,
 * }} options
 * @returns {Promise<Record<string, any>>}
 */
export async function evaluateSystemOne({
  apiKey,
  endpoint,
  model,
  state,
  questions,
  fetchImpl = fetch,
}) {
  const response = await fetchImpl(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, state, questions }),
  });

  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { raw: text };
  }

  if (!response.ok) {
    const detail = typeof payload.error === 'string'
      ? payload.error
      : text.slice(0, 400);
    throw new Error(`Jev request failed (${response.status}): ${detail}`);
  }

  return payload;
}

/**
 * @param {{
 *   ranking: ThemeRanking,
 *   recipe?: any,
 *   inspiration?: any,
 *   recentThemes?: any[],
 *   skipJev?: boolean,
 *   env?: Record<string, string | undefined>,
 *   fetchImpl?: JevFetch,
 * }} options
 * @returns {Promise<{ ranking: ThemeRanking, jev: JevJudgeOutcome }>}
 */
export async function judgeThemeCandidates({
  ranking,
  recipe,
  inspiration,
  recentThemes = [],
  skipJev = false,
  env = process.env,
  fetchImpl = fetch,
}) {
  if (skipJev) {
    return { ranking, jev: { used: false, reason: 'skip-flag' } };
  }

  const config = resolveJevConfig(env);
  if (!config.enabled) {
    return { ranking, jev: { used: false, reason: config.reason } };
  }

  if (!ranking?.ranked?.length) {
    return { ranking, jev: { used: false, reason: 'no-candidates' } };
  }

  try {
    const payload = await evaluateSystemOne({
      apiKey: config.apiKey,
      endpoint: config.endpoint,
      model: config.model,
      state: buildThemeJudgeState({
        ranked: ranking.ranked,
        recipe,
        inspiration,
        recentThemes,
      }),
      questions: buildThemeJudgeQuestions(ranking.ranked, recipe),
      fetchImpl,
    });
    const answers = normalizeJevAnswers(payload);
    const next = applyJevTasteRanking(ranking, { ...payload, answers });
    return {
      ranking: next,
      jev: {
        used: true,
        reason: 'ok',
        model: payload.model || config.model,
        pick: next.jev.pick,
        pickConfidence: next.jev.pickConfidence,
        usage: payload.usage || null,
      },
    };
  } catch (error) {
    return {
      ranking,
      jev: {
        used: false,
        reason: 'error',
        error: error instanceof Error ? error.message : String(error),
      },
    };
  }
}
