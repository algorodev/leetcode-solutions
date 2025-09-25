import type { LeetCode } from './schemas.ts';
import { LeetCodeSchema } from './schemas.ts';
import type { PageObjectResponse } from '@notionhq/client';

export function rtToPlain(rt: any[]): string {
  return (rt ?? []).map((r: any) => r.plain_text ?? '').join('');
}

export function fileToUrl(file: any): string | undefined {
  if (!file) return undefined;
  if (file.type === 'external') return file.external?.url;
  if (file.type === 'file') return file.file?.url;
  return undefined;
}

export function getCoverUrl(page: PageObjectResponse): string | undefined {
  const c = (page as any).cover;
  if (!c) return undefined;
  return fileToUrl(c);
}

export function mapLeetCode(page: PageObjectResponse): LeetCode {
  const props: any = page.properties;

  const leetcodeId = props?.ID;
  const title = rtToPlain(props?.Title?.title ?? []);
  const slug = (
    props?.Slug?.rich_text?.[0]?.plain_text ??
    props?.Slug?.formula?.string ??
    ''
  ).trim();
  const difficulty = props?.Difficulty?.select?.name ?? 'Easy';
  const tags = (props?.Tags?.multi_select ?? []).map((t: any) => t.name);
  const link = props?.Link?.url ?? undefined;
  const languages = (props?._Languages?.multi_select ?? []).map((l: any) => l.name);
  const time = props?.Time?.rich_text?.[0]?.plain_text ?? undefined;
  const space = props?.Space?.rich_text?.[0]?.plain_text ?? undefined;
  const updated = props?.Update?.date?.start ?? undefined;

  const obj = {
    id: page.id,
    leetcodeId,
    title,
    slug,
    difficulty,
    tags,
    link,
    languages,
    time,
    space,
    updated,
  };
  return LeetCodeSchema.parse(obj);
}
