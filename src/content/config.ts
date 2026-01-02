import { defineCollection, z } from 'astro:content';

const writing = defineCollection({
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    description: z.string(),
    ogImage: z.string().optional(),
    coverImage: z.string().optional(),
    draft: z.boolean().optional().default(false),
    // ... other fields
  })
});

export const collections = {
  'writing': writing
}; 