import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const leetcode = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/leetcode' }),
  schema: z.object({
    id: z.number(),
    title: z.string(),
    slug: z.string(),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']),
    tags: z.array(z.string()).default([]),
    link: z.string().url(),
    languages: z.array(z.string()).default(['ts']),
    time: z.string().optional(),
    space: z.string().optional(),
    updated: z.string().datetime().optional(),
  }),
});

export const collections = { leetcode };
