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
