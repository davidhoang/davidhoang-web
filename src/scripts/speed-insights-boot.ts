/** Loaded from MainLayout only in production — keeps Vite preload out of the layout chunk. */
import('@vercel/speed-insights').then(({ injectSpeedInsights }) => {
  injectSpeedInsights();
});

export {};