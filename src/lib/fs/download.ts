import fs from 'node:fs';
import path from 'node:path';
import { ensureDir } from './paths.ts';

export async function downloadFile(url: string, destFile: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`[download] HTTP ${res.status} for ${url}`);
  const arrayBuffer = await res.arrayBuffer();
  ensureDir(path.dirname(destFile));
  fs.writeFileSync(destFile, Buffer.from(arrayBuffer));
}
