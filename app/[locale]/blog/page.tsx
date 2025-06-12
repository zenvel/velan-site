// 这是一个服务器组件
import Link from 'next/link';
import Image from 'next/image';
import Footer from '@/components/Footer';
import { getPosts } from '@/lib/notion';
import { getTranslations } from 'next-intl/server';
import { unstable_noStore as noStore } from 'next/cache';
import { Metadata } from 'next';
import type { JoinedPost } from '@/lib/notion-types';
import { defaultLocale, locales } from '@/i18n';

/**
 * Blog posts page - displays a grid of blog posts
 * 统一中英文页面，通过locale参数区分
 */
export default async function BlogList({ 
  params 
}: { 
  params: { locale: string } | Promise<{ locale: string }>;
}) {
  try {
  // 强制禁用缓存
  noStore();
  
  // 正确地等待参数解析
  const resolvedParams = await Promise.resolve(params);
  
  // 确保locale有效，避免默认回退
  let locale = resolvedParams.locale;
  if (!locale || !locales.includes(locale as any)) {
    console.warn(`无效的语言代码: ${locale}，使用默认语言: ${defaultLocale}`);
    locale = defaultLocale;
  }
  
  console.log("开始获取博客文章，语言:", locale);
  
    // 获取翻译
    const t = await getTranslations({
      locale,
      namespace: 'Blog'
    });
  
  const posts = await getPosts(locale);
  console.log("获取到博客文章数量:", posts.length);
  
  // 默认封面图片配置 - 根据语言选择不同的标题
  let DEFAULT_COVER_PATTERNS;
  if (locale === 'zh') {
    DEFAULT_COVER_PATTERNS = [
        { emoji: "📊", title: "数据分析" },
        { emoji: "⚙️", title: "系统思维" },
        { emoji: "📈", title: "生产力" },
        { emoji: "📝", title: "思考" },
        { emoji: "💡", title: "创意" }
    ];
  } else if (locale === 'es') {
    DEFAULT_COVER_PATTERNS = [
        { emoji: "📊", title: "Análisis" },
        { emoji: "⚙️", title: "Sistemas" },
        { emoji: "📈", title: "Productividad" },
        { emoji: "📝", title: "Pensamientos" },
        { emoji: "💡", title: "Ideas" }
    ];
  } else {
    DEFAULT_COVER_PATTERNS = [
        { emoji: "📊", title: "Analytics" },
        { emoji: "⚙️", title: "Systems" },
        { emoji: "📈", title: "Productivity" },
        { emoji: "📝", title: "Thoughts" },
        { emoji: "💡", title: "Ideas" }
      ];
    }
    
    // 获取页面标题
    const blogTitle = t('pageTitle');
    const blogSubtitle = await getTranslations({
      locale,
      namespace: 'blog'
    }).then(t => t('subtitle'));
    
    // 获取空状态文本
    const emptyTitle = t('empty.title');
    const emptyDescription = t('empty.description');
    
    // 格式化日期的辅助函数
  function formatDate(dateString: string | undefined) {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      
      // 检查日期是否有效
      if (isNaN(date.getTime())) {
        console.warn('无效的日期格式:', dateString);
        return dateString || '';
      }
      
        // 根据语言格式化日期
      if (locale === 'zh') {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}年${month}月${day}日`;
      } else if (locale === 'es') {
        return date.toLocaleDateString('es-ES', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      } else {
        return date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
    } catch (error) {
      console.error('日期格式化错误:', error);
      return dateString || '';
    }
  }
  
    // 文章卡片组件
    const BlogCard = ({ 
      post, 
      locale 
    }: { 
      post: JoinedPost; 
      locale: string 
    }) => {
      // 如果没有slug，跳过渲染
      if (!post.slug || post.slug.trim() === '') {
        console.warn(`博客列表 - 文章缺少slug，跳过: "${post.title}"`);
        return null;
      }
      
      const cleanSlug = post.slug;
      const href = `/${locale}/blog/${cleanSlug}`;
      
      return (
        <Link href={href} className="block group">
          <div className="overflow-hidden rounded-2xl shadow-md transition-all duration-300 hover:shadow-xl dark:bg-gray-800">
            {/* 封面图 */}
            {post.coverUrl ? (
              <div className="relative aspect-video w-full overflow-hidden">
                <Image
                  src={post.coverUrl}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            ) : (
              <div className="aspect-video w-full bg-gradient-to-br from-blue-100 to-indigo-50 dark:from-blue-900 dark:to-indigo-900" />
            )}
            
            {/* 文章信息 */}
            <div className="p-6">
              <h3 className="mb-2 text-xl font-semibold transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {post.title}
              </h3>
              
              {post.summary && (
                <p className="mb-4 line-clamp-2 text-gray-600 dark:text-gray-300">
                  {post.summary}
                </p>
              )}
              
              <div className="mt-4 flex flex-wrap items-center justify-between">
                {/* 日期 */}
                <time className="text-sm text-gray-500 dark:text-gray-400" suppressHydrationWarning>
                  {new Date(post.date).toLocaleDateString(locale, { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </time>
                
                {/* 标签 */}
                {post.tags && post.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2 sm:mt-0">
                    {post.tags.slice(0, 2).map((tag, index) => (
                      <span 
                        key={index} 
                        className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                      >
                        {tag}
                      </span>
                    ))}
                    {post.tags.length > 2 && (
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        +{post.tags.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Link>
      );
    };
  
  return (
    <div className="bg-white dark:bg-gray-900">
      <section className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center">{blogTitle}</h1>
        <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-400 text-lg text-center mb-12">{blogSubtitle}</p>
        
        {posts.length === 0 ? (
          <div className="text-center py-12">
              <p className="text-gray-500">{emptyTitle}</p>
              <p className="text-sm mt-2 text-gray-400">{emptyDescription}</p>
          </div>
        ) : (
          <ul className="grid gap-8">
            {posts.map((post: JoinedPost, index: number) => {
              try {
                // 添加安全检查
                if (!post || typeof post !== 'object') {
                  console.warn('无效的文章数据:', post);
                  return null;
                }
                
                const { slug, title, date, tags, summary, coverUrl, id } = post;
                
                // 为标题选择默认emoji
                const defaultPattern = DEFAULT_COVER_PATTERNS[index % DEFAULT_COVER_PATTERNS.length];
                
                if (!slug || !title) {
                  console.warn('缺少必要的文章数据:', { slug, title, id });
                  return null;
                }
                
                // 格式化日期
                const formattedDate = formatDate(date);
                
                return (
                  <li key={post.id} className="group transition-all">
                      <BlogCard post={post} locale={locale} />
                  </li>
                );
              } catch (error) {
                  console.error('渲染文章列表项出错:', error, post);
                return (
                  <li key={post?.id || index} className="p-4 text-red-500 border border-red-200 rounded">
                      {t('notFound.title')}
                  </li>
                );
              }
            })}
          </ul>
        )}
      </section>
      
      <Footer />
    </div>
  );
  } catch (error) {
    console.error('博客列表页面渲染错误:', error);
    
    // 在错误情况下，重新获取locale和翻译
    const resolvedParams = await Promise.resolve(params);
    const locale = resolvedParams.locale || defaultLocale;
    const t = await getTranslations({ locale, namespace: 'Blog' });
    
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">加载出错</h1>
        <p className="mb-8">抱歉，加载博客列表时出现了问题。请稍后再试。</p>
        <Link href={`/${locale}`} className="text-blue-600 dark:text-blue-400 hover:underline">
          {t('backToHome')}
        </Link>
      </div>
    );
  }
} 