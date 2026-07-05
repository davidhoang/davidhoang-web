import { fade } from 'astro:transitions';

/** Opacity-only page transition — avoids translateY reposition flicker between routes. */
export const pageFade = fade({ duration: '0.2s' });
