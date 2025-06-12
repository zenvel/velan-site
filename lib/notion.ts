import { Client } from '@notionhq/client';
import { ArticleRow, LocaleRow, JoinedPost } from './notion-types';

// 创建Notion客户端实例
const notion = new Client({ 
  auth: process.env.NOTION_TOKEN || '',
  notionVersion: '2022-06-28', // 明确指定API版本
  timeoutMs: 60000, // 增加超时时间到60秒
});

// ① 把数据库 ID 换成你的
const ARTICLES_DB   = process.env.NOTION_ARTICLES_DB_ID!
const LOCALES_DB    = process.env.NOTION_LOCALES_DB_ID!

// 带重试机制的API包装函数
async function notionApiWithRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      return result;
    } catch (error) {
      lastError = error as Error;
      const isNetworkError = error.message?.includes('fetch failed') || 
                            error.message?.includes('ECONNRESET') ||
                            error.message?.includes('timeout') ||
                            error.code === 'ECONNRESET';
      
      console.warn(`⚠️ ${operationName} - 第${attempt}次尝试失败:`, error.message);
      
      if (!isNetworkError || attempt === maxRetries) {
        // 非网络错误或已达到最大重试次数，直接抛出错误
        break;
      }
      
      // 等待后重试
      const waitTime = delay * attempt; // 递增延迟
      console.log(`🔄 ${waitTime}ms后进行第${attempt + 1}次重试...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  console.error(`❌ ${operationName} - 所有重试都失败了`);
  throw lastError;
}

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
  
      return title;
    }
    
    // 如果该语言版本不存在，尝试使用英文版
    if (lang !== 'en' && ARTICLE_TITLES['en'] && ARTICLE_TITLES['en'][articleId]) {
      const title = ARTICLE_TITLES['en'][articleId];
  
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
  
        
        // 输出这个属性的详细内容
        if (prop.title && Array.isArray(prop.title)) {
          console.log(`📄 ${key} 属性内容:`, JSON.stringify(prop.title).substring(0, 200));
          
          if (prop.title.length > 0 && prop.title[0]?.plain_text) {
            const title = prop.title[0].plain_text;
    
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
    
      
      // 输出所有属性的详细信息
      for (const key in page.properties) {
        const prop = page.properties[key];
        console.log(`📄 属性 ${key}:`, prop.type, JSON.stringify(prop).substring(0, 100) + '...');
      }
      
      // 尝试从 Title 属性获取
      const title = page.properties.Title?.title;
      if (title && Array.isArray(title) && title.length > 0) {

        return title[0]?.plain_text || defaultTitle;
      }
      
      // 尝试从 Name 属性获取
      const nameTitle = page.properties.Name?.title;
      if (nameTitle && Array.isArray(nameTitle) && nameTitle.length > 0) {

        return nameTitle[0]?.plain_text || defaultTitle;
      }
      
      // 尝试从 Page 属性获取
      const pageTitle = page.properties.Page?.title;
      if (pageTitle && Array.isArray(pageTitle) && pageTitle.length > 0) {

        return pageTitle[0]?.plain_text || defaultTitle;
      }
      
      // 尝试遍历所有属性寻找 title 类型
      for (const key in page.properties) {
        const prop = page.properties[key];
        if (prop.type === "title" && prop.title && Array.isArray(prop.title) && prop.title.length > 0) {

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
  try {
    // 获取所有文章
    const articles = await notionApiWithRetry(
      () => notion.databases.query({
        database_id: ARTICLES_DB,
        sorts: [{ property: "Date", direction: "descending" }]
      }),
      '获取Articles列表'
    );

    if (articles.results.length === 0) {
      return [];
    }

    // 获取文章ID列表
    const ids = articles.results.map((p, index) => {
      try {
        let id;
        const properties = (p as any).properties;
        
        if (properties?.Article_ID) {
          const prop = properties.Article_ID;
          if (prop.type === 'number') {
            id = prop.number;
          } else if (prop.type === 'rich_text' && prop.rich_text?.length > 0) {
            id = parseInt(prop.rich_text[0].plain_text, 10);
          } else if (prop.type === 'title' && prop.title?.length > 0) {
            id = parseInt(prop.title[0].plain_text, 10);
          }
        }
        
        if (!id && properties?.ArticleID) {
          const prop = properties.ArticleID;
          if (prop.type === 'number') {
            id = prop.number;
          } else if (prop.type === 'rich_text' && prop.rich_text?.length > 0) {
            id = parseInt(prop.rich_text[0].plain_text, 10);
          } else if (prop.type === 'title' && prop.title?.length > 0) {
            id = parseInt(prop.title[0].plain_text, 10);
          }
        }
        
        if (!id && properties?.ID) {
          const prop = properties.ID;
          if (prop.type === 'number') {
            id = prop.number;
          } else if (prop.type === 'rich_text' && prop.rich_text?.length > 0) {
            id = parseInt(prop.rich_text[0].plain_text, 10);
          } else if (prop.type === 'title' && prop.title?.length > 0) {
            id = parseInt(prop.title[0].plain_text, 10);
          }
        }
        
        if (!id || isNaN(id)) {
          id = index + 1;
        }
        
        return id;
      } catch (e) {
        return index + 1;
      }
    }).filter(Boolean);

    // 获取所有语言版本数据
    const locales = await notionApiWithRetry(
      () => notion.databases.query({
        database_id: LOCALES_DB
      }),
      '获取Locales列表'
    );

    // 过滤符合条件的数据
    const localeMap = new Map<number, any[]>();
    
    // 将 Locale 条目按照 Article_ID 分组
    locales.results.forEach((l, index) => {
      try {
        let articleId;
        const properties = (l as any).properties;
        
        if (properties?.Article_ID) {
          const prop = properties.Article_ID;
          
          if (prop.type === 'relation' && Array.isArray(prop.relation) && prop.relation.length > 0) {
            const relatedPageId = prop.relation[0].id;
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
        
        if (!articleId && properties?.ArticleID) {
          const prop = properties.ArticleID;
          if (prop.type === 'number') {
            articleId = prop.number;
          } else if (prop.type === 'rich_text' && prop.rich_text?.length > 0) {
            articleId = parseInt(prop.rich_text[0].plain_text, 10);
          } else if (prop.type === 'title' && prop.title?.length > 0) {
            articleId = parseInt(prop.title[0].plain_text, 10);
          }
        }
        
        if (!articleId) {
          const title = safeGetProperty(l, "Title", "title");
          if (title) {
            const match = title.match(/^(\d+)/);
            if (match && match[1]) {
              articleId = parseInt(match[1], 10);
            }
          }
        }
        
        if (!articleId || isNaN(articleId)) {
          const localeTitle = safeGetProperty(l, "Title", "title");
          if (localeTitle) {
            for (const article of articles.results) {
              const articleTitle = safeGetProperty(article, "Title", "rich_text");
              if (articleTitle && (
                  articleTitle.includes(localeTitle) || 
                  localeTitle.includes(articleTitle) ||
                  (articleTitle.length > 10 && localeTitle.length > 10 && 
                   (articleTitle.substring(0, 10) === localeTitle.substring(0, 10)))
              )) {
                const artId = articles.results.indexOf(article) + 1;
                articleId = artId;
                break;
              }
            }
          }
          
          if (!articleId || isNaN(articleId)) {
            articleId = index + 1;
          }
        }
        
        const localeLang = safeGetSelect(l, "Lang");
        
        if (!localeMap.has(articleId)) {
          localeMap.set(articleId, []);
        }
        localeMap.get(articleId)?.push({
          entry: l,
          lang: localeLang
        });
      } catch (e) {
        console.warn(`处理 Locale 条目时出错: ${e}`);
      }
    });
    
    // 选择匹配当前语言的条目
    const filteredLocales = [];
    for (const articleId of ids) {
      const entries = localeMap.get(articleId) || [];
      
      const matchingEntry = entries.find(e => e.lang === lang);
      if (matchingEntry) {
        filteredLocales.push(matchingEntry.entry);
      } else {
        const englishEntry = entries.find(e => e.lang === 'en');
        if (englishEntry) {
          filteredLocales.push(englishEntry.entry);
        } else if (entries.length > 0) {
          filteredLocales.push(entries[0].entry);
        }
      }
    }

    // 建立 Map 以 articleID 为 key
    const map = new Map<number, LocaleRow>();
    
    filteredLocales.forEach(l => {
      try {
        let articleId;
        const properties = (l as any).properties;
        
        if (properties?.Article_ID) {
          const prop = properties.Article_ID;
          
          if (prop.type === 'relation' && Array.isArray(prop.relation) && prop.relation.length > 0) {
            const relatedPageId = prop.relation[0].id;
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
        
        if (!articleId) {
          const title = safeGetProperty(l, "Title", "title");
          if (title) {
            const match = title.match(/^(\d+)/);
            if (match && match[1]) {
              articleId = parseInt(match[1], 10);
            }
          }
        }
        
        if (!articleId) {
          const index = filteredLocales.findIndex(item => item.id === l.id);
          if (index !== -1) {
            articleId = index + 1;
          } else {
            return;
          }
        }
        
        const localeLang = safeGetSelect(l, "Lang", "en");
        
        let title;
        if (properties?.Title?.type === 'title' && Array.isArray(properties.Title.title) && properties.Title.title.length > 0) {
          title = properties.Title.title[0]?.plain_text;
        }
        
        if (!title) {
          for (const key in properties || {}) {
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
        
        if (!title) {
          title = getArticleTitleFromMapping(localeLang, articleId) || `文章 #${articleId}`;
        }
        
        let slug = '';
        if (properties?.Slug?.type === 'formula' && properties.Slug.formula?.string) {
          slug = properties.Slug.formula.string;
        } else if (properties?.Slug_Manual?.rich_text?.[0]?.plain_text) {
          slug = properties.Slug_Manual.rich_text[0].plain_text;
        } else if (properties?.Slug?.rich_text?.[0]?.plain_text) {
          slug = properties.Slug.rich_text[0].plain_text;
        }
        
        if (!slug) {
          console.warn(`⚠️ 文章 Article_ID=${articleId} 缺少Slug字段，跳过`);
          return;
        }
        
        const summary = properties?.Summary?.rich_text?.[0]?.plain_text || 
                        safeGetProperty(l, "Summary", "rich_text") || "";
        
        const tags = safeGetTags(l);
        
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

    // merge 文章和语言信息
    const joined: JoinedPost[] = [];
    
    for (const a of articles.results) {
      try {
        const properties = (a as any).properties;
        if (!properties) continue;
        
        let aid;
        if (properties.Article_ID?.type === 'title') {
          const titleArr = properties.Article_ID.title;
          if (Array.isArray(titleArr) && titleArr.length > 0 && titleArr[0]?.plain_text) {
            aid = parseInt(titleArr[0].plain_text, 10);
          }
        }
        
        if (!aid || isNaN(aid)) {
          const index = articles.results.indexOf(a);
          aid = index + 1;
        }
        
        let locale = map.get(aid);
        
        if (!locale) {
          const articleTitle = properties.Title?.rich_text?.[0]?.plain_text || '';
          
          if (articleTitle) {
            for (const l of locales.results) {
              const localeProps = (l as any).properties;
              const localeTitle = localeProps.Title?.title?.[0]?.plain_text || '';
              const localeLang = safeGetSelect(l, "Lang", "");
              
              if (localeLang === lang && 
                  (localeTitle.includes(articleTitle) || articleTitle.includes(localeTitle))) {
                let matchSlug = '';
                if (localeProps.Slug?.type === 'formula' && localeProps.Slug.formula?.string) {
                  matchSlug = localeProps.Slug.formula.string;
                } else if (localeProps.Slug_Manual?.rich_text?.[0]?.plain_text) {
                  matchSlug = localeProps.Slug_Manual.rich_text[0].plain_text;
                } else if (localeProps.Slug?.rich_text?.[0]?.plain_text) {
                  matchSlug = localeProps.Slug.rich_text[0].plain_text;
                }
                
                if (!matchSlug) {
                  console.warn(`⚠️ 匹配的Locale条目缺少Slug字段`);
                  break;
                }
                
                locale = {
                  id: l.id,
                  articleID: aid,
                  lang: lang as "en" | "zh" | "es",
                  title: localeTitle || articleTitle,
                  slug: matchSlug,
                  summary: localeProps.Summary?.rich_text?.[0]?.plain_text || "",
                  tags: safeGetTags(l),
                  localePageId: l.id
                };
                break;
              }
            }
          }
          
          if (!locale) {
            locale = await getLocaleByArticle(aid, "en");
          }
        }
        
        if (!locale) {
          let title = '';
          if (properties.Title?.rich_text?.[0]?.plain_text) {
            title = properties.Title.rich_text[0].plain_text;
          } else {
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
            
            if (!title) {
              title = `文章 #${aid}`;
            }
          }
          
          let fallbackSlug = '';
          if (properties.Slug_Manual?.rich_text?.[0]?.plain_text) {
            fallbackSlug = properties.Slug_Manual.rich_text[0].plain_text;
          }
          
          if (!fallbackSlug) {
            console.warn(`⚠️ 文章 ${aid} 缺少Slug，跳过`);
            continue;
          }
          
          locale = {
            id: a.id,
            articleID: aid,
            lang: lang as "en" | "zh" | "es",
            title: title,
            slug: fallbackSlug,
            summary: "",
            tags: [],
            localePageId: a.id
          };
        }
        
        const coverFiles = properties.Cover?.files || [];
        const coverUrl = coverFiles[0]?.file?.url || coverFiles[0]?.external?.url || '';
        
        const date = properties.Date?.date?.start || new Date().toISOString().split('T')[0];
        
        const status = properties.Status?.select?.name || '';
        const publish = status === 'Published';
        
        if (publish) {
          joined.push({
            id:        a.id,
            articleID: aid,
            date:      date,
            coverUrl:  coverUrl,
            publish:   true,
            ...locale
          });
        }
      } catch (error) {
        console.warn(`❌ 处理文章时出错: ${error}`);
      }
    }
    
    return joined;
  } catch (error) {
    console.error(`❌❌❌ API获取文章错误:`, error);
    
    // 更详细的错误信息
    if (error instanceof Error) {
      console.error('错误类型:', error.name);
      console.error('错误消息:', error.message);
      console.error('错误堆栈:', error.stack?.substring(0, 500));
    }
    
    // 检查是否是网络错误
    if (error.message?.includes('fetch failed') || error.message?.includes('timeout')) {
      console.error('🌐 网络连接问题，请检查网络状态');
    }
    
    return [];
  }
}

// ③ 获取单条
export async function getPost(slug: string, lang: string): Promise<JoinedPost | null> {
  try {
    if (!slug || !lang) {
      return null;
    }
    
    // 先获取所有 Locale 条目（使用重试机制）
    const localePages = await notionApiWithRetry(
      () => notion.databases.query({
        database_id: LOCALES_DB
      }),
      '获取Locale条目'
    );
    

    
    // 找出匹配的 Locale
    const matchingLocale = localePages.results.find(page => {
      try {
        const properties = (page as any).properties;
        let pageSlug = '';
        
        // 优先从formula字段获取Slug
        if (properties.Slug?.type === 'formula' && properties.Slug.formula?.string) {
          pageSlug = properties.Slug.formula.string;
        }
        // 然后尝试从 Slug_Manual rich_text 字段获取
        else if (properties.Slug_Manual?.rich_text?.[0]?.plain_text) {
          pageSlug = properties.Slug_Manual.rich_text[0].plain_text;
        }
        // 最后尝试从 rich_text 类型的 Slug 字段获取
        else {
          pageSlug = safeGetProperty(page, "Slug", "rich_text");
        }
        
        const pageLang = safeGetSelect(page, "Lang");
        
        // 直接使用从数据库获取的slug
        let cleanPageSlug = pageSlug;
        
        return cleanPageSlug === slug && pageLang === lang;
      } catch (e) {
        return false;
      }
    });
    
    if (!matchingLocale) {
      // 尝试找到任意语言的匹配slug
      const anyLangMatch = localePages.results.find(page => {
        try {
          const properties = (page as any).properties;
          let pageSlug = '';
          
          if (properties.Slug?.type === 'formula' && properties.Slug.formula?.string) {
            pageSlug = properties.Slug.formula.string;
          } else if (properties.Slug_Manual?.rich_text?.[0]?.plain_text) {
            pageSlug = properties.Slug_Manual.rich_text[0].plain_text;
          } else {
            pageSlug = safeGetProperty(page, "Slug", "rich_text");
          }
          
          let cleanPageSlug = pageSlug;
          return cleanPageSlug === slug;
        } catch (e) {
          return false;
        }
      });
      
      if (anyLangMatch) {
        try {
          let relatedArticleId = null;
          
          const relationProperty = (anyLangMatch as any).properties.Article_ID;
          if (relationProperty?.type === 'relation' && relationProperty.relation?.length > 0) {
            relatedArticleId = relationProperty.relation[0].id;
            
            const articlesResponse = await notionApiWithRetry(
              () => notion.databases.query({
                database_id: ARTICLES_DB,
                page_size: 100
              }),
              '获取Articles条目'
            );
            
            const matchedArticle = articlesResponse.results.find(a => a.id === relatedArticleId);
            
            if (matchedArticle) {
              const langMatch = localePages.results.find(page => {
                try {
                  const pageRelation = (page as any).properties.Article_ID;
                  if (pageRelation?.type === 'relation' && pageRelation.relation?.length > 0) {
                    const pageRelatedId = pageRelation.relation[0].id;
                    const pageLang = safeGetSelect(page, "Lang");
                    return pageRelatedId === relatedArticleId && pageLang === lang;
                  }
                  return false;
                } catch (e) {
                  return false;
                }
              });
              
              if (langMatch) {
                return await processArticleLocale(langMatch);
              }
            }
          } else {
            const aid = (anyLangMatch as any).properties.Article_ID?.number;
            
            if (aid) {
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
      relatedArticleId = relationProperty.relation[0].id;
    }
    
    // 获取所有文章，以便后续处理
    const allArticlesResponse = await notionApiWithRetry(
      () => notion.databases.query({
        database_id: ARTICLES_DB,
        page_size: 100
      }),
      '获取所有Articles条目'
    );
    
    const allArticles = allArticlesResponse.results;
    
    // 尝试多种方式找到匹配的文章
    let matchedArticle = null;
    
    // 如果有关系ID，直接通过ID匹配
    if (relatedArticleId) {
      matchedArticle = allArticles.find(a => a.id === relatedArticleId);
    }
    
    // 如果没找到，尝试通过 Slug 匹配
    if (!matchedArticle) {
      const slug = safeGetProperty(L, "Slug", "rich_text");
      if (slug) {
        for (const article of allArticles) {
          const articleSlug = ((article as any).properties.Slug_Manual?.rich_text || [])[0]?.plain_text;
          if (articleSlug === slug) {
            matchedArticle = article;
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

    // 获取块内容（使用重试机制）
    const blocks = await notionApiWithRetry(
      () => notion.blocks.children.list({
        block_id: localePageId,
        page_size: 100
      }),
      '获取页面块内容'
    );

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
  
        }
      }
    } catch (e) {
      console.warn(`获取 Article_ID 失败:`, e);
    }
    
    // 2. 如果没有找到，使用 art.id 的哈希作为 ID
    if (!articleId) {
      const idStr = art.id.replace(/-/g, '').slice(-8);
      articleId = parseInt(idStr, 16) % 10000;

    }

    // 组装
    const coverFiles = (art as any).properties.Cover?.files || [];
    const coverUrl = coverFiles[0]?.file?.url || coverFiles[0]?.external?.url || '';
    
    const tags = safeGetTags(L);
    
    
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
        // 获取子块（使用重试机制）
        const childBlocks = await notionApiWithRetry(
          () => notion.blocks.children.list({
            block_id: block.id,
            page_size: 100
          }),
          `获取子块内容[${block.id}]`
        );
        
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
    // 获取所有 Locale 条目（使用重试机制）
    const localePages = await notionApiWithRetry(
      () => notion.databases.query({
        database_id: LOCALES_DB
      }),
      '获取Locale条目'
    );
    
    // 获取所有文章，以便解析关系（使用重试机制）
    const articlesResponse = await notionApiWithRetry(
      () => notion.databases.query({
        database_id: ARTICLES_DB
      }),
      '获取Articles条目'
    );
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

const NEWSLETTER_DB = process.env.NOTION_NEWSLETTER_DB_ID;

export async function fetchIssueById(id: string) {
  const response = await notion.pages.retrieve({ page_id: id });
  const properties = response.properties as any;
  
  return {
    title: properties.Title.title[0].plain_text,
    content: properties.Content.rich_text[0].plain_text,
    articles: properties.Articles.relation.map((r: any) => ({
      slug: r.id,
      title: r.title
    }))
  };
}

export async function updateIssueStatus(id: string, status: string) {
  await notion.pages.update({
    page_id: id,
    properties: {
      Status: {
        select: {
          name: status
        }
      }
    }
  });
}