import { Client } from '@notionhq/client';
import type { NotionPage, NotionBlock, RichText } from './notion-types';

// 创建Notion客户端实例
const notion = new Client({ 
  auth: process.env.NOTION_TOKEN || '',
  notionVersion: '2022-06-28' // 明确指定API版本
});

/**
 * 获取所有已发布的博客文章
 * @returns 博客文章数组
 */
export async function getPosts(): Promise<NotionPage[]> {
  try {
    // 验证环境变量
    if (!process.env.NOTION_TOKEN) {
      console.error('未配置Notion API令牌。请在环境变量中设置NOTION_TOKEN。');
      return [];
    }

    if (!process.env.NOTION_DATABASE_ID) {
      console.error('未配置Notion数据库ID。请在环境变量中设置NOTION_DATABASE_ID。');
      return [];
    }

    // 查询数据库
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID,
      filter: { 
        property: 'Publish', 
        checkbox: { equals: true } 
      },
      sorts: [{ 
        property: 'Date', 
        direction: 'descending' 
      }],
    });

    // 转换结果并添加封面
    const pages = response.results.map((page) => {
      const typedPage = page as unknown as NotionPage;
      
      // 尝试从 Cover 属性中获取封面
      const coverProperty = typedPage.properties?.Cover as any;
      if (coverProperty?.files && coverProperty.files.length > 0) {
        const coverFile = coverProperty.files[0];
        if (coverFile.file?.url) {
          typedPage.cover = {
            type: 'file',
            file: { url: coverFile.file.url, expiry_time: '' }
          };
        } else if (coverFile.external?.url) {
          typedPage.cover = {
            type: 'external',
            external: { url: coverFile.external.url }
          };
        }
      }
      return typedPage;
    });

    return pages;
  } catch (error) {
    console.error('获取Notion文章列表失败:', error);
    return [];
  }
}

/**
 * 通过slug获取特定博客文章
 * @param slug 文章的唯一标识符
 * @returns 博客文章详情，包括块内容
 */
export async function getPost(slug: string): Promise<NotionPage | null> {
  try {
    const pages = await getPosts();
    
    if (pages.length === 0) {
      return null;
    }

    // 查找匹配的文章
    const page = pages.find(
      (p) => p.properties?.Slug?.rich_text?.[0]?.plain_text === slug
    );
    
    if (!page) {
      return null;
    }
    
    // 获取页面的块内容
    const blocks = await getBlocks(page.id);
    
    // 返回增强的页面对象
    return {
      ...page,
      blocks
    };
  } catch (error) {
    console.error(`获取文章详情失败 (slug: ${slug}):`, error);
    return null;
  }
}

/**
 * 递归获取指定块ID的所有子块
 * @param blockId 父块ID
 * @returns 块内容数组，包括嵌套子块
 */
export async function getBlocks(blockId: string): Promise<NotionBlock[]> {
  try {
    const blocks: NotionBlock[] = [];
    let hasMore = true;
    let cursor: string | undefined;
    
    // 分页获取所有块
    while (hasMore) {
      const { results, next_cursor, has_more } = await notion.blocks.children.list({
        start_cursor: cursor,
        block_id: blockId,
        page_size: 100, // 每次获取最大数量
      });
      
      blocks.push(...(results as unknown as NotionBlock[]));
      
      hasMore = Boolean(has_more);
      cursor = next_cursor as string || undefined;
    }
    
    // 获取嵌套块（递归）
    const childBlocks = await Promise.all(
      blocks
        .filter((block) => block.has_children)
        .map(async (block): Promise<NotionBlock> => {
          try {
            const children = await getBlocks(block.id);
            return { ...block, children };
          } catch (error) {
            console.error(`获取子块失败 (ID: ${block.id}):`, error);
            return block;
          }
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
    console.error(`获取块内容失败 (blockId: ${blockId}):`, error);
    return [];
  }
}

// 重新导出类型
export type { NotionPage, NotionBlock, RichText } from './notion-types';