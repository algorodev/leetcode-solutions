import 'dotenv/config';
import { fetchAllLeetCodes, fetchAllBlocks } from '../src/lib/notion/fetchers'
import { blocksToMDX } from '../src/lib/notion/blocks-to-mdx';
import { writeLeetcodeMDX } from '../src/lib/mdx/mdx-writer'
import { ensureBaseDirs, clearContentDirs } from '../src/lib/fs/paths';
import { notion } from '../src/lib/notion/client';

async function loadChildren(blockId: string): Promise<any[]> {
  const children: any[] = [];
  let cursor: string | undefined = undefined;
  do {
    const res = await notion.blocks.children.list({
      block_id: blockId,
      page_size: 100,
      start_cursor: cursor,
    });
    children.push(...(res.results ?? []));
    cursor = res.next_cursor ?? undefined;
  } while (cursor);
  return children;
}

async function main() {
  console.log('[mdx] Clearing existing content...');
  clearContentDirs();
  ensureBaseDirs();

  console.log('[mdx] Starting to fetch content from Notion...');
  const leetcodes = await fetchAllLeetCodes();
  let ok = 0;
  for (const leetcode of leetcodes) {
    const blocks = await fetchAllBlocks(leetcode.id);
    const { mdx } = await blocksToMDX(leetcode.id, blocks, {
      loadChildren,
    });
    const out = writeLeetcodeMDX(leetcode, mdx);
    console.log(`[mdx] Wrote ${leetcode.slug} → ${out}`);
    ok++;
  }

  console.log(`[mdx] Done. Generated ${ok} file(s).`);
}

main().catch((err) => {
  console.error('[mdx] FAILED:', err);
  process.exit(1);
});
