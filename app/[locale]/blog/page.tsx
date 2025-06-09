// 这是一个服务器组件，所以可以保留dynamic和revalidate配置
import Link from 'next/link';
import Image from 'next/image';
import Footer from '@/components/Footer';
import { getPosts } from '@/lib/notion';
import { getTranslations } from 'next-intl/server';
import { unstable_noStore as noStore } from 'next/cache';
import { Metadata } from 'next';
import type { JoinedPost } from '@/lib/notion-types';
import { defaultLocale, locales } from '@/i18n';

// 导入翻译文件
import zhMessages from '@/messages/zh.json';
import enMessages from '@/messages/en.json';

// 强制使用动态渲染，防止静态生成缓存问题
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Blog posts page - displays a grid of blog posts
 * 统一中英文页面，通过locale参数区分
 */
export default async function BlogList({ 
  params 
}: { 
  params: { locale: string } | Promise<{ locale: string }>;
}) {
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
  
  // 直接读取翻译文件，避免getTranslations可能的问题
  const messages = locale === 'zh' ? zhMessages : enMessages;
  
  const posts = await getPosts(locale);
  console.log("获取到博客文章数量:", posts.length);
  
  // 默认封面图片配置 - 根据语言选择不同的标题
  const DEFAULT_COVER_PATTERNS = locale === 'zh' 
    ? [
        { emoji: '📝', title: '文章' },
        { emoji: '💡', title: '笔记' },
        { emoji: '🧠', title: '思考' },
        { emoji: '🚀', title: '项目' }
      ]
    : [
        { emoji: '📝', title: 'Article' },
        { emoji: '💡', title: 'Note' },
        { emoji: '🧠', title: 'Thought' },
        { emoji: '🚀', title: 'Project' }
      ];
  
  // 格式化日期的辅助函数，确保服务端和客户端渲染一致
  function formatDate(dateString: string | undefined) {
    if (!dateString) return '';
    try {
      // 使用固定的时间字符串格式而不是依赖 locale
      const date = new Date(dateString);
      
      if (locale === 'zh') {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}年${month}月${day}日`;
      } else {
        // 英文日期格式
        return dateString;
      }
    } catch (error) {
      console.error('日期格式化错误:', error);
      return dateString;
    }
  }
  
  // 使用直接读取的翻译 - 这样更可靠
  const blogTitle = messages.blog.title;
  const blogSubtitle = messages.blog.subtitle;
  const readMoreText = messages.blog.readMore;
  
  return (
    <div className="bg-white dark:bg-gray-900">
      <section className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center">{blogTitle}</h1>
        <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-400 text-lg text-center mb-12">{blogSubtitle}</p>
        
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">{locale === 'zh' ? '暂无文章' : 'No posts found'}</p>
            <p className="text-sm mt-2 text-gray-400">{locale === 'zh' ? '请稍后再来查看新内容' : 'Check back later for new content'}</p>
          </div>
        ) : (
          <ul className="grid gap-8">
            {posts.map((post: JoinedPost, index: number) => {
              try {
                // 添加安全检查
                const { slug, title, date, tags, summary, coverUrl } = post;
                
                // 为标题选择默认emoji
                const defaultPattern = DEFAULT_COVER_PATTERNS[index % DEFAULT_COVER_PATTERNS.length];
                
                if (!slug || !title) return null;
                
                // 格式化日期
                const formattedDate = formatDate(date);
                
                return (
                  <li key={post.id} className="group transition-all">
                    <Link href={`/${locale}/blog/${slug}`}>
                      <article className="rounded-2xl bg-white dark:bg-gray-800/50 border dark:border-gray-700 shadow-sm hover:shadow-md transition overflow-hidden">
                        {/* 封面图 */}
                        {coverUrl ? (
                          <img
                            src={coverUrl}
                            alt={title}
                            className="w-full h-48 object-cover rounded-t-2xl transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-48 flex items-center justify-center bg-gradient-to-r from-indigo-500 to-blue-400 text-white text-3xl">
                            {defaultPattern.emoji}
                          </div>
                        )}

                        <div className="p-6 space-y-3">
                          {/* 时间 + 标签 */}
                          <div className="flex flex-wrap justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                            <time suppressHydrationWarning>{formattedDate}</time>
                            <div className="flex gap-2">
                              {tags && tags.length > 0 && tags.slice(0, 2).map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-3 py-1"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* 标题 */}
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>

                          {/* 摘要 */}
                          {summary && (
                            <p className="text-gray-600 dark:text-gray-400 line-clamp-3">
                              {summary}
                            </p>
                          )}
                          
                          {/* 阅读更多 */}
                          <div className="pt-2">
                            <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                              {readMoreText} →
                            </span>
                          </div>
                        </div>
                      </article>
                    </Link>
                  </li>
                );
              } catch (error) {
                console.error(locale === 'zh' ? '渲染文章列表项出错:' : 'Error rendering blog post:', error);
                return null;
              }
            })}
          </ul>
        )}
      </section>
      
      <Footer />
    </div>
  );
} 