import { Client } from '@notionhq/client';

// Notion 数据类型定义
export interface NotionPage {
  id: string;
  properties: {
    Title?: {
      title: Array<{
        plain_text: string;
      }>;
    };
    Slug?: {
      rich_text: Array<{
        plain_text: string;
      }>;
    };
    Date?: {
      date: {
        start: string;
      };
    };
    Tags?: {
      multi_select: Array<{
        id: string;
        name: string;
        color: string;
      }>;
    };
    Summary?: {
      rich_text: Array<{
        plain_text: string;
      }>;
    };
    Publish?: {
      checkbox: boolean;
    };
    [key: string]: unknown;
  };
  blocks?: NotionBlock[];
}

export interface NotionBlock {
  id: string;
  type: string;
  has_children?: boolean;
  children?: NotionBlock[];
  [blockType: string]: unknown;
}

export interface RichText {
  type: string;
  text?: {
    content: string;
    link?: { url: string } | null;
  };
  annotations?: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
  };
  plain_text?: string;
  href?: string | null;
}

const notion = new Client({ auth: process.env.NOTION_TOKEN || '' });

export async function getPosts(): Promise<NotionPage[]> {
  try {
    if (!process.env.NOTION_TOKEN) {
      console.warn('Notion API令牌未设置');
      return [];
    }

    if (!process.env.NOTION_DATABASE_ID) {
      console.warn('Notion数据库ID未设置');
      return [];
    }

    const res = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID as string,
      filter: { 
        property: 'Publish', 
        checkbox: { equals: true } 
      },
      sorts: [{ 
        property: 'Date', 
        direction: 'descending' 
      }],
    });
    return res.results as NotionPage[];
  } catch (error) {
    console.error('获取Notion文章失败:', error);
    return [];
  }
}

export async function getPost(slug: string): Promise<NotionPage | null> {
  try {
    const pages = await getPosts();
    if (pages.length === 0) {
      return null;
    }

    const page = pages.find(
      (p) => p.properties?.Slug?.rich_text?.[0]?.plain_text === slug
    );
    
    if (!page) return null;
    
    // 获取页面的块内容
    const blocks = await getBlocks(page.id);
    
    return {
      ...page,
      blocks
    };
  } catch (error) {
    console.error('获取Notion文章详情失败:', error);
    return null;
  }
}

export async function getBlocks(blockId: string): Promise<NotionBlock[]> {
  try {
    const blocks: NotionBlock[] = [];
    let cursor: string | undefined;
    
    while (true) {
      const { results, next_cursor } = await notion.blocks.children.list({
        start_cursor: cursor || undefined,
        block_id: blockId,
      });
      
      blocks.push(...(results as NotionBlock[]));
      
      if (!next_cursor) break;
      cursor = next_cursor as string;
    }
    
    // 获取嵌套块
    const childBlocks = await Promise.all(
      blocks
        .filter((block) => block.has_children)
        .map(async (block): Promise<NotionBlock> => {
          const children = await getBlocks(block.id);
          return { ...block, children };
        })
    );
    
    // 用嵌套块替换有子项的块
    const blocksWithChildren = blocks.map((block): NotionBlock => {
      if (block.has_children) {
        const childBlock = childBlocks.find((child) => child.id === block.id);
        return childBlock || block;
      }
      return block;
    });
    
    return blocksWithChildren;
  } catch (error) {
    console.error('获取Notion块内容失败:', error);
    return [];
  }
}