export interface ArticleRow {
  id: string;                 // Notion page id
  articleID: number;          // Articles 表主键
  date: string;
  coverUrl?: string;
  publish: boolean;
}

export interface LocaleRow {
  id: string;
  articleID: number;
  lang: "en" | "zh" | "es";   // 未来可扩充
  title: string;
  slug: string;
  summary: string;
  tags: string[];             // 多选标签 → string[]
  localePageId: string;        // Locale 行的 page.id
  blocks?: any[];             // 文章详情页才会用到
}

export interface JoinedPost extends ArticleRow, Omit<LocaleRow,
  "id" | "articleID"> {}      // 合并后的最终结构 