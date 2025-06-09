import { getPost } from '@/lib/notion';
import NotionRenderer from '@/components/notion/NotionRenderer';
import type { JoinedPost } from '@/lib/notion-types';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import BlogLocaleSwitcher from '@/components/BlogLocaleSwitcher';

export const dynamicParams = true;

// 更新类型定义以支持异步参数
type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

// 默认封面图片配置
const DEFAULT_COVER_GRADIENT = 'linear-gradient(135deg, #4f46e5 0%, #60a5fa 100%)';
const DEFAULT_EMOJI = '📝';

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

// 页面组件
export default async function Page(props: PageProps) {
  // 等待参数解析
  const resolvedParams = await props.params;
  const slug = resolvedParams.slug;
  const post = await getPost(slug, 'en');
  
  // 如果找不到页面，返回404
  if (!post) {
    return notFound();
  }

  return (
    <article className="max-w-3xl mx-auto rounded-2xl bg-white dark:bg-gray-900 px-6 py-10 shadow-sm">
      <BlogLocaleSwitcher />
      <header>
        {/* 封面区域 */}
        <div className="mb-8 overflow-hidden rounded-xl">
          {post.coverUrl ? (
            <img src={post.coverUrl} alt={post.title} className="w-full h-[300px] object-cover" />
          ) : (
            <div className="w-full h-[300px] flex items-center justify-center bg-gradient-to-r from-indigo-500 to-blue-400 text-white">
              <div className="text-center">
                <div className="text-6xl mb-2">{DEFAULT_EMOJI}</div>
                <div className="text-xl font-semibold">{post.title}</div>
              </div>
            </div>
          )}
        </div>

        {/* 标题 */}
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight mb-6 text-center">{post.title}</h1>

        {/* 时间和标签 */}
        <div className="flex flex-wrap justify-center gap-3 mb-6 text-sm text-gray-500">
          {post.date && <time dateTime={post.date}>{post.date}</time>}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag: string, index: number) => (
                <span key={index} className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-xs">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 引言 */}
        {post.summary && (
          <div className="text-lg text-gray-600 dark:text-gray-400 italic text-center border-l-4 border-gray-200 dark:border-gray-700 pl-4 bg-gradient-to-r from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-4 rounded mb-8">
            {post.summary}
          </div>
        )}
      </header>

      {/* 正文 */}
      <div className="markdown-content prose prose-lg dark:prose-invert">
        {post.blocks && post.blocks.length > 0 ? (
          <NotionRenderer blocks={post.blocks} />
        ) : (
          /* 这里是Notion内容为空的情况，我们可以显示Summary内容，或者什么都不显示 */
          <div>{post.summary || ''}</div>
        )}
      </div>
    </article>
  );
}

// 生成动态元数据
export async function generateMetadata(props: PageProps): Promise<Metadata> {
  // 等待参数解析
  const resolvedParams = await props.params;
  const slug = resolvedParams.slug;
  console.log(`生成英文文章元数据，slug: ${slug}`);
  const post = await getPost(slug, 'en');
  
  if (!post) {
    return {
      title: 'Article Not Found',
      description: 'Please check the URL or return to the blog homepage'
    };
  }
  
  return {
    title: post.title || 'Untitled',
    description: post.summary || '',
    openGraph: {
      title: post.title || 'Untitled',
      description: post.summary || '',
      type: 'article',
      publishedTime: post.date,
      authors: ['Velan'],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title || 'Untitled',
      description: post.summary || '',
    }
  };
}