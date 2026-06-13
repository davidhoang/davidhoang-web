export type ActiveStage = 0 | 1 | 2 | 3;
export type DiagramPhase = 'intro' | 'settled';

export const INTRO_MS = 13200;
export const INTRO_STAGE_II_MS = 3800;
export const INTRO_STAGE_III_MS = 8200;

export const PEAK_REST = 0.36;
export const PEAK_HOVER = 1;
export const PEAK_HOVER_MAIN = 1.12;

export const tectonicSpring = {
  type: 'spring' as const,
  stiffness: 110,
  damping: 19,
  mass: 0.9,
};

export const rangeSpring = {
  type: 'spring' as const,
  stiffness: 72,
  damping: 22,
  mass: 1.1,
};

export const popoverSpring = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 32,
};

export const SUBDUCT_ORIGIN = '580px 440px';
export const PLATE_ORIGIN = '520px 400px';

export const subductSettled = { rotate: 2.5, x: 8, y: 14 };
export const subductDeep = { rotate: 4.2, x: 13, y: 28 };
export const subductHover = { rotate: 5.5, x: 16, y: 32 };

export const plateSettled = { x: -11, y: -7, rotate: -1.2 };
export const plateHover = { x: -25, y: -12, rotate: -2 };

export const peakOrigins = {
  '1': '368px 262px',
  '2': '520px 252px',
  '3': '620px 238px',
  '4': '772px 228px',
} as const;

export const foothillsOrigin = '580px 278px';

export function peakScale(activeStage: ActiveStage, peak: keyof typeof peakOrigins): number {
  if (activeStage !== 3) return PEAK_REST;
  if (peak === '1') return 0.92;
  if (peak === '2') return PEAK_HOVER_MAIN;
  if (peak === '3') return PEAK_HOVER;
  return 0.9;
}

export const FRICTION_POPOVERS = [
  {
    stage: 1 as const,
    tone: 'rust' as const,
    tag: 'Friction zone · 01',
    num: 'CRAFT TRANSMISSION',
    title: 'Who develops the next generation when succession is thinning?',
    desc: "The pipeline isn't looking great. High-potential future leaders need mentorship — but they need to trust you understand their craft before they'll accept your perspective on AI.",
  },
  {
    stage: 2 as const,
    tone: 'teal' as const,
    tag: 'Friction zone · 02',
    num: 'CREDENTIALING LAG',
    title: "Boards still hire for the last decade's archetype.",
    desc: 'Standard credentialing feels lagging while market validation emerges. The summit forms faster than the org chart updates — mid-career leaders carry the new model into rooms still scoring the old one.',
  },
  {
    stage: 3 as const,
    tone: 'gold' as const,
    tag: 'Friction zone · 03',
    num: 'MELT-ZONE TALENT',
    title: 'Adapt, resist, or become irrelevant?',
    desc: 'Designers get submerged into the molten lava of irrelevance — recycled into founding roles, back to IC, or out of the industry. In the best case, experience becomes material for the multi-modal generations.',
  },
] as const;

export const LEGEND_ITEMS = [
  {
    stage: 1 as const,
    tone: 'rust' as const,
    swatch: '#a8442a',
    key: 'Stage I · Initial Uplift',
    body: 'First contact between AI-native and incumbent models. Pressure builds at the edges; nothing dramatic at the surface yet. Incumbents still in charge — boards hire the previous archetype.',
    em: 'The wedge is beneath.',
  },
  {
    stage: 2 as const,
    tone: 'teal' as const,
    swatch: '#2d5d63',
    key: 'Stage II · Sustained Thrust',
    body: 'The override plate gains momentum — hover to thrust left and compress the crust. Pressure builds at the collision zone, lifting the range above.',
    em: 'Horizontal force becomes vertical terrain.',
  },
  {
    stage: 3 as const,
    tone: 'gold' as const,
    swatch: '#b8893d',
    key: 'Stage III · New Mountain Range',
    body: 'The range rests on the override plate — low foothills at first, visible but not yet dominant. Hover to grow the terrain slowly into full relief.',
    em: 'When the new normal no longer needs a label.',
  },
] as const;
