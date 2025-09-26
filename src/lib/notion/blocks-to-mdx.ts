import path from 'node:path';
import { downloadFile } from '../fs/download';
import { NOTION_PUBLIC_DIR } from '../fs/paths';

function esc(text = '') {
  return text
    .replaceAll('{', '\\{')
    .replaceAll('}', '\\}')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function richTextToInline(rt: any[] = []): string {
  return (rt ?? [])
    .map((r) => {
      const t = r?.plain_text ?? '';
      const ann = r?.annotations ?? {};
      let out = esc(t);
      if (ann.code) out = '`' + out + '`';
      if (ann.bold) out = `**${out}**`;
      if (ann.italic) out = `*${out}*`;
      if (ann.strikethrough) out = `~~${out}~~`;
      if (ann.underline) out = `<u>${out}</u>`;
      if (r?.href) out = `[${out}](${r.href})`;
      return out;
    })
    .join('');
}

export type ImageDownload = {
  url: string;
  localRelPath: string;
  localAbsPath: string;
};

async function materializeImage(pageId: string, url: string, idx: number): Promise<ImageDownload> {
  const ext = (() => {
    try {
      const u = new URL(url);
      const m = u.pathname.match(/\.(\w+)(?:\?|$)/);
      return m ? m[1] : 'png';
    } catch {
      return 'png';
    }
  })();
  const fileName = `img-${idx}.${ext}`;
  const rel = `/notion/${pageId}/${fileName}`;
  const abs = path.join(NOTION_PUBLIC_DIR, pageId, fileName);
  await downloadFile(url, abs);
  return { url, localRelPath: rel, localAbsPath: abs };
}

export type BlocksToMdxOptions = {
  coverUrl?: string;
  loadChildren?: (blockId: string) => Promise<any[]>;
};

export async function blocksToMDX(
  pageId: string,
  blocks: any[],
  options?: BlocksToMdxOptions,
): Promise<{ mdx: string; coverPath?: string }> {
  let imageCount = 0;
  let localCover: string | undefined;

  if (options?.coverUrl) {
    const cover = await materializeImage(pageId, options.coverUrl, ++imageCount);
    localCover = cover.localRelPath;
  }

  const mdxLines = await renderBlocks(blocks, 0);

  const contentHasSolutionTabs = mdxLines.some(line => line.includes('<SolutionTabs'));

  let finalMdx = mdxLines.join('\n').replace(/\n{3,}/g, '\n\n');

  if (contentHasSolutionTabs) {
    const importStatement = `import SolutionTabs from '../../components/SolutionTabs.astro';\n\n`;
    finalMdx = importStatement + finalMdx;
  }

  return { mdx: finalMdx, coverPath: localCover };

  async function renderBlocks(items: any[] = [], depth: number): Promise<string[]> {
    const out: string[] = [];

    for (let i = 0; i < items.length; i++) {
      const block = items[i];
      const t = block?.type;
      if (!t) continue;

      if (t === 'paragraph') {
        out.push(richTextToInline(block.paragraph?.rich_text) || '<div class="my-2" />');
      } else if (t === 'heading_1' || t === 'heading_2' || t === 'heading_3') {
        const level = t === 'heading_1' ? '#' : t === 'heading_2' ? '##' : '###';
        const content = richTextToInline(block[t]?.rich_text);
        const isToggle = block[t]?.is_toggleable;
        if (isToggle) {
          out.push(`<details>\n<summary>${level} ${content}</summary>`);
          const children = await getChildren(block);
          if (children?.length) out.push(...(await renderBlocks(children, depth + 1)));
          out.push('</details>');
        } else {
          out.push(`${level} ${content}`);
        }
      } else if (t === 'bulleted_list_item' || t === 'numbered_list_item') {
        const groupType = t;
        const group: any[] = [block];
        while (i + 1 < items.length && items[i + 1]?.type === groupType) {
          group.push(items[++i]);
        }
        out.push(...(await renderList(group, groupType, depth)));
      } else if (t === 'quote') {
        const txt = richTextToInline(block.quote?.rich_text);
        out.push(`> ${txt}`);
        const children = await getChildren(block);
        if (children?.length)
          out.push(...(await renderBlocks(children, depth + 1)).map((l) => `> ${l}`));
      } else if (t === 'callout') {
        const txt = richTextToInline(block.callout?.rich_text);
        const icon = block.callout?.icon;
        const iconTxt = icon?.emoji ? icon.emoji + ' ' : '';
        out.push(`> ${iconTxt}${txt}`);
        const children = await getChildren(block);
        if (children?.length)
          out.push(...(await renderBlocks(children, depth + 1)).map((l) => `> ${l}`));
      } else if (t === 'toggle') {
        const summary = richTextToInline(block.toggle?.rich_text);
        out.push(`<details><summary>${summary}</summary>`);
        const children = await getChildren(block);
        if (children?.length) out.push(...(await renderBlocks(children, depth + 1)));
        out.push('</details>');
      } else if (t === 'to_do') {
        const checked = !!block.to_do?.checked;
        out.push(
          `${'  '.repeat(depth)}- [${checked ? 'x' : ' '}] ${richTextToInline(block.to_do?.rich_text)}`,
        );
        const children = await getChildren(block);
        if (children?.length) out.push(...(await renderBlocks(children, depth + 1)));
      } else if (t === 'code') {
        const lang = block.code?.language || '';
        const codeText = extractCodeWithIndentation(block.code?.rich_text ?? []);

        function extractCodeWithIndentation(rt: any[] = []): string {
          return rt
            .map((r) => {
              return r?.plain_text ?? '';
            })
            .join('');
        }

        const getLanguageTitle = (language: string): string => {
          const langMap: Record<string, string> = {
            'typescript': 'TypeScript Solution',
            'javascript': 'JavaScript Solution',
            'python': 'Python Solution',
          };
          return langMap[language.toLowerCase()] || 'Solution';
        };

        const title = getLanguageTitle(lang);

        out.push('');
        out.push(`<SolutionTabs title="${title}">`);
        out.push('```' + lang);
        out.push(codeText);
        out.push('```');
        out.push('</SolutionTabs>');
        out.push('');
      } else if (t === 'image') {
        const file = block.image?.external?.url ?? block.image?.file?.url;
        if (file) {
          const dl = await materializeImage(pageId, file, ++imageCount);
          const caption = richTextToInline(block.image?.caption ?? []);
          out.push(`![${caption}](${dl.localRelPath})`);
        }
      } else if (t === 'video' || t === 'audio' || t === 'file' || t === 'pdf' || t === 'embed') {
        const src = block[t]?.external?.url ?? block[t]?.file?.url ?? block[t]?.url;
        const cap = richTextToInline(block[t]?.caption ?? []);
        if (src) out.push(`[${cap || t}](${src})`);
      } else if (t === 'bookmark') {
        const url = block.bookmark?.url;
        const cap = richTextToInline(block.bookmark?.caption ?? []);
        if (url) out.push(`[${cap || url}](${url})`);
      } else if (t === 'equation') {
        const expr = block.equation?.expression ?? '';
        out.push('');
        out.push('$$');
        out.push(expr);
        out.push('$$');
        out.push('');
      } else if (t === 'table') {
        const rows = await getChildren(block);
        if (!rows?.length) continue;

        const hasColHeader = !!block.table?.has_column_header;

        const rawCells: string[][] = rows.map((row: any) =>
          (row.table_row?.cells ?? []).map((cell: any[]) =>
            richTextToInline(cell).replace(/\|/g, '\\|'),
          ),
        );

        const maxCols = Math.max(...rawCells.map((r) => r.length));
        if (maxCols === 0) continue;
        const cells = rawCells.map((r) =>
          r.concat(Array(Math.max(0, maxCols - r.length)).fill('')),
        );

        out.push('');

        if (hasColHeader) {
          const header = cells[0];
          const sep = Array.from({ length: header.length }, () => '---').join(' | ');
          out.push(`| ${header.join(' | ')} |`);
          out.push(`| ${sep} |`);
          for (let r = 1; r < cells.length; r++) {
            out.push(`| ${cells[r].join(' | ')} |`);
          }
        } else {
          const header = Array.from({ length: maxCols }, () => '');
          const sep = Array.from({ length: maxCols }, () => '---').join(' | ');
          out.push(`| ${header.join(' | ')} |`);
          out.push(`| ${sep} |`);
          for (let r = 0; r < cells.length; r++) {
            out.push(`| ${cells[r].join(' | ')} |`);
          }
        }

        out.push('');
      } else if (t === 'column_list') {
        const cols = await getChildren(block); // column[]
        const rendered: string[] = [];
        for (const col of cols ?? []) {
          const colChildren = await getChildren(col);
          const body = colChildren?.length
            ? (await renderBlocks(colChildren, depth + 1)).join('\n')
            : '';
          rendered.push(`<div class="mdx-column">\n${body}\n</div>`);
        }
        if (rendered.length) {
          out.push(`<div class="mdx-columns">`);
          out.push(rendered.join('\n'));
          out.push(`</div>`);
        }
      } else if (t === 'synced_block') {
        const children = await getChildren(block);
        if (children?.length) out.push(...(await renderBlocks(children, depth + 1)));
      } else if (t === 'child_page') {
        const title = block.child_page?.title ?? 'Untitled page';
        out.push(`**${esc(title)}**`);
      } else if (t === 'child_database') {
        const title = block.child_database?.title ?? 'Untitled database';
        out.push(`**${esc(title)}**`);
      } else if (t === 'divider') {
        out.push('---');
      } else if (t === 'table_of_contents') {
        out.push('<!-- table of contents placeholder -->');
      } else if (t === 'breadcrumb') {
        // skip
      } else {
        const rich = block[t]?.rich_text;
        if (rich) out.push(richTextToInline(rich));
      }
    }

    return out;
  }

  async function renderList(
    group: any[],
    listType: 'bulleted_list_item' | 'numbered_list_item',
    depth: number,
  ): Promise<string[]> {
    const out: string[] = [];
    const bullet = listType === 'numbered_list_item' ? '1.' : '-';
    for (const item of group) {
      const txt = richTextToInline(item[listType]?.rich_text);
      out.push(`${'  '.repeat(depth)}${bullet} ${txt}`);
      const children = await getChildren(item);
      if (children?.length) out.push(...(await renderBlocks(children, depth + 1)));
    }
    return out;
  }

  async function getChildren(block: any): Promise<any[] | undefined> {
    if (!block?.has_children) return undefined;
    if (Array.isArray(block[block.type]?.children)) return block[block.type].children;
    if (typeof options?.loadChildren === 'function') {
      try {
        return await options.loadChildren(block.id);
      } catch {
        return [];
      }
    }
    return [];
  }
}
