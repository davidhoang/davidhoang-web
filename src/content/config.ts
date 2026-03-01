import { defineCollection, z } from 'astro:content';

const writing = defineCollection({
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    description: z.string(),
    ogImage: z.string().optional(),
    coverImage: z.string().optional(),
    draft: z.boolean().optional().default(false),
  })
});

const notes = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    pubDate: z.date(),                    // First planted
    updatedDate: z.date().optional(),     // Last tended
    stage: z.enum(['seedling', 'budding', 'evergreen']).default('seedling'),
    tags: z.array(z.string()).optional(),
    ogImage: z.string().optional(),
    draft: z.boolean().optional().default(false),
  })
});

export const collections = {
  'writing': writing,
  'notes': notes,
}; 