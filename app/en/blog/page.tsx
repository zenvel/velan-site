import { getPosts } from '@/lib/notion';
import Link from 'next/link';
import type { JoinedPost } from '@/lib/notion-types';
import type { Metadata } from 'next';

// 默认封面图片配置
const DEFAULT_COVER_PATTERNS = [
  { emoji: '📝', title: 'Article' },
  { emoji: '💡', title: 'Note' },
  { emoji: '🧠', title: 'Thought' },
  { emoji: '🚀', title: 'Project' }
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

export default async function BlogList() {
  console.log("Getting English blog posts");
  const posts = await getPosts('en');
  console.log(`Found ${posts.length} English blog posts`);
  
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
          <ul className="grid gap-8">
            {posts.map((post: JoinedPost, index: number) => {
              try {
                // 使用JoinedPost类型的属性
                const { slug, title, date, tags, summary, coverUrl } = post;
                
                // 为标题选择默认emoji
                const defaultPattern = DEFAULT_COVER_PATTERNS[index % DEFAULT_COVER_PATTERNS.length];
                
                if (!slug || !title) return null;
                
                return (
                  <li key={post.id} className="group transition-all">
                    <Link href={`/en/blog/${slug}`}>
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
                            <time>{date}</time>
                            <div className="flex gap-2">
                              {tags && tags.length > 0 && tags.map((tag: string, i: number) => (
                                <span
                                  key={i}
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
                        </div>
                      </article>
                    </Link>
                  </li>
                );
              } catch (error) {
                console.error('Error rendering blog post:', error);
                return null;
              }
            })}
          </ul>
        )}
      </section>
    </div>
  );
}