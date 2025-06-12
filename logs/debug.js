/**
 * 调试脚本 - 用于分析Notion数据库和文章映射
 */
require('dotenv').config();

// 导入必要的模块
const { Client } = require('@notionhq/client');

// 创建Notion客户端
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
  notionVersion: '2022-06-28'
});

// 数据库ID
const ARTICLES_DB = process.env.NOTION_ARTICLES_DB_ID;
const LOCALES_DB = process.env.NOTION_LOCALES_DB_ID;

// 辅助函数：安全获取属性
function safeGetProperty(obj, prop, type, defaultValue = '') {
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

// 辅助函数：安全获取Select属性
function safeGetSelect(obj, prop, defaultValue = '') {
  try {
    const select = obj.properties[prop]?.select;
    if (select?.name) {
      return select.name;
    }
    return defaultValue;
  } catch (error) {
    console.warn(`Failed to get select property ${prop}:`, error);
    return defaultValue;
  }
}

// 打印页面属性
function printPageProperties(page) {
  console.log('\n页面属性:');
  for (const [key, value] of Object.entries(page.properties)) {
    console.log(`  - ${key} (${value.type}): ${JSON.stringify(value).substring(0, 100)}...`);
  }
}

// 获取并分析所有文章
async function analyzeArticles() {
  console.log('===== 分析文章数据库 =====');
  
  try {
    // 获取所有文章
    const articlesResponse = await notion.databases.query({
      database_id: ARTICLES_DB,
      page_size: 100
    });
    
    console.log(`找到 ${articlesResponse.results.length} 篇文章`);
    
    // 分析每篇文章
    for (const article of articlesResponse.results) {
      console.log('\n文章ID:', article.id);
      printPageProperties(article);
      
      // 获取文章ID
      let articleId = null;
      if (article.properties.Article_ID) {
        if (article.properties.Article_ID.type === 'number') {
          articleId = article.properties.Article_ID.number;
        } else if (article.properties.Article_ID.type === 'title' && 
                  article.properties.Article_ID.title && 
                  article.properties.Article_ID.title.length > 0) {
          articleId = article.properties.Article_ID.title[0].plain_text;
        }
      }
      
      console.log(`  文章ID: ${articleId}`);
      
      // 获取标题
      let title = '';
      if (article.properties.Title) {
        if (article.properties.Title.type === 'title' && 
            article.properties.Title.title && 
            article.properties.Title.title.length > 0) {
          title = article.properties.Title.title[0].plain_text;
        } else if (article.properties.Title.type === 'rich_text' && 
                  article.properties.Title.rich_text && 
                  article.properties.Title.rich_text.length > 0) {
          title = article.properties.Title.rich_text[0].plain_text;
        }
      }
      
      console.log(`  标题: ${title}`);
    }
  } catch (error) {
    console.error('分析文章失败:', error);
  }
}

// 获取并分析所有语言版本
async function analyzeLocales() {
  console.log('\n===== 分析语言数据库 =====');
  
  try {
    // 获取所有语言条目
    const localesResponse = await notion.databases.query({
      database_id: LOCALES_DB,
      page_size: 100
    });
    
    console.log(`找到 ${localesResponse.results.length} 条语言记录`);
    
    // 收集所有文章ID的语言版本
    const articleLocales = {};
    
    // 分析每个语言条目
    for (const locale of localesResponse.results) {
      console.log('\n语言条目ID:', locale.id);
      printPageProperties(locale);
      
      // 获取关联的文章ID
      let articleId = null;
      if (locale.properties.Article_ID) {
        if (locale.properties.Article_ID.type === 'relation' && 
            locale.properties.Article_ID.relation && 
            locale.properties.Article_ID.relation.length > 0) {
          // 关系类型
          const relationId = locale.properties.Article_ID.relation[0].id;
          console.log(`  关联ID: ${relationId}`);
          // 这里需要额外查询获取实际的文章ID
        } else if (locale.properties.Article_ID.type === 'number') {
          // 数字类型
          articleId = locale.properties.Article_ID.number;
        } else if (locale.properties.Article_ID.type === 'rich_text' && 
                  locale.properties.Article_ID.rich_text && 
                  locale.properties.Article_ID.rich_text.length > 0) {
          // 文本类型
          articleId = locale.properties.Article_ID.rich_text[0].plain_text;
        }
      }
      
      // 获取语言
      const lang = safeGetSelect(locale, 'Lang', '未知');
      
      // 获取Slug
      let slug = safeGetProperty(locale, 'Slug', 'rich_text', '');
      
      // 获取标题
      let title = '';
      if (locale.properties.Title) {
        if (locale.properties.Title.type === 'title' && 
            locale.properties.Title.title && 
            locale.properties.Title.title.length > 0) {
          title = locale.properties.Title.title[0].plain_text;
        } else if (locale.properties.Title.type === 'rich_text' && 
                  locale.properties.Title.rich_text && 
                  locale.properties.Title.rich_text.length > 0) {
          title = locale.properties.Title.rich_text[0].plain_text;
        }
      }
      
      console.log(`  文章ID: ${articleId}, 语言: ${lang}, Slug: ${slug}, 标题: ${title}`);
      
      // 添加到映射
      if (articleId) {
        if (!articleLocales[articleId]) {
          articleLocales[articleId] = {};
        }
        articleLocales[articleId][lang] = { slug, title };
      }
    }
    
    // 打印文章-语言映射
    console.log('\n===== 文章-语言映射 =====');
    for (const [articleId, locales] of Object.entries(articleLocales)) {
      console.log(`\n文章 #${articleId}:`);
      for (const [lang, data] of Object.entries(locales)) {
        console.log(`  - ${lang}: ${data.title} (slug: ${data.slug})`);
      }
    }
  } catch (error) {
    console.error('分析语言条目失败:', error);
  }
}

// 主函数
async function main() {
  console.log('开始分析Notion数据库...');
  
  try {
    await analyzeArticles();
    await analyzeLocales();
    
    console.log('\n分析完成!');
  } catch (error) {
    console.error('分析过程出错:', error);
  }
}

// 执行主函数
main(); 