import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { ensureDir, LEETCODE_DIR } from '../fs/paths';

function sanitize<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.filter((v) => v !== undefined).map((v) => sanitize(v)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value as Record<string, any>)) {
      if (v === undefined) continue;
      const sv = sanitize(v);
      out[k] = sv;
    }
    return out as unknown as T;
  }
  return value;
}

export function writeLeetcodeMDX(
  post: {
    id: string;
    leetcodeId: number;
    title: string;
    slug: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    tags: string[];
    link: string;
    languages: string[];
    time: string;
    space: string;
    updated: string;
  },
  mdxBody: string,
) {
  const frontmatterRaw = {
    id: post.leetcodeId,
    title: post.title,
    slug: post.slug,
    difficulty: post.difficulty,
    tags: post.tags,
    link: post.link,
    languages: post.languages,
    time: post.time,
    space: post.space,
    update: post.updated,
  };

  const frontmatter = sanitize(frontmatterRaw);

  const filepath = path.join(LEETCODE_DIR, `${post.slug}.mdx`);
  const file = matter.stringify(mdxBody, frontmatter);
  ensureDir(LEETCODE_DIR);
  fs.writeFileSync(filepath, file, 'utf-8');
  return filepath;
}
