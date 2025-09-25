import { Client } from '@notionhq/client';

const token = process.env.NOTION_TOKEN;
if (!token) {
  throw new Error('[NOTION] Missing NOTION_TOKEN in .env');
}

export const notion = new Client({
  auth: token,
  notionVersion: '2025-09-03',
});

export const resourceIds = {
  leetcodesDb: process.env.NOTION_DATABASE_ID,
};
