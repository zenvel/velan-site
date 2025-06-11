import { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';

// 支持的语言列表
const locales = ['en', 'zh', 'es'];

// 创建国际化中间件
const intlMiddleware = createMiddleware({
  // 必须匹配所有支持的语言代码
  locales,
  // 用于未匹配任何语言时
  defaultLocale: 'zh',
  // 强制总是显示语言前缀
  localePrefix: 'always'
});

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // 记录请求日志
  console.log('Middleware处理路径:', pathname);
  
  // 如果是根路径，手动重定向到默认语言
  if (pathname === '/') {
    const acceptLanguage = request.headers.get('accept-language') || '';
    const preferEnglish = acceptLanguage.toLowerCase().includes('en') && !acceptLanguage.toLowerCase().includes('zh');
    const preferSpanish = acceptLanguage.toLowerCase().includes('es') && !acceptLanguage.toLowerCase().includes('zh') && !acceptLanguage.toLowerCase().includes('en');
    let locale = 'zh';  // 默认优先中文
    
    if (preferEnglish) {
      locale = 'en';
    } else if (preferSpanish) {
      locale = 'es';
    }
    
    console.log('根路径重定向到:', `/${locale}`);
    return Response.redirect(new URL(`/${locale}`, request.url));
  }
  
  // 其他路径使用 next-intl 中间件处理
  return intlMiddleware(request);
}

// 仅在特定路径上运行中间件
export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
}; 