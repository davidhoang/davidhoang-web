/** YouTube watch, embed, shorts, or youtu.be URL, or a bare 11-character video id. */
export function parseYoutubeVideoId(
  input: string | undefined | null
): string | null {
  if (!input || typeof input !== 'string') return null;
  const s = input.trim();
  const fromUrl = s.match(
    /(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (fromUrl) return fromUrl[1];
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  return null;
}

/** youtube-nocookie embed URL for a parsed video id. */
export function youtubeNocookieEmbedUrl(
  videoId: string,
  options?: { autoplay?: boolean }
): string {
  const params = new URLSearchParams();
  if (options?.autoplay) params.set('autoplay', '1');
  const query = params.toString();
  return `https://www.youtube-nocookie.com/embed/${videoId}${query ? `?${query}` : ''}`;
}

/** Standard YouTube poster thumbnail (hqdefault exists for all public videos). */
export function youtubePosterUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

/** Default 16:9 dimensions for `og:video:width` / `og:video:height` on YouTube embeds. */
export const YOUTUBE_OG_VIDEO_WIDTH = 1280;
export const YOUTUBE_OG_VIDEO_HEIGHT = 720;

/** Canonical youtube.com embed URL for Open Graph (`og:video`). Crawlers expect youtube.com, not nocookie. */
export function youtubeOpenGraphEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}
