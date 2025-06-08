import { NextRequest, NextResponse } from 'next/server';

// 支持的语言列表
const LOCALES = ['en', 'zh'];
const DEFAULT_LOCALE = 'en';

export function middleware(request: NextRequest) {
  // 获取请求路径
  const { pathname } = request.nextUrl;
  
  // 如果路径已经包含语言前缀，直接通过
  if (LOCALES.some(locale => pathname.startsWith(`/${locale}`))) {
    return NextResponse.next();
  }

  // 从Accept-Language头获取浏览器首选语言
  const acceptLanguage = request.headers.get('Accept-Language') || '';
  
  // 检测是否为中文，如果是则重定向到/zh，否则重定向到/en
  const preferredLocale = acceptLanguage.startsWith('zh') ? 'zh' : DEFAULT_LOCALE;
  
  // 构建重定向URL，保留原始路径部分
  const redirectUrl = new URL(`/${preferredLocale}${pathname}`, request.url);
  
  // 返回重定向响应
  return NextResponse.redirect(redirectUrl);
}

// 匹配除静态文件和API路由外的所有路径
export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\.).*)']
}; 