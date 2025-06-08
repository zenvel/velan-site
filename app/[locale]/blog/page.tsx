'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Footer from '@/components/Footer';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import LocalizedHead from '@/components/LocalizedHead';

/**
 * Blog posts page - displays a grid of blog posts
 */
export default function Blog() {
  const t = useTranslations('Blog');
  const params = useParams();
  const locale = params.locale as string || 'en';
  
  // 示例博客文章数据
  const posts = [
    {
      id: 'build-nextjs-i18n',
      title: t('posts.i18n.title'),
      excerpt: t('posts.i18n.excerpt'),
      date: '2023-11-15',
      image: '/blog/i18n-cover.jpg',
      category: t('categories.dev')
    },
    {
      id: 'design-system-approach',
      title: t('posts.design.title'),
      excerpt: t('posts.design.excerpt'),
      date: '2023-10-20',
      image: '/blog/design-cover.jpg',
      category: t('categories.design')
    },
    {
      id: 'future-web-animations',
      title: t('posts.animations.title'),
      excerpt: t('posts.animations.excerpt'),
      date: '2023-09-05',
      image: '/blog/animations-cover.jpg',
      category: t('categories.frontend')
    },
    {
      id: 'serverless-architecture',
      title: t('posts.serverless.title'),
      excerpt: t('posts.serverless.excerpt'),
      date: '2023-08-12',
      image: '/blog/serverless-cover.jpg',
      category: t('categories.backend')
    },
    {
      id: 'typesafe-state-management',
      title: t('posts.typescript.title'),
      excerpt: t('posts.typescript.excerpt'),
      date: '2023-07-28',
      image: '/blog/typescript-cover.jpg',
      category: t('categories.dev')
    },
    {
      id: 'progressive-web-apps',
      title: t('posts.pwa.title'),
      excerpt: t('posts.pwa.excerpt'),
      date: '2023-06-15',
      image: '/blog/pwa-cover.jpg',
      category: t('categories.frontend')
    }
  ];
  
  // 按日期排序，最新的在前
  const sortedPosts = [...posts].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  return (
    <>
      <LocalizedHead 
        titleKey="blog.title" 
        descriptionKey="blog.description" 
      />
      
      <main className="bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100">
        {/* Hero Section */}
        <section className="pt-20 pb-16 md:pt-28 md:pb-20 text-center px-6">
          <motion.h1 
            className="text-4xl md:text-5xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {t('title')}
          </motion.h1>
          <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-400 text-lg">
            {t('subtitle')}
          </p>
        </section>
        
        {/* Blog Posts Grid */}
        <section className="max-w-7xl mx-auto px-6 pb-24">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {sortedPosts.map((post) => (
              <Link 
                href={`/${locale}/blog/${post.id}`} 
                key={post.id}
                className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
              >
                <div className="relative h-48 w-full">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    style={{ objectFit: "cover" }}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority={false}
                  />
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium">
                      {post.category}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                      {post.date}
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
                  <p className="text-gray-600 dark:text-gray-300 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="mt-4 text-blue-600 dark:text-blue-400 font-medium">
                    {t('readMore')} →
                  </div>
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