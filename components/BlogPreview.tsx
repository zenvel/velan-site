import { getPosts } from '@/lib/notion';
import Link from 'next/link';
import { format } from 'date-fns';
import Image from 'next/image';

// 默认封面图片配置
const DEFAULT_COVER_GRADIENT = 'linear-gradient(135deg, #4f46e5 0%, #60a5fa 100%)';
const DEFAULT_COVER_PATTERNS = [
  { emoji: '📝', title: '文章' },
  { emoji: '💡', title: '笔记' },
  { emoji: '🧠', title: '思考' },
  { emoji: '🚀', title: '项目' }
];

export default async function BlogPreview() {
  const posts = await getPosts();
  const latestPosts = posts.slice(0, 3); // 仅取最新三篇

  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-3xl font-bold">Latest Posts</h2>
        <Link href="/en/blog" className="text-blue-600 hover:underline dark:text-blue-400">
          View all →
        </Link>
      </div>
      <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {latestPosts.map((post: any, index: number) => {
          const slug = post.properties?.Slug?.rich_text?.[0]?.plain_text;
          const title = post.properties?.Title?.title?.[0]?.plain_text;
          const summary = post.properties?.Summary?.rich_text?.map((t: any) => t.plain_text).join('');
          const date = post.properties?.Date?.date?.start;
          const coverUrl = post.cover?.file?.url || post.cover?.external?.url;
          
          // 为标题选择默认emoji
          const defaultPattern = DEFAULT_COVER_PATTERNS[index % DEFAULT_COVER_PATTERNS.length];

          if (!slug || !title) return null;

          return (
            <Link 
              key={post.id}
              href={`/en/blog/${slug}`}
              className="block group"
            >
              <article
                className="rounded-xl border border-gray-200 overflow-hidden transition hover:shadow-lg dark:border-gray-700 cursor-pointer h-full"
              >
                {/* 显示封面图片或默认占位图 */}
                <div className="mb-3 overflow-hidden rounded-t-xl h-40 w-full">
                  {coverUrl ? (
                    <img 
                      src={coverUrl} 
                      alt={title}
                      className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div 
                      className="h-40 w-full flex items-center justify-center"
                      style={{ background: DEFAULT_COVER_GRADIENT }}
                    >
                      <div className="text-center text-white">
                        <div className="text-4xl mb-2">{defaultPattern.emoji}</div>
                        <div className="text-sm font-medium">{title}</div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  {date && (
                    <time className="text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(date), 'MMMM d, yyyy')}
                    </time>
                  )}
                  <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                    {title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-gray-600 dark:text-gray-400">
                    {summary}
                  </p>
                </div>
              </article>
            </Link>
          );
        })}
      </div>
    </section>
  );
}