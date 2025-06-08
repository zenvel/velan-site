import { getPosts } from '@/lib/notion';
import Link from 'next/link';
import type { NotionPage } from '@/lib/notion-types';
import type { Metadata } from 'next';

// 默认封面图片配置
const DEFAULT_COVER_PATTERNS = [
  { emoji: '📝', title: '文章' },
  { emoji: '💡', title: '笔记' },
  { emoji: '🧠', title: '思考' },
  { emoji: '🚀', title: '项目' }
];

// 静态元数据
export const metadata: Metadata = {
  title: '博客文章 - Velan',
  description: '阅读有关开发、设计和更多内容的最新文章。',
  openGraph: {
    title: '博客文章 - Velan',
    description: '阅读有关开发、设计和更多内容的最新文章。',
    type: 'website',
  },
};

// 格式化日期的辅助函数，确保服务端和客户端渲染一致
function formatDate(dateString: string | undefined) {
  if (!dateString) return '';
  try {
    // 使用固定的时间字符串格式而不是依赖 locale
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}年${month}月${day}日`;
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
        <h1 className="text-3xl font-bold mb-8 text-center">📝 博客文章</h1>
        
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">暂无文章</p>
            <p className="text-sm mt-2 text-gray-400">请稍后再来查看新内容</p>
          </div>
        ) : (
          <ul className="grid gap-8">
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
                  <li key={p.id} className="group transition-all">
                    <Link href={`/zh/blog/${slug}`}>
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
                              {tags.map((tag) => (
                                <span
                                  key={tag.id}
                                  className="rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-3 py-1"
                                >
                                  {tag.name}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* 标题 */}
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>

                          {/* 摘要 */}
                          {summary.length > 0 && (
                            <p className="text-gray-600 dark:text-gray-400 line-clamp-3">
                              {summary.map((text) => text.plain_text).join('')}
                            </p>
                          )}
                        </div>
                      </article>
                    </Link>
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