import React from 'react';
import NotionBlock from './NotionBlock';

interface NotionRendererProps {
  blocks: any[];
}

const NotionRenderer = ({ blocks }: NotionRendererProps) => {
  if (!blocks || blocks.length === 0) {
    return null; // 页面为空时不显示任何内容
  }

  let orderedListItems: any[] = [];
  let bulletedListItems: any[] = [];
  let isProcessingOrderedList = false;
  let isProcessingBulletedList = false;

  return (
    <div className="notion-content">
      {blocks.map((block, index) => {
        const nextBlock = index < blocks.length - 1 ? blocks[index + 1] : null;

        // 处理有序列表
        if (block.type === 'numbered_list_item') {
          isProcessingOrderedList = true;
          orderedListItems.push(block);

          // 检查是否是列表的最后一项
          if (nextBlock?.type !== 'numbered_list_item') {
            const listItems = [...orderedListItems];
            orderedListItems = [];
            isProcessingOrderedList = false;
            
            return (
              <ol key={block.id} className="list-decimal pl-6 my-4 space-y-1">
                {listItems.map(item => (
                  <NotionBlock key={item.id} block={item} />
                ))}
              </ol>
            );
          }
          return null;
        }

        // 处理无序列表
        if (block.type === 'bulleted_list_item') {
          isProcessingBulletedList = true;
          bulletedListItems.push(block);

          // 检查是否是列表的最后一项
          if (nextBlock?.type !== 'bulleted_list_item') {
            const listItems = [...bulletedListItems];
            bulletedListItems = [];
            isProcessingBulletedList = false;
            
            return (
              <ul key={block.id} className="list-disc pl-6 my-4 space-y-1">
                {listItems.map(item => (
                  <NotionBlock key={item.id} block={item} />
                ))}
              </ul>
            );
          }
          return null;
        }

        // 处理其他块
        return (
          <div key={block.id} className="notion-block">
            <NotionBlock block={block} />
          </div>
        );
      })}
    </div>
  );
};

export default NotionRenderer; 