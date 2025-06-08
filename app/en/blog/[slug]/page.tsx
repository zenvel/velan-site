import { getPost } from '@/lib/notion';
import NotionRenderer from '@/components/notion/NotionRenderer';
import type { NotionPage } from '@/lib/notion-types';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const dynamicParams = true;

// 直接使用字符串类型，避免解构
type PageProps = {
  params: {
    slug: string;
  };
};

// 默认封面图片配置
const DEFAULT_COVER_GRADIENT = 'linear-gradient(135deg, #4f46e5 0%, #60a5fa 100%)';
const DEFAULT_EMOJI = '📝';

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

// 生成动态元数据
export async function generateMetadata(props: PageProps): Promise<Metadata> {
  // 使用await Promise.all来处理所有异步操作
  const [params] = await Promise.all([props.params]);
  const slug = params.slug;
  const page = await getPost(slug);
  
  if (!page) {
    return {
      title: '文章不存在',
      description: '请检查URL或返回博客首页'
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

// 使用官方推荐的方式处理动态路由参数
export default async function Page(props: PageProps) {
  // 使用await Promise.all来处理所有异步操作
  const [params] = await Promise.all([props.params]);
  const slug = params.slug;
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
  const formattedDate = formatDate(date);

  return (
    <article className="prose prose-lg max-w-3xl mx-auto py-10 px-4">
      <header className="mb-8">
        {/* 显示封面图片或默认占位图 */}
        <div className="mb-6 -mx-4 sm:-mx-6 md:-mx-8 overflow-hidden rounded-lg">
          {coverUrl ? (
            <img 
              src={coverUrl} 
              alt={title} 
              className="w-full h-[40vh] object-cover"
            />
          ) : (
            <div 
              className="w-full h-[40vh] flex items-center justify-center"
              style={{ background: DEFAULT_COVER_GRADIENT }}
            >
              <div className="text-center text-white">
                <div className="text-7xl mb-4">{DEFAULT_EMOJI}</div>
                <div className="text-xl font-medium">{title}</div>
              </div>
            </div>
          )}
        </div>
        
        <h1 className="text-3xl font-bold mb-4">{title}</h1>
        
        <div className="flex flex-wrap gap-4 items-center mb-4">
          {date && (
            <time dateTime={date} className="text-gray-500 text-sm">
              {formattedDate}
            </time>
          )}
          
          {/* 显示Tags */}
          {page.properties.Tags?.multi_select && page.properties.Tags.multi_select.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {page.properties.Tags.multi_select.map((tag) => (
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
        
        {/* 显示Summary作为文章引言 */}
        {summaryText && (
          <div className="mt-4 text-xl text-gray-600 italic border-l-4 border-gray-300 pl-4 py-2 bg-gray-50 rounded">
            {summaryText}
          </div>
        )}
      </header>
      
      <div className="markdown-content">
        {page.blocks && page.blocks.length > 0 ? (
          <NotionRenderer blocks={page.blocks} />
        ) : (
          /* 这里是Notion内容为空的情况，我们可以显示Summary内容，或者什么都不显示 */
          <div>{summaryText || ''}</div>
        )}
      </div>
    </article>
  );
}