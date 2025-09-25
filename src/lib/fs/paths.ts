import path from 'node:path';
import fs from 'node:fs';

const project = () => process.cwd();

export const CONTENT_DIR = path.join(project(), 'src/content');
export const LEETCODE_DIR = path.join(CONTENT_DIR, 'leetcode');
export const PUBLIC_DIR = path.join(project(), 'public');
export const NOTION_PUBLIC_DIR = path.join(PUBLIC_DIR, 'notion');

export function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function clearContentDirs() {
  if (fs.existsSync(LEETCODE_DIR)) {
    const blogFiles = fs.readdirSync(LEETCODE_DIR);
    for (const file of blogFiles) {
      if (file.endsWith('.mdx')) {
        fs.unlinkSync(path.join(LEETCODE_DIR, file));
      }
    }
  }
}

export function ensureBaseDirs() {
  ensureDir(LEETCODE_DIR);
  ensureDir(NOTION_PUBLIC_DIR);
}
