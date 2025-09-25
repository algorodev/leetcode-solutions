import { z } from 'zod'

export const LeetCodeSchema = z.object({
  id: z.string(),
  leetcodeId: z.number(),
  title: z.string(),
  slug: z.string(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  tags: z.array(z.string()).default([]),
  link: z.string().url(),
  languages: z.array(z.string()).default(['ts']),
  time: z.string(),
  space: z.string(),
  updated: z.string(),
})
export type LeetCode = z.infer<typeof LeetCodeSchema>;
