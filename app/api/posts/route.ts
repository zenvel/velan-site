import { getPosts } from '@/lib/notion';
import { NextResponse } from 'next/server';

// API 路由处理函数：获取所有已发布文章
export async function GET() {
  try {
    // 从Notion获取文章
    const posts = await getPosts();
    
    // 返回JSON格式的文章数据
    return NextResponse.json(posts, { status: 200 });
  } catch (error) {
    console.error('API获取文章错误:', error);
    return NextResponse.json(
      { error: '获取文章失败' },
      { status: 500 }
    );
  }
} 