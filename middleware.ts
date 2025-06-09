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
  
  // 如果访问根路径，检查Accept-Language头部，决定重定向到哪个语言
  if (pathname === '/' || pathname === '') {
    // 获取Accept-Language头部
    const acceptLang = request.headers.get('Accept-Language') || '';
    // 简单检测是否包含中文偏好
    const preferChinese = acceptLang.includes('zh');
    
    // 根据语言偏好重定向
    const locale = preferChinese ? 'zh' : 'en';
    
    // 创建重定向URL
    const url = new URL(`/${locale}`, request.url);
    
    // 返回重定向响应
    return Response.redirect(url);
  }
  
  // 调用next-intl的中间件处理路由和重定向
  const response = middleware(request);
  
  // 为元数据处理添加当前路径到headers
  response.headers.set('x-pathname', pathname);
  
  // 添加no-cache头部，防止浏览器缓存问题
  response.headers.set('Cache-Control', 'no-store, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  return response;
}

// 仅在特定路径上运行中间件
export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
}; 