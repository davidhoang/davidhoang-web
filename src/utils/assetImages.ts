import type { ImageMetadata } from 'astro';

const assetImages = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/images/**/*.{webp,jpg,jpeg,png,avif}',
  { eager: true },
);

/**
 * Resolve `/images/...` URL paths to `src/assets/images` modules for `astro:assets`.
 * Image source of truth lives under src/assets; public/images is a generated mirror.
 */
export function resolveAssetImage(path: string | undefined): ImageMetadata | undefined {
  if (!path || !path.startsWith('/images/')) return undefined;
  return assetImages[`/src/assets${path}`]?.default;
}
