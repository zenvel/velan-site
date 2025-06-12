import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import Footer from '@/components/Footer';
import NotionRenderer from '@/components/notion/NotionRenderer';
import { getPost } from '@/lib/notion';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

// 定义页面参数类型
type BlogParams = {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
};

// 博客文章页面组件
export default async function BlogDetailPage({ params }: BlogParams) {
  // 等待params
  const { slug, locale } = await params;
  
  try {
    // 获取翻译文本
    const t = await getTranslations({ 
      locale, 
      namespace: 'Blog' 
    });
    
    // 直接使用传入的slug，无需额外处理
    let cleanSlug = slug;
  
    // 获取文章
    const post = await getPost(cleanSlug, locale);
  
    if (!post) {
      notFound();
    }

    // 格式化日期
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      if (locale === 'zh') {
        return `${year}年${Number(month)}月${Number(day)}日`;
      } else if (locale === 'es') {
        const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
          'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
        ];
        return `${day} de ${monthNames[date.getMonth()]} de ${year}`;
      } else {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return `${monthNames[date.getMonth()]} ${day}, ${year}`;
    }
    };
  
  return (
    <main className="bg-white dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100">
        {/* 返回按钮 */}
        <article className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
            <Link 
              href={`/${locale}/blog`} 
              className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
            >
            <ArrowLeft className="h-4 w-4" />
              {t('backToBlog')}
          </Link>
        </div>
          
          {/* 文章内容 */}
        {post.coverUrl && (
          <div className="relative mb-12 shadow-xl rounded-2xl overflow-hidden">
            <Image
              src={post.coverUrl}
              alt={post.title}
              width={768}
              height={432}
              className="w-full object-cover aspect-video"
              priority
            />
          </div>
        )}
        
          <h1 className="text-3xl md:text-4xl font-semibold mb-6 text-center">
            {post.title}
          </h1>
        
          {/* 元数据 */}
        <div className="flex flex-wrap justify-center items-center gap-4 mb-10 text-sm">
            <time 
              className="text-gray-500 dark:text-gray-400"
              suppressHydrationWarning
            >
              {formatDate(post.date)}
          </time>
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* 摘要 */}
        {post.summary && (
          <div className="my-12 text-center">
            <p className="text-xl text-gray-600 dark:text-gray-400">
              {post.summary}
            </p>
          </div>
        )}
        
          {/* 文章正文 */}
        <div className="prose dark:prose-invert prose-lg max-w-none prose-img:rounded-lg prose-headings:font-bold">
          <NotionRenderer blocks={post.blocks || []} />
        </div>
      </article>
      
      <Footer />
    </main>
  );
  } catch (error) {
    console.error('博客详情页面渲染错误:', error);
    notFound();
  }
} 