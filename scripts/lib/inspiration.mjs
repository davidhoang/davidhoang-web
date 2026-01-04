/**
 * Inspiration System
 *
 * Fetches design trends from multiple sources and combines with
 * time-of-day modifiers for rich theme generation prompts.
 */

// Curated inspiration bank - updated periodically from design feeds
// These are distilled from Dribbble, Behance, Designspiration, Abduzeedo
export const INSPIRATION_BANK = [
  // Design Movements
  { name: "Swiss Modernism", prompt: "Clean grid systems, Helvetica, primary colors used sparingly, mathematical precision, white space as design element" },
  { name: "Bauhaus", prompt: "Primary colors, geometric shapes, functional minimalism, form follows function, bold sans-serif" },
  { name: "Art Deco", prompt: "Gold and black, geometric patterns, luxury glamour, Gatsby era elegance, ornate details" },
  { name: "Memphis Design", prompt: "Bold clashing colors, playful geometry, squiggles and dots, 80s postmodern, terrazzo patterns" },
  { name: "Japanese Minimalism", prompt: "Wabi-sabi imperfection, muted earth tones, asymmetric balance, zen tranquility, negative space" },
  { name: "Scandinavian", prompt: "Light woods, soft whites, cozy hygge, natural materials, warm neutrals, functional comfort" },
  { name: "Brutalism", prompt: "Raw concrete, monospace type, stark contrast, utilitarian, no decoration, honest materials" },
  { name: "Art Nouveau", prompt: "Organic flowing lines, nature motifs, muted jewel tones, elegant curves, botanical elements" },

  // Contemporary Trends (from design feeds)
  { name: "Editorial Minimalism", prompt: "Magazine layouts, structured grids, sophisticated typography, refined simplicity, generous white space" },
  { name: "Retro Revival", prompt: "70s earth tones, vintage typography, warm nostalgia, film grain texture, analog warmth" },
  { name: "Dark Academia", prompt: "Deep forest greens, aged paper, library aesthetic, scholarly serif fonts, candlelit warmth" },
  { name: "Soft Tech", prompt: "Rounded corners, pastel gradients, friendly sans-serif, approachable interfaces, gentle shadows" },
  { name: "Neo Brutalist Web", prompt: "Black borders, system fonts, raw HTML aesthetic, anti-design, visible structure" },
  { name: "Organic Modern", prompt: "Earth tones, curved shapes, natural textures, biophilic design, warm neutrals" },
  { name: "Maximalist Color", prompt: "Bold saturated hues, color blocking, fearless combinations, high energy, visual abundance" },
  { name: "Monochrome Editorial", prompt: "Single color family, tonal variations, sophisticated restraint, typographic focus, elegant simplicity" },

  // Mood-Based
  { name: "Calm Digital", prompt: "Muted palettes, reduced cognitive load, breathing room, soft interactions, peaceful reading" },
  { name: "Bold Statement", prompt: "Large typography, high contrast, confident colors, dramatic impact, memorable presence" },
  { name: "Cozy Warmth", prompt: "Amber tones, soft textures, firelight glow, comfortable reading, inviting spaces" },
  { name: "Cool Precision", prompt: "Steel blues, sharp edges, technical clarity, modern efficiency, crisp details" },
  { name: "Playful Energy", prompt: "Bright accents, rounded elements, dynamic layouts, joyful interactions, friendly vibes" },
  { name: "Noir Cinema", prompt: "Deep shadows, golden accents, high drama, mysterious atmosphere, cinematic contrast" },

  // Color Stories
  { name: "Desert Sunset", prompt: "Terracotta, sand, burnt orange, dusty rose, golden hour warmth, southwestern palette" },
  { name: "Forest Floor", prompt: "Moss green, bark brown, mushroom beige, dappled light, woodland serenity" },
  { name: "Ocean Depths", prompt: "Navy blue, sea foam, pearl white, coral accents, maritime elegance" },
  { name: "Mountain Dawn", prompt: "Soft lavender, misty gray, snow white, alpine freshness, crisp morning air" },
  { name: "Urban Dusk", prompt: "Concrete gray, neon accents, deep purple sky, city lights, metropolitan edge" },
  { name: "Autumn Library", prompt: "Burgundy, mustard, forest green, aged leather, scholarly warmth, harvest tones" }
];

// Time-of-day modifiers
export const TIME_MODIFIERS = {
  // 5am - 8am: Dawn
  dawn: {
    mood: "fresh awakening",
    colorBias: "soft pastels, gentle warmth, misty atmosphere",
    energy: "calm, contemplative, peaceful beginning"
  },
  // 8am - 12pm: Morning
  morning: {
    mood: "energized clarity",
    colorBias: "bright, clean, optimistic tones",
    energy: "productive, focused, forward-moving"
  },
  // 12pm - 5pm: Afternoon
  afternoon: {
    mood: "confident presence",
    colorBias: "bold, saturated, full spectrum",
    energy: "dynamic, engaged, expressive"
  },
  // 5pm - 8pm: Evening
  evening: {
    mood: "warm sophistication",
    colorBias: "golden hour warmth, amber, rich tones",
    energy: "refined, relaxed, contemplative"
  },
  // 8pm - 11pm: Night
  night: {
    mood: "intimate depth",
    colorBias: "deep, moody, dramatic contrast",
    energy: "focused, introspective, cozy"
  },
  // 11pm - 5am: Late night
  lateNight: {
    mood: "quiet mystery",
    colorBias: "dark, muted, subtle accents",
    energy: "minimal, serene, dreamlike"
  }
};

/**
 * Get time-of-day period based on hour
 */
export function getTimePeriod(hour = new Date().getHours()) {
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 20) return 'evening';
  if (hour >= 20 && hour < 23) return 'night';
  return 'lateNight';
}

/**
 * Get a random inspiration from the bank
 */
export function getRandomInspiration(count = 1) {
  const shuffled = [...INSPIRATION_BANK].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Get inspiration by category
 */
export function getInspirationByKeyword(keyword) {
  const lower = keyword.toLowerCase();
  return INSPIRATION_BANK.filter(i =>
    i.name.toLowerCase().includes(lower) ||
    i.prompt.toLowerCase().includes(lower)
  );
}

/**
 * Generate a rich inspiration prompt combining:
 * - Random or specified design movement
 * - Time-of-day modifier
 * - Optional user input
 */
export function generateInspirationPrompt(options = {}) {
  const {
    userPrompt = null,
    inspirationName = null,
    hour = new Date().getHours(),
    includeTimeModifier = true
  } = options;

  // Get base inspiration
  let inspiration;
  if (inspirationName) {
    inspiration = INSPIRATION_BANK.find(i =>
      i.name.toLowerCase() === inspirationName.toLowerCase()
    ) || getRandomInspiration(1)[0];
  } else {
    inspiration = getRandomInspiration(1)[0];
  }

  // Get time modifier
  const timePeriod = getTimePeriod(hour);
  const timeModifier = TIME_MODIFIERS[timePeriod];

  // Build the prompt
  const parts = [];

  parts.push(`## DESIGN INSPIRATION: ${inspiration.name}`);
  parts.push(inspiration.prompt);

  if (includeTimeModifier) {
    parts.push(`\n## TIME-OF-DAY INFLUENCE (${timePeriod})`);
    parts.push(`Mood: ${timeModifier.mood}`);
    parts.push(`Color bias: ${timeModifier.colorBias}`);
    parts.push(`Energy: ${timeModifier.energy}`);
  }

  if (userPrompt) {
    parts.push(`\n## ADDITIONAL DIRECTION`);
    parts.push(userPrompt);
  }

  parts.push(`\n## IMPORTANT`);
  parts.push(`Blend these influences naturally. The theme should feel cohesive, not like a checklist.`);
  parts.push(`Create something that feels intentional and designed, not random.`);

  return {
    inspirationName: inspiration.name,
    timePeriod,
    fullPrompt: parts.join('\n')
  };
}

/**
 * List all available inspirations
 */
export function listInspirations() {
  return INSPIRATION_BANK.map(i => i.name);
}
