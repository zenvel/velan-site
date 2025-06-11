import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Footer from '@/components/Footer';
import { getPost } from '@/lib/notion';
import NotionRenderer from '@/components/notion/NotionRenderer';
import { getTranslations } from 'next-intl/server';
import { unstable_noStore as noStore } from 'next/cache';
import { defaultLocale } from '@/i18n';
import type { Metadata } from 'next';

// 导入翻译文件，确保国际化正常工作
import zhMessages from '@/messages/zh.json';
import enMessages from '@/messages/en.json';
import esMessages from '@/messages/es.json';

// 博客详情页作为服务器组件

// 生成动态元数据
export async function generateMetadata({ 
  params 
}: { 
  params: { locale: string, slug: string } | Promise<{ locale: string, slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const locale = resolvedParams.locale || defaultLocale;
  const slug = resolvedParams.slug;
  
  if (!slug) {
    return {
      title: '文章未找到',
      description: '请求的文章不存在'
    };
  }
  
  const post = await getPost(slug, locale);
  
  if (!post) {
    return {
      title: '文章未找到',
      description: '请求的文章不存在'
    };
  }
  
  return {
    title: post.title,
    description: post.summary || '阅读这篇文章了解更多',
    openGraph: {
      title: post.title,
      description: post.summary || '阅读这篇文章了解更多',
      images: post.coverUrl ? [post.coverUrl] : undefined,
    },
  };
}

export default async function BlogPost({ 
  params 
}: { 
  params: { locale: string, slug: string } | Promise<{ locale: string, slug: string }>;
}) {
  // 强制禁用缓存
  noStore();
  
  // 正确地等待参数解析
  const resolvedParams = await Promise.resolve(params);
  const locale = resolvedParams.locale || defaultLocale;
  const slug = resolvedParams.slug;
  
  if (!slug) {
    console.error('缺少文章slug参数');
    notFound();
  }
  
  // 直接使用翻译文件，确保国际化正常工作
  let messages;
  if (locale === 'zh') {
    messages = zhMessages;
  } else if (locale === 'es') {
    messages = esMessages;
  } else {
    messages = enMessages;
  }
  const backToBlogText = messages.BlogPost.backToBlog;
  
  // 确保传递正确的语言参数
  const post = await getPost(slug, locale);
  
  if (!post) notFound();
  
  // 检查当前slug是否与文章的slug一致，如果不一致则重定向
  if (post.slug !== slug) {
    redirect(`/${locale}/blog/${post.slug}`);
  }
  
  // 格式化日期的辅助函数
  function formatDate(dateString: string | undefined) {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      
      // 检查日期是否有效
      if (isNaN(date.getTime())) {
        console.warn('无效的日期格式:', dateString);
        return dateString || '';
      }
      
      if (locale === 'zh') {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}年${month}月${day}日`;
      } else if (locale === 'es') {
        // 西班牙语日期格式
        return date.toLocaleDateString('es-ES', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      } else {
        // 英文日期格式
        return date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
    } catch (error) {
      console.error('日期格式化错误:', error);
      return dateString || '';
    }
  }
  
  const formattedDate = formatDate(post.date);
  
  return (
    <main className="bg-white dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100">
      <article className="max-w-3xl mx-auto px-6 py-16">
        {/* 返回按钮 */}
        <div className="mb-12">
          <Link href={`/${locale}/blog`} className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline">
            <ArrowLeft className="h-4 w-4" />
            {backToBlogText}
          </Link>
        </div>
          
        {/* 封面图 */}
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
        
        {/* 标题 */}
        <h1 className="text-3xl md:text-4xl font-semibold mb-6 text-center">{post.title}</h1>
        
        {/* 日期和标签 */}
        <div className="flex flex-wrap justify-center items-center gap-4 mb-10 text-sm">
          <time className="text-gray-500 dark:text-gray-400" suppressHydrationWarning>
            {formattedDate}
          </time>
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {post.tags.map((tag, index) => (
                <span key={index} className="px-3 py-1 rounded-full font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
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
        
        {/* 博客内容 */}
        <div className="prose dark:prose-invert prose-lg max-w-none prose-img:rounded-lg prose-headings:font-bold">
          <NotionRenderer blocks={post.blocks} />
        </div>
      </article>
      
      {/* Footer */}
      <Footer />
    </main>
  );
} 