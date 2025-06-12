import { JoinedPost } from './notion-types';
import { getPosts, getPost, getPostLocales } from './notion';
import { defaultLocale } from '@/i18n';

// 定义文章本地化数据的类型
interface LocaleData {
  slug: string;
  title: string;
}

// 定义文章映射的类型
interface ArticleMapping {
  id: number;
  slug_base: string;
  locales: {
    [key: string]: LocaleData;
  };
}

/**
 * 获取所有文章，按语言分组
 */
export async function fetchAllArticles() {
  // 获取所有支持的语言版本的文章
  const zhPosts = await getPosts('zh');
  const enPosts = await getPosts('en');
  const esPosts = await getPosts('es');
  
  // 建立文章ID到各语言slug的映射
  const articlesMap = new Map<number, ArticleMapping>();
  
  // 处理所有文章数据
  const processArticles = (posts: JoinedPost[], lang: string) => {
    posts.forEach(post => {
      if (!articlesMap.has(post.articleID)) {
        articlesMap.set(post.articleID, {
          id: post.articleID,
          slug_base: post.slug,
          locales: {}
        });
      }
      
      // 添加语言版本信息
      const article = articlesMap.get(post.articleID);
      if (article) {
        article.locales[lang] = {
          slug: post.slug,
          title: post.title
        };
      }
    });
  };
  
  // 处理所有语言的文章
  processArticles(zhPosts, 'zh');
  processArticles(enPosts, 'en'); 
  processArticles(esPosts, 'es');
  
  // 转换为数组返回
  return Array.from(articlesMap.values());
}

/**
 * 生成所有静态路径 - 用于getStaticPaths
 */
export async function getStaticBlogPaths() {
  const articles = await getPosts("en"); // 获取英文文章列表
  
  // 为每篇文章获取所有语言版本
  const pathsPromises = articles.map(async (article) => {
    const locales = await getPostLocales(article.articleID.toString());
    
    // 为每个语言版本创建路径
    return locales.map(locale => ({
      params: {
        slug: locale.slug,
        locale: locale.lang
      }
    }));
  });
  
  // 等待所有路径生成完成
  const nestedPaths = await Promise.all(pathsPromises);
  
  // 将嵌套数组展平
  const paths = nestedPaths.flat();
  
  console.log(`生成静态路径: ${JSON.stringify(paths)}`);
  
  return {
    paths,
    fallback: 'blocking' // 允许动态生成其他路径
  };
}

/**
 * 根据slug获取文章内容 - 用于getStaticProps
 */
export async function fetchArticleBySlug(params: { slug: string | string[], locale: string } | Promise<{ slug: string | string[], locale: string }>) {
  // 确保params已解析
  const resolvedParams = await Promise.resolve(params);
  const { slug, locale } = resolvedParams;
  
  console.log(`获取文章内容，参数:`, JSON.stringify({ slug, locale }));
  
  // 处理slug参数 - 支持多段路径
  let slugPath = '';
  if (Array.isArray(slug)) {
    console.log(`Slug是数组: ${slug.join('/')}`);
    slugPath = slug.join('/');
  } else {
    console.log(`Slug是字符串: ${slug}`);
    slugPath = slug;
  }
  
  try {
    // 1. 直接尝试使用当前语言和slug获取文章
    console.log(`尝试获取文章，slug=${slugPath}, locale=${locale}`);
    let article = await getPost(slugPath, locale);
    
    // 2. 如果未找到，获取所有该语言的文章，查找匹配的slug
    if (!article) {
      console.log(`直接获取未找到文章，尝试从所有${locale}文章中查找...`);
      const allPosts = await getPosts(locale);
      article = allPosts.find(post => post.slug === slugPath);
      
      // 3. 如果仍未找到，尝试部分匹配
      if (!article) {
        console.log(`通过完全匹配未找到文章，尝试部分匹配...`);
        article = allPosts.find(post => 
          slugPath.includes(post.slug) || 
          post.slug.includes(slugPath)
        );
      }
    }
    
    // 4. 如果当前语言找不到，尝试其他语言版本，然后获取对应文章ID的当前语言版本
    if (!article) {
      console.log(`在${locale}语言中未找到文章，尝试其他语言...`);
      
      // 尝试其他语言
      const otherLanguages = ['en', 'zh', 'es'].filter(lang => lang !== locale);
      
      for (const lang of otherLanguages) {
        console.log(`尝试在${lang}语言中查找文章...`);
        const langPosts = await getPosts(lang);
        const foundInOtherLang = langPosts.find(post => post.slug === slugPath);
        
        if (foundInOtherLang) {
          console.log(`在${lang}语言中找到匹配文章，articleID=${foundInOtherLang.articleID}`);
          
          // 找到对应的当前语言版本
          const localePosts = await getPosts(locale);
          const localizedVersion = localePosts.find(post => post.articleID === foundInOtherLang.articleID);
          
          if (localizedVersion) {
            console.log(`找到${locale}语言的对应版本，使用本地化版本`);
            article = localizedVersion;
          } else {
            console.log(`未找到${locale}语言版本，使用${lang}语言版本作为回退`);
            article = foundInOtherLang;
          }
          
          break;
        }
      }
    }
    
    if (!article) {
      console.log(`未找到文章: slug=${slugPath}, locale=${locale}`);
      return {
        props: {
          article: null,
          fallbackLanguage: null,
          error: `未找到文章: ${slugPath}`
        },
        revalidate: 60
      };
    }
    
    console.log(`成功找到文章: ${article.title} (${article.lang})`);
    
    // 检查是否需要fallback
    const fallbackLanguage = article.lang !== locale ? article.lang : null;
    if (fallbackLanguage) {
      console.log(`使用${fallbackLanguage}语言文章作为回退`);
    }
    
    return {
      props: {
        article,
        fallbackLanguage
      },
      // 增加ISR刷新
      revalidate: 60
    };
  } catch (error) {
    console.error(`获取文章出错:`, error);
    return {
      props: {
        article: null,
        fallbackLanguage: null,
        error: `加载文章时出错: ${error.message}`
      },
      revalidate: 60
    };
  }
} 