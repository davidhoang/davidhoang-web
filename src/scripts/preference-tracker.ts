/**
 * Preference Tracker
 *
 * Tracks user theme selections and computes aggregated preferences
 * for use in future theme generation.
 */

export interface ThemeSelection {
  date: string;
  themeName: string;
  timestamp: number;
  // Theme properties for learning
  fontCategory: {
    heading: string;
    body: string;
  };
  colorTemperature: 'warm' | 'cool' | 'neutral';
  cardStyle: string;
  navStyle: string;
  linkStyle: string;
  borderRadius: string;
  footerStyle: string;
}

export interface AggregatedPreferences {
  // Font preferences (-1 to 1 scale: avoid to prefer)
  fontPreferences: {
    serif: number;
    sansSerif: number;
    display: number;
    handwriting: number;
  };

  // Color temperature (-1 cool, 0 neutral, 1 warm)
  colorTemperature: number;

  // Style preferences (counts normalized to 0-1)
  stylePreferences: {
    cardStyles: Record<string, number>;
    navStyles: Record<string, number>;
    linkStyles: Record<string, number>;
    footerStyles: Record<string, number>;
  };

  // Layout preferences (0-1 scale)
  layoutPreferences: {
    borderRadius: number; // 0 = sharp, 1 = rounded
  };
}

export interface UserPreferences {
  selections: ThemeSelection[];
  aggregated: AggregatedPreferences;
  lastUpdated: number;
  version: number;
}

const STORAGE_KEY = 'user-theme-preferences';
const MAX_SELECTIONS = 30;
const CURRENT_VERSION = 1;

/**
 * Determine color temperature from background color
 */
function getColorTemperature(bgColor: string): 'warm' | 'cool' | 'neutral' {
  // Parse hex color
  const hex = bgColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Warm colors have more red/yellow
  // Cool colors have more blue
  const warmth = r - b;

  if (warmth > 30) return 'warm';
  if (warmth < -30) return 'cool';
  return 'neutral';
}

/**
 * Parse border radius to determine if sharp or rounded
 */
function parseBorderRadius(radius: string): number {
  const value = parseInt(radius);
  if (isNaN(value)) return 0.5;
  // 0px = 0, 24px+ = 1
  return Math.min(value / 24, 1);
}

/**
 * Get current preferences from localStorage
 */
export function getPreferences(): UserPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const prefs = JSON.parse(stored) as UserPreferences;
      // Migration check
      if (prefs.version === CURRENT_VERSION) {
        return prefs;
      }
    }
  } catch (e) {
    console.warn('Failed to load preferences:', e);
  }

  // Return default preferences
  return {
    selections: [],
    aggregated: {
      fontPreferences: {
        serif: 0,
        sansSerif: 0,
        display: 0,
        handwriting: 0,
      },
      colorTemperature: 0,
      stylePreferences: {
        cardStyles: {},
        navStyles: {},
        linkStyles: {},
        footerStyles: {},
      },
      layoutPreferences: {
        borderRadius: 0.5,
      },
    },
    lastUpdated: Date.now(),
    version: CURRENT_VERSION,
  };
}

/**
 * Save preferences to localStorage
 */
function savePreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.warn('Failed to save preferences:', e);
  }
}

/**
 * Track a theme selection
 */
export function trackThemeSelection(theme: any): void {
  const prefs = getPreferences();

  // Extract theme properties
  const selection: ThemeSelection = {
    date: theme.date,
    themeName: theme.name,
    timestamp: Date.now(),
    fontCategory: {
      heading: theme.fonts?.heading?.category || 'sans-serif',
      body: theme.fonts?.body?.category || 'sans-serif',
    },
    colorTemperature: getColorTemperature(
      theme.colors?.light?.['--color-bg'] || '#ffffff'
    ),
    cardStyle: theme.cards?.style || 'elevated',
    navStyle: theme.navigation?.style || 'floating',
    linkStyle: theme.links?.style || 'underline',
    borderRadius: theme.layout?.borderRadius || '8px',
    footerStyle: theme.footer?.style || 'classic',
  };

  // Add to selections (remove duplicates for same theme)
  prefs.selections = prefs.selections.filter(
    (s) => s.themeName !== selection.themeName
  );
  prefs.selections.unshift(selection);

  // Keep only last N selections
  prefs.selections = prefs.selections.slice(0, MAX_SELECTIONS);

  // Recompute aggregates
  prefs.aggregated = computeAggregates(prefs.selections);
  prefs.lastUpdated = Date.now();

  savePreferences(prefs);
}

/**
 * Compute aggregated preferences from selection history
 */
export function computeAggregates(
  selections: ThemeSelection[]
): AggregatedPreferences {
  const aggregated: AggregatedPreferences = {
    fontPreferences: {
      serif: 0,
      sansSerif: 0,
      display: 0,
      handwriting: 0,
    },
    colorTemperature: 0,
    stylePreferences: {
      cardStyles: {},
      navStyles: {},
      linkStyles: {},
      footerStyles: {},
    },
    layoutPreferences: {
      borderRadius: 0.5,
    },
  };

  if (selections.length === 0) return aggregated;

  // Count font categories (recent selections weighted more)
  const fontCounts = { serif: 0, 'sans-serif': 0, display: 0, handwriting: 0 };
  let totalFontWeight = 0;

  selections.forEach((s, i) => {
    // Weight: most recent = 1, oldest = 0.5
    const weight = 1 - (i / selections.length) * 0.5;
    totalFontWeight += weight * 2; // heading + body

    const headingCat = s.fontCategory.heading as keyof typeof fontCounts;
    const bodyCat = s.fontCategory.body as keyof typeof fontCounts;

    if (fontCounts[headingCat] !== undefined) fontCounts[headingCat] += weight;
    if (fontCounts[bodyCat] !== undefined) fontCounts[bodyCat] += weight;
  });

  // Normalize font preferences to -1 to 1 scale
  // (above average = positive, below = negative)
  const avgFontCount = totalFontWeight / 4;
  aggregated.fontPreferences = {
    serif: (fontCounts.serif - avgFontCount) / avgFontCount,
    sansSerif: (fontCounts['sans-serif'] - avgFontCount) / avgFontCount,
    display: (fontCounts.display - avgFontCount) / avgFontCount,
    handwriting: (fontCounts.handwriting - avgFontCount) / avgFontCount,
  };

  // Color temperature average
  const tempScores = selections.map((s) => {
    if (s.colorTemperature === 'warm') return 1;
    if (s.colorTemperature === 'cool') return -1;
    return 0;
  });
  aggregated.colorTemperature =
    tempScores.reduce((a, b) => a + b, 0) / tempScores.length;

  // Style preferences (count occurrences, normalize by total)
  const styleCounts = {
    cardStyles: {} as Record<string, number>,
    navStyles: {} as Record<string, number>,
    linkStyles: {} as Record<string, number>,
    footerStyles: {} as Record<string, number>,
  };

  selections.forEach((s) => {
    styleCounts.cardStyles[s.cardStyle] =
      (styleCounts.cardStyles[s.cardStyle] || 0) + 1;
    styleCounts.navStyles[s.navStyle] =
      (styleCounts.navStyles[s.navStyle] || 0) + 1;
    styleCounts.linkStyles[s.linkStyle] =
      (styleCounts.linkStyles[s.linkStyle] || 0) + 1;
    styleCounts.footerStyles[s.footerStyle] =
      (styleCounts.footerStyles[s.footerStyle] || 0) + 1;
  });

  // Normalize style counts to 0-1
  const normalizeStyleCounts = (counts: Record<string, number>) => {
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const normalized: Record<string, number> = {};
    for (const [key, value] of Object.entries(counts)) {
      normalized[key] = total > 0 ? value / total : 0;
    }
    return normalized;
  };

  aggregated.stylePreferences = {
    cardStyles: normalizeStyleCounts(styleCounts.cardStyles),
    navStyles: normalizeStyleCounts(styleCounts.navStyles),
    linkStyles: normalizeStyleCounts(styleCounts.linkStyles),
    footerStyles: normalizeStyleCounts(styleCounts.footerStyles),
  };

  // Border radius average
  const radiusValues = selections.map((s) => parseBorderRadius(s.borderRadius));
  aggregated.layoutPreferences.borderRadius =
    radiusValues.reduce((a, b) => a + b, 0) / radiusValues.length;

  return aggregated;
}

/**
 * Get a summary suitable for theme generation prompts
 */
export function getPreferenceSummary(): string {
  const prefs = getPreferences();

  if (prefs.selections.length < 3) {
    return ''; // Not enough data yet
  }

  const hints: string[] = [];
  const agg = prefs.aggregated;

  // Font preferences
  const fontEntries = Object.entries(agg.fontPreferences) as [string, number][];
  const preferredFont = fontEntries.reduce((a, b) =>
    b[1] > a[1] ? b : a
  )[0];
  if (agg.fontPreferences[preferredFont as keyof typeof agg.fontPreferences] > 0.3) {
    hints.push(`User tends to prefer ${preferredFont} fonts`);
  }

  // Color temperature
  if (agg.colorTemperature > 0.3) {
    hints.push('User gravitates toward warm color temperatures');
  } else if (agg.colorTemperature < -0.3) {
    hints.push('User gravitates toward cool color temperatures');
  }

  // Top style preferences
  const topCardStyle = Object.entries(agg.stylePreferences.cardStyles).reduce(
    (a, b) => (b[1] > a[1] ? b : a),
    ['', 0]
  );
  if (topCardStyle[1] > 0.4) {
    hints.push(`User often selects "${topCardStyle[0]}" card styles`);
  }

  const topNavStyle = Object.entries(agg.stylePreferences.navStyles).reduce(
    (a, b) => (b[1] > a[1] ? b : a),
    ['', 0]
  );
  if (topNavStyle[1] > 0.4) {
    hints.push(`User prefers "${topNavStyle[0]}" navigation`);
  }

  // Border radius
  if (agg.layoutPreferences.borderRadius > 0.7) {
    hints.push('User likes rounded corners');
  } else if (agg.layoutPreferences.borderRadius < 0.3) {
    hints.push('User prefers sharp/angular layouts');
  }

  if (hints.length === 0) {
    return '';
  }

  return `## USER PREFERENCE HINTS (weight these lightly)\n${hints.map((h) => `- ${h}`).join('\n')}`;
}

/**
 * Clear all preferences (for testing/reset)
 */
export function clearPreferences(): void {
  localStorage.removeItem(STORAGE_KEY);
}
