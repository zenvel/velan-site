import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_TOKEN || '' });

export async function getPosts() {
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
    return res.results;
  } catch (error) {
    console.error('获取Notion文章失败:', error);
    return [];
  }
}

export async function getPost(slug: string) {
  try {
    const pages = await getPosts();
    if (pages.length === 0) {
      return null;
    }

    const page = pages.find(
      (p: any) => p.properties?.Slug?.rich_text?.[0]?.plain_text === slug
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

export async function getBlocks(blockId: string): Promise<any[]> {
  try {
    const blocks: any[] = [];
    let cursor: string | undefined;
    
    while (true) {
      const { results, next_cursor }: any = await notion.blocks.children.list({
        start_cursor: cursor || undefined,
        block_id: blockId,
      });
      
      blocks.push(...results);
      
      if (!next_cursor) break;
      cursor = next_cursor;
    }
    
    // 获取嵌套块
    const childBlocks: any[] = await Promise.all(
      blocks
        .filter((block: any) => block.has_children)
        .map(async (block: any): Promise<any> => {
          const children: any[] = await getBlocks(block.id);
          return { ...block, children };
        })
    );
    
    // 用嵌套块替换有子项的块
    const blocksWithChildren: any[] = blocks.map((block: any): any => {
      if (block.has_children) {
        const childBlock: any = childBlocks.find((child: any) => child.id === block.id);
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