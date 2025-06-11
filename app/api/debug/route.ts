import { getPosts } from '@/lib/notion';
import { NextResponse } from 'next/server';

// 调试API路由：测试Notion连接和数据获取
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const lang = url.searchParams.get('lang') || 'zh';
    
    console.log(`🔍 调试API - 语言: ${lang}`);
    
    // 检查环境变量
    const hasNotionToken = !!process.env.NOTION_TOKEN;
    const hasArticlesDb = !!process.env.NOTION_ARTICLES_DB_ID;
    const hasLocalesDb = !!process.env.NOTION_LOCALES_DB_ID;
    
    console.log('环境变量检查:', {
      hasNotionToken,
      hasArticlesDb,
      hasLocalesDb,
      articlesDbId: process.env.NOTION_ARTICLES_DB_ID?.substring(0, 8) + '...',
      localesDbId: process.env.NOTION_LOCALES_DB_ID?.substring(0, 8) + '...'
    });
    
    // 尝试获取文章数据
    const posts = await getPosts(lang);
    
    return NextResponse.json({
      success: true,
      config: {
        hasNotionToken,
        hasArticlesDb,
        hasLocalesDb
      },
      posts: posts.length,
      data: posts
    });
  } catch (error) {
    console.error('调试API错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      config: {
        hasNotionToken: !!process.env.NOTION_TOKEN,
        hasArticlesDb: !!process.env.NOTION_ARTICLES_DB_ID,
        hasLocalesDb: !!process.env.NOTION_LOCALES_DB_ID
      }
    }, { status: 500 });
  }
} 