/**
 * Notion API 类型定义
 * 根据官方 API 规范定义类型
 */

export interface NotionPage {
  id: string;
  object: string;
  created_time: string;
  last_edited_time: string;
  created_by: {
    object: string;
    id: string;
  };
  last_edited_by: {
    object: string;
    id: string;
  };
  cover: null | {
    type: 'external' | 'file';
    external?: { url: string };
    file?: { url: string; expiry_time: string };
  };
  icon: null | {
    type: 'emoji' | 'external' | 'file';
    emoji?: string;
    external?: { url: string };
    file?: { url: string; expiry_time: string };
  };
  parent: {
    type: 'database_id' | 'page_id' | 'workspace';
    database_id?: string;
    page_id?: string;
    workspace?: boolean;
  };
  archived: boolean;
  properties: {
    Title?: {
      id: string;
      type: 'title';
      title: Array<RichText>;
    };
    Slug?: {
      id: string;
      type: 'rich_text';
      rich_text: Array<RichText>;
    };
    Date?: {
      id: string;
      type: 'date';
      date: {
        start: string;
        end: string | null;
        time_zone: string | null;
      };
    };
    Tags?: {
      id: string;
      type: 'multi_select';
      multi_select: Array<{
        id: string;
        name: string;
        color: string;
      }>;
    };
    Summary?: {
      id: string;
      type: 'rich_text';
      rich_text: Array<RichText>;
    };
    Publish?: {
      id: string;
      type: 'checkbox';
      checkbox: boolean;
    };
    [key: string]: unknown;
  };
  url: string;
  blocks?: NotionBlock[];
}

export interface NotionBlock {
  id: string;
  parent: {
    type: 'page_id' | 'block_id' | 'database_id';
    page_id?: string;
    block_id?: string;
    database_id?: string;
  };
  created_time: string;
  last_edited_time: string;
  created_by: {
    object: string;
    id: string;
  };
  last_edited_by: {
    object: string;
    id: string;
  };
  has_children: boolean;
  archived: boolean;
  type: string;
  object: string;
  children?: NotionBlock[];

  // 段落块
  paragraph?: {
    rich_text: RichText[];
    color: string;
  };
  
  // 标题块
  heading_1?: {
    rich_text: RichText[];
    color: string;
    is_toggleable: boolean;
  };
  heading_2?: {
    rich_text: RichText[];
    color: string;
    is_toggleable: boolean;
  };
  heading_3?: {
    rich_text: RichText[];
    color: string;
    is_toggleable: boolean;
  };
  
  // 列表块
  bulleted_list_item?: {
    rich_text: RichText[];
    color: string;
  };
  numbered_list_item?: {
    rich_text: RichText[];
    color: string;
  };
  
  // 任务块
  to_do?: {
    rich_text: RichText[];
    checked: boolean;
    color: string;
  };
  
  // 引用块
  quote?: {
    rich_text: RichText[];
    color: string;
  };
  
  // 代码块
  code?: {
    rich_text: RichText[];
    caption: RichText[];
    language: string;
  };
  
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
}

export interface RichText {
  type: 'text' | 'mention' | 'equation';
  text?: {
    content: string;
    link: { url: string } | null;
  };
  annotations: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
  };
  plain_text: string;
  href: string | null;
} 