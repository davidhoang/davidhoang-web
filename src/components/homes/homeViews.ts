export type HomeKind = 'desert' | 'clocktower';
export type HomeView = 'home' | 'detail';

export type Framing = {
  position: [number, number, number];
  target: [number, number, number];
  width: number;
  height: number;
};

export const homeFraming: Record<HomeKind, Record<HomeView, Framing>> = {
  desert: {
    home: { position: [22.2, 28, 32.8], target: [-2.8, 3, -4.2], width: 35, height: 30 },
    detail: { position: [0.25, 1.85, 9.8], target: [-1.9, 0.78, 6.35], width: 2.8, height: 2.8 },
  },
  clocktower: {
    home: { position: [29.2, 32, 43.8], target: [-2.8, 7, -4.2], width: 43, height: 37 },
    detail: { position: [1.5, 18.5, 11], target: [-8.25, 15.8, -2.65], width: 11, height: 12 },
  },
};

export function homeDescription(kind: HomeKind): string {
  return kind === 'desert'
    ? 'Clay miniature of our Palm Springs home, with layered desert mountains behind it and Kai the tabby cat by the front path.'
    : 'Clay miniature of the Clocktower in San Francisco, with pale blue bay water, sailboats and a suspension bridge behind it.';
}

export function homePeekLabel(kind: HomeKind, view: HomeView, name: string): string {
  if (view === 'detail') return `Show the full ${name} view`;
  return kind === 'desert' ? `Look closer at Kai in ${name}` : `Look closer at the ${name} tower`;
}

export function homeInstructions(): string {
  return 'Drag to orbit, Shift-drag to pan, scroll to zoom. Touch: one finger orbits, two fingers pan and zoom. Keyboard: arrow keys pan, + / − zoom. Double-click or use Look closer to inspect a detail. Reset restores the initial view.';
}
