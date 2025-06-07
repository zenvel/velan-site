import { getPost } from '@/lib/notion';
import NotionRenderer from '@/components/notion/NotionRenderer';

export default async function Post({ params }: { params: { slug: string } }) {
  // 确保params是已解析的
  const resolvedParams = await Promise.resolve(params);
  const page: any = await getPost(resolvedParams.slug);
  
  if (!page) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <h1 className="text-2xl font-bold mb-4">文章不存在</h1>
        <p className="text-gray-500">
          请检查您的Notion API配置或确认此文章是否发布
        </p>
      </div>
    );
  }

  // 获取Summary内容，用于显示在文章开头
  const summaryText = page.properties.Summary?.rich_text?.map((text: any) => text.plain_text).join('') || '';

  return (
    <article className="prose prose-lg max-w-3xl mx-auto py-10 px-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-4">{page.properties.Title?.title?.[0]?.plain_text || 'Untitled'}</h1>
        
        <div className="flex flex-wrap gap-4 items-center mb-4">
          {page.properties.Date?.date?.start && (
            <time dateTime={page.properties.Date.date.start} className="text-gray-500 text-sm">
              {new Date(page.properties.Date.date.start).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </time>
          )}
          
          {/* 显示Tags */}
          {page.properties.Tags?.multi_select && page.properties.Tags.multi_select.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {page.properties.Tags.multi_select.map((tag: any) => (
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