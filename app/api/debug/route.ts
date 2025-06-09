import { NextResponse } from 'next/server';
import { locales } from '@/i18n';

export async function GET() {
  // 尝试加载翻译文件
  const loadedMessages = {};
  
  try {
    for (const locale of locales) {
      try {
        const messages = (await import(`../../../messages/${locale}.json`)).default;
        loadedMessages[locale] = {
          loaded: true,
          keysCount: Object.keys(messages).length,
          blogKeys: messages.blog ? Object.keys(messages.blog) : [],
          homeKeys: messages.Home ? Object.keys(messages.Home) : []
        };
      } catch (error) {
        loadedMessages[locale] = {
          loaded: false,
          error: error.message
        };
      }
    }
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to load messages',
      message: error.message 
    }, { status: 500 });
  }
  
  // 返回系统信息
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    supportedLocales: locales,
    messages: loadedMessages,
    nodeVersion: process.version,
    memoryUsage: process.memoryUsage()
  });
} 