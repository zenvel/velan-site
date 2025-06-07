import { getPosts } from '@/lib/notion';
import Link from 'next/link';
import type { NotionPage } from '@/lib/notion-types';
import type { Metadata } from 'next';

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
            {posts.map((p: NotionPage) => {
              try {
                // 添加安全检查
                const slug = p.properties?.Slug?.rich_text?.[0]?.plain_text;
                const title = p.properties?.Title?.title?.[0]?.plain_text;
                const date = p.properties?.Date?.date?.start;
                const tags = p.properties?.Tags?.multi_select || [];
                const summary = p.properties?.Summary?.rich_text || [];
                
                if (!slug || !title) return null;
                
                return (
                  <li key={p.id} className="py-8 first:pt-0 last:pb-0 group">
                    <article>
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
                              {new Date(date).toLocaleDateString('zh-CN', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
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