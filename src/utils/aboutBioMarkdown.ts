/** HTML escape helper to prevent XSS in bio markdown output. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Simple markdown to HTML for About bio (links and paragraphs). */
export function markdownToHtml(markdown: string): string {
  let html = markdown.trim();

  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, text, url) => {
    const isExternal = url.startsWith('http://') || url.startsWith('https://');
    const target = isExternal ? ' target="_blank"' : '';
    const rel = isExternal ? ' rel="noopener noreferrer"' : '';
    const newTabHint = isExternal
      ? '<span class="sr-only"> (opens in a new tab)</span>'
      : '';
    return `<a href="${escapeHtml(url)}"${target}${rel}>${escapeHtml(text)}${newTabHint}</a>`;
  });

  const paragraphs = html.split(/\n\n+/).filter((p) => p.trim());
  return paragraphs.map((p) => `<p>${p.trim()}</p>`).join('\n');
}