import { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';

// 支持的语言列表
const locales = ['en', 'zh'];

// 创建国际化中间件
const middleware = createMiddleware({
  // 必须匹配所有支持的语言代码
  locales,
  // 用于未匹配任何语言时
  defaultLocale: 'en',
  // 强制总是显示语言前缀
  localePrefix: 'always'
});

export default function(request: NextRequest) {
  // 获取当前路径
  const pathname = request.nextUrl.pathname;
  
  // 调用next-intl的中间件处理路由和重定向
  const response = middleware(request);
  
  // 为元数据处理添加当前路径到headers
  response.headers.set('x-pathname', pathname);
  
  return response;
}

// 仅在特定路径上运行中间件
export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
}; 