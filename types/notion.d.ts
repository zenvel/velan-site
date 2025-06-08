// Basic Notion property types
export type NotionText = {
  plain_text: string;
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
    color?: string;
  };
  href?: string;
  text?: {
    content: string;
    link?: {
      url: string;
    };
  };
};

export type NotionSelect = {
  id: string;
  name: string;
  color: string;
};

export type NotionProperty = {
  id: string;
  type: 'title' | 'rich_text' | 'select' | 'multi_select' | 'date' | 'files' | 'checkbox' | 'url' | 'email' | 'phone_number' | 'number' | 'people' | 'relation' | 'formula' | 'rollup' | 'created_time' | 'created_by' | 'last_edited_time' | 'last_edited_by';
  title?: NotionText[];
  rich_text?: NotionText[];
  select?: NotionSelect;
  multi_select?: NotionSelect[];
  date?: {
    start: string;
    end?: string;
    time_zone?: string;
  };
  files?: {
    name: string;
    type: 'file' | 'external';
    file?: { url: string; expiry_time: string };
    external?: { url: string };
  }[];
  checkbox?: boolean;
  url?: string;
  email?: string;
  phone_number?: string;
  number?: number;
  people?: { id: string; }[];
  relation?: { id: string; }[];
  formula?: {
    type: string;
    [key: string]: any;
  };
  rollup?: {
    type: string;
    [key: string]: any;
  };
  created_time?: string;
  created_by?: { id: string; };
  last_edited_time?: string;
  last_edited_by?: { id: string; };
};

export type NotionPage = {
  id: string;
  created_time: string;
  last_edited_time: string;
  parent: {
    type: 'database_id' | 'page_id' | 'workspace' | 'block_id';
    database_id?: string;
    page_id?: string;
    workspace?: boolean;
    block_id?: string;
  };
  properties: {
    [key: string]: NotionProperty;
  };
  url: string;
}; 