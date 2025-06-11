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
      filter: { property: "Status", select: { equals: "Published" } },
      sorts: [{ property: "Date", direction: "descending" }]
    });
    console.log(`📄 Articles 查询结果: ${articles.results.length} 条记录`);

    if (articles.results.length === 0) {
      console.log(`❌ 没有找到已发布的文章`);
      return [];
    }

    // 2-2 取 articleID 列表
    const ids = articles.results.map(p => {
      try {
        const id = (p as any).properties.Article_ID?.number;
        if (!id) console.log(`⚠️ 文章缺少 Article_ID: ${p.id}`);
        return id;
      } catch (e) {
        console.log(`⚠️ 获取 Article_ID 出错: ${e}`);
        return null;
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
    const filteredLocales = locales.results.filter(l => {
      try {
        const articleId = (l as any).properties.Article_ID?.number;
        const localeLang = safeGetSelect(l, "Lang");
        
        // 添加更多调试信息
        console.log(`📄 检查 Locale 条目: ID=${l.id}, Article_ID=${articleId}, Lang=${localeLang}, 请求语言=${lang}`);
        
        const isMatch = articleId && ids.includes(articleId) && localeLang === lang;
        
        if (isMatch) {
          console.log(`✅ 找到匹配的语言条目: Article_ID=${articleId}, Lang=${localeLang}`);
        } else if (articleId && ids.includes(articleId)) {
          console.log(`ℹ️ 找到文章但语言不匹配: Article_ID=${articleId}, Lang=${localeLang}`);
        }
        
        return isMatch;
      } catch (e) {
        console.log(`⚠️ 过滤 Locales 时出错: ${e}`);
        return false;
      }
    });
    console.log(`🔍 过滤后的 Locales: ${filteredLocales.length} 条记录`);

    // 2-5 建立 Map 以 articleID 为 key
    const map = new Map<number, LocaleRow>();
    
    filteredLocales.forEach(l => {
      try {
        const articleId = (l as any).properties.Article_ID?.number;
        if (!articleId) {
          console.log(`⚠️ Locale 缺少 Article_ID: ${l.id}`);
          return;
        }
        
        // 从 Lang 字段的 title 中获取语言
        const localeLang = safeGetSelect(l, "Lang", "en");
        
        // 使用新函数获取标题
        const title = getArticleTitleFromMapping(localeLang, articleId);
        
        const slug = safeGetProperty(l, "Slug", "rich_text");
        const summary = safeGetProperty(l, "Summary", "rich_text");
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
        const aid = (a as any).properties.Article_ID?.number;
        if (!aid) {
          console.log(`⚠️ 文章缺少 Article_ID: ${a.id}`);
          continue;
        }
        
        console.log(`🔄 处理文章: ID=${a.id}, Article_ID=${aid}`);
        let locale = map.get(aid);
        
        if (!locale) {
          console.log(`🔤 当前语言 ${lang} 没有找到对应条目，尝试回退到英文`);
          // fallback to en
          locale = await getLocaleByArticle(aid, "en");
        }
        
        if (!locale) {
          console.log(`❌ 文章 ${aid} 没有可用的语言版本`);
          continue;
        }
        
        console.log(`✅ 文章 ${aid} 使用语言: ${locale.lang}, 标题: ${locale.title}`);
        
        const coverFiles = (a as any).properties.Cover?.files || [];
        const coverUrl = coverFiles[0]?.file?.url || coverFiles[0]?.external?.url || '';
        
        joined.push({
          id:        a.id,
          articleID: aid,
          date:      (a as any).properties.Date?.date?.start || new Date().toISOString().split('T')[0],
          coverUrl:  coverUrl,
          publish:   true,
          ...locale
        });
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
        // 找到了其他语言的相同slug，获取Article_ID
        const aid = (anyLangMatch as any).properties.Article_ID?.number;
        
        if (aid) {
          console.log(`🔄 找到其他语言的相同slug文章，Article_ID=${aid}，尝试查找当前语言版本`);
          
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
            
            // 这里可以返回一个特殊标记，表示需要跳转
            // 但我们不在这里处理跳转，而是返回对应文章的信息
            return await processArticleLocale(langMatch);
          }
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
    const aid = (L as any).properties.Article_ID?.number;
    const lang = safeGetSelect(L, "Lang");
    
    if (!aid) {
      console.error(`找到的文章没有Article_ID: ${L.id}`);
      return null;
    }
    
    const localePageId = L.id;

    // 获取对应的 Article
    const articles = await notion.databases.query({
      database_id: ARTICLES_DB,
      filter: {
        property: "Article_ID",
        number: { equals: aid }
      }
    });
    
    if (articles.results.length === 0) {
      console.error(`没有找到对应的文章数据: Article_ID=${aid}`);
      return null;
    }
    
    const art = articles.results[0];

    // 获取块内容
    const blocks = await notion.blocks.children.list({
      block_id: localePageId,
      page_size: 100
    });

    // 处理块内容，递归获取子块
    const processedBlocks = await processBlocksWithChildren(blocks.results);

    // 从 title 类型属性获取标题
    const title = getArticleTitleFromMapping(lang, aid);
    const slug = safeGetProperty(L, "Slug", "rich_text");

    // 组装
    const coverFiles = (art as any).properties.Cover?.files || [];
    const coverUrl = coverFiles[0]?.file?.url || coverFiles[0]?.external?.url || '';
    
    const tags = safeGetTags(L);
    console.log(`文章标签: ${tags.join(', ')}`);
    
    return {
      articleID: aid,
      id: art.id,
      date: (art as any).properties.Date?.date?.start || new Date().toISOString().split('T')[0],
      coverUrl: coverUrl,
      publish: (art as any).properties.Status?.select?.name === "Published",
      lang,
      title,
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
    
    // 找出匹配的 Locale
    const matchingLocale = localePages.results.find(page => {
      try {
        const pageArticleId = (page as any).properties.Article_ID?.number;
        const pageLang = safeGetSelect(page, "Lang");
        return pageArticleId === aid && pageLang === lang;
      } catch (e) {
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