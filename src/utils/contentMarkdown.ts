/**
 * Build clean, public Markdown documents for writing posts and notes.
 * Used by /writing/{slug}.md and /notes/{slug}.md static endpoints.
 */

export type ContentMarkdownKind = 'writing' | 'notes';

/** Fields that must never appear in public Markdown exports. */
const INTERNAL_FIELDS = new Set(['draft']);

type YamlPrimitive = string | number | boolean | Date | null | undefined;
type YamlValue = YamlPrimitive | YamlValue[] | { [key: string]: YamlValue };

export interface ContentMarkdownSource {
  kind: ContentMarkdownKind;
  id: string;
  body?: string;
  data: Record<string, unknown>;
  site?: string | URL;
}

function formatDate(value: Date): string {
  // Prefer YYYY-MM-DD when the time is midnight UTC (content frontmatter style).
  const iso = value.toISOString();
  if (iso.endsWith('T00:00:00.000Z')) {
    return iso.slice(0, 10);
  }
  return iso;
}

function escapeDoubleQuoted(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function needsQuotes(value: string): boolean {
  if (value === '') return true;
  if (/^[-:?|&!*>%@`'"{}[\],#]|^\s|\s$|: | #|[\n\r]/.test(value)) return true;
  if (/^(true|false|null|yes|no|on|off)$/i.test(value)) return true;
  if (/^[-+]?(\d+(\.\d+)?|\.\d+)([eE][-+]?\d+)?$/.test(value)) return true;
  return false;
}

function formatScalar(value: YamlPrimitive): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'null';
  if (value instanceof Date) return formatDate(value);
  const str = String(value);
  if (needsQuotes(str) || str.includes('\n')) {
    return `"${escapeDoubleQuoted(str)}"`;
  }
  return str;
}

function formatYamlValue(value: YamlValue, indent: number): string[] {
  const pad = '  '.repeat(indent);

  if (Array.isArray(value)) {
    if (value.length === 0) return [`${pad}[]`];
    const lines: string[] = [];
    for (const item of value) {
      if (item !== null && typeof item === 'object' && !(item instanceof Date)) {
        const nested = formatYamlValue(item, indent + 1);
        if (nested.length === 0) {
          lines.push(`${pad}- {}`);
        } else {
          lines.push(`${pad}- ${nested[0].trimStart()}`);
          lines.push(...nested.slice(1));
        }
      } else {
        lines.push(`${pad}- ${formatScalar(item as YamlPrimitive)}`);
      }
    }
    return lines;
  }

  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    const entries = Object.entries(value).filter(([, v]) => v !== undefined);
    if (entries.length === 0) return [`${pad}{}`];
    const lines: string[] = [];
    for (const [key, nested] of entries) {
      if (Array.isArray(nested) || (nested !== null && typeof nested === 'object' && !(nested instanceof Date))) {
        lines.push(`${pad}${key}:`);
        lines.push(...formatYamlValue(nested, indent + 1));
      } else {
        lines.push(`${pad}${key}: ${formatScalar(nested as YamlPrimitive)}`);
      }
    }
    return lines;
  }

  return [`${pad}${formatScalar(value as YamlPrimitive)}`];
}

/** Serialize a plain object to YAML front matter (no surrounding --- fences). */
export function toYamlFrontMatter(data: Record<string, YamlValue>): string {
  return formatYamlValue(data, 0).join('\n');
}

function siteOrigin(site?: string | URL): string {
  const raw = site ? String(site) : 'https://www.davidhoang.com';
  return raw.replace(/\/+$/, '');
}

function pickPublicFields(
  kind: ContentMarkdownKind,
  data: Record<string, unknown>,
): Record<string, YamlValue> {
  const writingKeys = [
    'title',
    'pubDate',
    'description',
    'tags',
    'coverImage',
    'ogImage',
    'newsletterUrl',
    'relatedWriting',
    'relatedNotes',
  ] as const;

  const noteKeys = [
    'title',
    'description',
    'overview',
    'overviewYoutube',
    'pubDate',
    'updatedDate',
    'stage',
    'tags',
    'coverImage',
    'ogImage',
    'links',
    'relatedWriting',
    'relatedNotes',
  ] as const;

  const keys = kind === 'writing' ? writingKeys : noteKeys;
  const out: Record<string, YamlValue> = {};

  for (const key of keys) {
    if (INTERNAL_FIELDS.has(key)) continue;
    const value = data[key];
    if (value === undefined || value === null) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    out[key] = value as YamlValue;
  }

  return out;
}

/**
 * Build a public Markdown document with canonical front matter + original body.
 * Omits draft and other internal-only fields.
 */
export function buildContentMarkdown(source: ContentMarkdownSource): string {
  const { kind, id, body = '', data } = source;
  const origin = siteOrigin(source.site);
  const htmlPath = `/${kind}/${id}`;
  const markdownPath = `${htmlPath}.md`;

  const publicData = pickPublicFields(kind, data);
  const frontMatter: Record<string, YamlValue> = {
    ...publicData,
    canonical: `${origin}${htmlPath}`,
    markdown: `${origin}${markdownPath}`,
  };

  // Never leak draft or unknown internal flags even if present on data.
  delete frontMatter.draft;

  const yaml = toYamlFrontMatter(frontMatter);
  const trimmedBody = body.replace(/^\uFEFF/, '').replace(/^\n+/, '').replace(/\s+$/, '');
  return `---\n${yaml}\n---\n\n${trimmedBody}\n`;
}

export function markdownResponse(markdown: string, canonicalHtmlUrl: string): Response {
  return new Response(markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      Link: `<${canonicalHtmlUrl}>; rel="canonical"`,
    },
  });
}
