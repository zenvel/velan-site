import { Client } from '@notionhq/client';

// 创建专用的Notion客户端实例
const featuresNotion = new Client({ 
  auth: process.env.NOTION_FEATURES_TOKEN || '',
  notionVersion: '2022-06-28',
  timeoutMs: 60000,
});

// 数据库ID - 获取原始ID
const FEATURES_DB = process.env.NOTION_FEATURES_DB_ID || '';
const FEATURES_LOCALES_DB = process.env.NOTION_FEATURES_LOCALES_DB_ID || '';

// 添加连字符，使其成为有效的UUID格式
function formatUUID(id: string): string {
  if (!id) return '';
  
  // 移除所有连字符
  const cleanId = id.replace(/-/g, '');
  
  // 如果长度不是32，返回原始ID
  if (cleanId.length !== 32) return id;
  
  // 添加连字符，格式化为UUID
  return cleanId.substring(0, 8) + '-' + 
         cleanId.substring(8, 12) + '-' + 
         cleanId.substring(12, 16) + '-' + 
         cleanId.substring(16, 20) + '-' + 
         cleanId.substring(20);
}

// 格式化数据库ID
const formattedFeaturesDB = formatUUID(FEATURES_DB);
const formattedFeaturesLocalesDB = formatUUID(FEATURES_LOCALES_DB);

// 添加日志
console.log('原始 Features DB ID:', FEATURES_DB);
console.log('格式化后 Features DB ID:', formattedFeaturesDB);
console.log('原始 Features Locales DB ID:', FEATURES_LOCALES_DB);
console.log('格式化后 Features Locales DB ID:', formattedFeaturesLocalesDB);

// 缓存机制
const CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存过期时间
const featuresCache = new Map<string, { data: any[], timestamp: number }>();

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
    } catch (error: any) {
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

// Feature类型定义
export interface Feature {
  id: string;
  featureId: number;
  slug: string;
  icon: string;
  title: string;
  summary: string;
  order: number;
}

// 获取Features功能
export async function getFeatures(lang: string): Promise<Feature[]> {
  try {
    // 检查环境变量
    console.log('NOTION_FEATURES_TOKEN:', process.env.NOTION_FEATURES_TOKEN ? '已设置' : '未设置');
    console.log('NOTION_FEATURES_DB_ID:', process.env.NOTION_FEATURES_DB_ID);
    console.log('NOTION_FEATURES_LOCALES_DB_ID:', process.env.NOTION_FEATURES_LOCALES_DB_ID);
    
    // 验证数据库ID
    if (!formattedFeaturesDB || !formattedFeaturesLocalesDB) {
      console.error('❌ 数据库ID未设置，无法获取Features数据');
      return [];
    }

    console.log('⚠️ 注意：请确保Notion集成已被添加到Features数据库中，并具有访问权限');
    console.log('👉 集成访问指南: https://developers.notion.com/docs/create-a-notion-integration#give-your-integration-page-permissions');
    
    // 检查缓存
    const cacheKey = `features_${lang}`;
    const cachedData = featuresCache.get(cacheKey);
    const now = Date.now();
    
    if (cachedData && (now - cachedData.timestamp) < CACHE_TTL) {
      console.log(`使用缓存的Features数据，语言: ${lang}`);
      return cachedData.data as Feature[];
    }
    
    console.log(`从Notion获取Features数据，语言: ${lang}`);
    
    // 获取主表Features数据
    const featuresResponse = await notionApiWithRetry(
      () => featuresNotion.databases.query({
        database_id: formattedFeaturesDB,
        sorts: [{ property: "Order", direction: "ascending" }]
      }),
      '获取Features列表'
    );
    
    console.log(`获取到 ${featuresResponse.results.length} 个Features`);
    
    // 获取Feature_Locales数据
    const localesResponse = await notionApiWithRetry(
      () => featuresNotion.databases.query({
        database_id: formattedFeaturesLocalesDB,
        filter: {
          property: "Lang",
          select: {
            equals: lang
          }
        }
      }),
      '获取Feature_Locales列表'
    );
    
    console.log(`获取到 ${localesResponse.results.length} 个Feature_Locales (语言: ${lang})`);
    
    // 建立Feature ID到Feature的映射
    const featuresById = new Map();
    
    // 处理主表数据
    featuresResponse.results.forEach(feature => {
      try {
        const properties = (feature as any).properties;
        const featureId = properties.Feature_ID?.number || 0;
        
        if (featureId) {
          featuresById.set(featureId, {
            id: feature.id,
            featureId,
            slug: properties.Slug?.rich_text?.[0]?.plain_text || '',
            order: properties.Order?.number || 999,
            icon: properties.Icon?.files?.[0]?.file?.url || 
                  properties.Icon?.files?.[0]?.external?.url || ''
          });
        }
      } catch (error) {
        console.warn(`处理Feature时出错:`, error);
      }
    });
    
    console.log(`处理后的Features数量: ${featuresById.size}`);
    
    // 处理本地化数据并合并结果
    const result: Feature[] = [];
    
    // 按Feature_ID和语言分组
    const localesByFeatureId = new Map();
    
    localesResponse.results.forEach(locale => {
      try {
        const properties = (locale as any).properties;
        
        // 获取Feature_ID（关系字段）
        let featureId = null;
        if (properties.Feature_ID?.relation?.length > 0) {
          // 通过关系获取ID
          const relatedFeatureId = properties.Feature_ID.relation[0].id;
          
          // 查找对应的Feature ID
          for (const [id, feature] of featuresById.entries()) {
            if (feature.id === relatedFeatureId) {
              featureId = id;
              break;
            }
          }
        } else if (properties.Feature_ID?.number) {
          // 直接使用数字ID
          featureId = properties.Feature_ID.number;
        }
        
        if (!featureId) {
          console.log('未找到Feature ID，跳过此Locale');
          return;
        }
        
        const title = safeGetProperty(locale, "Title", "title");
        const summary = safeGetProperty(locale, "Summary", "rich_text");
        
        console.log(`处理Locale: featureId=${featureId}, title=${title}`);
        
        // 按Feature ID分组
        if (!localesByFeatureId.has(featureId)) {
          localesByFeatureId.set(featureId, { title, summary });
        }
      } catch (error) {
        console.warn(`处理Feature Locale时出错:`, error);
      }
    });
    
    console.log(`处理后的Locales数量: ${localesByFeatureId.size}`);
    
    // 合并数据
    for (const [featureId, feature] of featuresById.entries()) {
      try {
        const localeData = localesByFeatureId.get(featureId);
        
        // 如果没有本地化数据，跳过此Feature
        if (!localeData) {
          console.log(`Feature #${featureId} 没有本地化数据，跳过`);
          continue;
        }
        
        result.push({
          id: feature.id,
          featureId,
          slug: feature.slug,
          icon: feature.icon,
          order: feature.order,
          title: localeData.title || `Feature #${featureId}`,
          summary: localeData.summary || ''
        });
      } catch (error) {
        console.warn(`合并Feature数据时出错:`, error);
      }
    }
    
    // 按order排序
    result.sort((a, b) => a.order - b.order);
    
    console.log(`最终返回 ${result.length} 个Features`);
    
    // 更新缓存
    featuresCache.set(cacheKey, {
      data: result,
      timestamp: now
    });
    
    return result;
  } catch (error) {
    console.error(`❌ 获取Features错误:`, error);
    return [];
  }
}