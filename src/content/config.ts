import { defineCollection, z } from 'astro:content';

const writing = defineCollection({
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    description: z.string(),
    ogImage: z.string().optional(),
    // ... other fields
  })
});

const work = defineCollection({
  schema: z.object({
    name: z.string(),
    coverImage: z.string(),
    year: z.union([z.number(), z.string()]), // Supports single year (number) or date range (string like "2019 to 2023")
    workedWith: z.array(z.object({
      name: z.string(),
      url: z.string().optional(),
    })).optional(),
    summary: z.string(),
  })
});

export const collections = {
  'writing': writing,
  'work': work
}; 