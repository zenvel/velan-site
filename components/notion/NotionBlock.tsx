import React from 'react';
import Image from 'next/image';
import { RichText, NotionBlock as NotionBlockType } from '@/lib/notion';

interface BlockProps {
  block: NotionBlockType;
  level?: number;
}

const RichTextRenderer = ({ richTexts }: { richTexts: RichText[] }) => {
  if (!richTexts || richTexts.length === 0) return null;

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

const NotionBlock = ({ block, level = 0 }: BlockProps) => {
  if (!block) return null;

  const { type } = block;
  const value = block[type];
  
  // 处理子块
  const renderChildren = () => {
    if (block.children) {
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

  switch (type) {
    case 'paragraph':
      return (
        <div className="mb-4">
          <p className="leading-relaxed">
            <RichTextRenderer richTexts={value.rich_text} />
          </p>
          {renderChildren()}
        </div>
      );
    
    case 'heading_1':
      return (
        <div className="mt-8 mb-4">
          <h1 className="text-2xl font-bold">
            <RichTextRenderer richTexts={value.rich_text} />
          </h1>
          {renderChildren()}
        </div>
      );
    
    case 'heading_2':
      return (
        <div className="mt-6 mb-3">
          <h2 className="text-xl font-bold">
            <RichTextRenderer richTexts={value.rich_text} />
          </h2>
          {renderChildren()}
        </div>
      );
    
    case 'heading_3':
      return (
        <div className="mt-4 mb-2">
          <h3 className="text-lg font-bold">
            <RichTextRenderer richTexts={value.rich_text} />
          </h3>
          {renderChildren()}
        </div>
      );
    
    case 'bulleted_list_item':
      return (
        <li className="mb-2">
          <RichTextRenderer richTexts={value.rich_text} />
          {renderChildren()}
        </li>
      );
    
    case 'numbered_list_item':
      return (
        <li className="mb-2">
          <RichTextRenderer richTexts={value.rich_text} />
          {renderChildren()}
        </li>
      );
    
    case 'to_do':
      return (
        <div className="flex items-start gap-2 mb-2">
          <input 
            type="checkbox" 
            checked={value.checked} 
            readOnly 
            className="mt-1.5"
          />
          <div className={value.checked ? 'line-through text-gray-500' : ''}>
            <RichTextRenderer richTexts={value.rich_text} />
            {renderChildren()}
          </div>
        </div>
      );
    
    case 'image':
      const imageUrl = value.type === 'external' ? value.external.url : value.file.url;
      const caption = value.caption && value.caption.length > 0 
        ? <figcaption className="text-center text-sm text-gray-500 mt-2"><RichTextRenderer richTexts={value.caption} /></figcaption> 
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
            />
          </div>
          {caption}
          {renderChildren()}
        </figure>
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
            <RichTextRenderer richTexts={value.rich_text} />
          </blockquote>
          {renderChildren()}
        </div>
      );
    
    case 'code':
      return (
        <div className="my-4">
          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm font-mono">
            <code>
              <RichTextRenderer richTexts={value.rich_text} />
            </code>
          </pre>
          {renderChildren()}
        </div>
      );
      
    case 'callout':
      const emoji = value.icon?.emoji;
      return (
        <div className="my-4 p-4 bg-gray-50 rounded-lg border border-gray-200 flex gap-3">
          {emoji && <div className="text-xl">{emoji}</div>}
          <div>
            <RichTextRenderer richTexts={value.rich_text} />
            {renderChildren()}
          </div>
        </div>
      );
    
    case 'bookmark':
      return (
        <div className="my-4">
          <a 
            href={value.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <div className="text-blue-600 font-medium hover:underline">{value.url}</div>
            {value.caption && value.caption.length > 0 && (
              <div className="mt-2 text-sm text-gray-500">
                <RichTextRenderer richTexts={value.caption} />
              </div>
            )}
          </a>
          {renderChildren()}
        </div>
      );
    
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