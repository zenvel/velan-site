import { getPosts } from '@/lib/notion';
import Link from 'next/link';
import type { NotionPage } from '@/lib/notion-types';
import type { Metadata } from 'next';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// 默认封面图片配置
const DEFAULT_COVER_GRADIENT = 'linear-gradient(135deg, #4f46e5 0%, #60a5fa 100%)';
const DEFAULT_COVER_PATTERNS = [
  { emoji: '📝', title: '文章' },
  { emoji: '💡', title: '笔记' },
  { emoji: '🧠', title: '思考' },
  { emoji: '🚀', title: '项目' }
];

// 静态元数据
export const metadata: Metadata = {
  title: 'Blog Posts - Velan',
  description: 'Read the latest articles about development, design, and more.',
  openGraph: {
    title: 'Blog Posts - Velan',
    description: 'Read the latest articles about development, design, and more.',
    type: 'website',
  },
};

// 格式化日期的辅助函数，确保服务端和客户端渲染一致
function formatDate(dateString: string | undefined) {
  if (!dateString) return '';
  try {
    return format(new Date(dateString), 'yyyy年MM月dd日', { locale: zhCN });
  } catch (error) {
    console.error('日期格式化错误:', error);
    return dateString;
  }
}

export default async function BlogList() {
  const posts: NotionPage[] = await getPosts();
  
  return (
    <div className="bg-white dark:bg-gray-900">
      <section className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">📝 Blog Posts</h1>
        
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No posts found</p>
            <p className="text-sm mt-2 text-gray-400">Check back later for new content</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {posts.map((p: NotionPage, index: number) => {
              try {
                // 添加安全检查
                const slug = p.properties?.Slug?.rich_text?.[0]?.plain_text;
                const title = p.properties?.Title?.title?.[0]?.plain_text;
                const date = p.properties?.Date?.date?.start;
                const tags = p.properties?.Tags?.multi_select || [];
                const summary = p.properties?.Summary?.rich_text || [];
                const coverUrl = p.cover?.file?.url || p.cover?.external?.url;
                
                // 为标题选择默认emoji
                const defaultPattern = DEFAULT_COVER_PATTERNS[index % DEFAULT_COVER_PATTERNS.length];
                
                if (!slug || !title) return null;
                
                // 格式化日期
                const formattedDate = formatDate(date);
                
                return (
                  <li key={p.id} className="py-8 first:pt-0 last:pb-0 group">
                    <article className="sm:flex gap-6">
                      {/* 封面图片区域 */}
                      <div className="sm:w-1/3 mb-4 sm:mb-0">
                        <Link href={`/en/blog/${slug}`} className="block rounded-lg overflow-hidden">
                          {coverUrl ? (
                            <img 
                              src={coverUrl} 
                              alt={title}
                              className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div 
                              className="w-full h-40 flex items-center justify-center"
                              style={{ background: DEFAULT_COVER_GRADIENT }}
                            >
                              <div className="text-center text-white">
                                <div className="text-4xl mb-2">{defaultPattern.emoji}</div>
                                <div className="text-sm font-medium">{title}</div>
                              </div>
                            </div>
                          )}
                        </Link>
                      </div>
                      
                      {/* 文章内容区域 */}
                      <div className="sm:w-2/3">
                        <div className="space-y-2 mb-3">
                          <Link 
                            href={`/en/blog/${slug}`} 
                            className="block text-2xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition"
                          >
                            {title}
                          </Link>
                          
                          <div className="flex flex-wrap gap-3 items-center">
                            {date && (
                              <time className="text-sm text-gray-500 dark:text-gray-400" dateTime={date}>
                                {formattedDate}
                              </time>
                            )}
                            
                            {tags.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {tags.map((tag) => (
                                  <span 
                                    key={tag.id} 
                                    className="px-3 py-1 text-sm rounded-full"
                                    style={{ 
                                      backgroundColor: tag.color === 'green' ? '#E6F6EC' : 
                                                      tag.color === 'brown' ? '#F9E8D9' : '#F0F0F0',
                                      color: tag.color === 'green' ? '#0E6245' : 
                                            tag.color === 'brown' ? '#8D4A00' : '#333333'
                                    }}
                                  >
                                    {tag.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {summary.length > 0 && (
                          <p className="text-gray-600 dark:text-gray-300 line-clamp-3">
                            {summary.map((text) => text.plain_text).join('')}
                          </p>
                        )}
                        
                        <div className="mt-4">
                          <Link 
                            href={`/en/blog/${slug}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline font-medium inline-flex items-center gap-1"
                          >
                            阅读全文
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </article>
                  </li>
                );
              } catch (error) {
                console.error('渲染文章列表项出错:', error);
                return null;
              }
            })}
          </ul>
        )}
      </section>
    </div>
  );
}