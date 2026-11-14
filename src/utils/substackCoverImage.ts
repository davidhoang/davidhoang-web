const SUBSTACK_CDN_FETCH = 'substackcdn.com/image/fetch/';

/**
 * Right-size Substack CDN cover art for in-page thumbnails (PoC subscribe canvas).
 * Full-resolution covers can be multiple MB each; the grid renders them at ~22vw.
 */
export function resizeSubstackCdnCover(coverImage: string, maxWidth = 600): string {
  if (!coverImage || typeof coverImage !== 'string') return coverImage;

  const isBareSubstackMedia =
    coverImage.startsWith('https://substack-post-media.s3.amazonaws.com/') ||
    coverImage.startsWith('https://bucketeer-e05bbc84-baa3-437e-9518-adb32be77984.s3.amazonaws.com/');

  if (isBareSubstackMedia) {
    const sizeHint = `w_${maxWidth},c_limit,f_auto,q_auto:good,fl_progressive:steep`;
    return `https://${SUBSTACK_CDN_FETCH}${sizeHint}/${encodeURIComponent(coverImage)}`;
  }

  if (!coverImage.includes(SUBSTACK_CDN_FETCH)) return coverImage;

  const [prefix, ...rest] = coverImage.split(SUBSTACK_CDN_FETCH);
  if (!rest.length) return coverImage;

  let params = rest.join(SUBSTACK_CDN_FETCH);
  // Drop any existing width/height hints so we do not stack transforms.
  params = params.replace(/(^|,)w_\d+,?/g, '$1').replace(/(^|,)h_\d+,?/g, '$1');
  params = params.replace(/^,+/, '').replace(/,+/g, ',');
  if (params.startsWith('c_limit,')) params = params.slice('c_limit,'.length);

  const sizeHint = `w_${maxWidth},c_limit,`;
  return `${prefix}${SUBSTACK_CDN_FETCH}${sizeHint}${params}`;
}