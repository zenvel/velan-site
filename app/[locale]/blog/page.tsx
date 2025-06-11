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

// 导入翻译文件
import zhMessages from '@/messages/zh.json';
import enMessages from '@/messages/en.json';
import esMessages from '@/messages/es.json';

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
  let messages;
  if (locale === 'zh') {
    messages = zhMessages;
  } else if (locale === 'es') {
    messages = esMessages;
  } else {
    messages = enMessages;
  }
  
  const posts = await getPosts(locale);
  console.log("获取到博客文章数量:", posts.length);
  
  // 默认封面图片配置 - 根据语言选择不同的标题
  let DEFAULT_COVER_PATTERNS;
  if (locale === 'zh') {
    DEFAULT_COVER_PATTERNS = [
      { emoji: '📝', title: '文章' },
      { emoji: '💡', title: '笔记' },
      { emoji: '🧠', title: '思考' },
      { emoji: '🚀', title: '项目' }
    ];
  } else if (locale === 'es') {
    DEFAULT_COVER_PATTERNS = [
      { emoji: '📝', title: 'Artículo' },
      { emoji: '💡', title: 'Nota' },
      { emoji: '🧠', title: 'Pensamiento' },
      { emoji: '🚀', title: 'Proyecto' }
    ];
  } else {
    DEFAULT_COVER_PATTERNS = [
      { emoji: '📝', title: 'Article' },
      { emoji: '💡', title: 'Note' },
      { emoji: '🧠', title: 'Thought' },
      { emoji: '🚀', title: 'Project' }
    ];
  }
  
  // 格式化日期的辅助函数，确保服务端和客户端渲染一致
  function formatDate(dateString: string | undefined) {
    if (!dateString) return '';
    try {
      // 使用固定的时间字符串格式而不是依赖 locale
      const date = new Date(dateString);
      
      // 检查日期是否有效
      if (isNaN(date.getTime())) {
        console.warn('无效的日期格式:', dateString);
        return dateString || '';
      }
      
      if (locale === 'zh') {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}年${month}月${day}日`;
      } else if (locale === 'es') {
        // 西班牙语日期格式
        return date.toLocaleDateString('es-ES', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      } else {
        // 英文日期格式，使用toLocaleDateString确保一致性
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
  
  // 使用直接读取的翻译 - 这样更可靠
  const blogTitle = messages.blog.title;
  const blogSubtitle = messages.blog.subtitle;
  const readMoreText = messages.blog.readMore;
  
  // 根据语言获取空状态文本
  function getEmptyStateText() {
    if (locale === 'zh') {
      return {
        noPost: '暂无文章',
        checkBack: '请稍后再来查看新内容'
      };
    } else if (locale === 'es') {
      return {
        noPost: 'No se encontraron publicaciones',
        checkBack: 'Vuelve más tarde para nuevo contenido'
      };
    } else {
      return {
        noPost: 'No posts found',
        checkBack: 'Check back later for new content'
      };
    }
  }
  
  // 根据语言获取错误文本
  function getErrorText() {
    if (locale === 'zh') {
      return {
        renderError: '渲染文章列表项出错:',
        postError: '文章渲染出错'
      };
    } else if (locale === 'es') {
      return {
        renderError: 'Error al renderizar la publicación del blog:',
        postError: 'Error al renderizar la publicación'
      };
    } else {
      return {
        renderError: 'Error rendering blog post:',
        postError: 'Error rendering post'
      };
    }
  }
  
  const emptyStateText = getEmptyStateText();
  const errorText = getErrorText();
  
  return (
    <div className="bg-white dark:bg-gray-900">
      <section className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center">{blogTitle}</h1>
        <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-400 text-lg text-center mb-12">{blogSubtitle}</p>
        
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">{emptyStateText.noPost}</p>
            <p className="text-sm mt-2 text-gray-400">{emptyStateText.checkBack}</p>
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
                    <Link href={`/${locale}/blog/${slug}`}>
                      <article className="rounded-2xl bg-white dark:bg-gray-800/50 border dark:border-gray-700 shadow-sm hover:shadow-md transition overflow-hidden">
                        {/* 封面图 */}
                        {coverUrl ? (
                          <Image
                            src={coverUrl}
                            alt={title}
                            width={600}
                            height={192}
                            className="w-full h-48 object-cover rounded-t-2xl transition-transform duration-300 group-hover:scale-105"
                            priority={index < 3}
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
                            <div className="flex flex-wrap gap-2">
                              {tags && tags.length > 0 && tags.map((tag, idx) => (
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
                console.error(errorText.renderError, error, post);
                return (
                  <li key={post?.id || index} className="p-4 text-red-500 border border-red-200 rounded">
                    {errorText.postError}
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
} 