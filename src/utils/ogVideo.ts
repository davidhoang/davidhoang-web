import {
  YOUTUBE_OG_VIDEO_HEIGHT,
  YOUTUBE_OG_VIDEO_WIDTH,
} from './youtube';

export type ResolvedOpenGraphVideo = {
  url: string;
  type: string;
  width: number;
  height: number;
};

/** Default looping hero clip used for davidhoang.com home link previews (Config talk). */
export const HOME_OG_PREVIEW = {
  video: '/images/davidhoang-web-config.mp4',
  poster: '/images/davidhoang-web-config-still.webp',
  width: 600,
  height: 338,
} as const;

function toAbsoluteUrl(src: string, siteUrl: string): string {
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  return `${siteUrl}${src.startsWith('/') ? src : `/${src}`}`;
}

function inferMimeType(absoluteUrl: string): string {
  const path = absoluteUrl.split('#')[0].split('?')[0].toLowerCase();
  if (path.endsWith('.mp4')) return 'video/mp4';
  if (path.endsWith('.webm')) return 'video/webm';
  return 'text/html';
}

/**
 * Build Open Graph video fields for MainLayout.
 * iMessage and Messages require direct MP4 (`video/mp4`); YouTube embeds use `text/html`.
 */
export function resolveOpenGraphVideo(
  src: string,
  siteUrl: string,
  dimensions?: { width: number; height: number },
): ResolvedOpenGraphVideo {
  const url = toAbsoluteUrl(src, siteUrl);
  const type = inferMimeType(url);

  if (type === 'text/html') {
    return {
      url,
      type,
      width: dimensions?.width ?? YOUTUBE_OG_VIDEO_WIDTH,
      height: dimensions?.height ?? YOUTUBE_OG_VIDEO_HEIGHT,
    };
  }

  return {
    url,
    type,
    width: dimensions?.width ?? YOUTUBE_OG_VIDEO_WIDTH,
    height: dimensions?.height ?? YOUTUBE_OG_VIDEO_HEIGHT,
  };
}
