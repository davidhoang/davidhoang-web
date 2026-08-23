import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildContentMarkdown,
  markdownResponse,
  toYamlFrontMatter,
} from '../src/utils/contentMarkdown';

const ROOT = process.cwd();

describe('contentMarkdown', () => {
  it('serializes nested YAML front matter cleanly', () => {
    const yaml = toYamlFrontMatter({
      title: 'Hello: world',
      tags: ['ai', 'design'],
      links: [{ title: 'Example', url: 'https://example.com' }],
    });

    expect(yaml).toContain('title: "Hello: world"');
    expect(yaml).toContain('tags:');
    expect(yaml).toContain('- ai');
    expect(yaml).toContain('- title: Example');
    expect(yaml).toContain('url: https://example.com');
  });

  it('builds writing markdown with public front matter and original body', () => {
    const md = buildContentMarkdown({
      kind: 'writing',
      id: 'a-new-mvc-is-emerging',
      body: 'Paragraph one.\n\n## Heading\n\nParagraph two.',
      data: {
        title: 'A new MVC is emerging',
        pubDate: new Date('2025-06-15T00:00:00.000Z'),
        description: 'AI is breaking the way we build',
        tags: ['ai', 'software'],
        coverImage: '/images/blog/2025/cover.webp',
        draft: true,
        companionPrototype: '/prototypes/secret',
        relatedNotes: ['mvc-is-decoupling'],
      },
      site: 'https://www.davidhoang.com',
    });

    expect(md.startsWith('---\n')).toBe(true);
    expect(md).toContain('title: A new MVC is emerging');
    expect(md).toContain('pubDate: 2025-06-15');
    expect(md).toContain('canonical: https://www.davidhoang.com/writing/a-new-mvc-is-emerging');
    expect(md).toContain('markdown: https://www.davidhoang.com/writing/a-new-mvc-is-emerging.md');
    expect(md).toContain('relatedNotes:');
    expect(md).toContain('- mvc-is-decoupling');
    expect(md).toContain('Paragraph one.');
    expect(md).toContain('## Heading');
    expect(md).not.toMatch(/^draft:/m);
    expect(md).not.toContain('draft: true');
    expect(md).not.toContain('companionPrototype');
    expect(md).not.toContain('/prototypes/secret');
  });

  it('builds notes markdown and omits empty optional fields', () => {
    const md = buildContentMarkdown({
      kind: 'notes',
      id: 'ai-creativity-tools',
      body: 'Rough notes on something I\'ve been thinking about...',
      data: {
        title: 'AI as Creative Partner',
        description: 'Early thoughts',
        pubDate: new Date('2025-01-03T00:00:00.000Z'),
        stage: 'thoughts',
        tags: ['ai'],
        draft: false,
        overview: undefined,
        links: [],
      },
    });

    expect(md).toContain('canonical: https://www.davidhoang.com/notes/ai-creativity-tools');
    expect(md).toContain('markdown: https://www.davidhoang.com/notes/ai-creativity-tools.md');
    expect(md).toContain('stage: thoughts');
    expect(md).toContain("Rough notes on something I've been thinking about...");
    expect(md).not.toContain('overview:');
    expect(md).not.toContain('links:');
    expect(md).not.toContain('draft:');
  });

  it('returns text/markdown UTF-8 with a canonical Link header', async () => {
    const response = markdownResponse('# Hello\n', 'https://www.davidhoang.com/writing/hello');
    expect(response.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8');
    expect(response.headers.get('Link')).toBe(
      '<https://www.davidhoang.com/writing/hello>; rel="canonical"',
    );
    await expect(response.text()).resolves.toBe('# Hello\n');
  });

  it('wires draft-filtered static endpoints for writing and notes', () => {
    const writingEndpoint = readFileSync(
      join(ROOT, 'src/pages/writing/[slug].md.ts'),
      'utf8',
    );
    const notesEndpoint = readFileSync(
      join(ROOT, 'src/pages/notes/[slug].md.ts'),
      'utf8',
    );

    expect(writingEndpoint).toContain("getCollection('writing'");
    expect(writingEndpoint).toContain('!data.draft');
    expect(writingEndpoint).toContain('buildContentMarkdown');
    expect(writingEndpoint).toContain('markdownResponse');

    expect(notesEndpoint).toContain("getCollection('notes'");
    expect(notesEndpoint).toContain('!data.draft');
    expect(notesEndpoint).toContain('buildContentMarkdown');
    expect(notesEndpoint).toContain('markdownResponse');
  });

  it('exposes HTML alternate discovery links without llms.txt coupling', () => {
    const writingPost = readFileSync(join(ROOT, 'src/layouts/WritingPost.astro'), 'utf8');
    const notePage = readFileSync(join(ROOT, 'src/pages/notes/[...slug].astro'), 'utf8');

    expect(writingPost).toContain('rel="alternate"');
    expect(writingPost).toContain('type="text/markdown"');
    expect(writingPost).toContain('data.draft');
    expect(writingPost).not.toContain('llms.txt');

    expect(notePage).toContain('rel="alternate"');
    expect(notePage).toContain('type="text/markdown"');
    expect(notePage).toContain('note.data.draft');
    expect(notePage).not.toContain('llms.txt');
  });

  it('sets text/markdown Content-Type for .md routes in vercel.json', () => {
    const vercel = readFileSync(join(ROOT, 'vercel.json'), 'utf8');
    expect(vercel).toContain('/writing/(.*).md');
    expect(vercel).toContain('/notes/(.*).md');
    expect(vercel).toContain('text/markdown; charset=utf-8');
  });

  it('serves repo-root design.md before Astro routeGuard so /design.md is not a 404', () => {
    const astroConfig = readFileSync(join(ROOT, 'astro.config.mjs'), 'utf8');
    const endpoint = readFileSync(join(ROOT, 'src/pages/design.md.ts'), 'utf8');

    expect(endpoint).toContain("join(process.cwd(), 'design.md')");
    expect(astroConfig).toContain("name: 'serve-root-markdown-routes'");
    expect(astroConfig).toContain("url !== '/design.md'");
  });
});
