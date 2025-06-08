'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Footer from '@/components/Footer';
import LocalizedHead from '@/components/LocalizedHead';

export default function BlogPost() {
  const params = useParams();
  const slug = params.slug as string;
  const locale = params.locale as string || 'en';
  const t = useTranslations('BlogPost');
  
  // 本地存储的示例博客文章数据 - 实际应用中这会从API或CMS获取
  const postData = {
    'build-nextjs-i18n': {
      title: t('posts.i18n.title'),
      date: '2023-11-15',
      image: '/blog/i18n-cover.jpg',
      category: t('categories.dev'),
      content: t('posts.i18n.content'),
    },
    'design-system-approach': {
      title: t('posts.design.title'),
      date: '2023-10-20',
      image: '/blog/design-cover.jpg',
      category: t('categories.design'),
      content: t('posts.design.content'),
    },
    'future-web-animations': {
      title: t('posts.animations.title'),
      date: '2023-09-05',
      image: '/blog/animations-cover.jpg',
      category: t('categories.frontend'),
      content: t('posts.animations.content'),
    },
    'serverless-architecture': {
      title: t('posts.serverless.title'),
      date: '2023-08-12',
      image: '/blog/serverless-cover.jpg',
      category: t('categories.backend'),
      content: t('posts.serverless.content'),
    },
    'typesafe-state-management': {
      title: t('posts.typescript.title'),
      date: '2023-07-28',
      image: '/blog/typescript-cover.jpg',
      category: t('categories.dev'),
      content: t('posts.typescript.content'),
    },
    'progressive-web-apps': {
      title: t('posts.pwa.title'),
      date: '2023-06-15',
      image: '/blog/pwa-cover.jpg',
      category: t('categories.frontend'),
      content: t('posts.pwa.content'),
    }
  };
  
  // 检查文章是否存在
  const post = postData[slug as keyof typeof postData];
  
  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">{t('notFound.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{t('notFound.message')}</p>
          <Button asChild>
            <Link href={`/${locale}/blog`}>{t('notFound.backButton')}</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <LocalizedHead 
        titleKey={`posts.${slug}.title`} 
        descriptionKey={`posts.${slug}.excerpt`}
        namespace="Blog" 
      />
      
      <main className="bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100">
        {/* 返回按钮 */}
        <div className="max-w-4xl mx-auto pt-8 px-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/${locale}/blog`} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t('backToBlog')}
            </Link>
          </Button>
        </div>
        
        {/* 博客文章头部 */}
        <article className="max-w-4xl mx-auto px-6 py-12">
          <header className="mb-12">
            <div className="flex items-center gap-4 mb-4 text-sm">
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full font-medium">
                {post.category}
              </span>
              <time className="text-gray-500 dark:text-gray-400">
                {post.date}
              </time>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold mb-6">{post.title}</h1>
            
            <div className="relative w-full h-64 md:h-96 rounded-xl overflow-hidden mb-8">
              <Image
                src={post.image}
                alt={post.title}
                fill
                style={{ objectFit: "cover" }}
                priority
              />
            </div>
          </header>
          
          {/* 博客内容 */}
          <div className="prose dark:prose-invert prose-lg max-w-none">
            {post.content.split('\n\n').map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
        </article>
        
        {/* 相关文章推荐 */}
        <section className="max-w-4xl mx-auto px-6 py-12 border-t border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-8">{t('relatedPosts')}</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {Object.entries(postData)
              .filter(([key]) => key !== slug)
              .slice(0, 2)
              .map(([key, relatedPost]) => (
                <Link
                  key={key}
                  href={`/${locale}/blog/${key}`}
                  className="flex gap-4 items-start group"
                >
                  <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                    <Image
                      src={relatedPost.image}
                      alt={relatedPost.title}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div>
                    <h3 className="font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {relatedPost.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {relatedPost.date}
                    </p>
                  </div>
                </Link>
              ))}
          </div>
        </section>
        
        {/* Footer */}
        <Footer />
      </main>
    </>
  );
} 