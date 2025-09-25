import { defineCollection, z } from 'astro:content'

const leetcode = defineCollection({
	type: 'content',
	schema: z.object({
		id: z.number(),
		title: z.string(),
		slug: z.string(),
		difficulty: z.enum(['Easy', 'Medium', 'Hard']),
		tags: z.array(z.string()).default([]),
		link: z.string().url(),
		langs: z.array(z.string()).default(['ts']),
		timeComplexity: z.string().optional(),
		spaceComplexity: z.string().optional(),
		updatedAt: z.string().datetime().optional(),
	}),
})

export const collections = { leetcode }
