import { getPosts } from '@/lib/notion';
import Link from 'next/link';
import { format } from 'date-fns';

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
        {latestPosts.map((post: any) => {
          const slug = post.properties?.Slug?.rich_text?.[0]?.plain_text;
          const title = post.properties?.Title?.title?.[0]?.plain_text;
          const summary = post.properties?.Summary?.rich_text?.map((t: any) => t.plain_text).join('');
          const date = post.properties?.Date?.date?.start;

          if (!slug || !title) return null;

          return (
            <article
              key={post.id}
              className="rounded-xl border border-gray-200 p-5 transition hover:shadow-lg dark:border-gray-700"
            >
              {date && (
                <time className="text-sm text-gray-500 dark:text-gray-400">
                  {format(new Date(date), 'MMMM d, yyyy')}
                </time>
              )}
              <h3 className="mt-2 text-lg font-semibold">
                <Link href={`/en/blog/${slug}`}>{title}</Link>
              </h3>
              <p className="mt-2 line-clamp-3 text-gray-600 dark:text-gray-400">
                {summary}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}