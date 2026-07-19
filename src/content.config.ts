import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { NOTE_STAGE_VALUES } from './content/noteStages';

const writing = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    description: z.string(),
    ogImage: z.string().optional(),
    coverImage: z.string().optional(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().optional().default(false),
    companionPrototype: z.string().optional(),
    newsletterUrl: z.url().optional(),
    relatedWriting: z.array(z.string()).optional(),
    relatedNotes: z.array(z.string()).optional(),
  }),
});

const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    overview: z.string().optional(),
    overviewYoutube: z.string().optional(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    stage: z.enum(NOTE_STAGE_VALUES).default('thoughts'),
    tags: z.array(z.string()).optional(),
    ogImage: z.string().optional(),
    coverImage: z.string().optional(),
    links: z
      .array(
        z.object({
          title: z.string(),
          url: z.string(),
        })
      )
      .optional(),
    draft: z.boolean().optional().default(false),
    relatedWriting: z.array(z.string()).optional(),
    relatedNotes: z.array(z.string()).optional(),
  }),
});

export const collections = {
  writing,
  notes,
};
