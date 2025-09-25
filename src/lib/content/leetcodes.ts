function baseName(path: string) {
  return path
    .split('/')
    .pop()!
    .replace(/\.mdx?$/, '');
}

export async function getAllLeetCodes() {
  const modules = import.meta.glob<any>('/src/content/leetcode/**/*.mdx', { eager: true });
  const leetcodes = Object.entries(modules).map(([file, mod]) => {
    const fm = mod.frontmatter || {};
    const slug = fm.slug || baseName(file);
    return { file, slug, ...fm, Content: mod.default };
  });

  return leetcodes.sort((a, b) => b.id - a.id);
}

export async function getLeetcodeBySlug(slug: string) {
  const all = await getAllLeetCodes();
  return all.find((l) => l.slug === slug);
}
