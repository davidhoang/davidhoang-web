import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { projects } from '../src/data/projects';
import { works } from '../src/data/works';

const worksPage = readFileSync(join(process.cwd(), 'src/pages/works.astro'), 'utf8');

describe('Works projects sidebar', () => {
  it('renders projects in a sidebar column beside the works stream', () => {
    expect(worksPage).toContain("import { projects } from '../data/projects'");
    expect(worksPage).toContain('class="layout-sidebar works-index__layout"');
    expect(worksPage).toContain('<aside class="works-projects" aria-label="Projects">');
  });

  it('keeps build-in-public projects out of the chronological stream', () => {
    const projectHrefs = new Set(projects.map((project) => project.href));
    const streamedProjects = works.filter((entry) => entry.href && projectHrefs.has(entry.href));

    expect(streamedProjects).toEqual([]);
  });
});
