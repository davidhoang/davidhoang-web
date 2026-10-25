/** Canonical status URL on X (no third-party widget scripts). */
export function xPostStatusUrl(handle: string, statusId: string): string {
  const user = handle.replace(/^@/, '').trim();
  const id = statusId.trim();
  if (!user || !id) {
    throw new Error('xPostStatusUrl requires a handle and status id');
  }
  return `https://x.com/${user}/status/${id}`;
}
