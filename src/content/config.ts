import { defineCollection, z } from 'astro:content';
import { NOTE_STAGE_VALUES } from '../utils/noteStages';

const writing = defineCollection({
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    description: z.string(),
    ogImage: z.string().optional(),
    coverImage: z.string().optional(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().optional().default(false),
  })
});

const notes = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    overview: z.string().optional(),
    overviewYoutube: z.string().optional(),
    pubDate: z.date(),                    // First planted
    updatedDate: z.date().optional(),     // Last tended
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
  })
});

export const collections = {
  'writing': writing,
  'notes': notes,
}; 