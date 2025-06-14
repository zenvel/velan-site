import React from 'react';
import NotionBlock, { NotionBlock as NotionBlockType } from './NotionBlock';

interface NotionRendererProps {
  blocks: NotionBlockType[];
  isNestedList?: boolean; // 添加标志以识别嵌套列表
}

const NotionRenderer = ({ blocks, isNestedList = false }: NotionRendererProps) => {
  if (!blocks || blocks.length === 0) {
    return null; // 页面为空时不显示任何内容
  }

  let orderedListItems: NotionBlockType[] = [];
  let bulletedListItems: NotionBlockType[] = [];

  return (
    <div className={isNestedList ? "" : "notion-content"}>
      {blocks.map((block, index) => {
        const nextBlock = index < blocks.length - 1 ? blocks[index + 1] : null;

        // 处理有序列表
        if (block.type === 'numbered_list_item') {
          orderedListItems.push(block);

          // 检查是否是列表的最后一项
          if (nextBlock?.type !== 'numbered_list_item') {
            const listItems = [...orderedListItems];
            orderedListItems = [];
            
            return (
              <ol key={block.id} className="list-decimal pl-6 my-4 space-y-1">
                {listItems.map(item => (
                  <NotionBlock key={item.id} block={{...item, children: item.children?.filter(child => 
                    child.type !== 'numbered_list_item' && child.type !== 'bulleted_list_item'
                  )}} />
                ))}
              </ol>
            );
          }
          return null;
        }

        // 处理无序列表
        if (block.type === 'bulleted_list_item') {
          bulletedListItems.push(block);

          // 检查是否是列表的最后一项
          if (nextBlock?.type !== 'bulleted_list_item') {
            const listItems = [...bulletedListItems];
            bulletedListItems = [];
            
            return (
              <ul key={block.id} className="list-disc pl-6 my-4 space-y-1">
                {listItems.map(item => (
                  <NotionBlock key={item.id} block={{...item, children: item.children?.filter(child => 
                    child.type !== 'numbered_list_item' && child.type !== 'bulleted_list_item'
                  )}} />
                ))}
              </ul>
            );
          }
          return null;
        }

        // 处理其他块
        return (
          <div key={block.id} className={isNestedList ? "" : "notion-block"}>
            <NotionBlock block={block} />
          </div>
        );
      })}
    </div>
  );
};

export default NotionRenderer; 