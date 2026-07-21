import { assessDiversity } from './theme-diversity.mjs';

/**
 * Rank normalized candidates using real render safety, grayscale layout
 * distance from recent themes, and categorical diversity.
 * @param {Array<{ id: string, theme: object, assessment?: object }>} candidates
 * @param {object[]} recentThemes
 * @param {any} [renderReport]
 */
export function rankThemeCandidates(candidates, recentThemes, renderReport = null) {
  const recentEntries = recentThemes.map((theme, index) => ({
    id: recentThemeId(theme, index),
    theme,
  }));

  const ranked = candidates.map((candidate) => {
    const assessment = candidate.assessment || assessDiversity(candidate.theme, recentThemes);
    const rendered = renderReport?.results?.[candidate.id];
    const issues = rendered
      ? Object.values(rendered.viewports).flatMap((viewport) => viewport.metrics.issues)
      : [];
    const visualDistance = rendered
      ? nearestRecentVisualDistance(candidate.id, recentEntries, renderReport)
      : 0;
    const renderCoverage = rendered
      ? Object.keys(rendered.viewports).length / Math.max(1, renderReport.viewports.length)
      : 0;

    const score = (
      visualDistance * 60 +
      (1 - assessment.score) * 30 +
      Math.min(assessment.changesFromYesterday, 8) * 1.25 +
      renderCoverage * 5 -
      issues.length * 100
    );

    return {
      ...candidate,
      assessment,
      score,
      visualDistance,
      renderCoverage,
      issues,
    };
  }).sort((a, b) => {
    const safetyOrder = Number(a.issues.length > 0) - Number(b.issues.length > 0);
    return safetyOrder || b.score - a.score || a.id.localeCompare(b.id);
  });

  return { winner: ranked[0], ranked };
}

export function visualSignatureDistance(left, right) {
  if (!left?.length || left.length !== right?.length) return 0;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference += Math.abs(left[index] - right[index]);
  }
  return difference / (left.length * 255);
}

export function recentThemeId(theme, index) {
  return `recent-${theme.date || index}`;
}

function nearestRecentVisualDistance(candidateId, recentEntries, renderReport) {
  if (recentEntries.length === 0) return 1;
  const candidate = renderReport.results[candidateId];
  const distances = recentEntries.map(({ id }) => {
    const recent = renderReport.results[id];
    if (!recent) return 0;
    const viewportDistances = renderReport.viewports.map(({ name }) =>
      visualSignatureDistance(
        candidate.viewports[name]?.signature,
        recent.viewports[name]?.signature,
      ),
    );
    return viewportDistances.reduce((sum, value) => sum + value, 0) / viewportDistances.length;
  });
  return Math.min(...distances);
}
