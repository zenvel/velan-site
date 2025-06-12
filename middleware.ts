import createMiddleware from 'next-intl/middleware';
import { defaultLocale, locales } from './i18n';
import { NextRequest, NextResponse } from 'next/server';

// 中间件函数
export default async function middleware(request: NextRequest) {
  try {
    // 输出当前请求路径
    const pathname = request.nextUrl.pathname;
    console.log('Middleware处理路径:', pathname);

// 创建国际化中间件
    const handleI18nRouting = createMiddleware({
      // 支持的语言列表
  locales,
      
      // 如果用户未指定语言，则使用默认语言
      defaultLocale,
      
      // 当访问根路径时自动重定向到默认语言
  localePrefix: 'always'
});

    // 处理博客详情页路径
    if (pathname.includes('/blog/') && !pathname.endsWith('/blog/')) {
      console.log('检测到博客详情页路径:', pathname);
  
      // 分析路径组件
      const segments = pathname.split('/');
      
      // 确保至少有[locale]/blog/[slug]的格式
      if (segments.length >= 4) {
        const locale = segments[1];
        const slug = segments.slice(3).join('/');
        
        console.log('路径解析:', {
          segments,
          locale,
          slug,
          locales: JSON.stringify(locales),
          isValidLocale: locales.includes(locale as any)
        });
        
        // 检查是否有效的locale
        if (locales.includes(locale as any)) {
          // 直接使用原始slug，无需处理
          let cleanSlug = slug;
          
          // 如果清理后的slug与原始slug不同，重定向到清理后的URL
          if (cleanSlug !== slug) {
            console.log(`中间件 - 规范化URL: 从 "${slug}" 到 "${cleanSlug}"`);
            const url = request.nextUrl.clone();
            url.pathname = `/${locale}/blog/${cleanSlug}`;
            return NextResponse.redirect(url);
    }
    
          // 符合格式，交给正常的路由系统处理
          console.log(`有效的博客路径: /${locale}/blog/${slug}`);
          return handleI18nRouting(request);
        } else {
          // 如果第一段不是有效的locale，使用默认locale重定向
          console.log(`无效的locale: ${locale}，重定向到默认语言`);
          const url = request.nextUrl.clone();
          url.pathname = `/${defaultLocale}/blog/${slug}`;
          return NextResponse.redirect(url);
        }
      }
  }
  
    // 其他路径交给国际化中间件处理
    return handleI18nRouting(request);
  } catch (error) {
    console.error('中间件处理出错:', error);
    // 出错时仍然尝试使用国际化中间件
    return createMiddleware({
      locales,
      defaultLocale,
      localePrefix: 'always'
    })(request);
  }
}

// 配置匹配的路径
export const config = {
  // 匹配所有路径，除了以下特殊路径
  matcher: ['/((?!api|_next|.*\\..*).*)']
}; 