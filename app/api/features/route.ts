import { NextRequest, NextResponse } from 'next/server';
import { getFeatures } from '@/lib/features';

export async function GET(request: NextRequest) {
  try {
    // 从查询参数中获取语言
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'zh';
    
    // 获取Features数据
    const features = await getFeatures(lang);
    
    // 返回数据
    return NextResponse.json(features);
  } catch (error) {
    console.error('获取Features失败:', error);
    return NextResponse.json(
      { error: '获取Features失败', message: (error as Error).message },
      { status: 500 }
    );
  }
} 