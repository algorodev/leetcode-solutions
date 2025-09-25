import { notion, resourceIds } from './client'
import { mapLeetCode } from './mappers'
import type { LeetCode } from './schemas.ts'

async function resolveDataSourceId(id: string): Promise<string> {
  if (id.startsWith('ntn_')) return id;

  const db: any = await notion.databases.retrieve({ database_id: id });
  const ds = db?.data_sources?.[0]?.id;
  if (!ds) {
    throw new Error(
      `[NOTION] Database ${id} has no accessible data sources for this integration. ` +
        `Ensure the integration is shared and the DB has at least one data source.`,
    );
  }
  return ds;
}

export async function fetchAllLeetCodes(): Promise<LeetCode[]> {
  const rawId = resourceIds.leetcodesDb;
  if (!rawId) throw new Error('[NOTION] Missing NOTION_DATABASE_ID');

  const dataSourceId = await resolveDataSourceId(rawId);

  const results: any[] = [];
  let hasMore = true;
  let cursor: string | undefined = undefined;

  while (hasMore) {
    const res: any = await (notion as any).dataSources.query({
      data_source_id: dataSourceId,
      start_cursor: cursor,
    });
    results.push(...(res.results ?? []));
    hasMore = !!res.has_more;
    cursor = res.next_cursor ?? undefined;
  }

  const pages = results.filter((r: any) => r.object === 'page' && r.properties);
  let leetcodes: LeetCode[] = pages.map((l: any) => mapLeetCode(l));

  leetcodes.sort((a, b) => b.leetcodeId - a.leetcodeId);

  const slugs = new Set<string>();
  for (const l of leetcodes) {
    if (!l.slug) throw new Error(`[NOTION] Leetcode ${l.id} missing slug`);
    if (slugs.has(l.slug)) throw new Error(`[NOTION] Duplicate slug: ${l.slug}`);
    slugs.add(l.slug);
  }

  return leetcodes;
}

export async function fetchAllBlocks(blockId: string) {
  const blocks: any[] = [];
  let cursor: string | undefined = undefined;
  let hasMore = true;

  while (hasMore) {
    const res: any = await (notion as any).blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
      page_size: 100,
    });
    blocks.push(...(res.results ?? []));
    hasMore = !!res.has_more;
    cursor = res.next_cursor ?? undefined;
  }
  return blocks;
}
