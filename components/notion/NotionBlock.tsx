import React from 'react';
import Image from 'next/image';
import type { RichText, NotionBlock as NotionBlockType } from '@/lib/notion-types';

interface BlockProps {
  block: NotionBlockType;
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
const NotionImage = ({ block }: { block: NotionBlockType }) => {
  if (!block.image) return null;
  
  let imageUrl = '';
  
  if (block.image.type === 'external' && block.image.external?.url) {
    imageUrl = block.image.external.url;
  } else if (block.image.type === 'file' && block.image.file?.url) {
    imageUrl = block.image.file.url;
  }
  
  if (!imageUrl) return null;
  
  const caption = block.image.caption && block.image.caption.length > 0 
    ? <figcaption className="text-center text-sm text-gray-500 mt-2">
        <RichTextRenderer richTexts={block.image.caption} />
      </figcaption> 
    : null;
  
  return (
    <figure className="my-6">
      <div className="relative max-w-full h-auto rounded-lg shadow-sm mx-auto overflow-hidden">
        <Image 
          src={imageUrl} 
          alt={caption ? "图片带有说明" : "Notion中的图片"} 
          className="max-w-full h-auto rounded-lg"
          width={700}
          height={400}
          style={{ objectFit: 'contain' }}
          loading="lazy"
          quality={85}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      {caption}
    </figure>
  );
};

// 类型安全的获取块内容的辅助函数
const getBlockContent = (block: NotionBlockType, type: string) => {
  const content = block[type as keyof NotionBlockType];
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