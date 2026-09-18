import type { HomeKind, HomeView } from './types';

// Viewer-only, for the same chunking reason as homeFraming: this side of the
// lazy boundary must stay out of the `homes-3d` chunk.
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
