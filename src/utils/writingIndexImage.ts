import { getImage } from 'astro:assets';
import { resolveAssetImage } from './assetImages';

export type WritingIndexImageVariant = 'card' | 'spotlight' | 'list';

export interface WritingIndexImage {
  src: string;
  srcSet?: string;
  sizes?: string;
  width: number;
  height: number;
}

const VARIANT_OPTS: Record<
  WritingIndexImageVariant,
  { widths: number[]; sizes: string; maxWidth: number }
> = {
  card: {
    widths: [400, 600, 800],
    sizes: '(max-width: 767px) 100vw, (max-width: 1200px) 50vw, 420px',
    maxWidth: 800,
  },
  spotlight: {
    widths: [640, 900, 1200],
    sizes: '(max-width: 767px) 100vw, min(900px, 100vw)',
    maxWidth: 1200,
  },
  list: {
    widths: [112, 224],
    sizes: '112px',
    maxWidth: 224,
  },
};

/** Right-size mirrored blog assets for writing index cards (not full /public originals). */
export async function optimizeWritingIndexImage(
  url: string,
  variant: WritingIndexImageVariant,
): Promise<WritingIndexImage> {
  if (url.startsWith('/api/') || /^https?:\/\//i.test(url)) {
    return { src: url, width: 600, height: 400 };
  }

  const asset = resolveAssetImage(url);
  if (!asset) {
    return { src: url, width: 600, height: 400 };
  }

  const { widths, sizes, maxWidth } = VARIANT_OPTS[variant];
  const result = await getImage({
    src: asset,
    widths,
    sizes,
    format: 'webp',
    width: maxWidth,
  });

  const aspect = asset.height / asset.width;
  const displayWidth = Math.min(asset.width, maxWidth);

  return {
    src: result.src,
    srcSet: result.srcSet.attribute,
    sizes,
    width: displayWidth,
    height: Math.round(displayWidth * aspect),
  };
}
