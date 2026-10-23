import { readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';

export type DiskWritingEntry = {
  id: string;
  data: {
    title: string;
    description: string;
    pubDate: Date;
    draft: boolean;
    tags?: string[];
  };
};

function parseFrontmatterBlock(block: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of block.split('\n')) {
    const match = line.match(/^([A-Za-z0-9_]+):\s*(.+)$/);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[match[1]] = value;
  }
  return out;
}

function parseMarkdownEntry(dir: string, file: string): DiskWritingEntry {
  const id = basename(file, '.md');
  const raw = readFileSync(join(dir, file), 'utf8');
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    throw new Error(`Missing frontmatter in ${file}`);
  }
  const fm = parseFrontmatterBlock(match[1]);
  return {
    id,
    data: {
      title: fm.title ?? id,
      description: fm.description ?? '',
      pubDate: new Date(fm.pubDate ?? '1970-01-01'),
      draft: fm.draft === 'true',
      tags: fm.tags
        ? fm.tags
            .replace(/^\[/, '')
            .replace(/\]$/, '')
            .split(',')
            .map((tag) => tag.trim().replace(/^["']|["']$/g, ''))
            .filter(Boolean)
        : undefined,
    },
  };
}

export function loadWritingEntriesFromDisk(): DiskWritingEntry[] {
  const dir = join(process.cwd(), 'src/content/writing');
  return readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .map((file) => parseMarkdownEntry(dir, file));
}

export function loadNoteEntriesFromDisk(): DiskWritingEntry[] {
  const dir = join(process.cwd(), 'src/content/notes');
  return readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .map((file) => parseMarkdownEntry(dir, file));
}
