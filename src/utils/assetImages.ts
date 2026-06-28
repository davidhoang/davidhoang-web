import type { ImageMetadata } from 'astro';

const assetImages = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/images/**/*.{webp,jpg,jpeg,png,avif}',
  { eager: true },
);

/** Resolve public `/images/...` paths to optimizable `astro:assets` modules when available. */
export function resolveAssetImage(path: string | undefined): ImageMetadata | undefined {
  if (!path || !path.startsWith('/images/')) return undefined;
  return assetImages[`/src/assets${path}`]?.default;
}
