import type { Framing, HomeKind, HomeView } from './types';

// Scene-only: a runtime module shared with HomeViewer would be chunked into
// `homes-3d`, making the viewer facade statically link the optional renderer.
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
