import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

// 首页元数据生成
export async function generateHomeMetadata({ 
  params 
}: { 
  params: { locale: string } | Promise<{ locale: string }> 
}): Promise<Metadata> {
  // 等待参数解析
  const resolvedParams = await Promise.resolve(params);
  const locale = resolvedParams.locale || 'en';
  
  // 构建规范化URL
  const baseUrl = 'https://velan.zenvel.io';
  
  // 为不同语言版本创建alternates对象
  const alternates = {
    canonical: `${baseUrl}/${locale}`,
    languages: {
      'en': `${baseUrl}/en`,
      'zh': `${baseUrl}/zh`,
    }
  };
  
  const t = await getTranslations({ 
    locale, 
    namespace: 'Metadata' 
  });
  
  return {
    title: t('home.title'),
    description: t('home.description'),
    alternates,
    openGraph: {
      title: t('home.title'),
      description: t('home.description'),
      url: `${baseUrl}/${locale}`,
    }
  };
}

// 关于页元数据生成
export async function generateAboutMetadata({ 
  params 
}: { 
  params: { locale: string } | Promise<{ locale: string }> 
}): Promise<Metadata> {
  // 等待参数解析
  const resolvedParams = await Promise.resolve(params);
  const locale = resolvedParams.locale || 'en';
  
  // 构建规范化URL
  const baseUrl = 'https://velan.zenvel.io';
  
  // 为不同语言版本创建alternates对象
  const alternates = {
    canonical: `${baseUrl}/${locale}/about`,
    languages: {
      'en': `${baseUrl}/en/about`,
      'zh': `${baseUrl}/zh/about`,
    }
  };
  
  const t = await getTranslations({ 
    locale, 
    namespace: 'Metadata' 
  });
  
  return {
    title: t('about.title'),
    description: t('about.description'),
    alternates,
    openGraph: {
      title: t('about.title'),
      description: t('about.description'),
      url: `${baseUrl}/${locale}/about`,
      type: 'profile'
    }
  };
}

// 博客列表页元数据生成
export async function generateBlogMetadata({ 
  params 
}: { 
  params: { locale: string } | Promise<{ locale: string }> 
}): Promise<Metadata> {
  // 等待参数解析
  const resolvedParams = await Promise.resolve(params);
  const locale = resolvedParams.locale || 'en';
  
  // 构建规范化URL
  const baseUrl = 'https://velan.zenvel.io';
  
  // 为不同语言版本创建alternates对象
  const alternates = {
    canonical: `${baseUrl}/${locale}/blog`,
    languages: {
      'en': `${baseUrl}/en/blog`,
      'zh': `${baseUrl}/zh/blog`,
    }
  };
  
  const t = await getTranslations({ 
    locale, 
    namespace: 'Metadata' 
  });
  
  return {
    title: t('blog.title'),
    description: t('blog.description'),
    alternates,
    openGraph: {
      title: t('blog.title'),
      description: t('blog.description'),
      url: `${baseUrl}/${locale}/blog`,
      type: 'website'
    }
  };
}

// 博客文章数据
export const blogPostData = {
  'build-nextjs-i18n': {
    titleKey: 'posts.i18n.title',
    excerptKey: 'posts.i18n.excerpt',
    date: '2023-11-15',
  },
  'design-system-approach': {
    titleKey: 'posts.design.title',
    excerptKey: 'posts.design.excerpt',
    date: '2023-10-20',
  },
  'future-web-animations': {
    titleKey: 'posts.animations.title',
    excerptKey: 'posts.animations.excerpt',
    date: '2023-09-05',
  },
  'serverless-architecture': {
    titleKey: 'posts.serverless.title',
    excerptKey: 'posts.serverless.excerpt',
    date: '2023-08-12',
  },
  'typesafe-state-management': {
    titleKey: 'posts.typescript.title',
    excerptKey: 'posts.typescript.excerpt',
    date: '2023-07-28',
  },
  'progressive-web-apps': {
    titleKey: 'posts.pwa.title',
    excerptKey: 'posts.pwa.excerpt',
    date: '2023-06-15',
  }
};

// 博客详情页元数据生成
export async function generateBlogPostMetadata({ 
  params 
}: { 
  params: { locale: string; slug: string } | Promise<{ locale: string; slug: string }> 
}): Promise<Metadata> {
  // 等待参数解析
  const resolvedParams = await Promise.resolve(params);
  const locale = resolvedParams.locale || 'en';
  const slug = resolvedParams.slug;
  
  // 检查文章是否存在
  if (!blogPostData[slug as keyof typeof blogPostData]) {
    return {
      title: 'Article Not Found',
      description: 'The requested article could not be found.'
    };
  }
  
  const post = blogPostData[slug as keyof typeof blogPostData];
  
  // 构建规范化URL
  const baseUrl = 'https://velan.zenvel.io';
  
  // 为不同语言版本创建alternates对象
  const alternates = {
    canonical: `${baseUrl}/${locale}/blog/${slug}`,
    languages: {
      'en': `${baseUrl}/en/blog/${slug}`,
      'zh': `${baseUrl}/zh/blog/${slug}`,
    }
  };
  
  const t = await getTranslations({ 
    locale, 
    namespace: 'Blog' 
  });
  
  const title = t(post.titleKey);
  const description = t(post.excerptKey);
  
  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}/blog/${slug}`,
      type: 'article',
      publishedTime: post.date,
      authors: ['Velan'],
    }
  };
} 