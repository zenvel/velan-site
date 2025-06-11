import { Client } from '@notionhq/client';
import { ArticleRow, LocaleRow, JoinedPost } from './notion-types';

// 创建Notion客户端实例
const notion = new Client({ 
  auth: process.env.NOTION_TOKEN || '',
  notionVersion: '2022-06-28' // 明确指定API版本
});

// ① 把数据库 ID 换成你的
const ARTICLES_DB   = process.env.NOTION_ARTICLES_DB_ID!
const LOCALES_DB    = process.env.NOTION_LOCALES_DB_ID!

// 根据截图中的 Article_Locales 表中的标题映射
type ArticleTitlesType = {
  [lang: string]: {
    [id: number]: string;
  };
};

const ARTICLE_TITLES: ArticleTitlesType = {
  'zh': {
    1: '我为何选择一人公司',
    2: '以系统观提升生产力',
    3: '公开式构建：透明与成长',
    4: '为什么我要打造一人公司：Velan的出发点'
  },
  'en': {
    1: 'Why I Choose a One-Person Company',
    2: 'The Systems Approach to Productivity',
    3: 'Build-in-Public: Transparency',
    4: "Why I'm Building a One-Person Company: Velan's Starting Point"
  },
  'es': {
    1: 'Por qué elijo una empresa de una persona',
    2: 'Enfoque sistémico para la productividad',
    3: 'Construir en público: transparencia',
    4: 'Por qué estoy construyendo una empresa de una persona: el punto de partida de Velan'
  }
};

// 辅助函数：安全获取 Notion 属性值
function safeGetProperty(obj: any, prop: string, type: string, defaultValue: string = ''): string {
  try {
    const property = obj.properties[prop]?.[type];
    if (!property || !Array.isArray(property) || property.length === 0) {
      return defaultValue;
    }
    return property[0]?.plain_text || defaultValue;
  } catch (error) {
    console.warn(`Failed to get property ${prop}.${type}:`, error);
    return defaultValue;
  }
}

// 辅助函数：安全获取 Select 类型属性或 Title 类型属性
function safeGetSelect(obj: any, prop: string, defaultValue: string = ''): string {
  try {
    // 首先尝试获取 select 类型
    const select = obj.properties[prop]?.select;
    if (select?.name) {
      return select.name;
    }
    
    // 如果不是 select，尝试获取 title 类型
    const title = obj.properties[prop]?.title;
    if (title && Array.isArray(title) && title.length > 0) {
      return title[0]?.plain_text || defaultValue;
    }
    
    return defaultValue;
  } catch (error) {
    console.warn(`Failed to get select/title property ${prop}:`, error);
    return defaultValue;
  }
}

// 辅助函数：安全获取标签
function safeGetTags(obj: any, defaultTags: string[] = []): string[] {
  try {
    // 检查是否存在Tags属性
    if (!obj.properties || !obj.properties.Tags) {
      return defaultTags;
    }
    
    // 处理multi_select类型标签
    if (obj.properties.Tags.type === 'multi_select') {
      const tags = obj.properties.Tags.multi_select;
      if (!tags || !Array.isArray(tags)) {
        return defaultTags;
      }
      return tags.map((t: any) => t.name || '').filter(Boolean);
    }
    
    // 处理rich_text类型标签 (新增)
    if (obj.properties.Tags.type === 'rich_text' && 
        obj.properties.Tags.rich_text && 
        Array.isArray(obj.properties.Tags.rich_text) && 
        obj.properties.Tags.rich_text.length > 0) {
      // 获取第一个文本块的内容
      const content = obj.properties.Tags.rich_text[0].text.content || '';
      // 按逗号分隔并去除空格
      return content.split(',').map((tag: string) => tag.trim()).filter(Boolean);
    }
    
    return defaultTags;
  } catch (error) {
    console.warn('Failed to get tags:', error);
    return defaultTags;
  }
}

// 从硬编码映射中获取标题
function getArticleTitleFromMapping(lang: string, articleId: number): string {
  try {
    // 如果存在这个语言版本的标题，返回对应文章ID的标题
    if (ARTICLE_TITLES[lang] && ARTICLE_TITLES[lang][articleId]) {
      const title = ARTICLE_TITLES[lang][articleId];
      console.log(`📝 从映射表获取 ${lang} 语言的文章 #${articleId} 标题: "${title}"`);
      return title;
    }
    
    // 如果该语言版本不存在，尝试使用英文版
    if (lang !== 'en' && ARTICLE_TITLES['en'] && ARTICLE_TITLES['en'][articleId]) {
      const title = ARTICLE_TITLES['en'][articleId];
      console.log(`📝 从映射表获取英文版文章 #${articleId} 标题: "${title}"`);
      return title;
    }
    
    // 如果都没有找到，返回默认标题
    console.log(`⚠️ 在映射表中未找到文章 #${articleId} 的标题`);
    return `文章 #${articleId}`;
  } catch (error) {
    console.warn(`❌ 从映射表获取标题失败:`, error);
    return `文章 #${articleId}`;
  }
}

// 从截图中直接查看文章标题
function getTitleFromArticleLocales(page: any, articleId: number): string {
  try {
    if (!page || !page.properties) {
      console.log('⚠️ 页面或页面属性不存在');
      return `文章 #${articleId}`;
    }
    
    // 输出所有属性名称和类型
    console.log(`📄 页面 ID=${page.id}, Article_ID=${articleId} 的所有属性:`, 
      Object.keys(page.properties).map(key => {
        const type = page.properties[key]?.type;
        return `${key}(${type})`;
      }).join(', ')
    );
    
    // 找到所有 title 类型的属性
    let titleProps = [];
    for (const key in page.properties) {
      const prop = page.properties[key];
      if (prop && prop.type === 'title') {
        titleProps.push({ key, prop });
        console.log(`📝 找到 title 类型属性: ${key}`);
        
        // 输出这个属性的详细内容
        if (prop.title && Array.isArray(prop.title)) {
          console.log(`📄 ${key} 属性内容:`, JSON.stringify(prop.title).substring(0, 200));
          
          if (prop.title.length > 0 && prop.title[0]?.plain_text) {
            const title = prop.title[0].plain_text;
            console.log(`📝 从 ${key} 获取到标题: "${title}"`);
            return title;
          }
        }
      }
    }
    
    // 如果没有找到标题，再次检查特定属性名
    if (page.properties.Title) {
      console.log(`📄 检查 Title 属性:`, page.properties.Title.type);
      
      if (page.properties.Title.title && Array.isArray(page.properties.Title.title) && 
          page.properties.Title.title.length > 0 && page.properties.Title.title[0]?.plain_text) {
        const title = page.properties.Title.title[0].plain_text;
        console.log(`📝 从 Title 属性获取到标题: "${title}"`);
        return title;
      }
    }
    
    // 尝试从页面名称获取
    if (page.parent?.database_id === LOCALES_DB && page.properties) {
      console.log(`📄 尝试从页面名称获取标题 (database=${page.parent.database_id})`);
      
      // 尝试从任何包含文本的属性获取
      for (const key in page.properties) {
        const prop = page.properties[key];
        const propType = prop?.type;
        
        if (propType === 'rich_text' && prop.rich_text && Array.isArray(prop.rich_text) && 
            prop.rich_text.length > 0 && prop.rich_text[0]?.plain_text) {
          const text = prop.rich_text[0].plain_text;
          if (text && text.length > 0) {
            console.log(`📝 从 ${key}(${propType}) 属性获取文本作为标题: "${text}"`);
            return text;
          }
        }
      }
    }
    
    // 如果所有尝试都失败，使用默认标题
    console.log(`⚠️ 未能从页面中获取标题，使用默认标题: 文章 #${articleId}`);
    return `文章 #${articleId}`;
  } catch (error) {
    console.warn(`❌ 获取文章标题失败:`, error);
    return `文章 #${articleId}`;
  }
}

// 从 Notion 页面获取页面标题
function getPageTitle(page: any, defaultTitle: string = "无标题"): string {
  try {
    // 尝试获取页面名称
    if (page.properties) {
      // 输出调试信息，查看 properties 中有什么属性
      console.log(`📝 页面属性列表:`, Object.keys(page.properties));
      
      // 输出所有属性的详细信息
      for (const key in page.properties) {
        const prop = page.properties[key];
        console.log(`📄 属性 ${key}:`, prop.type, JSON.stringify(prop).substring(0, 100) + '...');
      }
      
      // 尝试从 Title 属性获取
      const title = page.properties.Title?.title;
      if (title && Array.isArray(title) && title.length > 0) {
        console.log(`📝 找到 Title 属性:`, title[0]?.plain_text);
        return title[0]?.plain_text || defaultTitle;
      }
      
      // 尝试从 Name 属性获取
      const nameTitle = page.properties.Name?.title;
      if (nameTitle && Array.isArray(nameTitle) && nameTitle.length > 0) {
        console.log(`📝 找到 Name 属性:`, nameTitle[0]?.plain_text);
        return nameTitle[0]?.plain_text || defaultTitle;
      }
      
      // 尝试从 Page 属性获取
      const pageTitle = page.properties.Page?.title;
      if (pageTitle && Array.isArray(pageTitle) && pageTitle.length > 0) {
        console.log(`📝 找到 Page 属性:`, pageTitle[0]?.plain_text);
        return pageTitle[0]?.plain_text || defaultTitle;
      }
      
      // 尝试遍历所有属性寻找 title 类型
      for (const key in page.properties) {
        const prop = page.properties[key];
        if (prop.type === "title" && prop.title && Array.isArray(prop.title) && prop.title.length > 0) {
          console.log(`📝 找到 title 类型属性 ${key}:`, prop.title[0]?.plain_text);
          return prop.title[0]?.plain_text || defaultTitle;
        }
      }
    }
    
    // 尝试获取页面对象的名称
    if (page.title) {
      if (typeof page.title === 'string') {
        return page.title;
      } else if (Array.isArray(page.title) && page.title.length > 0) {
        return page.title[0]?.plain_text || defaultTitle;
      }
    }
    
    console.log(`⚠️ 无法找到标题，使用默认标题:`, defaultTitle);
    return defaultTitle;
  } catch (error) {
    console.warn('Failed to get page title:', error);
    return defaultTitle;
  }
}

// ② 获取多条
export async function getPosts(lang: string): Promise<JoinedPost[]> {
  console.log(`📌 getPosts 开始获取文章，语言: ${lang}`);
  try {
    // 2-1 先取 Articles
    console.log(`📄 查询 Articles 数据库: ${ARTICLES_DB}`);
    
    const articles = await notion.databases.query({
      database_id: ARTICLES_DB,
      sorts: [{ property: "Date", direction: "descending" }]
    });
    
    // 打印数据库结构信息
    if (articles.results.length > 0) {
      const firstArticle = articles.results[0];
      console.log(`📊 文章数据库结构分析:`);
      console.log(`属性列表:`, Object.keys((firstArticle as any).properties).join(', '));
      
      // 检查每个属性的类型
      Object.entries((firstArticle as any).properties).forEach(([key, value]) => {
        const type = (value as any).type;
        const valueStr = JSON.stringify(value).substring(0, 100);
        console.log(`属性 ${key} (${type}): ${valueStr}...`);
      });
    }
    console.log(`📄 Articles 查询结果: ${articles.results.length} 条记录`);

    if (articles.results.length === 0) {
      console.log(`❌ 没有找到已发布的文章`);
      return [];
    }

    // 2-2 取 articleID 列表
    const ids = articles.results.map((p, index) => {
      try {
        // 详细检查是否存在 Article_ID 字段以及其格式
        let id;
        
        // 检查各种可能的字段名称
        const properties = (p as any).properties;
        if (properties) {
          // 1. 检查 Article_ID
          if (properties.Article_ID) {
            const prop = properties.Article_ID;
            console.log(`检查 Article_ID 属性 (类型: ${prop.type}):`, JSON.stringify(prop).substring(0, 100));
            
            if (prop.type === 'number') {
              id = prop.number;
            } else if (prop.type === 'rich_text' && prop.rich_text?.length > 0) {
              // 可能是富文本格式
              id = parseInt(prop.rich_text[0].plain_text, 10);
            } else if (prop.type === 'title' && prop.title?.length > 0) {
              // 可能是标题格式
              id = parseInt(prop.title[0].plain_text, 10);
            }
          }
          
          // 2. 检查 ArticleID (无下划线)
          if (!id && properties.ArticleID) {
            const prop = properties.ArticleID;
            console.log(`检查 ArticleID 属性 (类型: ${prop.type}):`, JSON.stringify(prop).substring(0, 100));
            
            if (prop.type === 'number') {
              id = prop.number;
            } else if (prop.type === 'rich_text' && prop.rich_text?.length > 0) {
              id = parseInt(prop.rich_text[0].plain_text, 10);
            } else if (prop.type === 'title' && prop.title?.length > 0) {
              id = parseInt(prop.title[0].plain_text, 10);
            }
          }
          
          // 3. 检查 ID 字段
          if (!id && properties.ID) {
            const prop = properties.ID;
            console.log(`检查 ID 属性 (类型: ${prop.type}):`, JSON.stringify(prop).substring(0, 100));
            
            if (prop.type === 'number') {
              id = prop.number;
            } else if (prop.type === 'rich_text' && prop.rich_text?.length > 0) {
              id = parseInt(prop.rich_text[0].plain_text, 10);
            } else if (prop.type === 'title' && prop.title?.length > 0) {
              id = parseInt(prop.title[0].plain_text, 10);
            }
          }
        }
        
        // 如果没有找到有效ID，使用索引+1作为ID
        if (!id || isNaN(id)) {
          id = index + 1;
          console.log(`⚠️ 文章缺少有效的 Article_ID，使用索引作为替代: ${p.id} -> ${id}`);
        } else {
          console.log(`✅ 成功获取文章 ID: ${id}`);
        }
        
        return id;
      } catch (e) {
        console.log(`⚠️ 获取 Article_ID 出错: ${e}`);
        // 使用索引+1作为备用ID
        const fallbackId = index + 1;
        console.log(`使用备用ID: ${fallbackId}`);
        return fallbackId;
      }
    }).filter(Boolean); // 过滤掉 null 和 undefined
    console.log(`📋 Article_ID 列表: ${ids.join(', ')}`);

    // 2-3 获取所有语言版本的数据
    console.log(`📄 查询 Locales 数据库: ${LOCALES_DB}`);
    const locales = await notion.databases.query({
      database_id: LOCALES_DB
    });
    console.log(`📄 Locales 查询结果: ${locales.results.length} 条记录`);

    // 2-4 过滤符合条件的数据
    // 创建一个映射，将 Locale 条目按照 Article_ID 分组
    const localeMap = new Map<number, any[]>();
    
    // 首先，尝试将所有 Locale 条目按 Article_ID 分组
    locales.results.forEach((l, index) => {
      try {
        // 详细检查是否存在 Article_ID 字段以及其格式
        let articleId;
        
        // 检查各种可能的字段名称
        const properties = (l as any).properties;
        if (properties) {
          // 打印所有属性
          console.log(`Locale 条目属性:`, Object.keys(properties).join(', '));
          
          // 1. 检查 Article_ID - 新的关系类型
          if (properties.Article_ID) {
            const prop = properties.Article_ID;
            console.log(`检查 Locale Article_ID 属性 (类型: ${prop.type}):`, JSON.stringify(prop).substring(0, 100));
            
            // 处理关系类型字段
            if (prop.type === 'relation' && Array.isArray(prop.relation) && prop.relation.length > 0) {
              // 获取关联的 Articles 表中的页面 ID
              const relatedPageId = prop.relation[0].id;
              console.log(`📎 找到关系引用: ${relatedPageId}`);
              
              // 查找对应的 Articles 页面，获取其 Article_ID (title 字段)
              const relatedArticle = articles.results.find(a => a.id === relatedPageId);
              if (relatedArticle) {
                const titleProp = (relatedArticle as any).properties.Article_ID;
                if (titleProp?.type === 'title' && titleProp.title?.length > 0) {
                  const titleText = titleProp.title[0]?.plain_text;
                  if (titleText) {
                    articleId = parseInt(titleText, 10);
                    console.log(`🔗 从关联页面获取 ID: ${articleId}`);
                  }
                }
              }
            } else if (prop.type === 'number') {
              articleId = prop.number;
            } else if (prop.type === 'rich_text' && prop.rich_text?.length > 0) {
              // 可能是富文本格式
              articleId = parseInt(prop.rich_text[0].plain_text, 10);
            } else if (prop.type === 'title' && prop.title?.length > 0) {
              // 可能是标题格式
              articleId = parseInt(prop.title[0].plain_text, 10);
            }
          }
          
          // 2. 检查 ArticleID (无下划线)
          if (!articleId && properties.ArticleID) {
            const prop = properties.ArticleID;
            console.log(`检查 Locale ArticleID 属性 (类型: ${prop.type}):`, JSON.stringify(prop).substring(0, 100));
            
            if (prop.type === 'number') {
              articleId = prop.number;
            } else if (prop.type === 'rich_text' && prop.rich_text?.length > 0) {
              articleId = parseInt(prop.rich_text[0].plain_text, 10);
            } else if (prop.type === 'title' && prop.title?.length > 0) {
              articleId = parseInt(prop.title[0].plain_text, 10);
            }
          }
          
          // 3. 如果还是没找到，尝试从标题中提取
          if (!articleId) {
            // 尝试从 Title 中提取数字
            const title = safeGetProperty(l, "Title", "title");
            if (title) {
              console.log(`检查 Locale Title 属性内容: "${title}"`);
              const match = title.match(/^(\d+)/);
              if (match && match[1]) {
                articleId = parseInt(match[1], 10);
              }
            }
          }
        }
        
        // 如果没有找到，尝试匹配标题
        if (!articleId || isNaN(articleId)) {
          // 尝试通过标题匹配找到对应的文章 ID
          const localeTitle = safeGetProperty(l, "Title", "title");
          
          if (localeTitle) {
            // 遍历文章列表，检查是否有标题相似的文章
            for (const article of articles.results) {
              const articleTitle = safeGetProperty(article, "Title", "rich_text");
              
              // 如果标题相似度高，认为是同一篇文章
              if (articleTitle && (
                  articleTitle.includes(localeTitle) || 
                  localeTitle.includes(articleTitle) ||
                  (articleTitle.length > 10 && localeTitle.length > 10 && 
                   (articleTitle.substring(0, 10) === localeTitle.substring(0, 10)))
              )) {
                // 从 Article 获取 ID
                const artId = articles.results.indexOf(article) + 1;
                console.log(`🔍 通过标题匹配找到文章 ID: ${artId}`);
                articleId = artId;
                break;
              }
            }
          }
          
          // 如果仍然没找到，使用索引+1
          if (!articleId || isNaN(articleId)) {
            articleId = index + 1;
            console.log(`⚠️ Locale 条目缺少有效的 Article_ID，使用计算值: ${l.id} -> ${articleId}`);
          }
        } else {
          console.log(`✅ 成功获取 Locale 条目 Article_ID: ${articleId}`);
        }
        
        const localeLang = safeGetSelect(l, "Lang");
        
        // 添加调试信息
        console.log(`📄 检查 Locale 条目: ID=${l.id}, Article_ID=${articleId}, Lang=${localeLang}, 请求语言=${lang}`);
        
        // 将条目添加到对应的 Article_ID 组中
        if (!localeMap.has(articleId)) {
          localeMap.set(articleId, []);
        }
        localeMap.get(articleId)?.push({
          entry: l,
          lang: localeLang
        });
      } catch (e) {
        console.log(`⚠️ 处理 Locale 条目时出错: ${e}`);
      }
    });
    
    // 然后，从每个组中选择匹配当前语言的条目
    const filteredLocales = [];
    for (const articleId of ids) {
      const entries = localeMap.get(articleId) || [];
      console.log(`🔍 文章 ID=${articleId} 有 ${entries.length} 个语言条目`);
      
      if (entries.length > 0) {
        // 打印所有可用的语言
        console.log(`可用语言:`, entries.map(e => e.lang).join(', '));
      }
      
      // 首先尝试找到匹配当前语言的条目
      const matchingEntry = entries.find(e => e.lang === lang);
      if (matchingEntry) {
        console.log(`✅ 找到匹配的语言条目: Article_ID=${articleId}, Lang=${lang}`);
        filteredLocales.push(matchingEntry.entry);
      } else {
        console.log(`ℹ️ 未找到匹配的语言条目: Article_ID=${articleId}, Lang=${lang}`);
        
        // 如果没有找到当前语言的条目，尝试使用英语条目
        const englishEntry = entries.find(e => e.lang === 'en');
        if (englishEntry) {
          console.log(`🔄 使用英语条目作为备选: Article_ID=${articleId}`);
          filteredLocales.push(englishEntry.entry);
        } else if (entries.length > 0) {
          // 如果没有英语条目但有其他语言，使用第一个
          console.log(`🔄 使用第一个可用条目作为备选: Article_ID=${articleId}, Lang=${entries[0].lang}`);
          filteredLocales.push(entries[0].entry);
        }
      }
    }
    
    console.log(`🔍 过滤后的 Locales: ${filteredLocales.length} 条记录`);
    console.log(`🔍 过滤后的 Locales: ${filteredLocales.length} 条记录`);

    // 2-5 建立 Map 以 articleID 为 key
    const map = new Map<number, LocaleRow>();
    
    filteredLocales.forEach(l => {
      try {
        // 详细检查是否存在 Article_ID 字段以及其格式
        let articleId;
        
        // 检查各种可能的字段名称
        const properties = (l as any).properties;
        if (properties) {
          // 1. 检查 Article_ID - 新的关系类型
          if (properties.Article_ID) {
            const prop = properties.Article_ID;
            
            // 处理关系类型字段
            if (prop.type === 'relation' && Array.isArray(prop.relation) && prop.relation.length > 0) {
              // 获取关联的 Articles 表中的页面 ID
              const relatedPageId = prop.relation[0].id;
              
              // 查找对应的 Articles 页面，获取其 Article_ID (title 字段)
              const relatedArticle = articles.results.find(a => a.id === relatedPageId);
              if (relatedArticle) {
                const titleProp = (relatedArticle as any).properties.Article_ID;
                if (titleProp?.type === 'title' && titleProp.title?.length > 0) {
                  const titleText = titleProp.title[0]?.plain_text;
                  if (titleText) {
                    articleId = parseInt(titleText, 10);
                  }
                }
              }
            } else if (prop.type === 'number') {
              articleId = prop.number;
            } else if (prop.type === 'rich_text' && prop.rich_text?.length > 0) {
              articleId = parseInt(prop.rich_text[0].plain_text, 10);
            } else if (prop.type === 'title' && prop.title?.length > 0) {
              articleId = parseInt(prop.title[0].plain_text, 10);
            }
          }
          
          // 2. 如果没有找到，尝试从标题中提取
          if (!articleId) {
            // 尝试从 Title 中提取数字
            const title = safeGetProperty(l, "Title", "title");
            if (title) {
              const match = title.match(/^(\d+)/);
              if (match && match[1]) {
                articleId = parseInt(match[1], 10);
              }
            }
          }
        }
        
        // 如果还没找到，尝试从索引中推断
        if (!articleId) {
          // 查找当前页面在 filteredLocales 中的索引
          const index = filteredLocales.findIndex(item => item.id === l.id);
          if (index !== -1) {
            articleId = index + 1;
            console.log(`🔢 从索引推断 Article_ID: ${articleId}`);
          } else {
            console.log(`⚠️ Locale 无法确定 Article_ID: ${l.id}`);
            return;
          }
        }
        
        // 从 Lang 字段获取语言
        const localeLang = safeGetSelect(l, "Lang", "en");
        
        // 处理标题
        let title;
        // 从 Title 属性获取标题
        if (properties.Title) {
          const titleProp = properties.Title;
          if (titleProp.type === 'title' && Array.isArray(titleProp.title) && titleProp.title.length > 0) {
            title = titleProp.title[0]?.plain_text;
          }
        }
        
        // 如果没有标题，尝试从其他属性获取
        if (!title) {
          for (const key in properties) {
            const prop = properties[key];
            if (prop.type === "title" && prop.title && Array.isArray(prop.title) && prop.title.length > 0) {
              title = prop.title[0]?.plain_text;
              if (title) break;
            } else if (prop.type === "rich_text" && prop.rich_text && Array.isArray(prop.rich_text) && prop.rich_text.length > 0) {
              title = prop.rich_text[0]?.plain_text;
              if (title) break;
            }
          }
        }
        
        // 如果仍然没有标题，使用映射表或默认标题
        if (!title) {
          title = getArticleTitleFromMapping(localeLang, articleId) || `文章 #${articleId}`;
        }
        
        // 获取其他属性
        const slug = properties.Slug?.rich_text?.[0]?.plain_text || 
                     safeGetProperty(l, "Slug", "rich_text") || 
                     `article-${articleId}`;
        
        const summary = properties.Summary?.rich_text?.[0]?.plain_text || 
                        safeGetProperty(l, "Summary", "rich_text") || "";
        
        const tags = safeGetTags(l);
        
        console.log(`📝 处理 Locale: ID=${l.id}, Article_ID=${articleId}, Title=${title}, Slug=${slug}, Lang=${localeLang}`);
        
        map.set(
          articleId,
          {
            id:        l.id,
            articleID: articleId,
            lang:      localeLang as "en" | "zh" | "es",
            title:     title,
            slug,
            summary,
            tags,
            localePageId: l.id
          }
        );
      } catch (error) {
        console.warn(`❌ 处理 Locale 时出错: ${error}`);
      }
    });
    console.log(`🗺️ Map 大小: ${map.size}`);

    // 2-6 merge：若缺失当前语言则 fallback en
    const joined: JoinedPost[] = [];
    
    for (const a of articles.results) {
      try {
        // 获取文章的 Article_ID
        const properties = (a as any).properties;
        
        // 如果没有 properties，跳过
        if (!properties) {
          console.log(`⚠️ 文章缺少属性: ${a.id}`);
          continue;
        }
        
        // 尝试从 title 类型的 Article_ID 字段获取 ID
        let aid;
        if (properties.Article_ID && properties.Article_ID.type === 'title') {
          const titleArr = properties.Article_ID.title;
          if (Array.isArray(titleArr) && titleArr.length > 0 && titleArr[0]?.plain_text) {
            aid = parseInt(titleArr[0].plain_text, 10);
          }
        }
        
        // 如果没有找到 ID，尝试从索引推断
        if (!aid || isNaN(aid)) {
          // 使用索引作为 ID
          const index = articles.results.indexOf(a);
          aid = index + 1;
          console.log(`⚠️ 文章缺少有效的 Article_ID，使用索引: ${a.id} -> ${aid}`);
        } else {
          console.log(`✅ 成功获取文章的 Article_ID: ${aid}`);
        }
        
        console.log(`🔄 处理文章: ID=${a.id}, Article_ID=${aid}`);
        let locale = map.get(aid);
        
        if (!locale) {
          console.log(`🔤 当前语言 ${lang} 没有找到对应条目，尝试从索引匹配`);
          
          // 尝试用文章标题匹配 Locale 表中的条目
          const articleTitle = properties.Title?.rich_text?.[0]?.plain_text || '';
          
          if (articleTitle) {
            // 遍历所有 Locale 条目，查找标题匹配的
            for (const l of locales.results) {
              const localeProps = (l as any).properties;
              const localeTitle = localeProps.Title?.title?.[0]?.plain_text || '';
              const localeLang = safeGetSelect(l, "Lang", "");
              
              // 检查语言和标题是否匹配
              if (localeLang === lang && 
                  (localeTitle.includes(articleTitle) || articleTitle.includes(localeTitle))) {
                // 构建 LocaleRow 对象
                console.log(`🔍 通过标题匹配找到 Locale 条目: ${l.id}`);
                locale = {
                  id: l.id,
                  articleID: aid,
                  lang: lang as "en" | "zh" | "es",
                  title: localeTitle || articleTitle,
                  slug: localeProps.Slug?.rich_text?.[0]?.plain_text || `article-${aid}`,
                  summary: localeProps.Summary?.rich_text?.[0]?.plain_text || "",
                  tags: safeGetTags(l),
                  localePageId: l.id
                };
                break;
              }
            }
          }
          
          // 如果仍未找到，回退到英文
          if (!locale) {
            console.log(`🔤 尝试回退到英文`);
            locale = await getLocaleByArticle(aid, "en");
          }
        }
        
        // 如果仍然没有找到合适的语言版本，但我们确实有文章，创建一个基本的 Locale 对象
        if (!locale) {
          console.log(`⚙️ 创建基本的语言版本: 文章 ID=${aid}`);
          
          // 获取文章标题
          let title = '';
          if (properties.Title?.rich_text?.[0]?.plain_text) {
            title = properties.Title.rich_text[0].plain_text;
          } else {
            // 尝试寻找任何包含标题的字段
            for (const key in properties) {
              const prop = properties[key];
              if ((prop.type === 'title' && prop.title?.length > 0) ||
                  (prop.type === 'rich_text' && prop.rich_text?.length > 0)) {
                title = prop.type === 'title' ? 
                        prop.title[0]?.plain_text : 
                        prop.rich_text[0]?.plain_text;
                if (title) break;
              }
            }
            
            // 如果仍然没有标题，使用默认标题
            if (!title) {
              title = `文章 #${aid}`;
            }
          }
          
          // 创建基本的 Locale 对象
          locale = {
            id: a.id,
            articleID: aid,
            lang: lang as "en" | "zh" | "es",
            title: title,
            slug: properties.Slug_Manual?.rich_text?.[0]?.plain_text || `article-${aid}`,
            summary: "",
            tags: [],
            localePageId: a.id
          };
        }
        
        console.log(`✅ 文章 ${aid} 使用语言: ${locale.lang}, 标题: ${locale.title}`);
        
        // 获取封面图片 URL
        const coverFiles = properties.Cover?.files || [];
        const coverUrl = coverFiles[0]?.file?.url || coverFiles[0]?.external?.url || '';
        
        // 获取日期
        const date = properties.Date?.date?.start || new Date().toISOString().split('T')[0];
        
        // 获取发布状态
        const status = properties.Status?.select?.name || '';
        const publish = status === 'Published';
        
        // 只添加已发布的文章
        if (publish) {
          joined.push({
            id:        a.id,
            articleID: aid,
            date:      date,
            coverUrl:  coverUrl,
            publish:   true,
            ...locale
          });
        } else {
          console.log(`⏸️ 跳过未发布的文章: ${locale.title}, 状态: ${status}`);
        }
      } catch (error) {
        console.warn(`❌ 处理文章时出错: ${error}`);
      }
    }
    
    console.log(`📊 最终文章数量: ${joined.length}`);
    joined.forEach((post, index) => {
      console.log(`📄 #${index + 1}: ${post.title} (${post.lang})`);
    });
    
    return joined;
  } catch (error) {
    console.error(`❌❌❌ API获取文章错误: ${error}`);
    return [];
  }
}

// ③ 获取单条
export async function getPost(slug: string, lang: string): Promise<JoinedPost | null> {
  try {
    console.log(`获取${lang}文章详情，slug: ${slug}`);
    
    if (!slug || !lang) {
      console.error(`无效的请求参数 - slug: ${slug}, lang: ${lang}`);
      return null;
    }
    
    // 先获取所有 Locale 条目
    const localePages = await notion.databases.query({
      database_id: LOCALES_DB
    });
    
    console.log(`查询到 ${localePages.results.length} 个语言条目`);
    
    // 找出匹配的 Locale
    const matchingLocale = localePages.results.find(page => {
      try {
        const pageSlug = safeGetProperty(page, "Slug", "rich_text");
        const pageLang = safeGetSelect(page, "Lang");
        console.log(`检查文章: Slug=${pageSlug}, Lang=${pageLang}, 当前需要: Slug=${slug}, Lang=${lang}`);
        return pageSlug === slug && pageLang === lang;
      } catch (e) {
        return false;
      }
    });
    
    if (!matchingLocale) {
      console.log(`❌ 没有找到匹配的${lang}文章: ${slug}`);
      
      // 先尝试找到任意语言的匹配slug
      const anyLangMatch = localePages.results.find(page => {
        try {
          const pageSlug = safeGetProperty(page, "Slug", "rich_text");
          return pageSlug === slug;
        } catch (e) {
          return false;
        }
      });
      
      if (anyLangMatch) {
        console.log(`🔄 找到其他语言的相同slug文章，尝试查找当前语言版本`);
        
        try {
          // 获取关联文章ID的方法有两种：数字字段或关系字段
          let relatedArticleId = null;
          
          // 检查是否是关系字段
          const relationProperty = (anyLangMatch as any).properties.Article_ID;
          if (relationProperty?.type === 'relation' && relationProperty.relation?.length > 0) {
            relatedArticleId = relationProperty.relation[0].id;
            console.log(`📎 找到关联的文章页面ID: ${relatedArticleId}`);
            
            // 查找所有文章以获取正确的ID
            const articlesResponse = await notion.databases.query({
              database_id: ARTICLES_DB,
              page_size: 100
            });
            
            const matchedArticle = articlesResponse.results.find(a => a.id === relatedArticleId);
            
            if (matchedArticle) {
              // 找到了文章，现在查找当前语言的条目
              const langMatch = localePages.results.find(page => {
                try {
                  // 检查关系字段
                  const pageRelation = (page as any).properties.Article_ID;
                  if (pageRelation?.type === 'relation' && pageRelation.relation?.length > 0) {
                    const pageRelatedId = pageRelation.relation[0].id;
                    const pageLang = safeGetSelect(page, "Lang");
                    
                    // 检查是否指向相同的文章并且是当前语言
                    return pageRelatedId === relatedArticleId && pageLang === lang;
                  }
                  return false;
                } catch (e) {
                  return false;
                }
              });
              
              if (langMatch) {
                // 找到了对应语言的文章
                const correctSlug = safeGetProperty(langMatch, "Slug", "rich_text");
                console.log(`✅ 找到正确的${lang}版本，slug=${correctSlug}，应该跳转`);
                
                // 返回对应文章的信息
                return await processArticleLocale(langMatch);
              }
            }
          } else {
            // 旧版使用数字字段
            const aid = (anyLangMatch as any).properties.Article_ID?.number;
            
            if (aid) {
              console.log(`🔢 从数字字段获取文章ID: ${aid}`);
              
              // 尝试找到当前语言的对应文章
              const langMatch = localePages.results.find(page => {
                try {
                  const pageArticleId = (page as any).properties.Article_ID?.number;
                  const pageLang = safeGetSelect(page, "Lang");
                  return pageArticleId === aid && pageLang === lang;
                } catch (e) {
                  return false;
                }
              });
              
              if (langMatch) {
                // 找到了对应语言的文章
                const correctSlug = safeGetProperty(langMatch, "Slug", "rich_text");
                console.log(`✅ 找到正确的${lang}版本，slug=${correctSlug}，应该跳转`);
                
                // 返回对应文章的信息
                return await processArticleLocale(langMatch);
              }
            }
          }
        } catch (error) {
          console.error(`查找关联文章时出错:`, error);
        }
      }
      
      return null;
    }
    
    console.log(`✅ 找到匹配的${lang}文章: ${slug}`);
    return await processArticleLocale(matchingLocale);
  } catch (error) {
    console.error(`获取文章详情失败 (slug: ${slug}, lang: ${lang}):`, error);
    return null;
  }
}

// 提取文章处理逻辑为单独函数
async function processArticleLocale(localeEntry: any): Promise<JoinedPost | null> {
  try {
    const L = localeEntry;
    const localePageId = L.id;
    const lang = safeGetSelect(L, "Lang");
    
    // 首先，从关系型字段中尝试获取关联的文章ID
    let relatedArticleId = null;
    const relationProperty = (L as any).properties.Article_ID;
    
    if (relationProperty?.type === 'relation' && relationProperty.relation?.length > 0) {
      // 获取关联的 Articles 表中的页面 ID
      relatedArticleId = relationProperty.relation[0].id;
      console.log(`📎 找到 Locale 关联的文章 ID: ${relatedArticleId}`);
    }
    
    // 获取所有文章，以便后续处理
    console.log(`🔍 获取所有文章以进行匹配`);
    const allArticlesResponse = await notion.databases.query({
      database_id: ARTICLES_DB,
      page_size: 100 // 获取足够多的文章
    });
    
    const allArticles = allArticlesResponse.results;
    console.log(`📚 获取到 ${allArticles.length} 篇文章`);
    
    // 尝试多种方式找到匹配的文章
    let matchedArticle = null;
    
    // 1. 如果有关系ID，直接通过ID匹配
    if (relatedArticleId) {
      matchedArticle = allArticles.find(a => a.id === relatedArticleId);
      if (matchedArticle) {
        console.log(`✅ 通过关系ID直接找到匹配文章`);
      }
    }
    
    // 2. 如果没找到，尝试通过 Slug 匹配
    if (!matchedArticle) {
      const slug = safeGetProperty(L, "Slug", "rich_text");
      if (slug) {
        // 先检查 Slug_Manual 字段
        for (const article of allArticles) {
          const articleSlug = ((article as any).properties.Slug_Manual?.rich_text || [])[0]?.plain_text;
          if (articleSlug === slug) {
            matchedArticle = article;
            console.log(`✅ 通过 Slug 找到匹配文章: ${slug}`);
            break;
          }
        }
      }
    }
    
    // 3. 如果仍未找到，尝试通过标题相似度匹配
    if (!matchedArticle) {
      const localeTitle = safeGetProperty(L, "Title", "title");
      if (localeTitle) {
        for (const article of allArticles) {
          const articleTitle = ((article as any).properties.Title?.rich_text || [])[0]?.plain_text;
          
          // 检查标题相似度
          if (articleTitle && (
              articleTitle.includes(localeTitle) || 
              localeTitle.includes(articleTitle) ||
              (articleTitle.length > 10 && localeTitle.length > 10 && 
               (articleTitle.substring(0, 10) === localeTitle.substring(0, 10)))
          )) {
            matchedArticle = article;
            console.log(`✅ 通过标题相似度找到匹配文章: "${articleTitle}" ~ "${localeTitle}"`);
            break;
          }
        }
      }
    }
    
    // 如果所有尝试都失败，但列表页能看到文章，尝试使用第一篇文章
    if (!matchedArticle && allArticles.length > 0) {
      // 从 Title 属性或标题属性寻找类似标题
      const localeTitle = safeGetProperty(L, "Title", "title");
      
      // 找到可能最匹配的文章
      let bestMatch = allArticles[0];
      let bestScore = 0;
      
      for (const article of allArticles) {
        const status = ((article as any).properties.Status?.select) || {};
        // 只考虑已发布的文章
        if (status.name === "Published") {
          // 获取标题并计算相似度简单得分
          const articleTitle = ((article as any).properties.Title?.rich_text || [])[0]?.plain_text || "";
          let score = 0;
          
          if (localeTitle && articleTitle) {
            // 简单的相似度评分
            if (localeTitle === articleTitle) score += 100;
            else if (localeTitle.includes(articleTitle) || articleTitle.includes(localeTitle)) score += 50;
            else if (localeTitle.length > 5 && articleTitle.length > 5 && 
                    localeTitle.substring(0, 5) === articleTitle.substring(0, 5)) score += 30;
          }
          
          if (score > bestScore) {
            bestScore = score;
            bestMatch = article;
          }
        }
      }
      
      matchedArticle = bestMatch;
      console.log(`⚠️ 未找到完全匹配，使用最佳匹配或第一篇文章: ${matchedArticle.id}`);
    }
    
    // 如果仍然找不到任何文章，返回 null
    if (!matchedArticle) {
      console.error(`❌ 无法找到任何匹配的文章`);
      return null;
    }
    
    const art = matchedArticle;

    // 获取块内容
    const blocks = await notion.blocks.children.list({
      block_id: localePageId,
      page_size: 100
    });

    // 处理块内容，递归获取子块
    const processedBlocks = await processBlocksWithChildren(blocks.results);

    // 获取标题和其他属性
    const localeTitle = safeGetProperty(L, "Title", "title");
    const slug = safeGetProperty(L, "Slug", "rich_text");
    
    // 获取 Article_ID
    let articleId = 0;
    
    // 1. 尝试从文章的 title 属性获取
    try {
      const titleProp = (art as any).properties.Article_ID;
      if (titleProp?.type === 'title' && titleProp.title?.length > 0) {
        const titleText = titleProp.title[0]?.plain_text;
        if (titleText && !isNaN(parseInt(titleText, 10))) {
          articleId = parseInt(titleText, 10);
          console.log(`📊 从文章 title 属性获取 ID: ${articleId}`);
        }
      }
    } catch (e) {
      console.warn(`获取 Article_ID 失败:`, e);
    }
    
    // 2. 如果没有找到，使用 art.id 的哈希作为 ID
    if (!articleId) {
      const idStr = art.id.replace(/-/g, '').slice(-8);
      articleId = parseInt(idStr, 16) % 10000;
      console.log(`📄 使用文章ID哈希作为 Article_ID: ${articleId}`);
    }

    // 组装
    const coverFiles = (art as any).properties.Cover?.files || [];
    const coverUrl = coverFiles[0]?.file?.url || coverFiles[0]?.external?.url || '';
    
    const tags = safeGetTags(L);
    console.log(`文章标签: ${tags.join(', ')}`);
    
    return {
      articleID: articleId,
      id: art.id,
      date: (art as any).properties.Date?.date?.start || new Date().toISOString().split('T')[0],
      coverUrl: coverUrl,
      publish: (art as any).properties.Status?.select?.name === "Published",
      lang,
      title: localeTitle || getArticleTitleFromMapping(lang, articleId) || `文章 #${articleId}`,
      slug,
      summary: safeGetProperty(L, "Summary", "rich_text"),
      tags,
      localePageId,
      blocks: processedBlocks
    } as JoinedPost;
  } catch (error) {
    console.error(`处理文章数据失败:`, error);
    return null;
  }
}

// 递归处理块及其子块
async function processBlocksWithChildren(blocks: any[]): Promise<any[]> {
  if (!blocks || blocks.length === 0) return [];
  
  const processedBlocks = [];
  
  for (const block of blocks) {
    // 复制块数据
    const processedBlock = { ...block };
    
    // 检查块是否有子块
    if (block.has_children) {
      try {
        // 获取子块
        const childBlocks = await notion.blocks.children.list({
          block_id: block.id,
          page_size: 100
        });
        
        // 递归处理子块
        processedBlock.children = await processBlocksWithChildren(childBlocks.results);
      } catch (error) {
        console.error(`获取块${block.id}的子块失败:`, error);
        processedBlock.children = [];
      }
    } else {
      processedBlock.children = [];
    }
    
    processedBlocks.push(processedBlock);
  }
  
  return processedBlocks;
}

// ④ fallback helper
async function getLocaleByArticle(aid: number, lang = "en"): Promise<LocaleRow | null> {
  try {
    // 获取所有 Locale 条目
    const localePages = await notion.databases.query({
      database_id: LOCALES_DB
    });
    
    // 获取所有文章，以便解析关系
    const articlesResponse = await notion.databases.query({
      database_id: ARTICLES_DB
    });
    const allArticles = articlesResponse.results;
    
    // 找出匹配的 Locale
    const matchingLocale = localePages.results.find(page => {
      try {
        const properties = (page as any).properties;
        let pageArticleId;
        
        // 检查是否有 Article_ID 关系字段
        if (properties.Article_ID && properties.Article_ID.type === 'relation') {
          // 关系字段中包含关联的 Articles 数据库的页面 ID
          const relationIds = properties.Article_ID.relation || [];
          
          if (relationIds.length > 0) {
            // 先记录这个关联，后面再处理
            const relatedId = relationIds[0].id;
            console.log(`👉 Locale页面有关联关系: ${relatedId}`);
            
            // 查找对应的 Articles 记录
            const relatedArticle = allArticles.find(a => a.id === relatedId);
            if (relatedArticle) {
              // 从 Articles 记录中获取 Article_ID
              const titleProp = (relatedArticle as any).properties?.Article_ID;
              if (titleProp && titleProp.type === 'title' && titleProp.title?.length > 0) {
                const idText = titleProp.title[0]?.plain_text;
                if (idText) {
                  pageArticleId = parseInt(idText, 10);
                }
              }
            }
          }
        } else if (properties.Article_ID && properties.Article_ID.type === 'number') {
          // 旧版直接使用数字类型
          pageArticleId = properties.Article_ID.number;
        }
        
        // 如果还没找到，尝试从标题中提取
        if (!pageArticleId) {
          // 尝试从 Title 中提取数字
          const title = safeGetProperty(page, "Title", "title");
          const match = title?.match(/^(\d+)/);
          if (match && match[1]) {
            pageArticleId = parseInt(match[1], 10);
          }
        }
        
        const pageLang = safeGetSelect(page, "Lang");
        return pageArticleId === aid && pageLang === lang;
      } catch (e) {
        console.error(`匹配 Locale 时出错:`, e);
        return false;
      }
    });
    
    if (!matchingLocale) return null;
    
    const l = matchingLocale;
    const localeLang = safeGetSelect(l, "Lang", "en");
    
    // 从 title 类型属性获取标题
    const title = getArticleTitleFromMapping(lang, aid);
    
    return {
      id:        l.id,
      articleID: aid,
      lang:      localeLang as "en" | "zh" | "es",
      title,
      slug:      safeGetProperty(l, "Slug", "rich_text"),
      summary:   safeGetProperty(l, "Summary", "rich_text"),
      tags:      safeGetTags(l),
      localePageId: l.id
    };
  } catch (error) {
    console.error(`获取文章语言版本失败 (articleID: ${aid}, lang: ${lang}):`, error);
    return null;
  }
}