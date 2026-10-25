/** Resolve a daily theme record for a calendar date, falling back to the first theme. */
export function resolveDailyTheme<T extends { date: string }>(
  themes: T[],
  date: string,
): T | undefined {
  if (!themes.length) return undefined;
  return themes.find((theme) => theme.date === date) ?? themes[0];
}
