import React from 'react';
import Image from 'next/image';

// 添加基本的 Notion 类型定义
export interface RichText {
  plain_text: string;
  href: string | null;
  annotations: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
  };
  text?: {
    content: string;
    link: { url: string } | null;
  };
}

export interface NotionBlock {
  id: string;
  type: string;
  has_children: boolean;
  children?: NotionBlock[];
  
  // 文本块
  paragraph?: { rich_text: RichText[]; color: string };
  heading_1?: { rich_text: RichText[]; color: string };
  heading_2?: { rich_text: RichText[]; color: string };
  heading_3?: { rich_text: RichText[]; color: string };
  bulleted_list_item?: { rich_text: RichText[]; color: string };
  numbered_list_item?: { rich_text: RichText[]; color: string };
  
  // 任务块
  to_do?: { rich_text: RichText[]; checked: boolean; color: string };
  
  // 引用块
  quote?: { rich_text: RichText[]; color: string };
  
  // 代码块
  code?: { rich_text: RichText[]; caption: RichText[]; language: string };
  
  // 分割线
  divider?: Record<string, never>;
  
  // 图片
  image?: {
    caption: RichText[];
    type: 'external' | 'file';
    external?: { url: string };
    file?: { url: string; expiry_time: string };
  };
  
  // 提醒块
  callout?: {
    rich_text: RichText[];
    icon: {
      type: 'emoji' | 'external' | 'file';
      emoji?: string;
      external?: { url: string };
      file?: { url: string; expiry_time: string };
    };
    color: string;
  };
  
  // 书签
  bookmark?: {
    url: string;
    caption: RichText[];
  };
  
  // 表格
  table?: {
    table_width: number;
    has_column_header: boolean;
    has_row_header: boolean;
  };
  
  // 表格行
  table_row?: {
    cells: RichText[][];
  };
  
  // 其他属性
  [key: string]: any;
}

interface BlockProps {
  block: NotionBlock;
  level?: number;
}

/**
 * 渲染Notion富文本内容
 */
const RichTextRenderer = ({ richTexts }: { richTexts: RichText[] }) => {
  if (!richTexts || richTexts.length === 0) return null;

  // 颜色映射表
  const colorMap: Record<string, string> = {
    gray: "text-gray-500",
    brown: "text-amber-700",
    orange: "text-orange-500",
    yellow: "text-yellow-500",
    green: "text-green-600",
    blue: "text-blue-600",
    purple: "text-purple-600",
    pink: "text-pink-600",
    red: "text-red-600",
  };

  return (
    <>
      {richTexts.map((richText, index) => {
        const { annotations, text } = richText;
        const content = text?.content || richText.plain_text || '';
        
        if (!content) return null;
        
        let element = <span key={`text-${index}`}>{content}</span>;
        
        if (annotations) {
          // 处理代码
          if (annotations.code) 
            element = <code key={`code-${index}`} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm">{element}</code>;
          
          // 处理文本样式
          if (annotations.bold) 
            element = <strong key={`bold-${index}`}>{element}</strong>;
          if (annotations.italic) 
            element = <em key={`italic-${index}`}>{element}</em>;
          if (annotations.strikethrough) 
            element = <del key={`del-${index}`} className="text-gray-500">{element}</del>;
          if (annotations.underline) 
            element = <u key={`u-${index}`}>{element}</u>;
            
          // 处理颜色
          if (annotations.color && annotations.color !== 'default') {
            const colorClass = colorMap[annotations.color] || '';
            if (colorClass) {
              element = <span key={`color-${index}`} className={colorClass}>{element}</span>;
            }
          }
        }
        
        // 处理链接
        if (text?.link?.url || richText.href) {
          element = (
            <a 
              href={text?.link?.url || richText.href || '#'} 
              target="_blank"
              rel="noopener noreferrer"
              key={`link-${index}`}
              className="text-blue-600 hover:underline"
            >
              {element}
            </a>
          );
        }
        
        return element;
      })}
    </>
  );
};

/**
 * 图片组件，支持图片类型检测和加载优化
 */
const NotionImage = ({ block }: { block: NotionBlock }) => {
  if (!block.image) return null;
  
  let imageUrl = '';
  
  // 判断图片类型并获取URL
  if (block.image.type === 'external' && block.image.external?.url) {
    imageUrl = block.image.external.url;
  } else if (block.image.type === 'file' && block.image.file?.url) {
    imageUrl = block.image.file.url;
  }
  
  if (!imageUrl) return null;
  
  // 保存原始URL用于直接加载
  const originalUrl = imageUrl;
  
  // 创建不同的代理URL
  const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`;
  const directProxyUrl = `/api/direct-proxy?url=${encodeURIComponent(imageUrl)}`;
  
  console.log(`图片URL: ${imageUrl}`);
  
  const caption = block.image.caption && block.image.caption.length > 0 
    ? <figcaption className="text-center text-sm text-gray-500 mt-2">
        <RichTextRenderer richTexts={block.image.caption} />
      </figcaption> 
    : null;
  
  // 使用多级回退策略: 直接加载 -> 直接代理 -> 标准代理 -> 占位图
  return (
    <figure className="my-6">
      <div className="relative max-w-full h-auto rounded-lg shadow-sm mx-auto overflow-hidden">
        <img 
          src={directProxyUrl} 
          alt={caption ? "图片带有说明" : "Notion中的图片"} 
          className="max-w-full h-auto rounded-lg mx-auto"
          loading="lazy"
          onError={(e) => {
            console.log(`直接代理加载图片失败，尝试通过标准代理: ${directProxyUrl}`);
            const target = e.target as HTMLImageElement;
            
            // 如果直接代理加载失败，尝试通过标准代理加载
            if (target.src.includes('/api/direct-proxy')) {
              console.log(`尝试使用标准代理: ${proxyUrl}`);
              target.src = proxyUrl;
            } 
            // 如果标准代理也失败，使用占位图
            else if (target.src.includes('/api/image-proxy')) {
              console.error(`所有代理加载图片都失败，使用占位图`);
              target.src = '/images/placeholder.png';
              target.onerror = null; // 移除错误处理器防止循环
            }
          }}
        />
      </div>
      {caption}
    </figure>
  );
};

// 类型安全的获取块内容的辅助函数
const getBlockContent = (block: NotionBlock, type: string) => {
  const content = block[type as keyof NotionBlock];
  return content && typeof content === 'object' ? content : null;
};

/**
 * 渲染Notion块
 */
const NotionBlock = ({ block, level = 0 }: BlockProps) => {
  if (!block) return null;

  const { type } = block;
  
  // 处理子块
  const renderChildren = () => {
    if (block.children && block.children.length > 0) {
      return (
        <div className="pl-4 mt-2 border-l border-gray-200">
          {block.children.map((child) => (
            <NotionBlock key={child.id} block={child} level={level + 1} />
          ))}
        </div>
      );
    }
    return null;
  };

  // 渲染富文本块的助手函数
  const renderRichText = (blockType: string) => {
    const content = getBlockContent(block, blockType);
    if (!content || !('rich_text' in content)) return null;
    return <RichTextRenderer richTexts={content.rich_text as RichText[]} />;
  };

  // 为不同块类型渲染对应组件
  switch (type) {
    case 'paragraph':
      return (
        <div className="mb-4">
          <p className="leading-relaxed">
            {renderRichText('paragraph')}
          </p>
          {renderChildren()}
        </div>
      );
    
    case 'heading_1':
      return (
        <div className="mt-8 mb-4">
          <h1 className="text-2xl font-bold">
            {renderRichText('heading_1')}
          </h1>
          {renderChildren()}
        </div>
      );
    
    case 'heading_2':
      return (
        <div className="mt-6 mb-3">
          <h2 className="text-xl font-bold">
            {renderRichText('heading_2')}
          </h2>
          {renderChildren()}
        </div>
      );
    
    case 'heading_3':
      return (
        <div className="mt-4 mb-2">
          <h3 className="text-lg font-bold">
            {renderRichText('heading_3')}
          </h3>
          {renderChildren()}
        </div>
      );
    
    case 'bulleted_list_item':
      return (
        <li className="mb-2">
          {renderRichText('bulleted_list_item')}
          {renderChildren()}
        </li>
      );
    
    case 'numbered_list_item':
      return (
        <li className="mb-2">
          {renderRichText('numbered_list_item')}
          {renderChildren()}
        </li>
      );
    
    case 'to_do': {
      const todoContent = getBlockContent(block, 'to_do');
      if (!todoContent || !('rich_text' in todoContent) || !('checked' in todoContent)) return null;
      
      return (
        <div className="flex items-start gap-2 mb-2">
          <input 
            type="checkbox" 
            checked={!!todoContent.checked} 
            readOnly 
            className="mt-1.5"
          />
          <div className={todoContent.checked ? 'line-through text-gray-500' : ''}>
            <RichTextRenderer richTexts={todoContent.rich_text as RichText[]} />
            {renderChildren()}
          </div>
        </div>
      );
    }
    
    case 'image':
      return (
        <div className="my-6">
          <NotionImage block={block} />
          {renderChildren()}
        </div>
      );
    
    case 'divider':
      return (
        <div className="my-6">
          <hr className="border-t border-gray-200" />
          {renderChildren()}
        </div>
      );
    
    case 'quote':
      return (
        <div className="my-4">
          <blockquote className="border-l-4 border-gray-300 pl-4 py-1 italic text-gray-700">
            {renderRichText('quote')}
          </blockquote>
          {renderChildren()}
        </div>
      );
    
    case 'code': {
      const codeContent = getBlockContent(block, 'code');
      if (!codeContent || !('rich_text' in codeContent)) return null;
      
      const language = 'language' in codeContent ? codeContent.language as string : 'plaintext';
      
      return (
        <div className="my-4">
          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm font-mono">
            <code className={`language-${language}`}>
              <RichTextRenderer richTexts={codeContent.rich_text as RichText[]} />
            </code>
          </pre>
          {renderChildren()}
        </div>
      );
    }
      
    case 'callout': {
      const calloutContent = getBlockContent(block, 'callout');
      if (!calloutContent || !('rich_text' in calloutContent) || !('icon' in calloutContent)) return null;
      
      // 安全地检查和访问emoji属性
      let emoji = null;
      if (calloutContent.icon && 
          typeof calloutContent.icon === 'object' && 
          'emoji' in calloutContent.icon && 
          typeof calloutContent.icon.emoji === 'string') {
        emoji = calloutContent.icon.emoji;
      }
      
      return (
        <div className="my-4 p-4 bg-gray-50 rounded-lg border border-gray-200 flex gap-3">
          {emoji && <div className="text-xl">{emoji}</div>}
          <div>
            <RichTextRenderer richTexts={calloutContent.rich_text as RichText[]} />
            {renderChildren()}
          </div>
        </div>
      );
    }
    
    case 'bookmark': {
      const bookmarkContent = getBlockContent(block, 'bookmark');
      if (!bookmarkContent || !('url' in bookmarkContent)) return null;
      
      const url = bookmarkContent.url as string;
      const caption = 'caption' in bookmarkContent ? bookmarkContent.caption as RichText[] : null;
      
      return (
        <div className="my-4">
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <div className="text-blue-600 font-medium hover:underline">{url}</div>
            {caption && caption.length > 0 && (
              <div className="mt-2 text-sm text-gray-500">
                <RichTextRenderer richTexts={caption} />
              </div>
            )}
          </a>
          {renderChildren()}
        </div>
      );
    }
    
    case 'table': {
      const tableContent = getBlockContent(block, 'table');
      if (!tableContent) return null;
      
      const hasColumnHeader = tableContent.has_column_header || false;
      const hasRowHeader = tableContent.has_row_header || false;
      
      return (
        <div className="my-6 overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-200 dark:border-gray-700">
            {block.children && block.children.length > 0 && (
              <tbody>
                {block.children.map((row, rowIndex) => {
                  if (row.type !== 'table_row' || !row.table_row) return null;
                  
                  return (
                    <tr 
                      key={row.id} 
                      className={`${
                        hasColumnHeader && rowIndex === 0 
                          ? 'bg-gray-100 dark:bg-gray-800' 
                          : 'border-t border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {row.table_row.cells.map((cell, cellIndex) => {
                        const isHeader = (hasColumnHeader && rowIndex === 0) || (hasRowHeader && cellIndex === 0);
                        const CellTag = isHeader ? 'th' : 'td';
                        
                        return (
                          <CellTag 
                            key={`${row.id}-${cellIndex}`}
                            className={`px-4 py-2 border border-gray-200 dark:border-gray-700 ${
                              isHeader 
                                ? 'font-medium text-left bg-gray-50 dark:bg-gray-800' 
                                : ''
                            }`}
                          >
                            <RichTextRenderer richTexts={cell} />
                          </CellTag>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            )}
          </table>
          {renderChildren()}
        </div>
      );
    }
    
    case 'table_row':
      // 表格行不单独渲染，由表格渲染
      return null;
    
    default:
      return (
        <div className="text-gray-500 text-sm my-2">
          <div className="text-xs bg-gray-100 inline-block px-2 py-1 rounded">不支持的块类型: {type}</div>
          {renderChildren()}
        </div>
      );
  }
};

export default NotionBlock; 