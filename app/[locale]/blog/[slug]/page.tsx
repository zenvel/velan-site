import { getPost } from '@/lib/notion';
import NotionRenderer from '@/components/notion/NotionRenderer';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BlogLocaleSwitcher from '@/components/BlogLocaleSwitcher';
import { getTranslations } from 'next-intl/server';

export const dynamicParams = true;

// 类型定义
interface PageProps {
  params: {
    slug: string;
    locale: string;
  };
}

// 默认封面图片配置
const DEFAULT_EMOJI = '📝';

// 格式化日期的辅助函数，确保服务端和客户端渲染一致
function formatDate(dateString: string | undefined, locale: string) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    
    if (locale === 'zh') {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}年${month}月${day}日`;
    } else {
      // 英文日期格式
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  } catch (error) {
    console.error('日期格式化错误:', error);
    return dateString;
  }
}

// 生成动态元数据
export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { slug, locale } = props.params;
  const t = await getTranslations({ locale, namespace: 'Blog' });
  const page = await getPost(slug);
  
  if (!page) {
    return {
      title: t('notFound.title'),
      description: t('notFound.description')
    };
  }
  
  const title = page.properties.Title?.title?.[0]?.plain_text || 'Untitled';
  const summary = page.properties.Summary?.rich_text?.map(text => text.plain_text).join('') || '';
  
  return {
    title,
    description: summary,
    openGraph: {
      title,
      description: summary,
      type: 'article',
      publishedTime: page.properties.Date?.date?.start,
      authors: ['Velan'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: summary,
    }
  };
}

// 页面组件
export default async function Page(props: PageProps) {
  const { slug, locale } = props.params;
  const t = await getTranslations({ locale, namespace: 'Blog' });
  const page = await getPost(slug);
  
  // 如果找不到页面，返回404
  if (!page) {
    return notFound();
  }

  // 获取Summary内容，用于显示在文章开头
  const summaryText = page.properties.Summary?.rich_text?.map((text) => text.plain_text).join('') || '';
  // 获取封面图片URL
  const coverUrl = page.cover?.file?.url || page.cover?.external?.url;
  // 获取标题
  const title = page.properties.Title?.title?.[0]?.plain_text || 'Untitled';
  // 格式化日期
  const date = page.properties.Date?.date?.start;
  const formattedDate = formatDate(date, locale);

  return (
    <article className="max-w-3xl mx-auto rounded-2xl bg-white dark:bg-gray-900 px-6 py-10 shadow-sm">
      <BlogLocaleSwitcher />
      <header>
        {/* 封面区域 */}
        <div className="mb-8 overflow-hidden rounded-xl">
          {coverUrl ? (
            <img src={coverUrl} alt={title} className="w-full h-[300px] object-cover" />
          ) : (
            <div className="w-full h-[300px] flex items-center justify-center bg-gradient-to-r from-indigo-500 to-blue-400 text-white">
              <div className="text-center">
                <div className="text-6xl mb-2">{DEFAULT_EMOJI}</div>
                <div className="text-xl font-semibold">{title}</div>
              </div>
            </div>
          )}
        </div>

        {/* 标题 */}
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight mb-6 text-center">{title}</h1>

        {/* 时间和标签 */}
        <div className="flex flex-wrap justify-center gap-3 mb-6 text-sm text-gray-500">
          {date && <time dateTime={date}>{formattedDate}</time>}
          {page.properties.Tags?.multi_select?.map(tag => (
            <span key={tag.id} className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-xs">
              {tag.name}
            </span>
          ))}
        </div>

        {/* 引言 */}
        {summaryText && (
          <div className="text-lg text-gray-600 dark:text-gray-400 italic text-center border-l-4 border-gray-200 dark:border-gray-700 pl-4 bg-gradient-to-r from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-4 rounded mb-8">
            <span className="font-semibold">{t('post.summaryNote')}:</span> {summaryText}
          </div>
        )}
      </header>

      {/* 正文 */}
      <div className="markdown-content prose prose-lg dark:prose-invert">
        {page.blocks && page.blocks.length > 0 ? (
          <NotionRenderer blocks={page.blocks} />
        ) : (
          <div className="text-center py-10 text-gray-500">
            {t('post.emptyContent')}
          </div>
        )}
      </div>
      
      <div className="mt-10 text-center">
        <a href={`/${locale}/blog`} className="text-blue-600 hover:underline dark:text-blue-400">
          {t('backToBlog')}
        </a>
      </div>
    </article>
  );
} 